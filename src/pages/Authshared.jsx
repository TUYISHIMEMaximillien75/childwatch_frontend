// AuthShared.jsx — shared components for Login.jsx & Register.jsx
// Usage: import { BrandPanel, Field, MobileTopBar, Spinner } from "./AuthShared";

import { Shield, Bell, Users, FileText, MapPin, AlertCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 ${className}`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

// ── Brand panel — left column on desktop ──────────────────────────
export function BrandPanel({ mode }) {
  const features = [
    { icon: <Shield   className="w-4 h-4" />, text: "Secure & confidential reporting"   },
    { icon: <Bell     className="w-4 h-4" />, text: "Real-time alerts to authorities"   },
    { icon: <Users    className="w-4 h-4" />, text: "Multi-agency child protection"     },
    { icon: <FileText className="w-4 h-4" />, text: "Track your case progress"          },
  ];

  return (
    <div
      className="hidden lg:flex flex-col justify-between relative overflow-hidden min-h-screen w-full px-10 py-12 bg-brand-gradient dark:bg-premium-dark-gradient"
    >
      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white leading-none">Childwatch</p>
            <p className="text-[11px] text-white/60 font-medium tracking-wide mt-0.5">Protect · Report · Respond</p>
          </div>
        </div>
      </div>

      {/* Copy */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full px-3 py-1.5 text-[11px] font-semibold mb-6 w-fit">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-white" />
          Rwanda Child Protection Platform
        </div>

        <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.15] mb-4">
          {mode === "login" ? "Welcome back to Childwatch" : "Join the Childwatch network"}
        </h2>
        <p className="text-[14px] text-white/80 leading-[1.8] max-w-sm">
          {mode === "login"
            ? "Sign in to access your dashboard, track case progress, and coordinate with protection agencies."
            : "Create your account to report cases, receive alerts, and work with Rwanda's child protection institutions."}
        </p>

        {/* Feature list */}
        <div className="mt-8 space-y-3">
          {features.map((f) => (
            <div key={f.text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0">
                {f.icon}
              </div>
              <span className="text-[13px] text-white/80 font-medium">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live case preview card */}
      <div className="relative z-10">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[11px] font-semibold text-white/80">Case active — #CW-2026-00124</span>
          </div>
          <p className="text-[13px] font-semibold text-white mb-1">Missing child report</p>
          <div className="flex items-center gap-3 text-[11px] text-white/50 mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Kigali, Gasabo
            </span>
            <span>·</span>
            <span>2 hours ago</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-1.5 bg-white rounded-full" style={{ width: "65%" }} />
          </div>
          <p className="text-[11px] text-white/50 mt-1.5">Response in progress · Authorities notified</p>
        </div>
      </div>
    </div>
  );
}

// ── Mobile sticky top bar ─────────────────────────────────────────
export function MobileTopBar({ href, linkLabel, linkText }) {
  return (
    <div
      className="lg:hidden flex items-center justify-between px-5 py-4 sticky top-0 z-40 bg-white/95 border-b border-slate-100 backdrop-blur dark:bg-slate-900/95 dark:border-slate-800"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-extrabold text-slate-900 dark:text-white">Childwatch</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle className="h-9 w-9" />
        <a href={href} className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white">
          {linkText}{" "}
          <span className="font-bold text-yellow-700 dark:text-amber-500">{linkLabel}</span>
        </a>
      </div>
    </div>
  );
}

// ── Form field ────────────────────────────────────────────────────
export function Field({ label, type = "text", placeholder, icon: Icon, value, onChange, error, suffix }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-bold text-slate-500 tracking-widest uppercase dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none dark:text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} ${suffix ? "pr-11" : "pr-4"} py-3 text-[14px] rounded-xl border transition-all outline-none
            ${error
              ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:focus:ring-red-500/10"
              : "border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:focus:border-blue-400 dark:focus:ring-blue-500/10"
            } text-slate-800 placeholder-slate-400 dark:text-slate-200 dark:placeholder-slate-500`}
        />
        {suffix && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-[12px] text-red-500 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
