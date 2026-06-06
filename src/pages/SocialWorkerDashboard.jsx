import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthProfile } from "../utils/authStorage";
import { getSocialCases, getSocialStats } from "../services/socialApi";
import NotificationBell from "../components/NotificationBell";
import ProfilePage from "../components/ProfilePage";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTheme } from "../contexts/ThemeContext";
import {
  LayoutDashboard, FolderOpen, ClipboardList, Heart, Calendar,
  ArrowRightLeft, Bell, AlertTriangle, CheckCircle2,
  MapPin, Menu, LogOut, Edit2, Eye, Send,
  Shield, FileText, Download, Home, User,
  MessageSquare, Sun, Moon, Search
} from "lucide-react";

// ── Stats builder ────────────────────────────────────────────────────
function buildStats(s = {}) {
  return [
    { label:"Assigned Cases",     value: String(s.total    ?? 0), icon:FolderOpen,    color:"blue"  },
    { label:"High-Priority",      value: String(s.highRisk ?? 0), icon:AlertTriangle, color:"red"   },
    { label:"Active Abuse Cases", value: String(s.active   ?? 0), icon:Shield,        color:"red"   },
    { label:"Cases Resolved",     value: String(s.resolved ?? 0), icon:CheckCircle2,  color:"green" },
  ];
}

// ── Config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  submitted:             { bg:"bg-slate-50",  text:"text-slate-700",  border:"border-slate-200",  dot:"bg-slate-400"  },
  verified:              { bg:"bg-blue-50",   text:"text-blue-700",   border:"border-blue-200",   dot:"bg-blue-500"   },
  "under-investigation": { bg:"bg-amber-50",  text:"text-amber-700",  border:"border-amber-200",  dot:"bg-amber-500"  },
  resolved:              { bg:"bg-green-50",  text:"text-green-700",  border:"border-green-200",  dot:"bg-green-500"  },
};

const PRIORITY_CONFIG = {
  high:   { bg:"bg-red-50",   text:"text-red-700",   border:"border-red-200",   dot:"bg-red-500"   },
  medium: { bg:"bg-amber-50", text:"text-amber-700", border:"border-amber-200", dot:"bg-amber-500" },
  low:    { bg:"bg-green-50", text:"text-green-700", border:"border-green-200", dot:"bg-green-500" },
};

const NAV = [
  { id:"dashboard",  label:"Dashboard",          icon:LayoutDashboard },
  { id:"cases",      label:"Assigned Cases",     icon:FolderOpen      },
  { id:"visits",     label:"Home Visits",        icon:Home            },
  { id:"assessment", label:"Assessments",        icon:ClipboardList   },
  { id:"referrals",  label:"Referrals",          icon:ArrowRightLeft  },
  { id:"follow-up",  label:"Follow-up Schedule", icon:Calendar        },
  { id:"reports",    label:"Reports",            icon:FileText        },
  { id:"alerts",     label:"Alerts",             icon:Bell            },
  { id:"profile",    label:"My Profile",         icon:User            },
];

// ── Shared UI ────────────────────────────────────────────────────────
function StatCard({ label, value, icon:Icon, color }) {
  const C = {
    blue:  "bg-yellow-50 text-yellow-600 ring-yellow-100",
    green: "bg-green-50 text-green-600 ring-green-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    red:   "bg-red-50 text-red-500 ring-red-100",
  }[color] || "bg-yellow-50 text-yellow-600 ring-yellow-100";
  const [bg, ic, ring] = C.split(" ");
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${bg} ring-4 ${ring} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${ic}`} />
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>
      {(status || "").replace(/-/g," ")}
    </span>
  );
}

function PriorityBadge({ priority = "medium" }) {
  const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>
      {priority} priority
    </span>
  );
}

function Btn({ children, variant="primary", size="sm", onClick, className="" }) {
  const V = {
    primary: "bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm",
    blue:    "bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm",
    outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
    danger:  "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
    ghost:   "text-slate-500 hover:bg-slate-100",
  }[variant];
  const S = { sm:"px-3 py-1.5 text-[12px]", md:"px-4 py-2.5 text-[13px]" }[size];
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all active:scale-[0.97] ${V} ${S} ${className}`}>
      {children}
    </button>
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

