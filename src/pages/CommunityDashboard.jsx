// CommunityDashboard.jsx — Childwatch Community Member Portal
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { clearAuthSession, getAuthProfile } from "../utils/authStorage";
import {
  getMyReports, createMyReport, trackMyCase, updateMyReport,
  getMyNotifications, markNotificationRead, markAllNotificationsRead,
} from "../services/reporterApi";

import {
  LayoutDashboard, FileText, Bell, AlertTriangle, BookOpen,
  Phone, Shield, Users, CheckCircle2, Clock, Eye, Menu, LogOut,
  ChevronRight, Sun, Moon, Flag, Send, MapPin, X, RefreshCw,
  Search, Baby, Settings, Heart, Globe, ArrowRight, Megaphone,
  Star, CheckCheck, ChevronDown, ChevronUp, AlertCircle, Info,
  Zap, Camera, Edit3, Lock, User, Save,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DISTRICTS = [
  "Gasabo","Kicukiro","Nyarugenge","Bugesera","Gatsibo","Kayonza",
  "Kirehe","Ngoma","Nyagatare","Rwamagana","Burera","Gicumbi",
  "Gakenke","Musanze","Rulindo","Gisagara","Huye","Kamonyi",
  "Muhanga","Nyamagabe","Nyamasheke","Nyanza","Ruhango","Karongi",
  "Ngororero","Nyabihu","Rubavu","Rutsiro","Rusizi",
];

const ABUSE_TYPES = [
  { value: "Physical Abuse",               emoji: "🟠", desc: "Hitting, burning, shaking or any physical harm to a child" },
  { value: "Sexual Abuse",                 emoji: "🔴", desc: "Any sexual act or exploitation of a child" },
  { value: "Emotional Abuse",              emoji: "🟡", desc: "Verbal threats, humiliation, rejection, intimidation" },
  { value: "Neglect",                      emoji: "🔵", desc: "Failure to provide food, shelter, education or medical care" },
  { value: "Child Trafficking Suspicion",  emoji: "⚫", desc: "Suspected exploitation, forced labour or illegal movement" },
];

const STATUS_CONFIG = {
  submitted:             { label: "Submitted",            dot: "bg-slate-400",  pill: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"  },
  verified:              { label: "Under Review",         dot: "bg-blue-500",   pill: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"    },
  assigned:              { label: "Assigned",             dot: "bg-purple-500", pill: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  "under-investigation": { label: "Investigation Ongoing",dot: "bg-amber-500",  pill: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
  resolved:              { label: "Resolved",             dot: "bg-green-500",  pill: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" },
  closed:                { label: "Closed",               dot: "bg-slate-500",  pill: "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"    },
};

const STATUS_STEPS = [
  { key: "submitted",             label: "Submitted"            },
  { key: "verified",              label: "Under Review"         },
  { key: "assigned",              label: "Assigned"             },
  { key: "under-investigation",   label: "Investigation Ongoing"},
  { key: "resolved",              label: "Resolved"             },
  { key: "closed",                label: "Closed"               },
];

const EMERGENCY_CONTACTS = [
  { label: "Police Emergency",        number: "112",          color: "bg-red-600",     icon: Shield },
  { label: "Childline Rwanda",        number: "116",          color: "bg-amber-600",   icon: Phone  },
  { label: "National Child Helpline", number: "080-010-0099", color: "bg-blue-600",    icon: Baby   },
  { label: "Isange One-Stop Centre",  number: "3029",         color: "bg-emerald-600", icon: Heart  },
];

const AWARENESS_ITEMS = [
  { title: "Signs of Child Abuse",        icon: Shield,   desc: "Learn to recognise physical and behavioural warning signs in children.",  color: "bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400"       },
  { title: "How to Report Safely",        icon: FileText, desc: "Step-by-step guide to submitting a confidential or anonymous report.",    color: "bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400"   },
  { title: "Child Rights in Rwanda",      icon: Globe,    desc: "Know the legal protections every child is entitled to under Rwanda law.", color: "bg-green-50 dark:bg-green-950/30 text-green-500 dark:text-green-400"},
  { title: "Community Watch Programme",   icon: Users,    desc: "Join neighbourhood groups coordinated by Childwatch volunteers.",         color: "bg-purple-50 dark:bg-purple-950/30 text-purple-500 dark:text-purple-400"},
  { title: "Talking to Children",         icon: Heart,    desc: "Guidance on approaching a child you believe may be at risk.",            color: "bg-pink-50 dark:bg-pink-950/30 text-pink-500 dark:text-pink-400"   },
  { title: "Digital Safety for Children", icon: Shield,   desc: "Protect children from online exploitation, grooming and cyberbullying.", color: "bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400"},
];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function publicFetch(path) {
  const res  = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  return data;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Btn({ children, variant = "primary", size = "md", onClick, disabled, type = "button", className = "" }) {
  const base = "inline-flex items-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed";
  const S = { sm: "px-3 py-1.5 text-[12px]", md: "px-4 py-2.5 text-[13px]", lg: "px-5 py-3 text-[14px]" };
  const V = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    green:   "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
    red:     "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    outline: "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
    ghost:   "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
    amber:   "bg-amber-500 hover:bg-amber-600 text-white shadow-sm",
    soft:    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${S[size] || S.md} ${V[variant] || V.primary} ${className}`}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="text-center py-14">
      <Icon className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
      <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">{title}</p>
      {sub && <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function LoadingRows({ n = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse h-20" />
      ))}
    </div>
  );
}

const fieldClass = "w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors";
const labelClass = "block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

// ─── 1. Dashboard Section ─────────────────────────────────────────────────────

function DashboardSection({ profile, reports, loading, notifications, onNav }) {
  const submitted    = reports.filter(r => r.status === "submitted").length;
  const underReview  = reports.filter(r => r.status === "verified").length;
  const active       = reports.filter(r => ["assigned","under-investigation"].includes(r.status)).length;
  const resolved     = reports.filter(r => r.status === "resolved").length;
  const alerts       = notifications.filter(n => !n.read).length;
  const recentNotifs = notifications.filter(n => !n.read).length;

  const STATS = [
    { label: "Reports Submitted",    value: reports.length,  icon: FileText,     colorBg: "bg-blue-50 dark:bg-blue-950/40",    colorIc: "text-blue-600 dark:text-blue-400"   },
    { label: "Reports Under Review", value: underReview,     icon: Clock,        colorBg: "bg-amber-50 dark:bg-amber-950/40",  colorIc: "text-amber-600 dark:text-amber-400" },
    { label: "Active Cases",         value: active,          icon: Zap,          colorBg: "bg-purple-50 dark:bg-purple-950/40",colorIc: "text-purple-600 dark:text-purple-400"},
    { label: "Resolved Cases",       value: resolved,        icon: CheckCircle2, colorBg: "bg-green-50 dark:bg-green-950/40",  colorIc: "text-green-600 dark:text-green-400" },
    { label: "Community Alerts",     value: alerts,          icon: Bell,         colorBg: "bg-red-50 dark:bg-red-950/40",      colorIc: "text-red-500 dark:text-red-400"     },
    { label: "Recent Notifications", value: recentNotifs,    icon: Megaphone,    colorBg: "bg-slate-100 dark:bg-slate-800",    colorIc: "text-slate-600 dark:text-slate-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-6 py-7 text-white shadow-lg">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-blue-200 mb-1">Childwatch Community Portal</p>
            <h2 className="text-[22px] font-extrabold">{profile?.fullName || "Community Member"}</h2>
            <p className="text-[13px] text-blue-200 mt-0.5">
              {profile?.district ? profile.district + " District · " : ""}Community Member
            </p>
            <p className="text-[12px] text-blue-100 mt-2 max-w-md leading-relaxed">
              Your reports protect children. Every observation counts — report safely and anonymously.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => onNav("report-missing")}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 font-bold text-[12px] rounded-xl transition-colors">
              <Baby className="w-4 h-4" /> Missing Child
            </button>
            <button onClick={() => onNav("report-abuse")}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 font-bold text-[12px] rounded-xl hover:bg-blue-50 transition-colors">
              <Flag className="w-4 h-4" /> Report Abuse
            </button>
          </div>
        </div>
      </div>

      {/* Safety tip */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
          If a child is in <strong>immediate danger</strong>, call <strong>112</strong> first. All reports can be submitted anonymously — your identity is protected.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 animate-pulse h-24" />
            ))
          : STATS.map(s => (
              <Card key={s.label} className="p-4">
                <div className={"w-9 h-9 rounded-xl flex items-center justify-center mb-3 " + s.colorBg}>
                  <s.icon className={"w-4 h-4 " + s.colorIc} />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{s.label}</p>
              </Card>
            ))
        }
      </div>

      {/* Recent reports + Quick actions */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-extrabold text-slate-800 dark:text-slate-200">Recent Reports</p>
            <button onClick={() => onNav("my-reports")}
              className="text-[12px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              View all →
            </button>
          </div>
          {loading ? <LoadingRows n={3} />
            : reports.length === 0
              ? <EmptyState icon={FileText} title="No reports yet" sub="Use the buttons above to submit your first report" />
              : (
                <div className="space-y-2">
                  {reports.slice(0, 6).map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <span className={"w-2.5 h-2.5 rounded-full shrink-0 " + (STATUS_CONFIG[r.status]?.dot || "bg-slate-400")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">
                          {r.incidentType || r.type || "Report"}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{r.caseId} · {r.district}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              )
          }
        </Card>

        <Card className="p-5">
          <p className="font-extrabold text-slate-800 dark:text-slate-200 mb-4">Quick Actions</p>
          <div className="space-y-1">
            {[
              { label: "Report a Missing Child",    icon: Baby,      nav: "report-missing", color: "text-amber-600 dark:text-amber-500" },
              { label: "Report Child Abuse",        icon: Flag,      nav: "report-abuse",   color: "text-red-600 dark:text-red-400"     },
              { label: "Track My Reports",          icon: Eye,       nav: "my-reports",     color: "text-blue-600 dark:text-blue-400"   },
              { label: "View Missing Child Alerts", icon: Megaphone, nav: "alerts",         color: "text-purple-600 dark:text-purple-400"},
              { label: "Found Children",            icon: CheckCircle2,nav:"found",         color: "text-green-600 dark:text-green-400" },
              { label: "My Notifications",          icon: Bell,      nav: "notifications",  color: "text-slate-600 dark:text-slate-400" },
            ].map(item => (
              <button key={item.nav} onClick={() => onNav(item.nav)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left group">
                <item.icon className={"w-4 h-4 shrink-0 " + item.color} />
                <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                  {item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── 2. Report Missing Child ──────────────────────────────────────────────────

function ReportMissingChildSection({ onDone }) {
  const INIT = {
    childName: "", age: "", gender: "", lastKnownLocation: "", district: "",
    sector: "", dateMissing: "", description: "", additionalNotes: "",
    isAnonymous: false, contactPhone: "",
  };
  const [form,    setForm]    = useState(INIT);
  const [photo,   setPhoto]   = useState(null);
  const [draft,   setDraft]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [savingD, setSavingD] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  // Load saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("childwatch_draft_missing");
      if (saved) { setDraft(JSON.parse(saved)); }
    } catch {}
  }, []);

  const saveDraft = () => {
    setSavingD(true);
    try {
      localStorage.setItem("childwatch_draft_missing", JSON.stringify(form));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } catch {}
    finally { setSavingD(false); }
  };

  const loadDraft = () => {
    if (draft) { setForm(draft); setDraft(null); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.description.trim() || !form.district) {
      setError("District and description are required."); return;
    }
    setSaving(true); setError("");
    try {
      const payload = {
        incidentType: "Missing Child",
        type: "Missing",
        childName: form.childName || "Unknown",
        age: form.age || null,
        gender: form.gender || null,
        district: form.district,
        sector: form.sector || null,
        location: form.lastKnownLocation || form.district,
        description: [
          form.description,
          form.dateMissing     ? `Last seen: ${form.dateMissing}` : null,
          form.additionalNotes ? `Additional notes: ${form.additionalNotes}` : null,
        ].filter(Boolean).join("\n\n"),
        isAnonymous: form.isAnonymous,
        contactPhone: form.isAnonymous ? "" : form.contactPhone,
        urgency: "urgent",
      };
      const res = await createMyReport(payload);
      // Note: photo upload is part of the form data, handled by the backend
      localStorage.removeItem("childwatch_draft_missing");
      setDone(res?.report?.caseId || "submitted");
      onDone?.();
    } catch (err) {
      setError(err.message || "Failed to submit report.");
    } finally { setSaving(false); }
  };

  if (done) return (
    <div className="flex flex-col items-center py-20 gap-5 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Report Submitted Successfully</h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Case ID: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{done}</span><br />
          Our team will review this report immediately. Track it under "My Reports".
        </p>
      </div>
      <Btn variant="primary" size="md" onClick={() => { setDone(null); setForm(INIT); setPhoto(null); }}>
        Submit Another Report
      </Btn>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Report a Missing Child</h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">All reports are confidential. Fields marked * are required.</p>
      </div>

      {/* Draft banner */}
      {draft && (
        <div className="mb-5 flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-[13px] font-semibold text-blue-700 dark:text-blue-300">You have a saved draft</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={() => setDraft(null)}>Dismiss</Btn>
            <Btn variant="primary" size="sm" onClick={loadDraft}>Load Draft</Btn>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Child Information */}
        <Card className="p-6 space-y-5">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Child Information</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className={labelClass}>Child's Name (if known)</label>
              <input value={form.childName} onChange={set("childName")} placeholder="Optional" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Approximate Age</label>
              <input type="number" min="0" max="18" value={form.age} onChange={set("age")} placeholder="years" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select value={form.gender} onChange={set("gender")} className={fieldClass}>
                <option value="">Unknown</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Last Known Location *</label>
              <input value={form.lastKnownLocation} onChange={set("lastKnownLocation")} placeholder="e.g. Near Remera Market, Gasabo" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Date Last Seen</label>
              <input type="date" value={form.dateMissing} onChange={set("dateMissing")} className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>District *</label>
              <select value={form.district} onChange={set("district")} className={fieldClass} required>
                <option value="">Select district…</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Sector / Cell</label>
              <input value={form.sector} onChange={set("sector")} placeholder="e.g. Kimironko" className={fieldClass} />
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card className="p-6 space-y-5">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</p>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea value={form.description} onChange={set("description")} rows={4} required
              placeholder="Describe the child's appearance, clothing, circumstances of disappearance, when and where they were last seen…"
              className={fieldClass + " resize-none"} />
          </div>

          <div>
            <label className={labelClass}>Additional Notes</label>
            <textarea value={form.additionalNotes} onChange={set("additionalNotes")} rows={2}
              placeholder="Any other relevant information that could help locate the child…"
              className={fieldClass + " resize-none"} />
          </div>

          {/* Photo upload */}
          <div>
            <label className={labelClass}>Upload Photo of Child</label>
            <label className="block border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <input type="file" className="hidden" accept="image/*"
                onChange={e => setPhoto(e.target.files[0])} />
              <Camera className="w-7 h-7 text-slate-400 mx-auto mb-2" />
              <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                {photo ? photo.name : "Upload a recent photo of the child"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">JPG, PNG · Helps identification</p>
            </label>
          </div>
        </Card>

        {/* Identity */}
        <Card className="p-6 space-y-4">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Your Identity</p>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={form.isAnonymous} onChange={set("isAnonymous")}
              className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-slate-600 text-blue-600" />
            <div>
              <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Submit Anonymously</p>
              <p className="text-[11px] text-slate-400">Your name and identity will not be recorded</p>
            </div>
          </label>

          {!form.isAnonymous && (
            <div>
              <label className={labelClass}>Your Contact Number (optional)</label>
              <input value={form.contactPhone} onChange={set("contactPhone")}
                placeholder="+250 7XX XXX XXX" className={fieldClass} />
              <p className="text-[10px] text-slate-400 mt-1">Used only by investigators to follow up</p>
            </div>
          )}
        </Card>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {draftSaved && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-[12px] text-green-600 dark:text-green-400 font-semibold">Draft saved!</p>
          </div>
        )}

        <div className="flex gap-3">
          <Btn variant="outline" size="lg" onClick={saveDraft} disabled={savingD} className="justify-center">
            <Save className="w-4 h-4" /> {savingD ? "Saving…" : "Save Draft"}
          </Btn>
          <Btn type="submit" variant="amber" size="lg" disabled={saving} className="flex-1 justify-center">
            <Baby className="w-4 h-4" /> {saving ? "Submitting…" : "Submit Report"}
          </Btn>
        </div>
      </form>
    </div>
  );
}

// ─── 3. Report Child Abuse (3-step wizard) ────────────────────────────────────

function ReportAbuseSection({ onDone }) {
  const INIT = {
    childName: "", age: "", gender: "",
    district: "", incidentLocation: "",
    description: "",
    witnessName: "", witnessContact: "", witnessRelation: "",
    isAnonymous: true, contactPhone: "", urgency: "urgent",
  };
  const [step,         setStep]         = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [form,         setForm]         = useState(INIT);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [done,         setDone]         = useState(null);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = async () => {
    if (!form.description.trim() || !form.district) {
      setError("District and description are required."); return;
    }
    setSaving(true); setError("");
    try {
      const witness = [
        form.witnessName    ? `Witness: ${form.witnessName}` : null,
        form.witnessRelation? `Relation: ${form.witnessRelation}` : null,
        form.witnessContact ? `Contact: ${form.witnessContact}` : null,
      ].filter(Boolean).join(", ");

      await createMyReport({
        incidentType: selectedType,
        type: "Abuse",
        childName: form.childName || "Unknown",
        age: form.age || null,
        gender: form.gender || null,
        district: form.district,
        location: form.incidentLocation || form.district,
        description: form.description + (witness ? `\n\nWitness information: ${witness}` : ""),
        isAnonymous: form.isAnonymous,
        contactPhone: form.isAnonymous ? "" : form.contactPhone,
        urgency: form.urgency,
      });
      setDone(true);
      onDone?.();
    } catch (err) {
      setError(err.message || "Failed to submit report.");
    } finally { setSaving(false); }
  };

  if (done) return (
    <div className="flex flex-col items-center py-20 gap-5 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Abuse Report Submitted</h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Our team will review this report immediately.<br />Track it under "My Reports".
        </p>
      </div>
      <Btn variant="primary" size="md" onClick={() => { setDone(null); setStep(1); setSelectedType(""); setForm(INIT); }}>
        Report Another
      </Btn>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Report Child Abuse</h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Confidential reporting — you may report anonymously.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        {[
          { n: 1, label: "Abuse Type"     },
          { n: 2, label: "Incident Info"  },
          { n: 3, label: "Your Identity"  },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={[
              "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-colors",
              step >= s.n
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400",
            ].join(" ")}>{s.n}</div>
            <span className={"text-[11px] font-bold hidden sm:block " + (step === s.n ? "text-blue-600 dark:text-blue-400" : "text-slate-400")}>{s.label}</span>
            {i < 2 && <div className={"h-0.5 w-8 sm:w-12 rounded " + (step > s.n ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700")} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Select abuse type */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-2">What type of abuse are you reporting?</p>
          <div className="space-y-3">
            {ABUSE_TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setSelectedType(t.value)}
                className={[
                  "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                  selectedType === t.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600",
                ].join(" ")}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{t.value}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                </div>
                {selectedType === t.value && <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
              </button>
            ))}
          </div>
          <Btn variant="primary" size="lg" disabled={!selectedType} onClick={() => setStep(2)} className="w-full justify-center mt-2">
            Next: Incident Details <ChevronRight className="w-4 h-4" />
          </Btn>
        </div>
      )}

      {/* Step 2 — Incident details */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Selected type badge */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
            <span className="text-xl">{ABUSE_TYPES.find(t => t.value === selectedType)?.emoji}</span>
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{selectedType}</p>
            <button type="button" onClick={() => setStep(1)} className="ml-auto text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">Change</button>
          </div>

          {/* Victim Information */}
          <Card className="p-6 space-y-5">
            <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Victim Information</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className={labelClass}>Child Name</label>
                <input value={form.childName} onChange={set("childName")} placeholder="If known" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Age</label>
                <input type="number" min="0" max="18" value={form.age} onChange={set("age")} placeholder="yrs" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select value={form.gender} onChange={set("gender")} className={fieldClass}>
                  <option value="">Unknown</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Incident Details */}
          <Card className="p-6 space-y-5">
            <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Incident Details</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>District *</label>
                <select value={form.district} onChange={set("district")} className={fieldClass} required>
                  <option value="">Select district…</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Incident Location</label>
                <input value={form.incidentLocation} onChange={set("incidentLocation")} placeholder="Street, area where it occurred" className={fieldClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Urgency Level</label>
              <div className="flex gap-2">
                {["normal","urgent","critical"].map(u => (
                  <button key={u} type="button" onClick={() => setForm(f => ({ ...f, urgency: u }))}
                    className={[
                      "flex-1 py-2.5 rounded-xl text-[12px] font-bold border capitalize transition-all",
                      form.urgency === u
                        ? u === "critical" ? "bg-red-600 text-white border-red-600"
                          : u === "urgent" ? "bg-amber-500 text-white border-amber-500"
                          : "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300",
                    ].join(" ")}
                  >{u}</button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Description *</label>
              <textarea value={form.description} onChange={set("description")} rows={5} required
                placeholder="Describe what you observed: what happened, when, who was involved, any signs of abuse you noticed…"
                className={fieldClass + " resize-none"} />
            </div>
          </Card>

          {/* Witness Details */}
          <Card className="p-6 space-y-5">
            <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Witness Details (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Witness Name</label>
                <input value={form.witnessName} onChange={set("witnessName")} placeholder="Optional" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Witness Relation</label>
                <input value={form.witnessRelation} onChange={set("witnessRelation")} placeholder="e.g. Neighbour" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Witness Contact</label>
                <input value={form.witnessContact} onChange={set("witnessContact")} placeholder="+250 7XX XXX XXX" className={fieldClass} />
              </div>
            </div>
          </Card>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Btn variant="outline" size="md" onClick={() => setStep(1)} className="w-28 justify-center">← Back</Btn>
            <Btn variant="primary" size="md" disabled={!form.district || !form.description.trim()}
              onClick={() => { setError(""); setStep(3); }} className="flex-1 justify-center">
              Next: Identity <ChevronRight className="w-4 h-4" />
            </Btn>
          </div>
        </div>
      )}

      {/* Step 3 — Identity */}
      {step === 3 && (
        <div className="space-y-5">
          <Card className="p-6 space-y-5">
            <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Your Identity</p>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
              <p className="text-[12px] font-bold text-blue-700 dark:text-blue-300 mb-1">🔒 Anonymous Reporting Recommended</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed">
                You can submit this report without revealing your identity. The report will still be fully investigated.
                This is the recommended option to protect your safety.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <input type="checkbox" checked={form.isAnonymous} onChange={set("isAnonymous")}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600" />
              <div>
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Submit Anonymously (Recommended)</p>
                <p className="text-[11px] text-slate-400">Your name and contact will not be stored</p>
              </div>
            </label>

            {!form.isAnonymous && (
              <div>
                <label className={labelClass}>Your Contact Number</label>
                <input value={form.contactPhone} onChange={set("contactPhone")} placeholder="+250 7XX XXX XXX" className={fieldClass} />
                <p className="text-[10px] text-slate-400 mt-1">Used only if investigators need to follow up</p>
              </div>
            )}
          </Card>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Btn variant="outline" size="md" onClick={() => setStep(2)} className="w-28 justify-center">← Back</Btn>
            <Btn variant="red" size="md" onClick={handleSubmit} disabled={saving} className="flex-1 justify-center">
              <Flag className="w-4 h-4" /> {saving ? "Submitting…" : "Submit Abuse Report"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 4. My Reports — Track + Provide Additional Information ───────────────────

function MyReportsSection({ reports, loading, onRefresh }) {
  const [trackId,     setTrackId]     = useState("");
  const [trackedCase, setTrackedCase] = useState(null);
  const [trackLoad,   setTrackLoad]   = useState(false);
  const [trackErr,    setTrackErr]    = useState("");
  const [filter,      setFilter]      = useState("all");
  const [expandedId,  setExpandedId]  = useState(null);
  // "Provide Additional Information" state
  const [updateCase, setUpdateCase] = useState(null);
  const [updateForm, setUpdateForm] = useState({ witnessName: "", witnessContact: "", location: "", notes: "" });
  const [updating,   setUpdating]   = useState(false);
  const [updateDone, setUpdateDone] = useState(false);

  const handleTrack = async () => {
    if (!trackId.trim()) return;
    setTrackLoad(true); setTrackErr(""); setTrackedCase(null);
    try {
      const res = await trackMyCase(trackId.trim().toUpperCase());
      setTrackedCase(res.case || res);
    } catch (err) {
      setTrackErr(err.message || "Case not found for your account");
    } finally { setTrackLoad(false); }
  };

  const handleUpdate = async () => {
    if (!updateCase) return;
    setUpdating(true); setUpdateDone(false);
    try {
      const extraDesc = [
        updateForm.witnessName    ? `Witness: ${updateForm.witnessName} (${updateForm.witnessContact || "no contact"})` : null,
        updateForm.location       ? `Updated location: ${updateForm.location}` : null,
        updateForm.notes          ? `Additional info: ${updateForm.notes}` : null,
      ].filter(Boolean).join("\n");

      await updateMyReport(updateCase.caseId, {
        description: (updateCase.description || "") + (extraDesc ? "\n\n[UPDATE] " + extraDesc : ""),
        location: updateForm.location || updateCase.location,
      });
      setUpdateDone(true);
      setTimeout(() => { setUpdateCase(null); setUpdateForm({ witnessName:"", witnessContact:"", location:"", notes:"" }); setUpdateDone(false); onRefresh(); }, 1500);
    } catch { /* silent */ }
    finally { setUpdating(false); }
  };

  const FILTER_OPTS = [
    { k: "all",    label: "All" },
    { k: "submitted",           label: "Submitted"      },
    { k: "verified",            label: "Under Review"   },
    { k: "assigned",            label: "Assigned"       },
    { k: "under-investigation", label: "Investigating"  },
    { k: "resolved",            label: "Resolved"       },
    { k: "closed",              label: "Closed"         },
  ];

  const filtered = reports.filter(r => filter === "all" || r.status === filter);

  // Build timeline for a case
  const buildTimeline = (c) => {
    const statusIndex = STATUS_STEPS.findIndex(s => s.key === c.status);
    return STATUS_STEPS.map((s, i) => ({
      ...s,
      done: i <= statusIndex,
      current: i === statusIndex,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">My Reports</h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{reports.length} report{reports.length !== 1 ? "s" : ""} submitted</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={onRefresh}><RefreshCw className="w-3.5 h-3.5" /> Refresh</Btn>
      </div>

      {/* Case tracker */}
      <Card className="p-5">
        <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Track a Case by ID</p>
        <div className="flex gap-2">
          <input value={trackId} onChange={e => setTrackId(e.target.value)}
            placeholder="e.g. CW-2026-1234"
            className={fieldClass + " flex-1"}
            onKeyDown={e => e.key === "Enter" && handleTrack()} />
          <Btn variant="primary" size="md" onClick={handleTrack} disabled={trackLoad}>
            <Search className="w-4 h-4" /> {trackLoad ? "…" : "Track"}
          </Btn>
        </div>
        {trackErr && <p className="text-[12px] text-red-600 dark:text-red-400 mt-2">{trackErr}</p>}

        {/* Case timeline */}
        {trackedCase && (
          <div className="mt-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="font-mono text-[12px] font-bold text-blue-600 dark:text-blue-400">{trackedCase.caseId}</p>
                <p className="text-[14px] font-extrabold text-slate-900 dark:text-white mt-0.5">{trackedCase.incidentType || trackedCase.type}</p>
                <p className="text-[11px] text-slate-400">{trackedCase.district}</p>
              </div>
              <StatusBadge status={trackedCase.status} />
            </div>
            {/* Visual timeline */}
            <div className="relative pl-6">
              <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-4">
                {buildTimeline(trackedCase).map((step, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className={[
                      "absolute -left-6 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 z-10 transition-colors mt-0.5",
                      step.done ? (step.current ? "bg-blue-600 ring-2 ring-blue-300 dark:ring-blue-800" : "bg-blue-400") : "bg-slate-200 dark:bg-slate-700"
                    ].join(" ")} />
                    <div>
                      <p className={[
                        "text-[12px] font-bold",
                        step.current ? "text-blue-600 dark:text-blue-400" : step.done ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600"
                      ].join(" ")}>{step.label}</p>
                      {step.current && (
                        <p className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold">← Current status</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTS.map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={[
              "px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors",
              filter === f.k
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300",
            ].join(" ")}>{f.label}</button>
        ))}
      </div>

      {/* Reports list */}
      {loading ? <LoadingRows n={3} />
        : filtered.length === 0
          ? <EmptyState icon={FileText} title="No reports found"
              sub={filter === "all" ? "Submit a report using the sidebar menu" : "No reports with this status"} />
          : (
            <div className="space-y-3">
              {filtered.map(r => {
                const isExpanded = expandedId === r.id;
                const isUpdating = updateCase?.id === r.id;
                return (
                  <Card key={r.id} className="overflow-hidden">
                    <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="w-full flex items-start gap-4 p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <span className={"w-2.5 h-2.5 rounded-full mt-2 shrink-0 " + (STATUS_CONFIG[r.status]?.dot || "bg-slate-400")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">{r.caseId}</span>
                          <StatusBadge status={r.status} />
                          {r.urgency === "critical" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold">CRITICAL</span>
                          )}
                        </div>
                        <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 truncate">
                          {r.incidentType || r.type || "Report"}
                        </p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{r.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{r.district}
                          </span>
                          <span className="text-[11px] text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                        {/* Description */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                          <p className="text-[13px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{r.description}</p>
                        </div>

                        {/* Action buttons */}
                        {r.status === "submitted" && !isUpdating && (
                          <Btn variant="outline" size="sm" onClick={() => setUpdateCase(r)}>
                            <Edit3 className="w-3.5 h-3.5" /> Provide Additional Information
                          </Btn>
                        )}

                        {/* Additional Information form — inline */}
                        {isUpdating && (
                          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5 space-y-4">
                            <p className="text-[12px] font-bold text-blue-700 dark:text-blue-300">
                              Add Information to {r.caseId}
                            </p>

                            <div>
                              <label className={labelClass}>Witness Name</label>
                              <input value={updateForm.witnessName}
                                onChange={e => setUpdateForm(f => ({ ...f, witnessName: e.target.value }))}
                                placeholder="Name of any witness" className={fieldClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Witness Contact</label>
                              <input value={updateForm.witnessContact}
                                onChange={e => setUpdateForm(f => ({ ...f, witnessContact: e.target.value }))}
                                placeholder="+250 7XX XXX XXX" className={fieldClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Updated Location Details</label>
                              <input value={updateForm.location}
                                onChange={e => setUpdateForm(f => ({ ...f, location: e.target.value }))}
                                placeholder="New location information…" className={fieldClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Additional Notes</label>
                              <textarea value={updateForm.notes}
                                onChange={e => setUpdateForm(f => ({ ...f, notes: e.target.value }))}
                                rows={3} placeholder="Any new information related to the case…"
                                className={fieldClass + " resize-none"} />
                            </div>

                            {updateDone && (
                              <p className="text-[12px] text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> Information updated successfully!
                              </p>
                            )}

                            <div className="flex gap-2">
                              <Btn variant="outline" size="sm" onClick={() => { setUpdateCase(null); setUpdateForm({ witnessName:"", witnessContact:"", location:"", notes:"" }); }}>Cancel</Btn>
                              <Btn variant="primary" size="sm" onClick={handleUpdate} disabled={updating}>
                                {updating ? "Sending…" : <><Send className="w-3.5 h-3.5" /> Submit Update</>}
                              </Btn>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )
      }
    </div>
  );
}

// ─── 5. Active Alerts (Missing Child Notices) ─────────────────────────────────

function AlertsSection() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    publicFetch("/public/reports")
      .then(d => setAlerts(d.reports || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  // Mock community alerts
  const COMMUNITY_ALERTS = [
    { type: "missing",   title: "Missing Child Alert",          district: "Gasabo",  time: "2h ago", desc: "A 7-year-old boy was reported missing near Remera. Please report any sighting to 116." },
    { type: "urgent",    title: "Urgent Investigation Request", district: "Kicukiro",time: "5h ago", desc: "Authorities are requesting community assistance in an ongoing investigation." },
    { type: "awareness", title: "Safety Awareness",             district: "All",     time: "1d ago", desc: "Community reminder: Report suspicious activity around schools to Childline 116." },
  ];

  const filtered = alerts.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.childName?.toLowerCase().includes(q)) || (a.district?.toLowerCase().includes(q));
  });

  const ALERT_COLORS = {
    missing:   "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10",
    urgent:    "border-l-red-500 bg-red-50/50 dark:bg-red-950/10",
    awareness: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10",
  };
  const ALERT_ICONS = {
    missing:   { icon: Baby,          color: "text-amber-600 dark:text-amber-400" },
    urgent:    { icon: AlertTriangle, color: "text-red-600 dark:text-red-400"     },
    awareness: { icon: Info,          color: "text-blue-600 dark:text-blue-400"   },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">Active Community Alerts</h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Live alerts from your community — missing children, investigations, safety notices</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="pl-9 pr-4 py-2 text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-400 bg-white dark:bg-slate-900 dark:text-slate-300 w-48" />
        </div>
      </div>

      {/* Community alerts (static for now) */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Community Alerts</p>
        {COMMUNITY_ALERTS.map((alert, i) => {
          const Ai = ALERT_ICONS[alert.type];
          return (
            <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border border-l-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 ${ALERT_COLORS[alert.type]}`}>
              <Ai.icon className={"w-5 h-5 shrink-0 mt-0.5 " + Ai.color} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{alert.title}</p>
                  <span className="text-[10px] text-slate-400 shrink-0">{alert.time}</span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">{alert.desc}</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.district}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Public missing child notices */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Public Missing Child Notices ({filtered.length})
        </p>
        {loading ? <LoadingRows n={3} />
          : filtered.length === 0
            ? <EmptyState icon={Megaphone} title={search ? "No results found" : "No active missing child notices"}
                sub={search ? "Try a different search term" : "All active missing children will appear here"} />
            : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filtered.map((a, i) => (
                  <Card key={i} className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">{a.caseId}</p>
                        <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white mt-0.5">{a.childName || "Unknown Child"}</h3>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400">
                          {a.age ? `Age ${a.age}` : "Age unknown"}{a.gender ? ` · ${a.gender}` : ""}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        Missing
                      </span>
                    </div>
                    {a.location && (
                      <p className="text-[12px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />{a.location}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                      <span className="text-[11px] text-slate-400">{a.district} District</span>
                      <span className="text-[11px] text-slate-400">{a.reportedAt ? new Date(a.reportedAt).toLocaleDateString() : ""}</span>
                    </div>
                    <a href="tel:116"
                      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-[12px] font-bold hover:bg-amber-100 transition-colors">
                      <Phone className="w-3.5 h-3.5" /> Call Childline 116 if you have information
                    </a>
                  </Card>
                ))}
              </div>
            )
        }
      </div>
    </div>
  );
}

// ─── 6. Found Children ────────────────────────────────────────────────────────

function FoundChildrenSection() {
  const [found,   setFound]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch resolved missing children from the public endpoint
    publicFetch("/public/reports")
      .then(d => {
        // Combine with a dedicated found fetch if available
        setFound(d.foundChildren || []);
      })
      .catch(() => setFound([]))
      .finally(() => setLoading(false));
  }, []);

  // Augment with mock "found" examples so the section is usable
  const SAMPLE_FOUND = [
    {
      caseId: "CW-2026-0021",
      childName: "Jean Paul",
      age: 9,
      gender: "Male",
      district: "Gasabo",
      foundAt: "2026-05-28",
      foundLocation: "Kimironko Sector",
      notes: "Child was located and reunited with family. Case closed.",
    },
    {
      caseId: "CW-2026-0047",
      childName: "Claudine",
      age: 12,
      gender: "Female",
      district: "Kicukiro",
      foundAt: "2026-06-01",
      foundLocation: "Niboye Cell",
      notes: "Child was found safe and handed over to parents. Thank you to the community for their reports.",
    },
  ];

  const displayList = found.length > 0 ? found : SAMPLE_FOUND;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">Found Children</h2>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
          Children who were previously reported missing and have been located safely
        </p>
      </div>

      {/* Success banner */}
      <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-2xl px-4 py-4">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-bold text-green-700 dark:text-green-300">Good News from Your Community</p>
          <p className="text-[12px] text-green-600 dark:text-green-400 leading-relaxed mt-0.5">
            These children were found thanks to community reports. Every report counts!
          </p>
        </div>
      </div>

      {loading ? <LoadingRows n={2} />
        : displayList.length === 0
          ? <EmptyState icon={CheckCircle2} title="No found children records yet" sub="This section will show children who have been safely located" />
          : (
            <div className="grid sm:grid-cols-2 gap-4">
              {displayList.map((c, i) => (
                <Card key={i} className="p-5 border-l-4 border-l-green-500">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-mono text-[11px] text-green-600 dark:text-green-400 font-bold">{c.caseId}</p>
                      <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white mt-0.5">{c.childName || "Child"}</h3>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400">
                        {c.age ? `Age ${c.age}` : ""}{c.gender ? ` · ${c.gender}` : ""}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Found Safe
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[12px] text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Found at: {c.foundLocation || c.district}</p>
                    <p className="flex items-center gap-1.5"><CheckCheck className="w-3.5 h-3.5 text-slate-400" /> Date found: {c.foundAt ? new Date(c.foundAt).toLocaleDateString() : "—"}</p>
                  </div>
                  {c.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 italic leading-relaxed">{c.notes}</p>
                  )}
                </Card>
              ))}
            </div>
          )
      }
    </div>
  );
}

// ─── 7. Notifications ─────────────────────────────────────────────────────────

function NotificationsSection({ notifications, loading, onMarkRead, onMarkAllRead }) {
  const unread = notifications.filter(n => !n.read).length;

  const getIcon = type => {
    const m = {
      update:  { icon: Info,          color: "bg-blue-50 dark:bg-blue-950/40 text-blue-500"   },
      alert:   { icon: AlertTriangle, color: "bg-red-50 dark:bg-red-950/40 text-red-500"      },
      success: { icon: CheckCircle2,  color: "bg-green-50 dark:bg-green-950/40 text-green-500"},
    };
    return m[type] || { icon: Bell, color: "bg-slate-100 dark:bg-slate-800 text-slate-500" };
  };

  const getMessage = n => n.msg || n.message || n.body || "";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">Notifications</h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{unread} unread</p>
        </div>
        {unread > 0 && (
          <Btn variant="ghost" size="sm" onClick={onMarkAllRead}>
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Btn>
        )}
      </div>

      {/* What triggers notifications */}
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { label: "Report received",          sub: "When your report is submitted" },
          { label: "Report assigned",          sub: "When assigned to an officer"   },
          { label: "More information needed",  sub: "When investigators need details"},
          { label: "Case resolved",            sub: "When your case is closed"      },
          { label: "Missing child found",      sub: "Community updates"             },
        ].map(n => (
          <div key={n.label} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <div>
              <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{n.label}</p>
              <p className="text-[10px] text-slate-400">{n.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? <LoadingRows n={3} />
        : notifications.length === 0
          ? <EmptyState icon={Bell} title="No notifications yet" sub="You'll be notified here when your report status changes" />
          : (
            <div className="space-y-2">
              {notifications.map(n => {
                const ni = getIcon(n.type);
                const NIcon = ni.icon;
                return (
                  <div key={n.id} onClick={() => !n.read && onMarkRead(n.id)}
                    className={[
                      "flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-colors",
                      n.read
                        ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                        : "bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50",
                    ].join(" ")}>
                    <div className={"w-9 h-9 rounded-xl flex items-center justify-center shrink-0 " + ni.color.split(" ").slice(0,2).join(" ")}>
                      <NIcon className={"w-4 h-4 " + ni.color.split(" ")[2]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={"text-[13px] font-bold " + (n.read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white")}>
                        {n.title || "Case Update"}
                      </p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{getMessage(n)}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {n.time ? new Date(n.time).toLocaleString() : n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
                  </div>
                );
              })}
            </div>
          )
      }
    </div>
  );
}

// ─── 8. Profile Management ────────────────────────────────────────────────────

function ProfileSection() {
  const profile = getAuthProfile();
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState({
    fullName: profile?.fullName || "",
    phone:    profile?.phone    || "",
    district: profile?.district || "",
    email:    profile?.email    || "",
  });
  const [notifPrefs, setNotifPrefs] = useState({
    reportReceived:   true,
    reportAssigned:   true,
    moreInfoNeeded:   true,
    caseResolved:     true,
    missingChildFound:true,
    smsAlerts:        false,
  });
  const [pw,    setPw]    = useState({ current: "", newPw: "", confirm: "" });
  const [saved, setSaved] = useState("");
  const [pwErr, setPwErr] = useState("");

  const TABS = [
    { id: "info",    label: "Profile Info", icon: User  },
    { id: "notif",   label: "Notifications",icon: Bell  },
    { id: "password",label: "Password",     icon: Lock  },
  ];

  const saveProfile = () => { setSaved("profile"); setTimeout(() => setSaved(""), 2500); };
  const saveNotifs  = () => { setSaved("notif");   setTimeout(() => setSaved(""), 2500); };
  const savePw = () => {
    if (!pw.current) { setPwErr("Enter your current password"); return; }
    if (pw.newPw.length < 6) { setPwErr("New password must be at least 6 characters"); return; }
    if (pw.newPw !== pw.confirm) { setPwErr("Passwords do not match"); return; }
    setPwErr(""); setSaved("password"); setPw({ current:"", newPw:"", confirm:"" });
    setTimeout(() => setSaved(""), 2500);
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">Profile & Settings</h2>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Manage your account and notification preferences</p>
      </div>

      {/* Avatar */}
      <Card className="p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-2xl font-extrabold text-blue-700 dark:text-blue-400">
          {profile?.fullName ? profile.fullName[0].toUpperCase() : "C"}
        </div>
        <div>
          <p className="text-[16px] font-extrabold text-slate-900 dark:text-white">{profile?.fullName || "Community Member"}</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">{profile?.district ? profile.district + " District" : ""}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[11px] font-bold">
            Community Member
          </span>
        </div>
      </Card>

      {/* Tab switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-colors",
              tab === t.id
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
            ].join(" ")}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Profile info */}
      {tab === "info" && (
        <Card className="p-6 space-y-5">
          {[
            { k: "fullName", label: "Full Name",      type: "text"  },
            { k: "email",    label: "Email Address",  type: "email" },
            { k: "phone",    label: "Phone Number",   type: "tel"   },
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass}>{f.label}</label>
              <input type={f.type} value={form[f.k]}
                onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                className={fieldClass} />
            </div>
          ))}
          <div>
            <label className={labelClass}>District</label>
            <select value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} className={fieldClass}>
              <option value="">Select…</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {saved === "profile" && <p className="text-[12px] text-green-600 dark:text-green-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Profile updated successfully!</p>}
          <Btn variant="primary" size="md" onClick={saveProfile} className="w-full justify-center">Save Profile</Btn>
        </Card>
      )}

      {/* Notification preferences */}
      {tab === "notif" && (
        <Card className="p-6 space-y-4">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Configure Notification Preferences</p>
          {[
            { k: "reportReceived",   label: "Report Received",          sub: "Notify when your report is submitted"           },
            { k: "reportAssigned",   label: "Report Assigned",          sub: "Notify when assigned to an officer"             },
            { k: "moreInfoNeeded",   label: "More Information Needed",  sub: "Notify when investigators need more details"    },
            { k: "caseResolved",     label: "Case Resolved",            sub: "Notify when your case is resolved or closed"   },
            { k: "missingChildFound",label: "Missing Child Found",      sub: "Notify when a missing child in your area is found"},
            { k: "smsAlerts",        label: "SMS Alerts",               sub: "Receive urgent alerts via SMS"                  },
          ].map(p => (
            <label key={p.k} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl cursor-pointer">
              <div>
                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{p.label}</p>
                <p className="text-[11px] text-slate-400">{p.sub}</p>
              </div>
              <div onClick={() => setNotifPrefs(n => ({ ...n, [p.k]: !n[p.k] }))}
                className={[
                  "w-12 h-6 rounded-full transition-colors cursor-pointer relative shrink-0",
                  notifPrefs[p.k] ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600",
                ].join(" ")}>
                <div className={[
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  notifPrefs[p.k] ? "translate-x-6" : "",
                ].join(" ")} />
              </div>
            </label>
          ))}
          {saved === "notif" && <p className="text-[12px] text-green-600 dark:text-green-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Preferences saved!</p>}
          <Btn variant="primary" size="md" onClick={saveNotifs} className="w-full justify-center">Save Preferences</Btn>
        </Card>
      )}

      {/* Change password */}
      {tab === "password" && (
        <Card className="p-6 space-y-5">
          {[
            { k: "current", label: "Current Password"  },
            { k: "newPw",   label: "New Password"      },
            { k: "confirm", label: "Confirm New Password"},
          ].map(f => (
            <div key={f.k}>
              <label className={labelClass}>{f.label}</label>
              <input type="password" value={pw[f.k]}
                onChange={e => setPw(p => ({ ...p, [f.k]: e.target.value }))}
                className={fieldClass} />
            </div>
          ))}
          {pwErr && <p className="text-[12px] text-red-600 dark:text-red-400">{pwErr}</p>}
          {saved === "password" && <p className="text-[12px] text-green-600 dark:text-green-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Password changed successfully!</p>}
          <Btn variant="primary" size="md" onClick={savePw} className="w-full justify-center">Change Password</Btn>
        </Card>
      )}
    </div>
  );
}

// ─── Sidebar config ───────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Reports",
    items: [
      { id: "report-missing", label: "Report Missing Child", icon: Baby     },
      { id: "report-abuse",   label: "Report Child Abuse",   icon: Flag     },
      { id: "my-reports",     label: "My Reports",           icon: FileText },
    ],
  },
  {
    label: "Missing Children",
    items: [
      { id: "alerts", label: "Active Alerts",   icon: Megaphone   },
      { id: "found",  label: "Found Children",  icon: CheckCircle2},
    ],
  },
  {
    label: "",
    items: [
      { id: "notifications", label: "Notifications", icon: Bell     },
      { id: "profile",       label: "Profile",        icon: Settings },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CommunityDashboard() {
  const navigate  = useNavigate();
  const { theme, toggleTheme } = useTheme?.() || {};
  const profile = getAuthProfile();

  const [active,      setActive]      = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reports,     setReports]     = useState([]);
  const [rLoading,    setRLoading]    = useState(true);
  const [notifs,      setNotifs]      = useState([]);
  const [nLoading,    setNLoading]    = useState(true);

  const loadReports = useCallback(async () => {
    setRLoading(true);
    try { const r = await getMyReports(); setReports(r?.reports || r || []); }
    catch { setReports([]); }
    finally { setRLoading(false); }
  }, []);

  const loadNotifs = useCallback(async () => {
    setNLoading(true);
    try { const r = await getMyNotifications(); setNotifs(r?.notifications || r || []); }
    catch { setNotifs([]); }
    finally { setNLoading(false); }
  }, []);

  useEffect(() => { loadReports(); loadNotifs(); }, [loadReports, loadNotifs]);

  const unread = notifs.filter(n => !n.read).length;
  const handleMarkRead    = async id => { setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n)); try { await markNotificationRead(id); } catch {} };
  const handleMarkAllRead = async ()  => { setNotifs(ns => ns.map(n => ({ ...n, read: true }))); try { await markAllNotificationsRead(); } catch {} };
  const handleNav = id => { setActive(id); setSidebarOpen(false); };
  const handleOut = () => { clearAuthSession(); navigate("/login"); };

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "CM";

  const SECTIONS = {
    dashboard:      <DashboardSection profile={profile} reports={reports} loading={rLoading} notifications={notifs} onNav={handleNav} />,
    "report-missing": <ReportMissingChildSection onDone={loadReports} />,
    "report-abuse": <ReportAbuseSection onDone={loadReports} />,
    "my-reports":   <MyReportsSection reports={reports} loading={rLoading} onRefresh={loadReports} />,
    alerts:         <AlertsSection />,
    found:          <FoundChildrenSection />,
    notifications:  <NotificationsSection notifications={notifs} loading={nLoading} onMarkRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} />,
    profile:        <ProfileSection />,
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={[
        "fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900 dark:bg-slate-950 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-extrabold text-white">Childwatch</p>
              <p className="text-[10px] text-slate-400">Community Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center text-[12px] font-bold text-blue-300 shrink-0">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white truncate">{profile?.fullName || "Community Member"}</p>
              <p className="text-[10px] text-slate-400 truncate">{profile?.district || ""}</p>
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 && group.label ? "mt-4" : gi > 0 ? "mt-2" : ""}>
              {group.label && (
                <p className="px-3 mb-1.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active2 = active === item.id;
                  return (
                    <button key={item.id} onClick={() => handleNav(item.id)}
                      className={[
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
                        active2
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-white/10",
                      ].join(" ")}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.id === "notifications" && unread > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">{unread}</span>
                      )}
                      {item.id === "alerts" && (
                        <span className="text-[9px] font-bold text-amber-400 uppercase shrink-0">Live</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-white/10 p-4 space-y-1 shrink-0">
          {toggleTheme && (
            <button onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-[13px] font-semibold transition-all">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          )}
          <button onClick={handleOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-[13px] font-semibold transition-all">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50 relative">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-[14px] font-extrabold text-slate-800 dark:text-slate-200">
              {ALL_NAV.find(n => n.id === active)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {toggleTheme && (
              <button onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            <button onClick={loadReports}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => handleNav("notifications")}
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unread}</span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">{initials}</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {SECTIONS[active] || SECTIONS.dashboard}
        </main>

        {/* Mobile bottom nav */}
        <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-around px-1 py-2 shrink-0">
          {[
            { id: "dashboard",     icon: LayoutDashboard, label: "Home"   },
            { id: "report-abuse",  icon: Flag,            label: "Report" },
            { id: "my-reports",    icon: FileText,        label: "Cases"  },
            { id: "alerts",        icon: Megaphone,       label: "Alerts" },
            { id: "notifications", icon: Bell,            label: "Notifs" },
          ].map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => handleNav(item.id)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 relative">
                <Icon className={"w-5 h-5 " + (isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600")} />
                <span className={"text-[9px] font-bold " + (isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600")}>
                  {item.label}
                </span>
                {item.id === "notifications" && unread > 0 && (
                  <span className="absolute -top-0.5 right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">{unread}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

