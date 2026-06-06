import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthProfile } from "../utils/authStorage";
import {
  getSocialCases, getSocialStats, getSocialCaseDetail, getSocialCaseNotes,
  addSocialCaseNote, getSocialAssessment, submitSocialAssessment,
  submitSocialReferral, updateSocialCaseStatus, getSocialAlerts, markSocialAlertRead,
} from "../services/socialApi";
import NotificationBell from "../components/NotificationBell";
import ProfilePage from "../components/ProfilePage";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTheme } from "../contexts/ThemeContext";
import {
  LayoutDashboard, FolderOpen, ClipboardList, Heart, Calendar,
  ArrowRightLeft, Bell, AlertTriangle, CheckCircle2,
  MapPin, Menu, LogOut, Edit2, Eye, Send, X,
  Shield, FileText, Home, User,
  MessageSquare, Sun, Moon, Search, Loader2,
  RefreshCw, ChevronDown, Info,
} from "lucide-react";

// ── Stats builder ────────────────────────────────────────────────────
function buildStats(s = {}) {
  return [
    { label: "Assigned Cases",     value: String(s.total    ?? 0), icon: FolderOpen,    color: "blue"  },
    { label: "High-Priority",      value: String(s.highRisk ?? 0), icon: AlertTriangle, color: "red"   },
    { label: "Active Abuse Cases", value: String(s.active   ?? 0), icon: Shield,        color: "red"   },
    { label: "Cases Resolved",     value: String(s.resolved ?? 0), icon: CheckCircle2,  color: "green" },
  ];
}

const STATUS_OPTIONS = ["submitted", "verified", "under-investigation", "resolved"];