// ── CaseCard ─────────────────────────────────────────────────────────
function CaseCard({ c, showActions=true }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="font-mono text-[11px] text-yellow-700 dark:text-yellow-400 font-bold">{c.caseId}</span>
          <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white mt-0.5">
            {c.child || "—"}
            {c.age ? <span className="text-slate-400 font-normal text-[13px]"> · age {c.age}</span> : null}
          </h3>
          <p className="text-[12px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3"/>{c.district || "—"}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <PriorityBadge priority={c.priority} />
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${c.type==="Abuse"?"bg-red-50 text-red-600 border border-red-200":"bg-amber-50 text-amber-700 border border-amber-200"}`}>
            {c.type || "—"}
          </span>
        </div>
      </div>
      <div className="mb-3">
        <StatusBadge status={c.status} />
      </div>
      {showActions && (
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline"><Eye className="w-3.5 h-3.5"/>View</Btn>
          <Btn variant="outline"><Edit2 className="w-3.5 h-3.5"/>Update</Btn>
          <Btn variant="outline"><MessageSquare className="w-3.5 h-3.5"/>Note</Btn>
          <Btn variant="primary"><ArrowRightLeft className="w-3.5 h-3.5"/>Refer</Btn>
        </div>
      )}
    </div>
  );
}

// ── DashboardView ─────────────────────────────────────────────────────
function DashboardView({ onNav, cases, stats, loading, profile }) {
  const name = profile?.fullName || "Social Worker";
  const district = profile?.district || "";
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-yellow-600 rounded-2xl px-6 py-5 text-white">
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-yellow-500 rounded-full opacity-50 pointer-events-none"/>
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-yellow-500 rounded-full opacity-10 pointer-events-none"/>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-green-200 mb-1">Welcome back</p>
            <h2 className="text-[20px] font-extrabold">{name}</h2>
            <p className="text-[13px] text-green-200 mt-0.5">Social Worker{district ? ` · ${district}` : ""}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>onNav("cases")} className="flex items-center gap-2 px-4 py-2.5 bg-white text-yellow-800 font-bold text-[13px] rounded-xl hover:bg-green-50">
              <FolderOpen className="w-4 h-4"/>My Cases
            </button>
            <button onClick={()=>onNav("visits")} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/30 text-white font-bold text-[13px] rounded-xl hover:bg-white/20">
              <Calendar className="w-4 h-4"/>Visits
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading
          ? <p className="text-[12px] text-slate-400 col-span-4">Loading…</p>
          : stats.map(s => <StatCard key={s.label} {...s} />)
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* High-priority cases */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="font-extrabold text-slate-800 dark:text-white">High-Priority Assigned Cases</p>
            <button onClick={()=>onNav("cases")} className="text-[12px] font-semibold text-yellow-700 dark:text-yellow-400">View all →</button>
          </div>
          {cases.filter(c=>c.priority==="high").length === 0
            ? <p className="text-[12px] text-slate-400 py-4 text-center">No high-priority cases assigned.</p>
            : cases.filter(c=>c.priority==="high").map(c => <CaseCard key={c.caseId} c={c} />)
          }
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <p className="font-extrabold text-slate-800 dark:text-white mb-4">Recent Assignments</p>
            <div className="space-y-3">
              {cases.length === 0
                ? <p className="text-[12px] text-slate-400 text-center py-2">No cases assigned yet.</p>
                : cases.slice(0,3).map(c => (
                <div key={c.caseId} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4 text-yellow-700 dark:text-yellow-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{c.child || "—"}</p>
                    <p className="text-[10px] text-slate-400">{c.district || "—"}</p>
                  </div>
                  <PriorityBadge priority={c.priority}/>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-2xl p-4">
            <p className="font-extrabold text-yellow-800 dark:text-yellow-400 mb-1">Case Summary</p>
            <div className="space-y-2 mt-3">
              {[
                {l:"Total assigned",   v: cases.length,                                   c:"text-slate-700 dark:text-slate-300"},
                {l:"High priority",    v: cases.filter(x=>x.priority==="high").length,    c:"text-red-600"},
                {l:"Resolved",         v: cases.filter(x=>x.status==="resolved").length,  c:"text-green-700"},
              ].map(x=>(
                <div key={x.l} className="flex justify-between text-[12px]">
                  <span className="text-yellow-700 dark:text-yellow-500">{x.l}</span>
                  <span className={`font-extrabold ${x.c}`}>{x.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CasesView ─────────────────────────────────────────────────────────
function CasesView({ cases }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const filtered = cases.filter(c =>
    (filter==="All" || c.status===filter || c.priority===filter) &&
    ((c.child||"").toLowerCase().includes(search.toLowerCase()) ||
     (c.caseId||"").toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="space-y-5">
      <SectionTitle title="Assigned Cases" sub={`${cases.length} case${cases.length!==1?"s":""} assigned to you`}/>
      {cases.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <FolderOpen className="w-10 h-10 text-slate-200 dark:text-slate-700" />
          <p className="text-[13px] text-slate-400 dark:text-slate-500">No cases assigned to you yet. The admin will assign cases.</p>
        </div>
      )}
      {cases.length > 0 && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search by child name or case ID…"
                className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 bg-white dark:bg-slate-900 dark:text-slate-200"/>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["All","submitted","verified","under-investigation","resolved","high","medium","low"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${filter===f?"bg-yellow-500 text-white border-yellow-500":"bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  {f==="All"?"All":f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filtered.length === 0
              ? <p className="text-[12px] text-slate-400 py-6 text-center">No cases match this filter.</p>
              : filtered.map(c=><CaseCard key={c.caseId} c={c}/>)
            }
          </div>
        </>
      )}
    </div>
  );
}

// ── VisitsView ────────────────────────────────────────────────────────
function VisitsView({ cases }) {
  const [notes, setNotes] = useState({});
  return (
    <div className="space-y-5">
      <SectionTitle title="Home Visit Notes" sub="Record observations from field visits"/>
      {cases.length === 0
        ? <p className="text-[12px] text-slate-400 py-6 text-center">No cases assigned yet.</p>
        : cases.map(c=>(
        <div key={c.caseId} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] text-yellow-700 dark:text-yellow-400 font-bold">{c.caseId}</p>
              <p className="text-[14px] font-extrabold text-slate-800 dark:text-white">{c.child || "—"}</p>
              <p className="text-[12px] text-slate-400">{c.district} · {c.type}</p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <StatusBadge status={c.status}/>
              <PriorityBadge priority={c.priority}/>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Visit Observations</label>
              <textarea value={notes[c.caseId+"_obs"]||""} onChange={e=>setNotes(p=>({...p,[c.caseId+"_obs"]:e.target.value}))} rows={3}
                placeholder="Describe home conditions, child wellbeing, family situation…"
                className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 resize-none bg-white dark:bg-slate-900 dark:text-slate-200"/>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Intervention Actions Taken</label>
              <textarea value={notes[c.caseId+"_action"]||""} onChange={e=>setNotes(p=>({...p,[c.caseId+"_action"]:e.target.value}))} rows={2}
                placeholder="Actions taken, services provided…"
                className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 resize-none bg-white dark:bg-slate-900 dark:text-slate-200"/>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary"><Send className="w-3.5 h-3.5"/>Save Visit Notes</Btn>
            <Btn variant="outline"><CheckCircle2 className="w-3.5 h-3.5"/>Mark Child Safe</Btn>
            <Btn variant="danger"><AlertTriangle className="w-3.5 h-3.5"/>Still At Risk</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AssessmentView ────────────────────────────────────────────────────
function AssessmentView({ cases }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Social Assessments" sub="Document formal child welfare assessments"/>
      {cases.length === 0
        ? <p className="text-[12px] text-slate-400 py-6 text-center">No cases assigned yet.</p>
        : cases.slice(0,3).map(c=>(
        <div key={c.caseId} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] text-yellow-700 dark:text-yellow-400 font-bold">{c.caseId}</p>
              <p className="text-[14px] font-extrabold text-slate-800 dark:text-white">{c.child || "—"}</p>
            </div>
            <PriorityBadge priority={c.priority}/>
          </div>
          {[["Physical safety assessment","Assess child's physical condition and safety"],
            ["Psychological / emotional state","Document emotional wellbeing"],
            ["Family and home environment","Describe family dynamics and home safety"],
            ["Protection recommendation","Recommended next steps for child protection"]].map(([lbl, ph])=>(
            <div key={lbl}>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{lbl}</label>
              <textarea rows={2} placeholder={ph} className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 resize-none bg-white dark:bg-slate-900 dark:text-slate-200"/>
            </div>
          ))}
          <Btn variant="primary" size="md"><Send className="w-4 h-4"/>Submit Assessment</Btn>
        </div>
      ))}
    </div>
  );
}

// ── ReferralsView ─────────────────────────────────────────────────────
function ReferralsView({ cases }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Case Referrals" sub="Refer assigned cases to police, hospitals, or other agencies"/>
      {cases.length === 0
        ? <p className="text-[12px] text-slate-400 py-6 text-center">No cases assigned yet.</p>
        : cases.slice(0,3).map(c=>(
        <div key={c.caseId} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] text-yellow-700 dark:text-yellow-400 font-bold">{c.caseId}</p>
              <p className="text-[14px] font-extrabold text-slate-800 dark:text-white">{c.child || "—"}</p>
            </div>
            <StatusBadge status={c.status}/>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {label:"Refer to Police",   color:"bg-yellow-500 hover:bg-yellow-600 text-white",  icon:"🚔"},
              {label:"Refer to Hospital", color:"bg-yellow-500 hover:bg-yellow-600 text-white",  icon:"🏥"},
              {label:"Escalate Case",     color:"bg-red-600 hover:bg-red-700 text-white",         icon:"⚡"},
            ].map(r=>(
              <button key={r.label} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[13px] transition-all ${r.color}`}>
                <span>{r.icon}</span>{r.label}
              </button>
            ))}
          </div>
          <textarea rows={2} placeholder="Reason for referral…" className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 resize-none bg-white dark:bg-slate-900 dark:text-slate-200"/>
        </div>
      ))}
    </div>
  );
}

