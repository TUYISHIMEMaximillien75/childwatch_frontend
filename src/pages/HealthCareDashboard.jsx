// HealthCareDashboard.jsx — Childwatch Healthcare Provider Panel
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthProfile } from "../utils/authStorage";
import { useTheme } from "../contexts/ThemeContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ProfilePage from "../components/ProfilePage";
import {
  getHealthCases, getHealthStats, getHealthCaseDetail,
  getHealthCaseNotes, addHealthCaseNote,
  getHealthAssessments, createHealthAssessment,
  updateHealthCaseStatus, uploadHealthFile, getHealthAttachments, getHealthReport,
} from "../services/healthApi";
import NotificationBell from "../components/NotificationBell";
import {
  LayoutDashboard, FolderOpen, ClipboardList, Upload, AlertTriangle,
  CheckCircle2, Clock, Bell, Menu, X, LogOut, Send, Eye, Download,
  Shield, FileText, Plus, Edit2, Activity, Heart, RefreshCw,
  Calendar, User, MapPin, Star, Zap, MessageSquare, ChevronRight,
  Sun, Moon, Paperclip, TrendingUp, BarChart3, Stethoscope,
  FileSearch, ArrowUpRight, CheckCheck, Archive, Search, Filter,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Cases",
    items: [
      { id: "dashboard",      label: "Dashboard",         icon: LayoutDashboard },
      { id: "assigned",       label: "Assigned Cases",    icon: FolderOpen      },
      { id: "examining",      label: "Under Examination", icon: Stethoscope     },
      { id: "completed",      label: "Completed Cases",   icon: CheckCheck      },
    ],
  },
  {
    label: "Medical",
    items: [
      { id: "assessment",     label: "Create Assessment", icon: ClipboardList   },
      { id: "reports-upload", label: "Medical Reports",   icon: Upload          },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { id: "notes",          label: "Case Notes",        icon: MessageSquare   },
    ],
  },
  {
    label: "Other",
    items: [
      { id: "reports",        label: "Reports",           icon: BarChart3       },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

const STATUS_COLORS = {
  submitted:             "bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  verified:              "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "under-investigation": "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  resolved:              "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
};
const STATUS_DOT = {
  submitted:             "bg-slate-400",
  verified:              "bg-blue-500",
  "under-investigation": "bg-amber-500",
  resolved:              "bg-green-500",
};
const MEDICAL_STATUS_LABELS = {
  submitted:             "Pending Examination",
  verified:              "Under Examination",
  "under-investigation": "Medical Report Submitted",
  resolved:              "Assessment Completed",
};
const VERIFICATION_STATUSES = [
  "Abuse Confirmed",
  "Abuse Suspected",
  "No Medical Evidence Found",
  "Further Examination Needed",
];
const MEDICAL_STATUSES = ["submitted", "verified", "under-investigation", "resolved"];

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Btn({ children, variant = "primary", size = "sm", onClick, disabled, className = "" }) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed";
  const S = { sm: "px-3 py-1.5 text-[12px]", md: "px-4 py-2.5 text-[13px]", lg: "px-5 py-3 text-[14px]" };
  const V = {
    primary: "bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm",
    green:   "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm",
    outline: "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
    danger:  "bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800",
    ghost:   "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
    amber:   "bg-amber-500 hover:bg-amber-600 text-white shadow-sm",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${S[size] || S.sm} ${V[variant] || V.primary} ${className}`}>
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.submitted;
  const dot   = STATUS_DOT[status]    || "bg-slate-400";
  const label = MEDICAL_STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    high:   "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    low:    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  };
  const dot = priority === "high" ? "🔴" : priority === "low" ? "🟢" : "🟡";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${map[priority] || map.medium}`}>
      {dot} {priority}
    </span>
  );
}

function SectionHeader({ title, sub, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">{title}</h2>
        {sub && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
      <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">{title}</p>
      {sub && <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse h-20" />
      ))}
    </div>
  );
}

// ─── Case Card ────────────────────────────────────────────────────────────────