const STATUS_CONFIG = {
  submitted:             { bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200",  dot: "bg-slate-400"  },
  verified:              { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500"   },
  "under-investigation": { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500"  },
  resolved:              { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500"  },
};

const PRIORITY_CONFIG = {
  high:   { bg: "bg-red-50",   text: "text-red-700",   border: "border-red-200",   dot: "bg-red-500"   },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  low:    { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
};

const NAV = [
  { id: "dashboard",  label: "Dashboard",          icon: LayoutDashboard },
  { id: "cases",      label: "Assigned Cases",     icon: FolderOpen      },
  { id: "visits",     label: "Home Visits",        icon: Home            },
  { id: "assessment", label: "Assessments",        icon: ClipboardList   },
  { id: "referrals",  label: "Referrals",          icon: ArrowRightLeft  },
  { id: "alerts",     label: "Alerts",             icon: Bell            },
  { id: "profile",    label: "My Profile",         icon: User            },
];

// ── Shared UI ────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  const C = {
    blue:  "bg-yellow-50 text-yellow-600 ring-yellow-100",
    green: "bg-green-50 text-green-600 ring-green-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    red:   "bg-red-50 text-red-500 ring-red-100",
  }[color] || "bg-yellow-50 text-yellow-600 ring-yellow-100";
  const parts = C.split(" ");
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${parts[0]} ring-4 ${parts[2]} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${parts[1]}`} />
      </div>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {(status || "").replace(/-/g, " ")}
    </span>
  );
}

function PriorityBadge({ priority = "medium" }) {
  const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {priority} priority
    </span>
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

// ── Modal shell ──────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-[13px] font-semibold max-w-sm
      ${type === "success"
        ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300"
        : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300"
      }`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose}><X className="w-4 h-4" /></button>
    </div>
  );
}

// ── View Case Modal ──────────────────────────────────────────────────
function ViewCaseModal({ caseId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    Promise.all([getSocialCaseDetail(caseId), getSocialCaseNotes(caseId)])
      .then(([d, n]) => { setDetail(d.case); setNotes(n.notes || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [caseId]);

  return (
    <Modal open={!!caseId} onClose={onClose} title={`Case Details — ${caseId}`} width="max-w-2xl">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : !detail ? (
        <p className="p-6 text-center text-slate-400">Failed to load case.</p>
      ) : (
        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ["Child Name", detail.child || "—"],
              ["Age", detail.age ? `${detail.age} yrs` : "Unknown"],
              ["Gender", detail.gender || "Unknown"],
              ["Type", detail.type || "—"],
              ["District", detail.district || "—"],
              ["Location", detail.location || "—"],
            ].map(([l, v]) => (
              <div key={l} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{l}</p>
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <StatusBadge status={detail.status} />
            <PriorityBadge priority={detail.priority} />
          </div>
          {detail.description && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description</p>
              <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{detail.description}</p>
            </div>
          )}
          {notes.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">Case History ({notes.length})</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div key={n.id} className="border-l-2 border-yellow-400 pl-3 py-1">
                    <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{n.comment}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {n.author_name} · {n.note_type} · {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Update Status Modal ──────────────────────────────────────────────
function UpdateStatusModal({ c, onClose, onUpdated, showToast }) {
  const [status, setStatus] = useState(c?.status || "submitted");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSocialCaseStatus(c.id, status);
      if (note.trim()) {
        await addSocialCaseNote(c.caseId, { comment: note.trim(), noteType: "status-update" });
      }
      showToast("success", "Status updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      showToast("error", err.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!c} onClose={onClose} title="Update Case Status">
      <div className="p-6 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Case</p>
          <p className="text-[13px] font-bold text-slate-800 dark:text-white mt-0.5">{c?.child} — <span className="font-mono text-yellow-700 dark:text-yellow-400">{c?.caseId}</span></p>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 bg-white dark:bg-slate-900 dark:text-slate-200 appearance-none">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/-/g, " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Reason for status change…"
            className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 resize-none bg-white dark:bg-slate-900 dark:text-slate-200" />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-[13px] font-bold transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Saving…" : "Update Status"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Note Modal ───────────────────────────────────────────────────
function AddNoteModal({ c, onClose, showToast }) {
  const [comment, setComment] = useState("");
  const [noteType, setNoteType] = useState("visit");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!comment.trim()) { showToast("error", "Please enter a note"); return; }
    setSaving(true);
    try {
      await addSocialCaseNote(c.caseId, { comment: comment.trim(), noteType });
      showToast("success", "Note saved successfully");
      onClose();
    } catch (err) {
      showToast("error", err.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!c} onClose={onClose} title="Add Case Note">
      <div className="p-6 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Case</p>
          <p className="text-[13px] font-bold text-slate-800 dark:text-white mt-0.5">{c?.child} — <span className="font-mono text-yellow-700 dark:text-yellow-400">{c?.caseId}</span></p>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Note Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[["visit", "🏠 Visit"], ["update", "📋 Update"], ["observation", "👁 Observation"]].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setNoteType(v)}
                className={`py-2 rounded-xl text-[12px] font-semibold border transition-all
                  ${noteType === v ? "bg-yellow-500 border-yellow-500 text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Note *</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={5}
            placeholder="Describe the observation, actions taken, or field visit findings…"
            className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 resize-none bg-white dark:bg-slate-900 dark:text-slate-200" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-[13px] font-bold transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Refer Case Modal ─────────────────────────────────────────────────
function ReferModal({ c, onClose, showToast }) {
  const [referTo, setReferTo] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const TARGETS = [
    { value: "Police",   label: "Police",   emoji: "🚔", color: "border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"   },
    { value: "Hospital", label: "Hospital", emoji: "🏥", color: "border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30" },
    { value: "NGO",      label: "NGO",      emoji: "🤝", color: "border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30" },
    { value: "Escalate", label: "Escalate", emoji: "⚡", color: "border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"        },
  ];

  const handleSubmit = async () => {
    if (!referTo) { showToast("error", "Please select a referral target"); return; }
    if (!reason.trim()) { showToast("error", "Please provide a reason for referral"); return; }
    setSaving(true);
    try {
      await submitSocialReferral(c.caseId, { referTo, reason: reason.trim() });
      showToast("success", `Case referred to ${referTo} successfully`);
      onClose();
    } catch (err) {
      showToast("error", err.message || "Failed to submit referral");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!c} onClose={onClose} title="Refer Case">
      <div className="p-6 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Case</p>
          <p className="text-[13px] font-bold text-slate-800 dark:text-white mt-0.5">{c?.child} — <span className="font-mono text-yellow-700 dark:text-yellow-400">{c?.caseId}</span></p>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Refer To *</label>
          <div className="grid grid-cols-2 gap-2">
            {TARGETS.map((t) => (
              <button key={t.value} type="button" onClick={() => setReferTo(t.value)}
                className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-[13px] font-semibold transition-all
                  ${referTo === t.value
                    ? "bg-yellow-500 border-yellow-500 text-white"
                    : `bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 ${t.color} border-slate-200 dark:border-slate-700`}`}>
                <span>{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reason for Referral *</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
            placeholder="Explain why this case is being referred and what actions are needed…"
            className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 resize-none bg-white dark:bg-slate-900 dark:text-slate-200" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-[13px] font-bold transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            {saving ? "Submitting…" : "Submit Referral"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Assessment Modal ─────────────────────────────────────────────────
function AssessmentModal({ c, onClose, showToast }) {
  const [form, setForm] = useState({
    physicalSafety: "", psychologicalState: "", familyEnvironment: "", recommendation: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!c) return;
    getSocialAssessment(c.caseId)
      .then((d) => {
        if (d.assessment) {
          setForm({
            physicalSafety:     d.assessment.physical_safety     || "",
            psychologicalState: d.assessment.psychological_state || "",
            familyEnvironment:  d.assessment.family_environment  || "",
            recommendation:     d.assessment.recommendation      || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [c]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.physicalSafety.trim() && !form.recommendation.trim()) {
      showToast("error", "Please fill in at least Physical Safety or Recommendation");
      return;
    }
    setSaving(true);
    try {
      await submitSocialAssessment(c.caseId, form);
      showToast("success", "Assessment submitted successfully");
      onClose();
    } catch (err) {
      showToast("error", err.message || "Failed to submit assessment");
    } finally {
      setSaving(false);
    }
  };

  const FIELDS = [
    { key: "physicalSafety",     label: "Physical Safety Assessment",     ph: "Assess child's physical condition, injuries, safety at home…"   },
    { key: "psychologicalState", label: "Psychological / Emotional State", ph: "Document emotional wellbeing, trauma signs, mental state…"        },
    { key: "familyEnvironment",  label: "Family & Home Environment",       ph: "Describe family dynamics, caregiver capacity, living conditions…" },
    { key: "recommendation",     label: "Protection Recommendation",       ph: "Recommended next steps, interventions, services needed…"          },
  ];

  return (
    <Modal open={!!c} onClose={onClose} title="Child Welfare Assessment" width="max-w-2xl">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : (
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-[12px] text-amber-700 dark:text-amber-300">
              <strong>{c?.child}</strong> — {c?.caseId} · Submitting will log a formal assessment record.
            </p>
          </div>
          {FIELDS.map(({ key, label, ph }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
              <textarea value={form[key]} onChange={set(key)} rows={3} placeholder={ph}
                className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 resize-none bg-white dark:bg-slate-900 dark:text-slate-200" />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-[13px] font-bold transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
              {saving ? "Submitting…" : "Submit Assessment"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Visit Notes Modal ────────────────────────────────────────────────
function VisitNoteModal({ c, onClose, showToast, onUpdated }) {
  const [obs, setObs]       = useState("");
  const [action, setAction] = useState("");
  const [childStatus, setChildStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const combined = [obs && `Observations: ${obs}`, action && `Actions taken: ${action}`].filter(Boolean).join("\n\n");
    if (!combined.trim()) { showToast("error", "Please fill in observations or actions"); return; }
    setSaving(true);
    try {
      await addSocialCaseNote(c.caseId, { comment: combined, noteType: "visit", status: childStatus || undefined });
      if (childStatus) await updateSocialCaseStatus(c.id, childStatus);
      showToast("success", "Visit notes saved");
      onUpdated?.();
      onClose();
    } catch (err) {
      showToast("error", err.message || "Failed to save visit notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!c} onClose={onClose} title="Record Home Visit" width="max-w-xl">
      <div className="p-6 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Case</p>
          <p className="text-[13px] font-bold text-slate-800 dark:text-white mt-0.5">{c?.child} — <span className="font-mono text-yellow-700">{c?.caseId}</span></p>
          <p className="text-[11px] text-slate-400 mt-0.5">{c?.district} · {c?.type}</p>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Visit Observations</label>
          <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3}
            placeholder="Describe home conditions, child wellbeing, family situation…"
            className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 resize-none bg-white dark:bg-slate-900 dark:text-slate-200" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Intervention Actions Taken</label>
          <textarea value={action} onChange={(e) => setAction(e.target.value)} rows={2}
            placeholder="Actions taken, services provided, referrals made…"
            className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 resize-none bg-white dark:bg-slate-900 dark:text-slate-200" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Update Case Status (optional)</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "verified",              l: "✅ Verified",       c: "border-blue-300"  },
              { v: "under-investigation",   l: "🔍 Investigating",  c: "border-amber-300" },
              { v: "resolved",              l: "🟢 Mark Resolved",  c: "border-green-300" },
              { v: "",                      l: "— No change",       c: "border-slate-200" },
            ].map((s) => (
              <button key={s.v} type="button" onClick={() => setChildStatus(s.v)}
                className={`py-2 px-3 rounded-xl border text-[12px] font-semibold transition-all
                  ${childStatus === s.v
                    ? "bg-yellow-500 border-yellow-500 text-white"
                    : `bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 ${s.c} dark:border-slate-700`}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-[13px] font-bold transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Visit Notes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── CaseCard ─────────────────────────────────────────────────────────
function CaseCard({ c, onView, onUpdate, onNote, onRefer, onAssessment, onVisit, compact = false }) {
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
            <MapPin className="w-3 h-3" />{c.district || "—"}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <PriorityBadge priority={c.priority} />
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${c.type === "Abuse" ? "bg-red-50 text-red-600 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            {c.type || "—"}
          </span>
        </div>
      </div>
      <div className="mb-3">
        <StatusBadge status={c.status} />
        <span className="text-[10px] text-slate-400 ml-2">
          Assigned {c.assignedAt ? new Date(c.assignedAt).toLocaleDateString() : "—"}
        </span>
      </div>
      {!compact && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onView(c.caseId)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all">
            <Eye className="w-3.5 h-3.5" />View
          </button>
          <button onClick={() => onUpdate(c)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all">
            <Edit2 className="w-3.5 h-3.5" />Update Status
          </button>
          <button onClick={() => onNote(c)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all">
            <MessageSquare className="w-3.5 h-3.5" />Add Note
          </button>
          <button onClick={() => onVisit(c)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all">
            <Home className="w-3.5 h-3.5" />Visit Log
          </button>
          <button onClick={() => onAssessment(c)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all">
            <ClipboardList className="w-3.5 h-3.5" />Assess
          </button>
          <button onClick={() => onRefer(c)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-yellow-500 hover:bg-yellow-600 text-white transition-all">
            <ArrowRightLeft className="w-3.5 h-3.5" />Refer
          </button>
        </div>
      )}
    </div>
  );
}

// ── Dashboard View ────────────────────────────────────────────────────
function DashboardView({ onNav, cases, stats, loading, profile, modalHandlers }) {
  const name = profile?.fullName || "Social Worker";
  const district = profile?.district || "";
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-yellow-600 rounded-2xl px-6 py-5 text-white">
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-yellow-500 rounded-full opacity-50 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-yellow-500 rounded-full opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-yellow-200 mb-1">Welcome back</p>
            <h2 className="text-[20px] font-extrabold">{name}</h2>
            <p className="text-[13px] text-yellow-200 mt-0.5">Social Worker{district ? ` · ${district}` : ""}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onNav("cases")} className="flex items-center gap-2 px-4 py-2.5 bg-white text-yellow-800 font-bold text-[13px] rounded-xl hover:bg-yellow-50">
              <FolderOpen className="w-4 h-4" />My Cases
            </button>
            <button onClick={() => onNav("visits")} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/30 text-white font-bold text-[13px] rounded-xl hover:bg-white/20">
              <Calendar className="w-4 h-4" />Visits
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading
          ? <p className="text-[12px] text-slate-400 col-span-4">Loading…</p>
          : stats.map((s) => <StatCard key={s.label} {...s} />)
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="font-extrabold text-slate-800 dark:text-white">High-Priority Cases</p>
            <button onClick={() => onNav("cases")} className="text-[12px] font-semibold text-yellow-700 dark:text-yellow-400">View all →</button>
          </div>
          {cases.filter((c) => c.priority === "high").length === 0
            ? <p className="text-[12px] text-slate-400 py-6 text-center">No high-priority cases assigned.</p>
            : cases.filter((c) => c.priority === "high").slice(0, 3).map((c) => (
              <CaseCard key={c.caseId} c={c} {...modalHandlers} />
            ))
          }
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <p className="font-extrabold text-slate-800 dark:text-white mb-4">Recent Assignments</p>
            {cases.length === 0
              ? <p className="text-[12px] text-slate-400 text-center py-2">No cases assigned yet.</p>
              : cases.slice(0, 4).map((c) => (
                <div key={c.caseId} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 mb-2 last:mb-0">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-950/40 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{c.child || "—"}</p>
                    <p className="text-[10px] text-slate-400">{c.district || "—"}</p>
                  </div>
                  <PriorityBadge priority={c.priority} />
                </div>
              ))
            }
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 rounded-2xl p-4">
            <p className="font-extrabold text-yellow-800 dark:text-yellow-400 mb-3">Case Summary</p>
            {[
              { l: "Total assigned", v: cases.length,                                    c: "text-slate-700 dark:text-slate-300" },
              { l: "High priority",  v: cases.filter((x) => x.priority === "high").length, c: "text-red-600"   },
              { l: "Resolved",       v: cases.filter((x) => x.status === "resolved").length, c: "text-green-700" },
            ].map((x) => (
              <div key={x.l} className="flex justify-between text-[12px] mb-1.5 last:mb-0">
                <span className="text-yellow-700 dark:text-yellow-500">{x.l}</span>
                <span className={`font-extrabold ${x.c}`}>{x.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cases View ────────────────────────────────────────────────────────
function CasesView({ cases, modalHandlers }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch]  = useState("");
  const filtered = cases.filter((c) =>
    (filter === "All" || c.status === filter || c.priority === filter) &&
    ((c.child || "").toLowerCase().includes(search.toLowerCase()) ||
     (c.caseId || "").toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="space-y-5">
      <SectionTitle title="Assigned Cases" sub={`${cases.length} case${cases.length !== 1 ? "s" : ""} assigned to you`} />
      {cases.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <FolderOpen className="w-10 h-10 text-slate-200 dark:text-slate-700" />
          <p className="text-[13px] text-slate-400 dark:text-slate-500">No cases assigned to you yet. The admin will assign cases.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by child name or case ID…"
                className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-yellow-400 bg-white dark:bg-slate-900 dark:text-slate-200" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["All", "submitted", "verified", "under-investigation", "resolved", "high", "medium", "low"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all
                    ${filter === f ? "bg-yellow-500 text-white border-yellow-500" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filtered.length === 0
              ? <p className="text-[12px] text-slate-400 py-6 text-center">No cases match this filter.</p>
              : filtered.map((c) => <CaseCard key={c.caseId} c={c} {...modalHandlers} />)
            }
          </div>
        </>
      )}
    </div>
  );
}

// ── Visits View ───────────────────────────────────────────────────────
function VisitsView({ cases, modalHandlers }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Home Visits" sub="Log field visits and observations for assigned cases" />
      {cases.length === 0
        ? <p className="text-[12px] text-slate-400 py-6 text-center">No cases assigned yet.</p>
        : cases.map((c) => (
          <div key={c.caseId} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-[11px] text-yellow-700 dark:text-yellow-400 font-bold">{c.caseId}</p>
                <p className="text-[14px] font-extrabold text-slate-800 dark:text-white">{c.child || "—"}</p>
                <p className="text-[12px] text-slate-400">{c.district} · {c.type}</p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
              </div>
            </div>
            <button onClick={() => modalHandlers.onVisit(c)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-[13px] font-bold transition-colors">
              <Home className="w-4 h-4" />Record Visit Notes
            </button>
          </div>
        ))
      }
    </div>
  );
}

// ── Assessment View ───────────────────────────────────────────────────
function AssessmentView({ cases, modalHandlers }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Social Assessments" sub="Submit formal child welfare assessments for your assigned cases" />
      {cases.length === 0
        ? <p className="text-[12px] text-slate-400 py-6 text-center">No cases assigned yet.</p>
        : cases.map((c) => (
          <div key={c.caseId} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] text-yellow-700 dark:text-yellow-400 font-bold">{c.caseId}</p>
              <p className="text-[14px] font-extrabold text-slate-800 dark:text-white">{c.child || "—"}</p>
              <p className="text-[12px] text-slate-400 mt-0.5">{c.district} · {c.type}</p>
              <div className="flex gap-2 mt-2">
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
              </div>
            </div>
            <button onClick={() => modalHandlers.onAssessment(c)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-[13px] font-bold transition-colors shrink-0">
              <ClipboardList className="w-4 h-4" />Assess / View
            </button>
          </div>
        ))
      }
    </div>
  );
}

// ── Referrals View ────────────────────────────────────────────────────
function ReferralsView({ cases, modalHandlers }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Case Referrals" sub="Refer assigned cases to police, hospitals, NGOs or escalate" />
      {cases.length === 0
        ? <p className="text-[12px] text-slate-400 py-6 text-center">No cases assigned yet.</p>
        : cases.map((c) => (
          <div key={c.caseId} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] text-yellow-700 dark:text-yellow-400 font-bold">{c.caseId}</p>
              <p className="text-[14px] font-extrabold text-slate-800 dark:text-white">{c.child || "—"}</p>
              <p className="text-[12px] text-slate-400">{c.district} · {c.type}</p>
              <div className="flex gap-2 mt-2">
                <StatusBadge status={c.status} />
              </div>
            </div>
            <button onClick={() => modalHandlers.onRefer(c)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-[13px] font-bold transition-colors shrink-0">
              <ArrowRightLeft className="w-4 h-4" />Refer Case
            </button>
          </div>
        ))
      }
    </div>
  );
}

// ── Alerts View ───────────────────────────────────────────────────────
function AlertsView() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getSocialAlerts();
      setAlerts(d.alerts || []);
    } catch { setAlerts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    await markSocialAlertRead(id).catch(() => {});
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: 1 } : a));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle title="Alerts & Notifications" sub="Notifications about your assigned cases" />
        <button onClick={load} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Bell className="w-10 h-10 text-slate-200 dark:text-slate-700" />
          <p className="text-[13px] text-slate-400">No alerts yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className={`flex items-start gap-4 p-4 rounded-2xl border shadow-sm transition-all
              ${a.is_read ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-70"
              : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                ${a.is_read ? "bg-slate-100 dark:bg-slate-800" : "bg-yellow-100 dark:bg-yellow-900/40"}`}>
                <Bell className={`w-4 h-4 ${a.is_read ? "text-slate-400" : "text-yellow-600 dark:text-yellow-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{a.message}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              {!a.is_read && (
                <button onClick={() => markRead(a.id)}
                  className="shrink-0 text-[11px] font-semibold text-yellow-700 dark:text-yellow-400 hover:underline">
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────
export default function SocialWorkerDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme?.() || {};
  const [active, setActive]           = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cases, setCases]             = useState([]);
  const [stats, setStats]             = useState(buildStats({}));
  const [loading, setLoading]         = useState(true);
  const profile = getAuthProfile();
  const initials = profile?.fullName?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "SW";

  // Modals
  const [viewCaseId,     setViewCaseId]     = useState(null);
  const [updateCase,     setUpdateCase]     = useState(null);
  const [noteCase,       setNoteCase]       = useState(null);
  const [referCase,      setReferCase]      = useState(null);
  const [assessmentCase, setAssessmentCase] = useState(null);
  const [visitCase,      setVisitCase]      = useState(null);

  // Toast
  const [toast, setToast] = useState({ msg: "", type: "" });
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => { clearAuthSession(); navigate("/login"); };

  const modalHandlers = {
    onView:       (caseId) => setViewCaseId(caseId),
    onUpdate:     (c) => setUpdateCase(c),
    onNote:       (c) => setNoteCase(c),
    onRefer:      (c) => setReferCase(c),
    onAssessment: (c) => setAssessmentCase(c),
    onVisit:      (c) => setVisitCase(c),
  };

  const SECTIONS = {
    dashboard:  <DashboardView onNav={setActive} cases={cases} stats={stats} loading={loading} profile={profile} modalHandlers={modalHandlers} />,
    cases:      <CasesView cases={cases} modalHandlers={modalHandlers} />,
    visits:     <VisitsView cases={cases} modalHandlers={modalHandlers} />,
    assessment: <AssessmentView cases={cases} modalHandlers={modalHandlers} />,
    referrals:  <ReferralsView cases={cases} modalHandlers={modalHandlers} />,
    alerts:     <AlertsView />,
    profile:    <ProfilePage accentColor="yellow" />,
  };
  const cur = NAV.find((n) => n.id === active);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Modals */}
      <ViewCaseModal caseId={viewCaseId} onClose={() => setViewCaseId(null)} />
      <UpdateStatusModal c={updateCase} onClose={() => setUpdateCase(null)} onUpdated={loadData} showToast={showToast} />
      <AddNoteModal c={noteCase} onClose={() => setNoteCase(null)} showToast={showToast} />
      <ReferModal c={referCase} onClose={() => setReferCase(null)} showToast={showToast} />
      <AssessmentModal c={assessmentCase} onClose={() => setAssessmentCase(null)} showToast={showToast} />
      <VisitNoteModal c={visitCase} onClose={() => setVisitCase(null)} showToast={showToast} onUpdated={loadData} />
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center shadow-sm"><Heart className="w-5 h-5 text-white" /></div>
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
          {NAV.map((item) => {
            const Icon = item.icon;
            const isA = active === item.id;
            return (
              <button key={item.id} onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${isA ? "bg-yellow-500 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/10"}`}>
                <Icon className="w-4 h-4 shrink-0" />{item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-1 shrink-0">
          <LanguageSwitcher mode="dark" opens="up" />
          {toggleTheme && (
            <button onClick={toggleTheme} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-[13px] font-semibold transition-all">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-[13px] font-semibold transition-all">
            <LogOut className="w-4 h-4" />Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 relative">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-[14px] font-extrabold text-slate-800 dark:text-slate-200">{cur?.label}</h1>
          </div>
          <div className="flex items-center gap-2">
            {toggleTheme && (
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            <NotificationBell accentColor="yellow" />
            <button onClick={() => setActive("profile")} className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-950/40 flex items-center justify-center">
              <span className="text-[11px] font-bold text-yellow-700 dark:text-yellow-400">{initials}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{SECTIONS[active] || SECTIONS.dashboard}</main>

        {/* Mobile bottom nav */}
        <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-around px-1 py-2 shrink-0">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Home"    },
            { id: "cases",     icon: FolderOpen,      label: "Cases"   },
            { id: "visits",    icon: Home,            label: "Visits"  },
            { id: "alerts",    icon: Bell,            label: "Alerts"  },
            { id: "profile",   icon: User,            label: "Profile" },
          ].map((item) => {
            const Icon = item.icon;
            const isA = active === item.id;
            return (
              <button key={item.id} onClick={() => setActive(item.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5">
                <Icon className={`w-5 h-5 ${isA ? "text-yellow-600 dark:text-yellow-400" : "text-slate-400"}`} />
                <span className={`text-[9px] font-bold ${isA ? "text-yellow-600 dark:text-yellow-400" : "text-slate-400"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
