/**
 * ProfilePage — shared across ALL dashboards / roles.
 * Props:
 *   accentColor  – Tailwind colour token used as the active accent (default: "blue")
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { getMyAccount, updateProfile, changePassword } from "../services/authApi";
import { getAuthProfile, setAuthProfile } from "../utils/authStorage";
import {
  User, Lock, Bell, CheckCircle2, AlertCircle, Eye, EyeOff,
  Camera, Mail, Phone, MapPin, Briefcase, Shield,
} from "lucide-react";

const DISTRICTS = [
  "Gasabo","Kicukiro","Nyarugenge","Bugesera","Gatsibo","Kayonza",
  "Kirehe","Ngoma","Nyagatare","Rwamagana","Burera","Gicumbi",
  "Gakenke","Musanze","Rulindo","Gisagara","Huye","Kamonyi",
  "Muhanga","Nyamagabe","Nyamasheke","Nyanza","Ruhango","Karongi",
  "Ngororero","Nyabihu","Rubavu","Rutsiro","Rusizi",
];

const ACCENT_MAP = {
  blue:   { pill:"bg-blue-600",   light:"bg-blue-50 dark:bg-blue-950/40",   text:"text-blue-600 dark:text-blue-400",   ring:"ring-blue-200 dark:ring-blue-800",   focus:"focus:border-blue-500"   },
  amber:  { pill:"bg-amber-500",  light:"bg-amber-50 dark:bg-amber-950/40", text:"text-amber-600 dark:text-amber-400", ring:"ring-amber-200 dark:ring-amber-800", focus:"focus:border-amber-500" },
  green:  { pill:"bg-green-600",  light:"bg-green-50 dark:bg-green-950/40", text:"text-green-600 dark:text-green-400", ring:"ring-green-200 dark:ring-green-800", focus:"focus:border-green-500" },
  red:    { pill:"bg-red-600",    light:"bg-red-50 dark:bg-red-950/40",     text:"text-red-600 dark:text-red-400",     ring:"ring-red-200 dark:ring-red-800",     focus:"focus:border-red-500"   },
  purple: { pill:"bg-purple-600", light:"bg-purple-50 dark:bg-purple-950/40",text:"text-purple-600 dark:text-purple-400",ring:"ring-purple-200 dark:ring-purple-800",focus:"focus:border-purple-500"},
  yellow: { pill:"bg-yellow-500", light:"bg-yellow-50 dark:bg-yellow-950/40",text:"text-yellow-600 dark:text-yellow-500",ring:"ring-yellow-200 dark:ring-yellow-800",focus:"focus:border-yellow-500"},
};

function Toast({ type, msg, onClose }) {
  if (!msg) return null;
  const ok = type === "success";
  return (
    <div className={[
      "fixed top-4 right-4 z-[9999] flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl max-w-sm border",
      ok
        ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300"
        : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300",
    ].join(" ")}>
      {ok
        ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
        : <AlertCircle  className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
      }
      <p className="text-[13px] font-semibold flex-1">{msg}</p>
      <button onClick={onClose} className="text-inherit opacity-60 hover:opacity-100 text-[16px] leading-none ml-2">×</button>
    </div>
  );
}

export default function ProfilePage({ accentColor = "blue" }) {
  const { t } = useTranslation();
  const { theme } = useTheme?.() || {};
  const accent = ACCENT_MAP[accentColor] || ACCENT_MAP.blue;

  const [tab,        setTab]        = useState("info");
  const [liveProfile,setLiveProfile]= useState(null);
  const [loading,    setLoading]    = useState(true);

  // Profile form
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", district: "" });
  const [saving, setSaving] = useState(false);

  // Password form
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  // Notification prefs (local-only, persisted to localStorage)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("childwatch_notif_prefs") || "{}"); } catch { return {}; }
  });
  const NOTIF_OPTIONS = [
    { key: "caseAssigned",    label: t("notifications.caseAssigned",    "Case assigned to you")           },
    { key: "statusChanged",   label: t("notifications.statusChanged",   "Case status changed")            },
    { key: "newEvidence",     label: t("notifications.newEvidence",     "New evidence uploaded")           },
    { key: "reportReceived",  label: t("notifications.reportReceived",  "Report received")                 },
    { key: "caseResolved",    label: t("notifications.caseResolved",    "Case resolved or closed")         },
    { key: "smsAlerts",       label: t("notifications.smsAlerts",       "SMS alerts (urgent cases only)")  },
  ];

  const [toast, setToast] = useState({ type: "", msg: "" });
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: "", msg: "" }), 4000);
  };

  // Load live profile from /auth/me
  useEffect(() => {
    setLoading(true);
    getMyAccount()
      .then(data => {
        const p = data.user || data.admin || {};
        setLiveProfile(p);
        setForm({
          fullName: p.fullName || "",
          email:    p.email    || "",
          phone:    p.phone    || "",
          district: p.district || "",
        });
      })
      .catch(() => {
        // Fallback to local storage profile
        const p = getAuthProfile() || {};
        setLiveProfile(p);
        setForm({ fullName: p.fullName || "", email: p.email || "", phone: p.phone || "", district: p.district || "" });
      })
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setPwField = k => e => setPw(p => ({ ...p, [k]: e.target.value }));

  const handleSaveProfile = async () => {
    if (!form.fullName.trim()) { showToast("error", t("errors.required", "Full name is required")); return; }
    setSaving(true);
    try {
      await updateProfile({ fullName: form.fullName, phone: form.phone, district: form.district });
      // Update local profile cache
      const current = getAuthProfile() || {};
      setAuthProfile({ ...current, fullName: form.fullName, phone: form.phone, district: form.district });
      showToast("success", t("profile.profileUpdated", "Profile updated successfully!"));
    } catch (err) {
      showToast("error", err.message || t("errors.networkError", "Failed to update profile"));
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pw.current)         { showToast("error", t("profile.currentPasswordRequired", "Enter your current password")); return; }
    if (pw.newPw.length < 6) { showToast("error", t("profile.passwordTooShort", "New password must be at least 6 characters")); return; }
    if (pw.newPw !== pw.confirm) { showToast("error", t("errors.passwordMismatch", "Passwords do not match")); return; }
    setPwSaving(true);
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.newPw });
      setPw({ current: "", newPw: "", confirm: "" });
      showToast("success", t("profile.passwordChanged", "Password changed successfully!"));
    } catch (err) {
      showToast("error", err.message || t("errors.networkError", "Failed to change password"));
    } finally { setPwSaving(false); }
  };

  const handleSaveNotifs = () => {
    localStorage.setItem("childwatch_notif_prefs", JSON.stringify(notifPrefs));
    showToast("success", t("profile.preferencessaved", "Notification preferences saved!"));
  };

  const initials = (form.fullName || "U")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const fieldClass = `w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-700 rounded-xl outline-none ${accent.focus} bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50`;
  const labelClass = "block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

  const TABS = [
    { id: "info",    label: t("profile.editProfile",    "Profile Info"),       icon: User  },
    { id: "security",label: t("profile.changePassword", "Security"),           icon: Lock  },
    { id: "notif",   label: t("common.notifications",   "Notifications"),      icon: Bell  },
  ];

  return (
    <div className="max-w-xl space-y-6">
      <Toast type={toast.type} msg={toast.msg} onClose={() => setToast({ type: "", msg: "" })} />

      {/* Header */}
      <div>
        <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-white">
          {t("profile.myProfile", "My Profile")}
        </h2>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
          {t("profile.profileSubtitle", "Manage your account information and preferences")}
        </p>
      </div>

      {/* Avatar card */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800`}>
        <div className="relative">
          <div className={`w-16 h-16 rounded-full ${accent.light} ring-4 ${accent.ring} flex items-center justify-center text-2xl font-extrabold ${accent.text}`}>
            {loading ? "…" : initials}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Camera className="w-3 h-3 text-slate-500" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {loading
            ? <div className="space-y-2"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-32" /><div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-20" /></div>
            : <>
              <p className="text-[16px] font-extrabold text-slate-900 dark:text-white truncate">{form.fullName || "—"}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{form.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {liveProfile?.role && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${accent.light} ${accent.text}`}>
                    <Shield className="w-3 h-3" />{liveProfile.role}
                  </span>
                )}
                {liveProfile?.district && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3 h-3" />{liveProfile.district}
                  </span>
                )}
              </div>
            </>
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
        {TABS.map(tab2 => (
          <button key={tab2.id} onClick={() => setTab(tab2.id)}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-all",
              tab === tab2.id
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
            ].join(" ")}>
            <tab2.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:block">{tab2.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Profile Info ── */}
      {tab === "info" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {t("profile.personalInfo", "Personal Information")}
          </p>

          <div>
            <label className={labelClass}>{t("profile.fullName", "Full Name")} *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.fullName} onChange={set("fullName")} disabled={loading}
                className={fieldClass + " pl-10"} placeholder={t("profile.fullName", "Full Name")} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("auth.email", "Email")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.email} disabled
                className={fieldClass + " pl-10 cursor-not-allowed opacity-60"} />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {t("profile.emailReadonly", "Email cannot be changed. Contact admin if needed.")}
            </p>
          </div>

          <div>
            <label className={labelClass}>{t("auth.phone", "Phone Number")}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.phone} onChange={set("phone")} disabled={loading}
                className={fieldClass + " pl-10"} placeholder="+250 7XX XXX XXX" />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("auth.district", "District")}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={form.district} onChange={set("district")} disabled={loading}
                className={fieldClass + " pl-10 appearance-none"}>
                <option value="">— {t("profile.selectDistrict", "Select district")} —</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("profile.role", "Role")}</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={liveProfile?.role || liveProfile?.accountType || ""} disabled
                className={fieldClass + " pl-10 cursor-not-allowed opacity-60"} />
            </div>
          </div>

          <button onClick={handleSaveProfile} disabled={saving || loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] text-white transition-all ${accent.pill} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}>
            {saving ? t("common.loading", "Saving…") : t("profile.updateProfile", "Save Profile")}
          </button>
        </div>
      )}

      {/* ── Tab: Security / Change Password ── */}
      {tab === "security" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {t("profile.changePassword", "Change Password")}
          </p>

          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-700 dark:text-amber-300 leading-relaxed">
              {t("profile.passwordTip", "Use a strong password with at least 6 characters mixing letters, numbers and symbols.")}
            </p>
          </div>

          {[
            { key: "current", label: t("profile.currentPassword", "Current Password") },
            { key: "newPw",   label: t("profile.newPassword",     "New Password")     },
            { key: "confirm", label: t("profile.confirmNewPassword","Confirm New Password") },
          ].map(f => (
            <div key={f.key}>
              <label className={labelClass}>{f.label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPw[f.key] ? "text" : "password"}
                  value={pw[f.key]}
                  onChange={setPwField(f.key)}
                  className={fieldClass + " pl-10 pr-10"}
                  placeholder="••••••••"
                />
                <button type="button"
                  onClick={() => setShowPw(s => ({ ...s, [f.key]: !s[f.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showPw[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <button onClick={handleChangePassword} disabled={pwSaving}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] text-white transition-all ${accent.pill} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}>
            {pwSaving ? t("common.loading", "Changing…") : t("profile.changePassword", "Change Password")}
          </button>
        </div>
      )}

      {/* ── Tab: Notification Preferences ── */}
      {tab === "notif" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {t("profile.notificationPrefs", "Notification Preferences")}
          </p>

          {NOTIF_OPTIONS.map(opt => (
            <label key={opt.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl cursor-pointer">
              <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{opt.label}</p>
              <div
                onClick={() => setNotifPrefs(n => ({ ...n, [opt.key]: !n[opt.key] }))}
                className={[
                  "w-12 h-6 rounded-full relative cursor-pointer transition-colors shrink-0",
                  notifPrefs[opt.key] !== false ? accent.pill : "bg-slate-300 dark:bg-slate-600",
                ].join(" ")}>
                <div className={[
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                  notifPrefs[opt.key] !== false ? "translate-x-6" : "",
                ].join(" ")} />
              </div>
            </label>
          ))}

          <button onClick={handleSaveNotifs}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] text-white transition-all ${accent.pill} hover:opacity-90`}>
            {t("common.save", "Save Preferences")}
          </button>
        </div>
      )}
    </div>
  );
}
