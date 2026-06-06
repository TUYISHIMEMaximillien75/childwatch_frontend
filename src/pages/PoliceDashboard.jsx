// PoliceDashboard.jsx — Childwatch Police Officer Panel (fully wired)
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthProfile } from "../utils/authStorage";
import {
  getPoliceCases, getPoliceStats, getPoliceAlerts,
  getPoliceDistrictStats, updatePoliceCaseStatus,
} from "../services/policeApi";
import NotificationBell from "../components/NotificationBell";
import FileUploadWidget from "../components/FileUploadWidget";
import {
  LayoutDashboard, FolderOpen, Search, Bell, Shield, AlertTriangle,
  MapPin, Upload, FileText, User, CheckCircle2, Clock, Flag,
  Menu, X, LogOut, Plus, Edit2, Eye, Download, ArrowRight,
  ChevronRight, Zap, Hash, Camera, BookOpen, MessageSquare,
  UserPlus, Lock, RefreshCw, Filter, MoreVertical, Star,
  Navigation, Activity, TrendingUp, Phone, Calendar, Send,
  Sun, Moon
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ProfilePage from "../components/ProfilePage";

// ── helpers ─────────────────────────────────────────────────────────
function buildStats(s = {}) {
  return [
    { label: "Total Assigned",      value: String(s.total ?? 0),              icon: FolderOpen,    color: "amber", delta: "cases"      },
    { label: "New Cases",           value: String(s.new ?? 0),                icon: Plus,          color: "amber", delta: "today"      },
    { label: "Under Investigation", value: String(s.underInvestigation ?? 0), icon: Search,        color: "amber", delta: "active"     },
    { label: "Urgent",              value: String(s.new ?? 0),                icon: AlertTriangle, color: "red",   delta: "priority"   },
    { label: "Resolved",            value: String(s.resolved ?? 0),           icon: CheckCircle2,  color: "green", delta: "this month" },
    { label: "Missing Not Found",   value: String(s.missingNotFound ?? 0),    icon: Flag,          color: "red",   delta: "open"       },
  ];
}

const STATUS_CONFIG = {
  submitted:            { bg:"bg-slate-50 dark:bg-slate-800/40",  text:"text-slate-700 dark:text-slate-300", dot:"bg-slate-400",  border:"border-slate-200 dark:border-slate-700"  },
  urgent:               { bg:"bg-red-50 dark:bg-red-950/30",    text:"text-red-700 dark:text-red-400",   dot:"bg-red-500",    border:"border-red-200 dark:border-red-900/50"    },
  "under-investigation":{ bg:"bg-amber-50 dark:bg-amber-950/30",  text:"text-amber-700 dark:text-amber-400", dot:"bg-amber-500",  border:"border-amber-200 dark:border-amber-900/50"  },
  new:                  { bg:"bg-amber-50 dark:bg-amber-950/30",  text:"text-amber-700 dark:text-amber-400", dot:"bg-amber-500",  border:"border-amber-200 dark:border-amber-900/50"  },
  verified:             { bg:"bg-blue-50 dark:bg-blue-950/30",   text:"text-blue-700 dark:text-blue-400",  dot:"bg-blue-500",   border:"border-blue-200 dark:border-blue-900/50"   },
  resolved:             { bg:"bg-green-50 dark:bg-green-950/30",  text:"text-green-700 dark:text-green-400", dot:"bg-green-500",  border:"border-green-200 dark:border-green-900/50"  },
};

const NAV = [
  { id:"dashboard", label:"Dashboard",        icon:LayoutDashboard },
  { id:"cases",     label:"Assigned Cases",   icon:FolderOpen      },
  { id:"missing",   label:"Missing Children", icon:Search          },
  { id:"abuse",     label:"Abuse Cases",      icon:Shield          },
  { id:"map",       label:"Incident Map",     icon:MapPin          },
  { id:"evidence",  label:"Evidence Upload",  icon:Upload          },
  { id:"notes",     label:"Case Notes",       icon:MessageSquare   },
  { id:"reports",   label:"Generate Reports", icon:FileText        },
  { id:"alerts",    label:"Alerts",           icon:Bell            },
];

const STATUS_ROW_BG = { urgent:"bg-red-50/40", new:"bg-amber-50/40", resolved:"", "under-investigation":"" };
const ALLOWED_STATUSES = ["submitted","verified","under-investigation","resolved"];

// ── Shared UI ───────────────────────────────────────────────────────
function StatCard({ label, value, icon:Icon, color, delta }) {
  const C = {
    blue:  { bg:"bg-amber-50 dark:bg-amber-950/40",  ic:"text-amber-600 dark:text-amber-400",  ring:"ring-amber-100 dark:ring-amber-950/20"  },
    green: { bg:"bg-green-50 dark:bg-green-950/40",  ic:"text-green-600 dark:text-green-400",  ring:"ring-green-100 dark:ring-green-950/20"  },
    amber: { bg:"bg-amber-50 dark:bg-amber-950/40",  ic:"text-amber-600 dark:text-amber-400",  ring:"ring-amber-100 dark:ring-amber-950/20"  },
    red:   { bg:"bg-red-50 dark:bg-red-950/40",    ic:"text-red-500 dark:text-red-400",    ring:"ring-red-100 dark:ring-red-950/20"    },
  }[color] || { bg:"bg-amber-50 dark:bg-amber-950/40", ic:"text-amber-600 dark:text-amber-400", ring:"ring-amber-100 dark:ring-amber-950/20" };
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${C.bg} ring-4 ${C.ring} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${C.ic}`} />
      </div>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{delta}</p>
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">{title}</h2>
      {sub && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.replace(/-/g," ")}
    </span>
  );
}

function Btn({ children, variant="primary", size="sm", onClick, disabled=false, className="" }) {
  const V = {
    primary:"text-slate-900 dark:text-white shadow-sm",
    green:  "text-slate-900 dark:text-white shadow-sm",
    outline:"border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200",
    danger: "bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50",
    ghost:  "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200",
  }[variant];
  const isPrimary = variant === "primary" || variant === "green";
  const S = { sm:"px-3 py-1.5 text-[12px]", md:"px-4 py-2.5 text-[13px]" }[size];
  return (
    <button onClick={onClick} disabled={disabled}
      style={isPrimary ? { background:"linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)", color:"#ffffff", boxShadow:"0 4px 12px rgba(37,99,235,0.16)" } : {}}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-60 ${V} ${S} ${className}`}>
      {children}
    </button>
  );
}