function CaseCard({ c, onView, onAssess, onUpload, onNote }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-mono text-[11px] text-yellow-600 dark:text-amber-400 font-bold">{c.caseId}</span>
            {c.priority && <PriorityBadge priority={c.priority} />}
          </div>
          <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white truncate">{c.child}</h3>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
            {c.age ? `Age ${c.age}` : "—"}{c.gender ? ` · ${c.gender}` : ""} · {c.district}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={c.status} />
          {c.attachmentCount > 0 && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Paperclip className="w-3 h-3" />{c.attachmentCount} file{c.attachmentCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {c.description && (
        <p className="text-[12px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2 mb-3 line-clamp-2">
          {c.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Btn variant="ghost"   size="sm" onClick={() => onView(c)}>   <Eye          className="w-3.5 h-3.5" /> View   </Btn>
        <Btn variant="primary" size="sm" onClick={() => onAssess(c)}> <ClipboardList className="w-3.5 h-3.5" /> Assess </Btn>
        <Btn variant="outline" size="sm" onClick={() => onUpload(c)}> <Upload        className="w-3.5 h-3.5" /> Upload </Btn>
        <Btn variant="ghost"   size="sm" onClick={() => onNote(c)}>   <MessageSquare className="w-3.5 h-3.5" /> Note   </Btn>
      </div>
    </Card>
  );
}

// ─── Case Detail Modal ────────────────────────────────────────────────────────

function CaseDetailModal({ caseItem, onClose }) {
  const [notes,       setNotes]       = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [apiError,    setApiError]    = useState("");
  const [activeTab,   setActiveTab]   = useState("info");

  // caseItem props render the Info tab immediately — no waiting for API
  const c = caseItem;

  useEffect(() => {
    if (!c || !c.caseId) { setLoading(false); return; }
    setLoading(true);
    setApiError("");
    Promise.all([
      getHealthCaseDetail(c.caseId),
      getHealthAssessments(c.caseId),
    ])
      .then(([detail, aData]) => {
        setNotes(detail && detail.notes             ? detail.notes             : []);
        setAttachments(detail && detail.attachments ? detail.attachments       : []);
        setAssessments(aData  && aData.assessments  ? aData.assessments        : []);
      })
      .catch(err => setApiError((err && err.message) ? err.message : "Could not load details"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c && c.caseId]);

  // assignedTo may be an object {id,name,role} or a string
  const assignedToLabel = !c.assignedTo
    ? "Unassigned"
    : (typeof c.assignedTo === "object"
        ? (c.assignedTo.name || "Assigned")
        : String(c.assignedTo));

  const TABS = [
    { id: "info",        label: "Info"                                    },
    { id: "notes",       label: "Notes (" + notes.length + ")"           },
    { id: "files",       label: "Files (" + attachments.length + ")"     },
    { id: "assessments", label: "Assessments (" + assessments.length + ")" },
  ];

  const infoRows = [
    ["Child Name",   c.child    || "—"],
    ["Age",          c.age != null ? String(c.age) : "—"],
    ["Gender",       c.gender   || "—"],
    ["Report Type",  c.type     || "—"],
    ["District",     c.district || "—"],
    ["Priority",     c.priority || "normal"],
    ["Status",       MEDICAL_STATUS_LABELS[c.status] || c.status || "—"],
    ["Assigned To",  assignedToLabel],
    ["Date Reported",c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"],
    ["Anonymous",    c.anonymous ? "Yes" : "No"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Case Details</p>
            <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
              {c.child || "Unknown"}{" — "}
              <span className="font-mono text-yellow-600 dark:text-amber-400 text-[13px]">{c.caseId}</span>
            </h3>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 shrink-0 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={[
                "px-4 py-3 text-[12px] font-bold whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-yellow-500 text-yellow-600 dark:text-amber-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
              ].join(" ")}
            >{tab.label}</button>
          ))}
        </div>

        {/* Error banner */}
        {apiError && (
          <div className="mx-6 mt-3 shrink-0 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-600 dark:text-red-400">{apiError} — showing partial info</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── INFO (instant, no API wait) ── */}
          {activeTab === "info" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {infoRows.map(([label, val]) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{label}</p>
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              {c.location && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Location</p>
                  <p className="text-[13px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />{c.location}
                  </p>
                </div>
              )}
              {c.description && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Description</p>
                  <p className="text-[13px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{c.description}</p>
                </div>
              )}
            </div>
          )}

          {/* ── NOTES ── */}
          {activeTab === "notes" && (
            loading ? <LoadingSkeleton rows={3} />
              : notes.length === 0
                ? <EmptyState icon={MessageSquare} title="No notes yet" sub="Add a note from the case card" />
                : (
                  <div className="space-y-3">
                    {notes.map(n => (
                      <div key={n.id} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{n.author_name}</span>
                          <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-[13px] text-slate-600 dark:text-slate-400">{n.comment}</p>
                      </div>
                    ))}
                  </div>
                )
          )}

          {/* ── FILES ── */}
          {activeTab === "files" && (
            loading ? <LoadingSkeleton rows={2} />
              : attachments.length === 0
                ? <EmptyState icon={Paperclip} title="No files uploaded" sub="Use the Upload button on the case card" />
                : (
                  <div className="space-y-2">
                    {attachments.map(f => (
                      <div key={f.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-3">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{f.file_name}</p>
                          <p className="text-[10px] text-slate-400">
                            {f.file_type} · {new Date(f.uploaded_at).toLocaleDateString()} · {f.uploaded_by_name}
                          </p>
                        </div>
                        <a href={f.file_url} target="_blank" rel="noreferrer">
                          <Btn variant="ghost" size="sm"><Eye className="w-3.5 h-3.5" /></Btn>
                        </a>
                      </div>
                    ))}
                  </div>
                )
          )}

          {/* ── ASSESSMENTS ── */}
          {activeTab === "assessments" && (
            loading ? <LoadingSkeleton rows={2} />
              : assessments.length === 0
                ? <EmptyState icon={ClipboardList} title="No assessments yet" sub="Use the Assess button on the case card" />
                : (
                  <div className="space-y-4">
                    {assessments.map(a => {
                      const vStatus = a.verification_status || "Pending";
                      const vColor = vStatus === "Abuse Confirmed"
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : vStatus === "No Medical Evidence Found"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
                      const fields = [
                        ["Physical Injuries",     a.physical_injuries],
                        ["Emotional Condition",   a.emotional_condition],
                        ["Signs of Neglect",      a.signs_of_neglect],
                        ["Signs of Sexual Abuse", a.signs_of_sexual_abuse],
                        ["General Health",        a.general_health],
                        ["Doctor Observations",   a.doctor_observations],
                      ].filter(([, v]) => v);
                      return (
                        <div key={a.id} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700 px-4 py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{a.doctor_name}</p>
                              <p className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
                            </div>
                            <span className={"text-[11px] font-bold px-2.5 py-1 rounded-lg " + vColor}>{vStatus}</span>
                          </div>
                          {fields.map(([label, val]) => (
                            <div key={label} className="border-t border-slate-200 dark:border-slate-700 pt-2">
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">{label}</p>
                              <p className="text-[12px] text-slate-700 dark:text-slate-300">{val}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Btn variant="outline" size="md" onClick={onClose} className="w-full justify-center">Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Assessment Modal ─────────────────────────────────────────────────────────

function AssessmentModal({ caseItem, onClose, onSaved }) {
  const [form, setForm] = useState({
    physicalInjuries: "", emotionalCondition: "", signsOfNeglect: "",
    signsOfSexualAbuse: "", generalHealth: "", doctorObservations: "",
    verificationStatus: "Further Examination Needed",
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const ic = "w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 bg-white dark:bg-slate-800 dark:text-amber-400 resize-none transition-colors";

  const FIELDS = [
    ["physicalInjuries",   "Physical Injuries",         "Describe observed physical injuries…"],
    ["emotionalCondition", "Emotional Condition",       "Child's emotional and psychological state…"],
    ["signsOfNeglect",     "Signs of Neglect",          "Negligence, malnutrition, hygiene issues…"],
    ["signsOfSexualAbuse", "Signs of Sexual Abuse",     "Clinical signs (if applicable)…"],
    ["generalHealth",      "General Health Condition",  "Overall health status…"],
    ["doctorObservations", "Doctor Observations",       "Professional conclusions and recommendations…"],
  ];

  const handleSave = async () => {
    if (!form.doctorObservations.trim()) { setError("Doctor observations are required"); return; }
    try {
      setSaving(true); setError("");
      await createHealthAssessment(caseItem.caseId, form);
      setSuccess(true);
      setTimeout(() => { onSaved && onSaved(); onClose(); }, 1200);
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Medical Assessment</p>
            <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
              {caseItem.child}{" — "}
              <span className="font-mono text-yellow-600 dark:text-amber-400 text-[13px]">{caseItem.caseId}</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {FIELDS.map(([key, label, ph]) => (
            <div key={key}>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
              <textarea rows={2} placeholder={ph} value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className={ic} />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Verification Status</label>
            <div className="grid grid-cols-2 gap-2">
              {VERIFICATION_STATUSES.map(v => {
                const active = form.verificationStatus === v;
                const dot = v === "Abuse Confirmed" ? "🔴" : v === "No Medical Evidence Found" ? "🟢" : "🟡";
                return (
                  <button key={v} onClick={() => setForm(f => ({ ...f, verificationStatus: v }))}
                    className={[
                      "px-3 py-2 rounded-xl text-[11px] font-bold border text-left transition-colors",
                      active
                        ? (v === "Abuse Confirmed"
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                            : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-amber-400")
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300",
                    ].join(" ")}
                  >{dot} {v}</button>
                );
              })}
            </div>
          </div>
          {error   && <p className="text-[12px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-[12px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Assessment saved!</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Btn variant="outline" size="md" onClick={onClose} className="flex-1 justify-center">Cancel</Btn>
          <Btn variant="primary" size="md" onClick={handleSave} disabled={saving} className="flex-1 justify-center">
            {saving ? "Saving…" : <><Send className="w-4 h-4" /> Save Assessment</>}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ caseItem, onClose }) {
  const [file,      setFile]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  const handleUpload = async () => {
    if (!file) { setError("Select a file first"); return; }
    try {
      setUploading(true); setError("");
      await uploadHealthFile(caseItem.caseId, file);
      setDone(true);
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Upload Medical Report</p>
            <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">{caseItem.child}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        {done ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-slate-800 dark:text-slate-200">File uploaded successfully!</p>
            <Btn variant="outline" size="md" onClick={onClose} className="mt-4">Close</Btn>
          </div>
        ) : (
          <>
            <label className="block border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-yellow-400 dark:hover:border-yellow-500 transition-colors">
              <input type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={e => { setFile(e.target.files[0]); setError(""); }} />
              <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
              <p className="text-[13px] font-semibold text-slate-700 dark:text-amber-400">
                {file ? file.name : "Click to select file"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">PDF, Images, Lab Results · Max 50 MB</p>
            </label>
            {error && <p className="text-[12px] text-red-600 dark:text-red-400 mt-3">{error}</p>}
            <div className="flex gap-3 mt-5">
              <Btn variant="outline" size="md" onClick={onClose} className="flex-1 justify-center">Cancel</Btn>
              <Btn variant="primary" size="md" onClick={handleUpload} disabled={uploading || !file} className="flex-1 justify-center">
                {uploading ? "Uploading…" : <><Upload className="w-4 h-4" /> Upload</>}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────

function NoteModal({ caseItem, onClose }) {
  const [comment,    setComment]    = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [done,       setDone]       = useState(false);

  const ic = "w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 bg-white dark:bg-slate-800 dark:text-amber-400 transition-colors";

  const handleSave = async () => {
    if (!comment.trim()) { setError("Note cannot be empty"); return; }
    try {
      setSaving(true); setError("");
      await addHealthCaseNote(caseItem.caseId, { comment: comment.trim(), targetRole });
      setDone(true);
    } catch (e) {
      setError(e.message || "Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Add Case Note</p>
            <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">{caseItem.caseId}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800 dark:text-slate-200">Note added!</p>
            <Btn variant="outline" size="md" onClick={onClose} className="mt-4">Close</Btn>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Note for</label>
                <select value={targetRole} onChange={e => setTargetRole(e.target.value)} className={ic}>
                  <option value="">All stakeholders</option>
                  <option value="Police">Police Officer</option>
                  <option value="Social Worker">Social Worker</option>
                  <option value="Hospital">Healthcare Team</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Note</label>
                <textarea rows={5} value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Enter your clinical note, observations, or request…"
                  className={ic + " resize-none"} />
              </div>
            </div>
            {error && <p className="text-[12px] text-red-600 dark:text-red-400 mt-2">{error}</p>}
            <div className="flex gap-3 mt-5">
              <Btn variant="outline" size="md" onClick={onClose} className="flex-1 justify-center">Cancel</Btn>
              <Btn variant="primary" size="md" onClick={handleSave} disabled={saving} className="flex-1 justify-center">
                {saving ? "Sending…" : <><Send className="w-4 h-4" /> Add Note</>}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Case List Section (reusable) ─────────────────────────────────────────────

function CaseListSection({ title, sub, cases, loading, filterFn, onRefresh }) {
  const filter = filterFn || (() => true);
  const [search,     setSearch]     = useState("");
  const [viewCase,   setViewCase]   = useState(null);
  const [assessCase, setAssessCase] = useState(null);
  const [uploadCase, setUploadCase] = useState(null);
  const [noteCase,   setNoteCase]   = useState(null);

  const filtered = cases.filter(filter).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.child  && c.child.toLowerCase().includes(q)) ||
           (c.caseId && c.caseId.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-5">
      <SectionHeader title={title} sub={sub}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="pl-9 pr-3 py-2 text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 bg-white dark:bg-slate-900 dark:text-slate-300 w-44" />
            </div>
            <Btn variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="w-3.5 h-3.5" /></Btn>
          </div>
        }
      />

      {loading ? <LoadingSkeleton rows={3} />
        : filtered.length === 0
          ? <EmptyState icon={FolderOpen} title="No cases found"
              sub={search ? "Try a different search term" : "Cases assigned to you will appear here"} />
          : (
            <div className="space-y-4">
              {filtered.map(c => (
                <CaseCard key={c.id || c.caseId} c={c}
                  onView={setViewCase} onAssess={setAssessCase}
                  onUpload={setUploadCase} onNote={setNoteCase} />
              ))}
            </div>
          )
      }

      {viewCase   && <CaseDetailModal caseItem={viewCase}   onClose={() => setViewCase(null)} />}
      {assessCase && <AssessmentModal caseItem={assessCase} onClose={() => setAssessCase(null)} onSaved={onRefresh} />}
      {uploadCase && <UploadModal     caseItem={uploadCase} onClose={() => setUploadCase(null)} />}
      {noteCase   && <NoteModal       caseItem={noteCase}   onClose={() => setNoteCase(null)} />}
    </div>
  );
}

// ─── Dashboard Section ────────────────────────────────────────────────────────

function DashboardSection({ stats, cases, loading, onNav }) {
  const profile = getAuthProfile();

  const STAT_CARDS = [
    { label: "Total Assigned",    value: stats.total            ?? 0, icon: FolderOpen,   color: "amber" },
    { label: "Pending Exam",      value: stats.pending          ?? 0, icon: Clock,         color: "slate" },
    { label: "Under Examination", value: stats.underExamination ?? 0, icon: Stethoscope,   color: "blue"  },
    { label: "Completed Reports", value: stats.completedReports ?? 0, icon: CheckCircle2,  color: "green" },
    { label: "High Priority",     value: stats.highPriority     ?? 0, icon: AlertTriangle, color: "red"   },
    { label: "Assigned to Me",    value: stats.assigned         ?? 0, icon: User,          color: "amber" },
  ];
  const COLOR = {
    amber: { bg: "bg-amber-50 dark:bg-amber-950/40", ic: "text-amber-600 dark:text-amber-400", ring: "ring-amber-100 dark:ring-amber-950/20" },
    blue:  { bg: "bg-blue-50 dark:bg-blue-950/40",   ic: "text-blue-600 dark:text-blue-400",   ring: "ring-blue-100 dark:ring-blue-950/20"   },
    green: { bg: "bg-green-50 dark:bg-green-950/40", ic: "text-green-600 dark:text-green-400", ring: "ring-green-100 dark:ring-green-950/20" },
    red:   { bg: "bg-red-50 dark:bg-red-950/40",     ic: "text-red-500 dark:text-red-400",     ring: "ring-red-100 dark:ring-red-950/20"     },
    slate: { bg: "bg-slate-100 dark:bg-slate-800/60",ic: "text-slate-500 dark:text-slate-400", ring: "ring-slate-200 dark:ring-slate-700"    },
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl px-6 py-6 text-white shadow-lg">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-yellow-100 mb-1">Healthcare Provider</p>
            <h2 className="text-[20px] font-extrabold">Dr. {profile && profile.fullName ? profile.fullName : "Healthcare Provider"}</h2>
            <p className="text-[13px] text-yellow-100 mt-0.5">{profile && profile.district ? profile.district : "—"} District · Hospital Unit</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onNav("assigned")}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 font-bold text-[13px] rounded-xl transition-colors">
              <FolderOpen className="w-4 h-4" /> View Cases
            </button>
            <button onClick={() => onNav("assessment")}
              className="flex items-center gap-2 px-4 py-2 bg-white text-amber-700 font-bold text-[13px] rounded-xl hover:bg-yellow-50 transition-colors">
              <ClipboardList className="w-4 h-4" /> Assess
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 animate-pulse h-24" />
            ))
          : STAT_CARDS.map(s => {
              const C = COLOR[s.color] || COLOR.amber;
              return (
                <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className={"w-9 h-9 rounded-xl ring-4 flex items-center justify-center mb-3 " + C.bg + " " + C.ring}>
                    <s.icon className={"w-4 h-4 " + C.ic} />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                </div>
              );
            })
        }
      </div>

      {/* Recent cases + Quick actions */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="font-extrabold text-slate-800 dark:text-slate-200">Recent Cases</p>
            <button onClick={() => onNav("assigned")}
              className="text-[12px] font-semibold text-yellow-600 dark:text-amber-400 hover:underline">View all →</button>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
          ) : cases.length === 0 ? (
            <EmptyState icon={FolderOpen} title="No cases yet" />
          ) : (
            <div className="space-y-2">
              {cases.slice(0, 6).map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className={"w-2.5 h-2.5 rounded-full shrink-0 " + (STATUS_DOT[c.status] || "bg-slate-400")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">{c.child}</p>
                    <p className="text-[11px] text-slate-400">{c.caseId} · {c.district}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <p className="font-extrabold text-slate-800 dark:text-slate-200 mb-4">Quick Actions</p>
          <div className="space-y-2">
            {[
              { label: "View Assigned Cases",    icon: FolderOpen,    nav: "assigned",       color: "text-amber-600"  },
              { label: "Under Examination",      icon: Stethoscope,   nav: "examining",      color: "text-blue-600"   },
              { label: "Create Assessment",      icon: ClipboardList, nav: "assessment",     color: "text-yellow-600" },
              { label: "Upload Medical Reports", icon: Upload,        nav: "reports-upload", color: "text-green-600"  },
              { label: "View Case Notes",        icon: MessageSquare, nav: "notes",          color: "text-purple-600" },
              { label: "Download Reports",       icon: BarChart3,     nav: "reports",        color: "text-slate-600"  },
            ].map(item => (
              <button key={item.nav} onClick={() => onNav(item.nav)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left group">
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

// ─── Notes Section ────────────────────────────────────────────────────────────

function NotesSection({ cases }) {
  const [selectedCase, setSelectedCase] = useState(null);
  const [notes,        setNotes]        = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [comment,      setComment]      = useState("");
  const [targetRole,   setTargetRole]   = useState("");
  const [sending,      setSending]      = useState(false);

  const ic = "w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 bg-white dark:bg-slate-800 dark:text-amber-400 transition-colors";

  const loadNotes = useCallback(async (c) => {
    setSelectedCase(c);
    setLoadingNotes(true);
    try {
      const d = await getHealthCaseNotes(c.caseId);
      setNotes(d && d.notes ? d.notes : []);
    } catch { setNotes([]); }
    finally { setLoadingNotes(false); }
  }, []);

  const handleSend = async () => {
    if (!comment.trim() || !selectedCase) return;
    try {
      setSending(true);
      await addHealthCaseNote(selectedCase.caseId, { comment: comment.trim(), targetRole });
      setComment("");
      await loadNotes(selectedCase);
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Case Notes & Collaboration" sub="Add notes for police, social workers, or request information" />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="!p-0 overflow-hidden lg:col-span-1">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Select a Case</p>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
            {cases.length === 0 ? (
              <p className="text-[12px] text-slate-400 text-center py-6">No cases available</p>
            ) : cases.map(c => (
              <button key={c.id} onClick={() => loadNotes(c)}
                className={[
                  "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors",
                  selectedCase && selectedCase.id === c.id ? "bg-yellow-50 dark:bg-yellow-900/10 border-l-2 border-yellow-500" : "",
                ].join(" ")}>
                <div className={"w-2 h-2 rounded-full shrink-0 " + (STATUS_DOT[c.status] || "bg-slate-400")} />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{c.child}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{c.caseId}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-3">
          {!selectedCase ? (
            <Card><EmptyState icon={MessageSquare} title="Select a case" sub="Click a case on the left to view its notes" /></Card>
          ) : (
            <>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Notes for</p>
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {selectedCase.child} — <span className="font-mono text-yellow-600 dark:text-amber-400 text-[13px]">{selectedCase.caseId}</span>
                    </p>
                  </div>
                  <StatusBadge status={selectedCase.status} />
                </div>
                {loadingNotes ? <LoadingSkeleton rows={2} />
                  : notes.length === 0
                    ? <EmptyState icon={MessageSquare} title="No notes yet" sub="Be the first to add a note" />
                    : (
                      <div className="space-y-3 max-h-72 overflow-y-auto">
                        {notes.map(n => (
                          <div key={n.id} className={"flex gap-3 " + (n.account_type === "health" ? "flex-row-reverse" : "")}>
                            <div className={"w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 " +
                              (n.account_type === "health" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
                              {n.author_name ? n.author_name[0].toUpperCase() : "?"}
                            </div>
                            <div className={"flex-1 flex flex-col " + (n.account_type === "health" ? "items-end" : "items-start")}>
                              <div className={"rounded-2xl px-3 py-2.5 max-w-xs " + (n.account_type === "health" ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-slate-50 dark:bg-slate-800/40")}>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">{n.author_name}</p>
                                <p className="text-[13px] text-slate-700 dark:text-slate-300">{n.comment}</p>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 px-1">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                }
              </Card>
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                    className="px-3 py-2 text-[12px] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-300 outline-none focus:border-yellow-400">
                    <option value="">For everyone</option>
                    <option value="Police">Police</option>
                    <option value="Social Worker">Social Worker</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Write a note, observation, or request…"
                    onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleSend()}
                    className={ic + " resize-none flex-1"} />
                  <Btn variant="primary" size="sm" onClick={handleSend} disabled={sending || !comment.trim()} className="self-end">
                    {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Btn>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Ctrl+Enter to send</p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reports Upload Section ───────────────────────────────────────────────────

function ReportsUploadSection({ cases, loading }) {
  const [selectedCase,  setSelectedCase]  = useState(null);
  const [attachments,   setAttachments]   = useState([]);
  const [file,          setFile]          = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const [loadingFiles,  setLoadingFiles]  = useState(false);
  const [error,         setError]         = useState("");
  const [uploadDone,    setUploadDone]    = useState(false);

  const loadAttachments = useCallback(async (c) => {
    setSelectedCase(c); setLoadingFiles(true); setUploadDone(false); setFile(null);
    try {
      const d = await getHealthAttachments(c.caseId);
      setAttachments(d && d.attachments ? d.attachments : []);
    } catch { setAttachments([]); }
    finally { setLoadingFiles(false); }
  }, []);

  const handleUpload = async () => {
    if (!file || !selectedCase) return;
    try {
      setUploading(true); setError("");
      await uploadHealthFile(selectedCase.caseId, file);
      setFile(null); setUploadDone(true);
      await loadAttachments(selectedCase);
    } catch (e) { setError(e.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Medical Reports" sub="Upload and manage medical reports, lab results, and evidence files" />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="!p-0 overflow-hidden lg:col-span-1">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Select Case</p>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? <LoadingSkeleton rows={3} /> : cases.length === 0 ? (
              <p className="text-[12px] text-slate-400 text-center py-6">No cases</p>
            ) : cases.map(c => (
              <button key={c.id} onClick={() => loadAttachments(c)}
                className={[
                  "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors",
                  selectedCase && selectedCase.id === c.id ? "bg-yellow-50 dark:bg-yellow-900/10 border-l-2 border-yellow-500" : "",
                ].join(" ")}>
                <div className={"w-2 h-2 rounded-full shrink-0 " + (STATUS_DOT[c.status] || "bg-slate-400")} />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{c.child}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{c.caseId}</p>
                </div>
                {c.attachmentCount > 0 && (
                  <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full px-1.5 py-0.5">{c.attachmentCount}</span>
                )}
              </button>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {!selectedCase ? (
            <Card><EmptyState icon={Upload} title="Select a case to manage files" /></Card>
          ) : (
            <>
              <Card>
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-4">
                  Upload for <span className="font-mono text-yellow-600 dark:text-amber-400">{selectedCase.caseId}</span> — {selectedCase.child}
                </p>
                <label className="block border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-yellow-400 dark:hover:border-yellow-500 transition-colors">
                  <input type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={e => { setFile(e.target.files[0]); setUploadDone(false); setError(""); }} />
                  <Upload className="w-7 h-7 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-[13px] font-semibold text-slate-700 dark:text-amber-400">{file ? file.name : "Click to select file"}</p>
                  <p className="text-[11px] text-slate-400 mt-1">PDF, Images, Lab Results, Medical Forms</p>
                </label>
                {error && <p className="text-[12px] text-red-600 dark:text-red-400 mt-2">{error}</p>}
                {uploadDone && <p className="text-[12px] text-green-600 dark:text-green-400 mt-2 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Uploaded!</p>}
                <Btn variant="primary" size="md" onClick={handleUpload} disabled={uploading || !file} className="mt-4 w-full justify-center">
                  {uploading ? "Uploading…" : <><Upload className="w-4 h-4" /> Upload File</>}
                </Btn>
              </Card>
              <Card>
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3">Uploaded Files ({attachments.length})</p>
                {loadingFiles ? <LoadingSkeleton rows={2} /> : attachments.length === 0 ? (
                  <EmptyState icon={Paperclip} title="No files yet" sub="Upload the first file above" />
                ) : (
                  <div className="space-y-2">
                    {attachments.map(f => (
                      <div key={f.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-3">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{f.file_name}</p>
                          <p className="text-[10px] text-slate-400">{f.file_type} · {new Date(f.uploaded_at).toLocaleDateString()} · {f.uploaded_by_name}</p>
                        </div>
                        <a href={f.file_url} target="_blank" rel="noreferrer">
                          <Btn variant="ghost" size="sm"><Eye className="w-3.5 h-3.5" /></Btn>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Assessment Section ───────────────────────────────────────────────────────

function AssessmentSection({ cases, loading, onRefresh }) {
  const [selectedCase, setSelectedCase] = useState(null);
  const [existing,     setExisting]     = useState([]);
  const [form, setForm] = useState({
    physicalInjuries: "", emotionalCondition: "", signsOfNeglect: "",
    signsOfSexualAbuse: "", generalHealth: "", doctorObservations: "",
    verificationStatus: "Further Examination Needed",
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const ic = "w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 bg-white dark:bg-slate-800 dark:text-amber-400 resize-none transition-colors";
  const FIELDS = [
    ["physicalInjuries",   "Physical Injuries",        "Describe observed injuries…"],
    ["emotionalCondition", "Emotional Condition",      "Child's emotional state…"],
    ["signsOfNeglect",     "Signs of Neglect",         "Negligence, malnutrition…"],
    ["signsOfSexualAbuse", "Signs of Sexual Abuse",    "Clinical signs (if applicable)…"],
    ["generalHealth",      "General Health Condition", "Overall health status…"],
    ["doctorObservations", "Doctor Observations",      "Professional conclusions…"],
  ];

  const loadExisting = useCallback(async (c) => {
    setSelectedCase(c);
    try {
      const d = await getHealthAssessments(c.caseId);
      setExisting(d && d.assessments ? d.assessments : []);
    } catch { setExisting([]); }
  }, []);

  const handleSave = async () => {
    if (!selectedCase) { setError("Select a case first"); return; }
    if (!form.doctorObservations.trim()) { setError("Doctor observations are required"); return; }
    try {
      setSaving(true); setError(""); setSuccess("");
      await createHealthAssessment(selectedCase.caseId, form);
      setSuccess("Assessment saved!");
      await loadExisting(selectedCase);
      onRefresh();
    } catch (e) { setError(e.message || "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Create Medical Assessment" sub="Record findings after examining a child" />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <Card className="!p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Select Case to Assess</p>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? <LoadingSkeleton rows={3} /> : cases.length === 0 ? (
                <p className="text-[12px] text-slate-400 text-center py-6">No cases yet</p>
              ) : cases.map(c => (
                <button key={c.id} onClick={() => loadExisting(c)}
                  className={[
                    "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors",
                    selectedCase && selectedCase.id === c.id ? "bg-yellow-50 dark:bg-yellow-900/10 border-l-2 border-yellow-500" : "",
                  ].join(" ")}>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{c.child}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{c.caseId}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
          {selectedCase && (
            <Card>
              <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-3">Previous ({existing.length})</p>
              {existing.length === 0 ? (
                <p className="text-[11px] text-slate-400">No prior assessments</p>
              ) : existing.map(a => (
                <div key={a.id} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5 mb-2">
                  <p className={"text-[11px] font-bold " + (a.verification_status === "Abuse Confirmed" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>
                    {a.verification_status}
                  </p>
                  <p className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            {!selectedCase ? (
              <EmptyState icon={ClipboardList} title="Select a case to create an assessment" />
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Assessment for</p>
                    <p className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                      {selectedCase.child} — <span className="font-mono text-yellow-600 dark:text-amber-400 text-[13px]">{selectedCase.caseId}</span>
                    </p>
                  </div>
                  <StatusBadge status={selectedCase.status} />
                </div>
                <div className="space-y-4">
                  {FIELDS.map(([key, label, ph]) => (
                    <div key={key}>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                      <textarea rows={2} placeholder={ph} value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className={ic} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Verification Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {VERIFICATION_STATUSES.map(v => {
                        const active = form.verificationStatus === v;
                        const dot = v === "Abuse Confirmed" ? "🔴" : v === "No Medical Evidence Found" ? "🟢" : "🟡";
                        return (
                          <button key={v} onClick={() => setForm(f => ({ ...f, verificationStatus: v }))}
                            className={[
                              "px-3 py-2 rounded-xl text-[11px] font-bold border text-left transition-colors",
                              active
                                ? (v === "Abuse Confirmed"
                                    ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                                    : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-amber-400")
                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300",
                            ].join(" ")}
                          >{dot} {v}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {error   && <p className="text-[12px] text-red-600 dark:text-red-400 mt-4 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
                {success && <p className="text-[12px] text-green-600 dark:text-green-400 mt-4 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{success}</p>}
                <Btn variant="primary" size="md" onClick={handleSave} disabled={saving} className="mt-5 w-full justify-center">
                  {saving ? "Saving…" : <><Send className="w-4 h-4" /> Save Assessment</>}
                </Btn>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Reports Section ──────────────────────────────────────────────────────────

// ─── Download Helpers ─────────────────────────────────────────────────────────

/** Trigger a CSV file download in the browser */
function downloadCSV(filename, headers, rows) {
  const escape = v => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? '"' + s.replace(/"/g, '""') + '"'
      : s;
  };
  const csv = [headers.map(escape).join(","),
    ...rows.map(r => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Trigger a print dialog with a formatted HTML string rendered in an iframe */
function downloadPDF(title, htmlBody) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1e293b; font-size: 13px; }
    h1   { font-size: 20px; font-weight: 800; margin-bottom: 4px; color: #92400e; }
    h2   { font-size: 15px; font-weight: 700; margin: 24px 0 8px; border-bottom: 2px solid #fde68a; padding-bottom: 4px; }
    p    { margin: 0 0 4px; }
    table{ border-collapse: collapse; width: 100%; margin-top: 8px; }
    th   { background: #fef3c7; text-align: left; padding: 6px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    td   { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
    tr:hover td { background: #fffbeb; }
    .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>${htmlBody}<div class="footer">Generated by Childwatch Healthcare Portal · ${new Date().toLocaleString()}</div></body>
</html>`;
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:800px;height:600px";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1500);
  }, 400);
}

// ─── Reports Section ──────────────────────────────────────────────────────────

function ReportsSection({ cases = [] }) {
  const [reportData, setReportData] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [toasting,   setToasting]   = useState("");

  useEffect(() => {
    getHealthReport()
      .then(d => setReportData(d))
      .catch(() => setReportData(null))
      .finally(() => setLoading(false));
  }, []);

  const toast = (msg) => { setToasting(msg); setTimeout(() => setToasting(""), 2500); };

  // ── CSV generators ──────────────────────────────────────────────────────────

  const csvHandlers = {
    "Monthly Assessment Report": () => {
      downloadCSV("monthly_assessment_report.csv",
        ["Case ID","Child Name","Age","Gender","District","Abuse Type","Priority","Status","Date Reported"],
        cases.map(c => [c.caseId, c.child, c.age, c.gender, c.district, c.abuseType, c.priority, c.status, c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""])
      );
      toast("Downloading CSV…");
    },
    "Abuse Type Statistics": () => {
      const rows = reportData && reportData.abuseByType ? reportData.abuseByType : [];
      downloadCSV("abuse_type_statistics.csv",
        ["Abuse Type","Count"],
        rows.map(r => [r.type, r.count])
      );
      toast("Downloading CSV…");
    },
    "Examination Summary": () => {
      const examined = cases.filter(c => c.status === "verified" || c.status === "under-investigation" || c.status === "resolved");
      downloadCSV("examination_summary.csv",
        ["Case ID","Child Name","Status","District","Priority","Date"],
        examined.map(c => [c.caseId, c.child, c.status, c.district, c.priority, c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""])
      );
      toast("Downloading CSV…");
    },
    "Medical Intervention Log": () => {
      downloadCSV("medical_intervention_log.csv",
        ["Case ID","Child Name","Location","Abuse Type","Status","District"],
        cases.map(c => [c.caseId, c.child, c.location, c.abuseType, c.status, c.district])
      );
      toast("Downloading CSV…");
    },
    "Monthly Hospital Report": () => {
      const now = new Date();
      const thisMonth = cases.filter(c => {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      downloadCSV("monthly_hospital_report.csv",
        ["Case ID","Child Name","Age","Status","Priority","Abuse Type","Date"],
        thisMonth.map(c => [c.caseId, c.child, c.age, c.status, c.priority, c.abuseType, c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""])
      );
      toast("Downloading CSV…");
    },
    "Evidence Documentation": () => {
      const withFiles = cases.filter(c => c.attachmentCount > 0);
      downloadCSV("evidence_documentation.csv",
        ["Case ID","Child Name","District","Files Attached","Status"],
        withFiles.map(c => [c.caseId, c.child, c.district, c.attachmentCount, c.status])
      );
      toast("Downloading CSV…");
    },
  };

  // ── PDF generators ──────────────────────────────────────────────────────────

  const pdfHandlers = {
    "Monthly Assessment Report": () => {
      const rows = cases.map(c =>
        `<tr><td>${c.caseId}</td><td>${c.child || "—"}</td><td>${c.age || "—"}</td><td>${c.district}</td><td>${c.priority}</td><td>${c.status}</td><td>${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td></tr>`
      ).join("");
      downloadPDF("Monthly Assessment Report",
        `<h1>Monthly Assessment Report</h1>
         <p>Generated: ${new Date().toLocaleDateString()} · Total cases: ${cases.length}</p>
         <h2>All Cases</h2>
         <table><tr><th>Case ID</th><th>Child</th><th>Age</th><th>District</th><th>Priority</th><th>Status</th><th>Date</th></tr>${rows}</table>`);
      toast("Opening print dialog…");
    },
    "Abuse Type Statistics": () => {
      const abt = reportData && reportData.abuseByType ? reportData.abuseByType : [];
      const rows = abt.map(r => `<tr><td>${r.type}</td><td>${r.count}</td></tr>`).join("");
      downloadPDF("Abuse Type Statistics",
        `<h1>Abuse Type Statistics</h1>
         <p>District summary · ${new Date().toLocaleDateString()}</p>
         <table><tr><th>Abuse Type</th><th>Count</th></tr>${rows}</table>`);
      toast("Opening print dialog…");
    },
    "Examination Summary": () => {
      const examined = cases.filter(c => c.status !== "submitted");
      const rows = examined.map(c =>
        `<tr><td>${c.caseId}</td><td>${c.child}</td><td>${c.status}</td><td>${c.district}</td></tr>`
      ).join("");
      downloadPDF("Examination Summary",
        `<h1>Examination Summary</h1>
         <p>${examined.length} cases examined · ${new Date().toLocaleDateString()}</p>
         <table><tr><th>Case ID</th><th>Child</th><th>Status</th><th>District</th></tr>${rows}</table>`);
      toast("Opening print dialog…");
    },
    "Medical Intervention Log": () => {
      const rows = cases.map(c =>
        `<tr><td>${c.caseId}</td><td>${c.child}</td><td>${c.location || "—"}</td><td>${c.abuseType || "—"}</td><td>${c.status}</td></tr>`
      ).join("");
      downloadPDF("Medical Intervention Log",
        `<h1>Medical Intervention Log</h1>
         <table><tr><th>Case ID</th><th>Child</th><th>Location</th><th>Abuse Type</th><th>Status</th></tr>${rows}</table>`);
      toast("Opening print dialog…");
    },
    "Monthly Hospital Report": () => {
      const now = new Date();
      const thisMonth = cases.filter(c => {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const rows = thisMonth.map(c =>
        `<tr><td>${c.caseId}</td><td>${c.child}</td><td>${c.age||"—"}</td><td>${c.priority}</td><td>${c.status}</td></tr>`
      ).join("");
      downloadPDF("Monthly Hospital Report",
        `<h1>Monthly Hospital Report — ${now.toLocaleString("default",{month:"long",year:"numeric"})}</h1>
         <p>${thisMonth.length} cases this month</p>
         <table><tr><th>Case ID</th><th>Child</th><th>Age</th><th>Priority</th><th>Status</th></tr>${rows}</table>`);
      toast("Opening print dialog…");
    },
    "Evidence Documentation": () => {
      const withFiles = cases.filter(c => c.attachmentCount > 0);
      const rows = withFiles.map(c =>
        `<tr><td>${c.caseId}</td><td>${c.child}</td><td>${c.district}</td><td>${c.attachmentCount}</td></tr>`
      ).join("");
      downloadPDF("Evidence Documentation",
        `<h1>Evidence Documentation</h1>
         <p>${withFiles.length} cases with uploaded files · ${new Date().toLocaleDateString()}</p>
         <table><tr><th>Case ID</th><th>Child</th><th>District</th><th>Files</th></tr>${rows}</table>`);
      toast("Opening print dialog…");
    },
  };

  const EXPORT_CARDS = [
    { title: "Monthly Assessment Report",  sub: "All cases with status and priority",  icon: ClipboardList },
    { title: "Abuse Type Statistics",      sub: "Breakdown of abuse categories",        icon: BarChart3     },
    { title: "Examination Summary",        sub: "Children examined and outcomes",       icon: FileSearch    },
    { title: "Medical Intervention Log",   sub: "Case locations and abuse types",       icon: Activity      },
    { title: "Monthly Hospital Report",    sub: "Cases reported this calendar month",   icon: Calendar      },
    { title: "Evidence Documentation",     sub: "Cases with uploaded files",            icon: Paperclip     },
  ];

  const summaryCards = [
    { label: "Exams This Month",  value: reportData ? reportData.monthlyExaminations ?? 0 : 0, icon: Stethoscope,   color: "text-amber-600"  },
    { label: "Total Children",    value: reportData ? reportData.totalThisMonth       ?? 0 : 0, icon: User,          color: "text-blue-600"   },
    { label: "Completed Reports", value: reportData ? reportData.completedThisMonth   ?? 0 : 0, icon: CheckCheck,    color: "text-green-600"  },
    { label: "Abuse Types",       value: reportData && reportData.abuseByType ? reportData.abuseByType.length : 0, icon: AlertTriangle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Reports & Analytics" sub="Generate and download medical reports as PDF or CSV" />

      {/* Toast notification */}
      {toasting && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[13px] font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-pulse">
          <Download className="w-4 h-4" /> {toasting}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 animate-pulse h-24" />)
          : summaryCards.map(s => (
              <Card key={s.label}>
                <div className="flex items-center gap-3 mb-2">
                  <s.icon className={"w-5 h-5 " + s.color} />
                  <p className="text-[12px] font-bold text-slate-600 dark:text-slate-400">{s.label}</p>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              </Card>
            ))
        }
      </div>

      {reportData && reportData.abuseByType && reportData.abuseByType.length > 0 && (
        <Card>
          <p className="font-extrabold text-slate-800 dark:text-slate-200 mb-4">Abuse Type Distribution</p>
          <div className="space-y-3">
            {reportData.abuseByType.map((item, i) => {
              const max = Math.max(...reportData.abuseByType.map(x => x.count), 1);
              return (
                <div key={i}>
                  <div className="flex justify-between text-[12px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    <span>{item.type || "Unknown"}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full bg-yellow-500 transition-all" style={{ width: ((item.count / max) * 100) + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_CARDS.map(r => (
          <Card key={r.title} className="hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center mb-3">
              <r.icon className="w-5 h-5 text-yellow-600 dark:text-amber-400" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-1">{r.title}</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">{r.sub}</p>
            <div className="flex gap-2">
              <Btn variant="outline" size="sm" className="flex-1 justify-center"
                onClick={() => { const h = pdfHandlers[r.title]; if (h) h(); }}>
                <Download className="w-3.5 h-3.5" /> PDF
              </Btn>
              <Btn variant="amber" size="sm" className="flex-1 justify-center"
                onClick={() => { const h = csvHandlers[r.title]; if (h) h(); }}>
                <Download className="w-3.5 h-3.5" /> CSV
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function HealthcareDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [active,      setActive]      = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cases,       setCases]       = useState([]);
  const [stats,       setStats]       = useState({});
  const [loading,     setLoading]     = useState(true);
  const profile = getAuthProfile();
  const initials = profile && profile.fullName
    ? profile.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "HC";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [casesData, statsData] = await Promise.all([getHealthCases(), getHealthStats()]);
      setCases(casesData && casesData.cases ? casesData.cases : []);
      setStats(statsData && statsData.stats ? statsData.stats : {});
    } catch (err) {
      console.error("Health data load failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => { clearAuthSession(); navigate("/login"); };
  const handleNav    = (id) => { setActive(id); setSidebarOpen(false); };

  const curNav = ALL_NAV.find(n => n.id === active);

  const SECTIONS = {
    dashboard:       <DashboardSection stats={stats} cases={cases} loading={loading} onNav={handleNav} />,
    assigned:        <CaseListSection  title="Assigned Cases" sub={cases.length + " total"}
                       cases={cases} loading={loading} onRefresh={loadData} />,
    examining:       <CaseListSection  title="Under Examination" sub="Cases being examined"
                       cases={cases} loading={loading}
                       filterFn={c => c.status === "verified" || c.status === "under-investigation"}
                       onRefresh={loadData} />,
    completed:       <CaseListSection  title="Completed Cases" sub="Assessments completed"
                       cases={cases} loading={loading}
                       filterFn={c => c.status === "resolved"}
                       onRefresh={loadData} />,
    assessment:      <AssessmentSection  cases={cases} loading={loading} onRefresh={loadData} />,
    "reports-upload":<ReportsUploadSection cases={cases} loading={loading} />,
    notes:           <NotesSection cases={cases} />,
    reports:         <ReportsSection cases={cases} />,
    profile:         <ProfilePage accentColor="amber" />,
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={[
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-extrabold text-yellow-700 dark:text-amber-400">Childwatch</p>
              <p className="text-[10px] text-slate-400 font-medium">Healthcare Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-4">
              <p className="px-3 mb-1.5 text-[9px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon     = item.icon;
                  const isActive = active === item.id;
                  return (
                    <button key={item.id} onClick={() => handleNav(item.id)}
                      className={[
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
                        isActive
                          ? "bg-yellow-500 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white",
                      ].join(" ")}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Profile footer */}
        <div className="px-4 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-extrabold text-yellow-700 dark:text-amber-400">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">
                {profile && profile.fullName ? profile.fullName : "Healthcare Provider"}
              </p>
              <p className="text-[10px] text-slate-400">{profile && profile.district ? profile.district : "—"} District</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50 relative">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-[14px] font-extrabold text-slate-800 dark:text-slate-200">
              {curNav ? curNav.label : "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title={theme === "dark" ? "Light mode" : "Dark mode"}>
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={loadData}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <NotificationBell accentColor="amber" />
            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <span className="text-[11px] font-bold text-yellow-700 dark:text-amber-400">{initials}</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {SECTIONS[active]}
        </main>

        {/* Mobile bottom nav */}
        <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-around px-1 py-2 shrink-0">
          {[
            { id: "dashboard",  icon: LayoutDashboard, label: "Home"    },
            { id: "assigned",   icon: FolderOpen,      label: "Cases"   },
            { id: "assessment", icon: ClipboardList,   label: "Assess"  },
            { id: "notes",      icon: MessageSquare,   label: "Notes"   },
            { id: "reports",    icon: BarChart3,       label: "Reports" },
          ].map(item => {
            const Icon     = item.icon;
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => handleNav(item.id)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl">
                <Icon className={"w-5 h-5 " + (isActive ? "text-yellow-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-600")} />
                <span className={"text-[9px] font-bold " + (isActive ? "text-yellow-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-600")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