// ── FollowUpView ──────────────────────────────────────────────────────
function FollowUpView({ cases }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Follow-up Schedule" sub="Manage upcoming child welfare case reviews"/>
      {cases.length === 0
        ? <p className="text-[12px] text-slate-400 py-6 text-center">No cases assigned yet.</p>
        : <div className="space-y-3">
          {cases.map(c => (
            <div key={c.caseId} className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950/40 flex flex-col items-center justify-center shrink-0 text-center">
                <p className="text-[13px] font-extrabold text-yellow-700 dark:text-yellow-400 leading-none">
                  {new Date(c.assignedAt || c.createdAt).getDate()}
                </p>
                <p className="text-[9px] text-green-600 font-bold uppercase">
                  {new Date(c.assignedAt || c.createdAt).toLocaleString("default",{month:"short"})}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-800 dark:text-white">{c.child || "—"}</p>
                <p className="text-[12px] text-slate-400">{c.district} · {c.type}</p>
              </div>
              <StatusBadge status={c.status}/>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ── ReportsView ───────────────────────────────────────────────────────
function ReportsView() {
  return (
    <div className="space-y-5">
      <SectionTitle title="Reports & Export" sub="Generate welfare reports and case summaries"/>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          {t:"Case Intervention Report",   s:"Full social intervention summary",   i:FileText},
          {t:"Child Welfare Assessment",   s:"Formal assessment document",          i:ClipboardList},
          {t:"Monthly Visit Log",          s:"All home visits this month",           i:Calendar},
          {t:"Referral Summary",           s:"All referrals and outcomes",           i:ArrowRightLeft},
        ].map(r=>(
          <div key={r.t} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center mb-3">
              <r.i className="w-5 h-5 text-yellow-700 dark:text-yellow-400"/>
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-white mb-1">{r.t}</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">{r.s}</p>
            <div className="flex gap-2">
              <Btn variant="outline" className="flex-1 justify-center"><Download className="w-3.5 h-3.5"/>PDF</Btn>
              <Btn variant="outline" className="flex-1 justify-center"><Download className="w-3.5 h-3.5"/>CSV</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────
export default function SocialWorkerDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme?.() || {};
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(buildStats({}));
  const [loading, setLoading] = useState(true);
  const profile = getAuthProfile();
  const initials = profile?.fullName?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() || "SW";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [casesData, statsData] = await Promise.all([getSocialCases(), getSocialStats()]);
        setCases(casesData.cases || []);
        setStats(buildStats(statsData.stats || {}));
      } catch (err) {
        console.error("Social data load failed:", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => { clearAuthSession(); navigate("/login"); };

  const SECTIONS = {
    dashboard:   <DashboardView onNav={setActive} cases={cases} stats={stats} loading={loading} profile={profile}/>,
    cases:       <CasesView cases={cases}/>,
    visits:      <VisitsView cases={cases}/>,
    assessment:  <AssessmentView cases={cases}/>,
    referrals:   <ReferralsView cases={cases}/>,
    "follow-up": <FollowUpView cases={cases}/>,
    reports:     <ReportsView/>,
    alerts:      <div className="text-slate-500 dark:text-slate-400 p-4">No new alerts.</div>,
    profile:     <ProfilePage />,
  };
  const cur = NAV.find(n=>n.id===active);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={()=>setSidebarOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen?"translate-x-0":"-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center shadow-sm"><Heart className="w-5 h-5 text-white"/></div>
            <div><p className="text-[14px] font-extrabold text-white">Childwatch</p><p className="text-[10px] text-slate-400 font-medium">Social Worker</p></div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-extrabold text-yellow-400">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-white truncate">{profile?.fullName || "Social Worker"}</p>
              <p className="text-[10px] text-slate-400">{profile?.district || ""}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {NAV.map(item=>{
            const Icon=item.icon; const isA=active===item.id;
            return <button key={item.id} onClick={()=>{setActive(item.id);setSidebarOpen(false);}}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${isA?"bg-yellow-500 text-white shadow-sm":"text-slate-400 hover:text-white hover:bg-white/10"}`}>
              <Icon className="w-4 h-4 shrink-0"/>{item.label}
            </button>;
          })}
        </nav>

        <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-1 shrink-0">
          <LanguageSwitcher mode="dark" opens="up" />
          {toggleTheme && (
            <button onClick={toggleTheme} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-[13px] font-semibold transition-all">
              {theme==="dark" ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
              {theme==="dark" ? "Light mode" : "Dark mode"}
            </button>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-[13px] font-semibold transition-all">
            <LogOut className="w-4 h-4"/>Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50 relative">
          <div className="flex items-center gap-3">
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><Menu className="w-5 h-5 text-slate-600 dark:text-slate-400"/></button>
            <h1 className="text-[14px] font-extrabold text-slate-800 dark:text-slate-200">{cur?.label}</h1>
          </div>
          <div className="flex items-center gap-2">
            {toggleTheme && (
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                {theme==="dark" ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
              </button>
            )}
            <NotificationBell accentColor="yellow" />
            <button onClick={()=>setActive("profile")} className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-950/40 flex items-center justify-center">
              <span className="text-[11px] font-bold text-yellow-700 dark:text-yellow-400">{initials}</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{SECTIONS[active] || SECTIONS.dashboard}</main>
        <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-around px-1 py-2 shrink-0">
          {[{id:"dashboard",icon:LayoutDashboard,label:"Home"},{id:"cases",icon:FolderOpen,label:"Cases"},{id:"visits",icon:Home,label:"Visits"},{id:"alerts",icon:Bell,label:"Alerts"},{id:"profile",icon:User,label:"Profile"}].map(item=>{
            const Icon=item.icon; const isA=active===item.id;
            return <button key={item.id} onClick={()=>setActive(item.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5">
              <Icon className={`w-5 h-5 ${isA?"text-yellow-600 dark:text-yellow-400":"text-slate-400"}`}/>
              <span className={`text-[9px] font-bold ${isA?"text-yellow-600 dark:text-yellow-400":"text-slate-400"}`}>{item.label}</span>
            </button>;
          })}
        </div>
      </div>
    </div>
  );
}