function TableWrap({ children }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800"><table className="w-full text-[13px]">{children}</table></div>;
}
function Th({ children }) { return <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900 whitespace-nowrap">{children}</th>; }
function Td({ children, className="" }) { return <td className={`px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 ${className}`}>{children}</td>; }

// ── View Case Modal ─────────────────────────────────────────────────
function ViewCaseModal({ c, onClose }) {
  if (!c) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(15,23,42,0.55)"}} onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${c.type==="Missing"?"bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50":"bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50"}`}>{c.type}</span>
              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{c.caseId}</span>
            </div>
            <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">{c.child || "—"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-5 h-5 text-slate-500 dark:text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2"><StatusBadge status={c.status} /></div>
          <div className="grid grid-cols-2 gap-3">
            {[["District", c.district],["Date", new Date(c.date||c.createdAt).toLocaleDateString()],["Age", c.age??  "—"],["Gender", c.gender||"—"],["Location",c.location||"—"]].map(([k,v])=>(
              <div key={k} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">{k}</p>
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{v}</p>
              </div>
            ))}
            <div className="col-span-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Description</p>
              <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{c.description||"—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Update Status Modal ─────────────────────────────────────────────
function UpdateStatusModal({ c, onClose, onUpdated }) {
  const [status, setStatus] = useState(c.status);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const handle = async () => {
    if (status === c.status) { onClose(); return; }
    setSaving(true); setErr("");
    try {
      await updatePoliceCaseStatus(c.id, status);
      onUpdated(c.id, status);
      onClose();
    } catch(e) { setErr(e.message||"Failed to update"); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(15,23,42,0.55)"}} onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white">Update Status</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4 text-slate-500 dark:text-slate-400" /></button>
        </div>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-3 font-mono">{c.caseId} · {c.child}</p>
        <div className="space-y-2 mb-4">
          {ALLOWED_STATUSES.map(s => (
            <label key={s} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${status===s?"border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/30":"border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}>
              <input type="radio" className="accent-amber-500" checked={status===s} onChange={()=>setStatus(s)} />
              <StatusBadge status={s} />
            </label>
          ))}
        </div>
        {err && <p className="text-[12px] text-red-500 mb-2">{err}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
          <button onClick={handle} disabled={saving} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-60 transition" style={{background:"linear-gradient(135deg,#2563EB,#1D4ED8)"}}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Note Modal ──────────────────────────────────────────────────
function AddNoteModal({ c, onClose, onSaved }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const handle = async () => {
    if (!text.trim()) { setErr("Note cannot be empty"); return; }
    setSaving(true); setErr("");
    try {
      const { addCaseNote } = await import("../services/caseApi");
      await addCaseNote(c.caseId||c.id, { comment: text.trim() });
      onSaved?.();
      onClose();
    } catch(e) { setErr(e.message||"Failed to save note"); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(15,23,42,0.55)"}} onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white">Add Investigation Note</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4 text-slate-500 dark:text-slate-400" /></button>
        </div>
        <p className="text-[12px] font-mono text-amber-600 dark:text-amber-400 mb-3">{c.caseId||c.id} · {c.child}</p>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={4}
          placeholder="Investigation notes, suspect details, recovery updates…"
          className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none mb-3" />
        {err && <p className="text-[12px] text-red-500 mb-2">{err}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
          <button onClick={handle} disabled={saving} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-60 transition" style={{background:"linear-gradient(135deg,#2563EB,#1D4ED8)"}}>
            {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Suspect Details Modal (Abuse) ───────────────────────────────────
function SuspectModal({ c, onClose }) {
  const [form, setForm] = useState({ suspectName:"", relationship:"", description:"" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const handle = async () => {
    if (!form.suspectName.trim()) { setErr("Suspect name is required"); return; }
    setSaving(true); setErr("");
    try {
      const { addCaseNote } = await import("../services/caseApi");
      const comment = `SUSPECT DETAILS — Name: ${form.suspectName} | Relationship: ${form.relationship||"Unknown"} | ${form.description}`;
      await addCaseNote(c.caseId||c.id, { comment });
      setDone(true);
    } catch(e) { setErr(e.message||"Failed to save"); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(15,23,42,0.55)"}} onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-slate-800 dark:text-white">Suspect details saved!</p>
            <button onClick={onClose} className="mt-4 px-5 py-2 rounded-xl text-[13px] font-bold text-white" style={{background:"linear-gradient(135deg,#2563EB,#1D4ED8)"}}>Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white">Suspect Details</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4 text-slate-500 dark:text-slate-400" /></button>
            </div>
            <p className="text-[12px] font-mono text-red-500 dark:text-red-400 mb-4">{c.caseId||c.id} · {c.child}</p>
            <div className="space-y-3">
              <input value={form.suspectName} onChange={set("suspectName")} placeholder="Suspect full name *"
                className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-400 dark:focus:border-red-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" />
              <input value={form.relationship} onChange={set("relationship")} placeholder="Relationship to child"
                className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-400 dark:focus:border-red-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" />
              <textarea value={form.description} onChange={set("description")} rows={3} placeholder="Incident details…"
                className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-400 dark:focus:border-red-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none" />
            </div>
            {err && <p className="text-[12px] text-red-500 mt-2">{err}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
              <button onClick={handle} disabled={saving} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-60 transition" style={{background:"linear-gradient(135deg,#dc2626,#b91c1c)"}}>
                {saving ? "Saving…" : "Save Details"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── SECTIONS ────────────────────────────────────────────────────────
function DashboardView({ onNav, cases, stats, loading, alerts = [], districts = [], profile }) {
  const name = profile?.fullName || "Officer";
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const district = profile?.district || "—";
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl px-6 py-5 text-gray-900" style={{background:"linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)"}}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-30 pointer-events-none" style={{background:"#1E3A8A"}} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase mb-1 text-blue-200">Welcome back</p>
            <h2 className="text-[20px] font-extrabold text-white">{name}</h2>
            <p className="text-[13px] mt-0.5 text-blue-200">{district} District Police</p>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>onNav("cases")} className="flex items-center gap-2 px-4 py-2.5 font-bold text-[13px] rounded-xl" style={{background:"rgba(255,255,255,0.9)",color:"#1E3A8A"}}>
              <FolderOpen className="w-4 h-4" /> My Cases
            </button>
            <button onClick={()=>onNav("map")} className="flex items-center gap-2 px-4 py-2.5 border font-bold text-[13px] rounded-xl" style={{background:"rgba(0,0,0,0.12)",borderColor:"rgba(255,255,255,0.3)",color:"#fff"}}>
              <MapPin className="w-4 h-4" /> Live Map
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {loading ? <p className="text-[12px] text-slate-400 dark:text-slate-500 col-span-6">Loading…</p>
          : stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent cases */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-extrabold text-slate-800 dark:text-white">Recent Cases</p>
            <button onClick={()=>onNav("cases")} className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">View all →</button>
          </div>
          <div className="space-y-2">
            {cases.length === 0
              ? <p className="text-[12px] text-slate-400 dark:text-slate-500 py-4 text-center">No cases assigned yet.</p>
              : cases.slice(0,5).map(c => (
              <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${STATUS_ROW_BG[c.status]||""}`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_CONFIG[c.status]?.dot||"bg-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">{c.child} <span className="text-slate-400 dark:text-slate-500 font-normal">· age {c.age}</span></p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{c.caseId} · {c.district}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="font-extrabold text-slate-800 dark:text-white mb-4">Recent Alerts</p>
          <div className="space-y-3">
            {alerts.length === 0
              ? <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No active alerts.</p>
              : alerts.slice(0,4).map((a,i) => (
              <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.urgency==="critical"?"bg-red-500":a.urgency==="urgent"?"bg-amber-500":"bg-amber-400"}`} />
                <div>
                  <p className="text-[12px] text-slate-700 dark:text-slate-350 leading-relaxed">{a.title}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{a.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mini map */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="font-extrabold text-slate-800 dark:text-white">Incident Locations — {district} District</p>
          <button onClick={()=>onNav("map")} className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">Full map →</button>
        </div>
        <IncidentMapView mini districts={districts} />
      </div>
    </div>
  );
}

function CasesView({ cases, onStatusUpdated }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [viewing, setViewing] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [noting, setNoting] = useState(null);

  const filtered = cases.filter(c =>
    (filter==="All" || c.status===filter) &&
    ((c.child||"").toLowerCase().includes(search.toLowerCase()) ||
     (c.caseId||c.id||"").toLowerCase().includes(search.toLowerCase()))
  );

  const handleClose = async (c) => {
    try {
      await updatePoliceCaseStatus(c.id, "resolved");
      onStatusUpdated(c.id, "resolved");
    } catch(e) { alert(e.message||"Failed to close case"); }
  };

  return (
    <div className="space-y-5">
      {viewing   && <ViewCaseModal c={viewing} onClose={()=>setViewing(null)} />}
      {updating  && <UpdateStatusModal c={updating} onClose={()=>setUpdating(null)} onUpdated={(id,s)=>{onStatusUpdated(id,s); setUpdating(null);}} />}
      {noting    && <AddNoteModal c={noting} onClose={()=>setNoting(null)} />}

      <SectionTitle title="Assigned Cases" sub={`${cases.length} case${cases.length!==1?"s":""} assigned to you`} />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by child name or case ID…"
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" />
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          className="px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
          {["All","submitted","verified","under-investigation","resolved"].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0
        ? <p className="text-[12px] text-slate-400 dark:text-slate-500 py-8 text-center">No cases match this filter.</p>
        : <div className="grid gap-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${c.type==="Missing"?"bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50":"bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50"}`}>{c.type}</span>
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{c.caseId}</span>
                  </div>
                  <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">{c.child} <span className="text-slate-400 dark:text-slate-500 text-[13px] font-normal">· age {c.age}</span></h3>
                  <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.district} · {new Date(c.date||c.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn variant="outline" onClick={()=>setViewing(c)}><Eye className="w-3.5 h-3.5" /> View</Btn>
                <Btn variant="outline" onClick={()=>setUpdating(c)}><Edit2 className="w-3.5 h-3.5" /> Update Status</Btn>
                <Btn variant="outline" onClick={()=>setNoting(c)}><MessageSquare className="w-3.5 h-3.5" /> Add Note</Btn>
                {c.status !== "resolved" && (
                  <Btn variant="danger" onClick={()=>handleClose(c)}><CheckCircle2 className="w-3.5 h-3.5" /> Close Case</Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function MissingView({ cases, onStatusUpdated }) {
  const [viewing, setViewing]   = useState(null);
  const [updating, setUpdating] = useState(null);
  const [noting, setNoting]     = useState(null);

  return (
    <div className="space-y-5">
      {viewing  && <ViewCaseModal c={viewing} onClose={()=>setViewing(null)} />}
      {updating && <UpdateStatusModal c={updating} onClose={()=>setUpdating(null)} onUpdated={(id,s)=>{onStatusUpdated(id,s); setUpdating(null);}} />}
      {noting   && <AddNoteModal c={noting} onClose={()=>setNoting(null)} />}

      <SectionTitle title="Missing Children Cases" sub={`${cases.length} missing case${cases.length !== 1 ? "s" : ""} assigned to you`} />
      {cases.length === 0
        ? (
          <div className="flex flex-col items-center py-16 text-center gap-3">
            <Search className="w-10 h-10 text-slate-200 dark:text-slate-700" />
            <p className="text-[13px] text-slate-400 dark:text-slate-500">No missing child cases assigned to you yet.</p>
          </div>
        )
        : <div className="grid gap-4">
          {cases.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className={`h-1.5 w-full ${c.status==="resolved"?"bg-green-500":c.status==="urgent"?"bg-red-500":"bg-amber-400"}`} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">{c.child}</h3>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">Age {c.age} · Last seen: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.district}</span> · {new Date(c.date||c.createdAt).toLocaleDateString()}</p>
                    <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{c.caseId}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Btn variant="primary" onClick={()=>setViewing(c)}><Eye className="w-3.5 h-3.5" />View Profile</Btn>
                  <Btn variant="outline" onClick={()=>setUpdating(c)}><Edit2 className="w-3.5 h-3.5" />Update</Btn>
                  <Btn variant="outline" onClick={()=>setNoting(c)}><MessageSquare className="w-3.5 h-3.5" />Add Note</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function AbuseView({ cases, onStatusUpdated }) {
  const [suspectCase, setSuspectCase] = useState(null);
  const [viewing, setViewing]   = useState(null);
  const [updating, setUpdating] = useState(null);

  return (
    <div className="space-y-5">
      {viewing   && <ViewCaseModal c={viewing} onClose={()=>setViewing(null)} />}
      {updating  && <UpdateStatusModal c={updating} onClose={()=>setUpdating(null)} onUpdated={(id,s)=>{onStatusUpdated(id,s); setUpdating(null);}} />}
      {suspectCase && <SuspectModal c={suspectCase} onClose={()=>setSuspectCase(null)} />}

      <SectionTitle title="Abuse Cases" sub={`${cases.length} abuse case${cases.length !== 1 ? "s" : ""} assigned to you`} />
      {cases.length === 0
        ? (
          <div className="flex flex-col items-center py-16 text-center gap-3">
            <Shield className="w-10 h-10 text-slate-200 dark:text-slate-700" />
            <p className="text-[13px] text-slate-400 dark:text-slate-500">No abuse cases assigned to you yet.</p>
          </div>
        )
        : cases.map(c => (
          <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-[11px] text-red-500 dark:text-red-400 font-bold">{c.caseId}</span>
                <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white mt-0.5">{c.child}</h3>
                <p className="text-[12px] text-slate-400 dark:text-slate-500">{c.district} · {new Date(c.date||c.createdAt).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn variant="outline" onClick={()=>setViewing(c)}><Eye className="w-3.5 h-3.5" />View Details</Btn>
              <Btn variant="outline" onClick={()=>setSuspectCase(c)}><Send className="w-3.5 h-3.5" />Suspect Details</Btn>
              <Btn variant="outline" onClick={()=>setUpdating(c)}><Edit2 className="w-3.5 h-3.5" />Update Status</Btn>
              {c.status !== "resolved" && (
                <Btn variant="green" onClick={async ()=>{ try{ await updatePoliceCaseStatus(c.id,"resolved"); onStatusUpdated(c.id,"resolved"); }catch(e){alert(e.message);} }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />Mark Resolved
                </Btn>
              )}
            </div>
          </div>
        ))
      }
    </div>
  );
}

function IncidentMapView({ mini=false, districts=[] }) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(null);
  const pinPos = [[22,36],[42,52],[64,33],[76,62],[32,72],[55,76],[84,42],[16,58],[48,24],[68,84]];
  const locations = districts.map((loc,i) => {
    const [x,y] = pinPos[i % pinPos.length];
    return { ...loc, id:loc.name||`d-${i}`, x, y, urgent:(loc.openIncidents??0)>5 };
  });
  const mapBg = theme === "dark" ? "linear-gradient(135deg,#1E293B 0%,#0F172A 100%)" : "linear-gradient(135deg,#FFFBEB 0%,#DBEAFE 100%)";
  const gridStroke = theme === "dark" ? "#334155" : "#1D4ED8";
  return (
    <div className={`relative rounded-2xl overflow-hidden ${mini?"h-48":"h-80"}`} style={{background:mapBg}}>
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        {[20,40,60,80].map(v=>(
          <g key={v}>
            <line x1={`${v}%`} y1="0" x2={`${v}%`} y2="100%" stroke={gridStroke} strokeWidth="0.5" />
            <line x1="0" y1={`${v}%`} x2="100%" y2={`${v}%`} stroke={gridStroke} strokeWidth="0.5" />
          </g>
        ))}
      </svg>
      <div className="absolute top-3 left-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">Incident Map</div>
      {locations.length===0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-[12px] font-semibold text-slate-500 dark:text-slate-400 shadow-sm">No active district data.</p>
        </div>
      )}
      {locations.map(loc=>(
        <div key={loc.id} className="absolute" style={{left:`${loc.x}%`,top:`${loc.y}%`,transform:"translate(-50%,-100%)"}}>
          <div className={`w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer ${loc.urgent?"bg-red-500":"bg-amber-500"}`}
            onMouseEnter={()=>setHovered(loc)} onMouseLeave={()=>setHovered(null)}>
            <MapPin className="w-3.5 h-3.5 text-white" />
          </div>
          {hovered?.id===loc.id && !mini && (
            <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-xl px-3 py-2 whitespace-nowrap z-10">
              <p className="text-[12px] font-bold text-slate-800 dark:text-white">{loc.name} District</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{loc.openIncidents} open incident{loc.openIncidents!==1?"s":""}</p>
            </div>
          )}
        </div>
      ))}
      {!mini && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg px-2.5 py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Urgent</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg px-2.5 py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Active</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MapView({ districts=[] }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Incident Map" sub="Open cases grouped by district" />
      <IncidentMapView districts={districts} />
      <div className="grid sm:grid-cols-2 gap-3">
        {districts.length===0
          ? <p className="text-sm text-slate-400 dark:text-slate-500 col-span-2 text-center py-6">No active district data.</p>
          : districts.map(loc => (
            <div key={loc.name} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${loc.openIncidents>5?"bg-red-100 dark:bg-red-950/40":"bg-amber-100 dark:bg-amber-950/40"}`}>
                <MapPin className={`w-4 h-4 ${loc.openIncidents>5?"text-red-600 dark:text-red-400":"text-amber-600 dark:text-amber-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate">{loc.name} District</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{loc.openIncidents} open incident{loc.openIncidents!==1?"s":""}</p>
              </div>
              {loc.openIncidents>5 && <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded-md">HIGH</span>}
            </div>
          ))
        }
      </div>
    </div>
  );
}

function EvidenceView({ cases }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Upload Investigation Evidence" sub="Add photos, documents or recordings to cases" />
      {cases.length===0
        ? <p className="text-[12px] text-slate-400 dark:text-slate-500">No cases to upload evidence for yet.</p>
        : cases.slice(0,3).map(c => (
          <div key={c.caseId||c.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">{c.caseId||c.id}</p>
                <p className="text-[14px] font-extrabold text-slate-800 dark:text-white">{c.child}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <FileUploadWidget caseId={c.caseId||c.id} accentColor="amber" />
          </div>
        ))
      }
    </div>
  );
}

function CaseNoteCard({ c }) {
  const [notes, setNotesList] = useState([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    import("../services/caseApi").then(({getCaseNotes})=>{
      getCaseNotes(c.caseId||c.id)
        .then(d=>setNotesList(d.notes||[]))
        .catch(()=>{})
        .finally(()=>setLoading(false));
    });
  },[c.caseId,c.id]);

  const handleSave = async () => {
    if(!text.trim()) return;
    try {
      setSaving(true);
      const {addCaseNote} = await import("../services/caseApi");
      await addCaseNote(c.caseId||c.id, {comment:text.trim()});
      setNotesList(prev=>[...prev,{id:Date.now(),author_name:"You",comment:text.trim(),created_at:new Date().toISOString()}]);
      setText("");
    } catch(err){ console.error("Save note failed:",err.message); }
    finally{ setSaving(false); }
  };

  const markUrgent = async () => {
    try {
      const {addCaseNote} = await import("../services/caseApi");
      await addCaseNote(c.caseId||c.id, {comment:"⚠️ Marked as URGENT by officer", status:"under-investigation"});
      setNotesList(prev=>[...prev,{id:Date.now(),author_name:"You",comment:"⚠️ Marked as URGENT",created_at:new Date().toISOString()}]);
    } catch(e){ console.error(e); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">{c.caseId||c.id}</p>
          <p className="text-[14px] font-extrabold text-slate-800 dark:text-white">{c.child}</p>
        </div>
        <StatusBadge status={c.status} />
      </div>
      {loading ? <p className="text-[12px] text-slate-400 dark:text-slate-500">Loading notes…</p>
        : notes.length>0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {notes.map(n=>(
              <div key={n.id} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2">
                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{n.comment}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{n.author_name} · {new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-[12px] text-slate-400 dark:text-slate-500 italic">No notes yet.</p>
      }
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={2}
        placeholder="Add investigation notes, suspect details, recovery information…"
        className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none" />
      <div className="flex gap-2">
        <Btn variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          <Send className="w-3.5 h-3.5" />{saving?"Saving…":"Save Note"}
        </Btn>
        <Btn variant="outline" size="sm" onClick={markUrgent}>
          <Flag className="w-3.5 h-3.5" />Mark Urgent
        </Btn>
      </div>
    </div>
  );
}

function NotesView({ cases }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Case Notes" sub="Add investigation notes, recovery details, and updates" />
      {cases.length===0
        ? <p className="text-[12px] text-slate-400 dark:text-slate-500">No cases in your district yet.</p>
        : cases.slice(0,6).map(c=><CaseNoteCard key={c.caseId||c.id} c={c} />)
      }
    </div>
  );
}

function ReportsView() {
  return (
    <div className="space-y-5">
      <SectionTitle title="Generate Case Reports" sub="Export case documentation for official use" />
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          {title:"Full Case Report",    sub:"Complete investigation summary",  icon:FileText    },
          {title:"Missing Child Report",sub:"Official missing persons form",   icon:User        },
          {title:"Arrest/Suspect Log",  sub:"Suspect and arrest documentation",icon:Lock        },
          {title:"Recovery Report",     sub:"Child recovery and outcome",      icon:CheckCircle2},
          {title:"Evidence Log",        sub:"All uploaded evidence manifest",  icon:Camera      },
          {title:"Monthly Summary",     sub:"All cases handled this month",    icon:Calendar    },
        ].map(r=>(
          <div key={r.title} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-3">
              <r.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-white mb-1">{r.title}</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">{r.sub}</p>
            <div className="flex gap-2">
              <Btn variant="outline" className="flex-1 justify-center"><Download className="w-3.5 h-3.5" />PDF</Btn>
              <Btn variant="outline" className="flex-1 justify-center"><Download className="w-3.5 h-3.5" />CSV</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsView({ alerts, loading }) {
  if (loading) return <div className="flex justify-center py-10"><svg className="animate-spin w-5 h-5 text-amber-500 dark:text-amber-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg></div>;
  return (
    <div className="space-y-5">
      <SectionTitle title="Alerts & Notifications" sub="All alerts, updates, and system messages" />
      <div className="space-y-3">
        {alerts.length===0
          ? <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-10">No active alerts right now.</p>
          : alerts.map((a,i)=>(
            <div key={i} className={`flex gap-3 p-4 rounded-xl border ${a.urgency==="critical"?"bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50":a.urgency==="urgent"?"bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50":"bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"} shadow-sm`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.urgency==="critical"?"bg-red-100 dark:bg-red-950/40":a.urgency==="urgent"?"bg-amber-100 dark:bg-amber-950/40":"bg-amber-50 dark:bg-amber-950/40"}`}>
                {a.urgency==="critical"||a.urgency==="urgent"
                  ? <AlertTriangle className={`w-4 h-4 ${a.urgency==="critical"?"text-red-600 dark:text-red-400":"text-amber-600 dark:text-amber-400"}`} />
                  : <Bell className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{a.title}</p>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${a.tag==="Critical"?"bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50":a.tag==="Urgent"?"bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50":"bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-700"}`}>{a.tag}</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{a.text}</p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────
export default function PoliceDashboard() {
  const navigate   = useNavigate();
  const profile    = getAuthProfile();
  const { theme, toggleTheme } = useTheme();
  const [active, setActive]           = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cases, setCases]             = useState([]);
  const [stats, setStats]             = useState(buildStats({}));
  const [loading, setLoading]         = useState(true);
  const [alerts, setAlerts]           = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [districts, setDistricts]     = useState([]);

  // Optimistic local status update
  const handleStatusUpdated = useCallback((id, status) => {
    setCases(prev => prev.map(c => c.id===id ? {...c, status} : c));
  }, []);

  useEffect(()=>{
    let cancelled = false;
    const loadData = async () => {
      try {
        const [casesData, statsData] = await Promise.all([getPoliceCases(), getPoliceStats()]);
        if (cancelled) return;
        setCases(casesData.cases||[]);
        setStats(buildStats(statsData.stats||{}));
      } catch(err){ console.error("Police data load failed:", err.message); }
      finally{ if(!cancelled) setLoading(false); }
    };
    const loadAlerts = async () => {
      try {
        const [alertsData, districtData] = await Promise.all([getPoliceAlerts(), getPoliceDistrictStats()]);
        if (cancelled) return;
        setAlerts(alertsData.alerts||[]);
        setDistricts(districtData.districts||[]);
      } catch(err){ console.error("Alerts load failed:", err.message); }
      finally{ if(!cancelled) setAlertsLoading(false); }
    };
    loadData();
    loadAlerts();
    return ()=>{ cancelled=true; };
  },[]);

  const handleLogout = ()=>{ clearAuthSession(); navigate("/login"); };

  const name     = profile?.fullName || "Officer";
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  const SECTIONS = {
    dashboard: <DashboardView onNav={setActive} cases={cases} stats={stats} loading={loading} alerts={alerts} districts={districts} profile={profile} />,
    cases:     <CasesView cases={cases} onStatusUpdated={handleStatusUpdated} />,
    missing:   <MissingView cases={cases.filter(c=>c.type==="Missing")} onStatusUpdated={handleStatusUpdated} />,
    abuse:     <AbuseView cases={cases.filter(c=>c.type==="Abuse")} onStatusUpdated={handleStatusUpdated} />,
    map:       <MapView districts={districts} />,
    evidence:  <EvidenceView cases={cases} />,
    notes:     <NotesView cases={cases} />,
    reports:   <ReportsView />,
    alerts:    <AlertsView alerts={alerts} loading={alertsLoading} />,
    profile:   <ProfilePage accentColor="blue" />,
  };
  const cur = NAV.find(n=>n.id===active);

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{backgroundColor: theme === "dark" ? "#0f172a" : "#FFFDF5"}}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={()=>setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 xl:w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen?"translate-x-0":"-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{background:"linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)"}}>
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[14px] font-extrabold text-amber-700 dark:text-amber-500">Childwatch</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Police Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {NAV.map(item=>{
            const Icon=item.icon; const isActive=active===item.id;
            return (
              <button key={item.id} onClick={()=>{setActive(item.id);setSidebarOpen(false);}}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${isActive?"text-white shadow-sm":"text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
                style={isActive?{background:"linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)"}:{}}>
                <Icon className="w-4 h-4 shrink-0" />{item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-4 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{profile?.district||""} · Police</p>
            </div>
            <button className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" onClick={handleLogout}><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50 relative">
          <div className="flex items-center gap-3">
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"><Menu className="w-5 h-5" /></button>
            <h1 className="text-[14px] font-extrabold text-slate-800 dark:text-white">{cur?.label}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationBell accentColor="amber" />
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">{initials}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40">{SECTIONS[active]}</main>
        <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-around px-1 py-2 shrink-0">
          {[{id:"dashboard",icon:LayoutDashboard,label:"Home"},{id:"cases",icon:FolderOpen,label:"Cases"},{id:"missing",icon:Search,label:"Missing"},{id:"map",icon:MapPin,label:"Map"},{id:"alerts",icon:Bell,label:"Alerts"}].map(item=>{
            const Icon=item.icon; const isA=active===item.id;
            return <button key={item.id} onClick={()=>setActive(item.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl">
              <Icon className={`w-5 h-5 ${isA?"text-amber-600 dark:text-amber-400":"text-slate-400 dark:text-slate-500"}`}/>
              <span className={`text-[9px] font-bold ${isA?"text-amber-600 dark:text-amber-400":"text-slate-400 dark:text-slate-500"}`}>{item.label}</span>
            </button>;
          })}
        </div>
      </div>
    </div>
  );
}

