import { useMemo, useState, useEffect } from "react";
import { fetchPublicStats, fetchPublicReports, fetchDistrictStats } from "../services/publicApi";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe,
  HeartHandshake,
  Lock,
  MapPin,
  Menu,
  Phone,
  Search,
  Shield,
  ShieldAlert,
  Users,
  X,
  Sun,
  Moon,
  Download,
  Share2,
  PlusSquare,
} from "lucide-react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import heroImage from "../assets/childwatch_hero.png";
import communityPortalImage from "../assets/community_portal.png";
import parentReunionImage from "../assets/parent_reunion.png";
import communitySupportImage from "../assets/community_support.png";
import { useTheme } from "../contexts/ThemeContext";

const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "Reports", href: "#reports" },
  { label: "Alerts", href: "#alerts" },
  { label: "How it Works", href: "#how-it-works" },
];

const mockStats = [
  { label: "Missing Children", value: "342", trend: "+12 new reports", icon: Search, tone: "blue" },
  { label: "Abuse Reports", value: "189", trend: "41 verified this week", icon: ShieldAlert, tone: "red" },
  { label: "Active Investigations", value: "531", trend: "86 multi-agency cases", icon: Activity, tone: "amber" },
  { label: "Safe / Resolved", value: "753", trend: "+18% this month", icon: CheckCircle2, tone: "green" },
];

const mockRecentReports = [
  { id: "CW-2026-00124", type: "Missing child", district: "Gasabo", time: "18 min ago", status: "Urgent" },
  { id: "CW-2026-00125", type: "Physical abuse", district: "Kicukiro", time: "43 min ago", status: "Investigation" },
  { id: "CW-2026-00126", type: "Neglect concern", district: "Nyarugenge", time: "1 hr ago", status: "Pending" },
  { id: "CW-2026-00127", type: "Recovered child", district: "Musanze", time: "2 hrs ago", status: "Safe" },
];

const alerts = [
  { title: "Critical missing child alert", detail: "Community broadcast active in Gasabo sector.", level: "Urgent" },
  { title: "Hospital referral pending", detail: "Medical assessment due for case CW-2026-00125.", level: "Pending" },
  { title: "Case resolved", detail: "Child reunited with guardian after police verification.", level: "Safe" },
];

const mockDistricts = [
  { name: "Gasabo", value: 86, color: "#2563EB" },
  { name: "Kicukiro", value: 64, color: "#10B981" },
  { name: "Nyarugenge", value: 48, color: "#1E3A8A" },
  { name: "Musanze", value: 31, color: "#F59E0B" },
];

function toneClasses(tone) {
  const map = {
    blue:  "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
    amber: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
    red:   "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30",
  };
  return map[tone] || map.blue;
}

function statusClasses(status) {
  const map = {
    Safe:          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
    Investigation: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
    Urgent:        "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30",
    Pending:       "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30",
  };
  return map[status] || map.Pending;
}

/* ─── Navigation ─── */
function PublicNav({ open, onOpen, onClose }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="#home" className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm sm:h-10 sm:w-10 sm:rounded-2xl">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold leading-none text-blue-950 dark:text-white sm:text-base">Childwatch</p>
              <p className="mt-0.5 hidden text-[10px] font-semibold text-slate-500 dark:text-slate-400 min-[360px]:block sm:text-xs">
                Protect. Report. Respond.
              </p>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-bold text-slate-600 hover:text-blue-800 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 lg:flex">
            <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
              Staff Login
            </Link>
            <Link to="/report" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 transition-colors">
              Report Now
            </Link>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <Link to="/report" className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-red-700 transition-colors">
              Report
            </Link>
            <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-800 dark:text-slate-400" onClick={onOpen}>
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-label="Close navigation" />
          <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-900 text-white">
                  <Shield className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <span className="font-extrabold text-blue-950 dark:text-white">Childwatch</span>
              </div>
              <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" onClick={onClose}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  {item.label}
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
              ))}
            </nav>
            <div className="p-3 pt-0 grid gap-2">
              <Link to="/report" onClick={onClose} className="rounded-2xl bg-red-600 px-4 py-3 text-center text-sm font-extrabold text-white hover:bg-red-700 transition-colors">
                Report Missing or Abuse
              </Link>
              <a href="tel:116" className="rounded-2xl bg-blue-900 px-4 py-3 text-center text-sm font-extrabold text-white hover:bg-blue-950 transition-colors">
                Emergency Hotline 116
              </a>
              <Link to="/login" onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Stat Card ─── */
function StatCard({ item }) {
  const Icon = item.icon;
  return (
    <div className="rounded-2xl border border-slate-200 border-t-4 border-t-blue-600 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">{item.label}</p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">{item.value}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{item.trend}</p>
        </div>
        <div className={`shrink-0 rounded-2xl border p-2.5 sm:p-3 ${toneClasses(item.tone)}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}

/* ─── Community image ─── */
function FamilyIllustration() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-lg dark:bg-slate-900">
      <img
        src={communityPortalImage}
        alt="Childwatch community support"
        className="h-auto w-full rounded-xl object-cover aspect-[4/3]"
      />
    </div>
  );
}

/* ─── How it Works ─── */
function HowItWorks() {
  const steps = [
    {
      title: "1. See Something, Say Something",
      desc: "Anyone can submit an anonymous report with photos, location, and details via the mobile app or web portal.",
      icon: ShieldAlert,
      color: "blue"
    },
    {
      title: "2. Rapid Triage & Action",
      desc: "The system instantly notifies the nearest police unit and social workers, prioritizing urgent cases like missing children.",
      icon: Activity,
      color: "red"
    },
    {
      title: "3. Multi-Agency Collaboration",
      desc: "Police investigate while social workers provide care. All agencies share secure updates on the same case file.",
      icon: Users,
      color: "amber"
    },
    {
      title: "4. Safe Resolution",
      desc: "The child is recovered, placed in safe care, and the community is updated. The case is securely archived.",
      icon: CheckCircle2,
      color: "emerald"
    }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-xl font-extrabold text-slate-950 dark:text-white sm:text-2xl">How Childwatch Works</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
          Childwatch is designed to bridge the gap between vigilant community members and rapid-response authorities. Here is how a typical user journey unfolds to protect a child.
        </p>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const bgMap = {
            blue: "bg-blue-50 dark:bg-blue-900/30",
            red: "bg-red-50 dark:bg-red-900/30",
            amber: "bg-amber-50 dark:bg-amber-900/30",
            emerald: "bg-emerald-50 dark:bg-emerald-900/30"
          };
          const textMap = {
            blue: "text-blue-700 dark:text-blue-400",
            red: "text-red-700 dark:text-red-400",
            amber: "text-amber-700 dark:text-amber-400",
            emerald: "text-emerald-700 dark:text-emerald-400"
          };
          
          return (
            <div key={idx} className="relative">
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-full h-[2px] bg-slate-100 dark:bg-slate-800" />
              )}
              <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${bgMap[step.color]} relative z-10`}>
                <Icon className={`h-8 w-8 ${textMap[step.color]}`} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl bg-slate-50 p-6 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">Ready to help?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your report could save a child's life today.</p>
        </div>
        <Link to="/report" className="shrink-0 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white hover:bg-blue-800 transition-colors">
          Start a Report
        </Link>
      </div>
    </div>
  );
}

/* ─── Install Modal ─── */
function ManualInstallModal({ onClose }) {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <img src="/pwa-192x192.png" alt="App" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Install Childwatch</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add to your home screen</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {isIos ? "Follow these steps on Safari:" : "Follow these steps on Chrome:"}
          </p>
          <div className="space-y-3">
            {isIos ? (
              <>
                {[
                  ["Open this page in Safari (not Chrome)", null],
                  ["Tap the Share icon at the bottom of the screen", <Share2 key="s" className="inline h-4 w-4" />],
                  ['Scroll down and tap "Add to Home Screen"', <PlusSquare key="p" className="inline h-4 w-4" />],
                  ['Tap "Add" in the top right corner', null],
                ].map(([text, icon], i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white mt-0.5">{i + 1}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{text} {icon}</p>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  'Tap the ⋮ menu (3 dots) in the top-right corner of Chrome',
                  'Tap "Add to Home screen" or "Install app"',
                  'Tap "Install" or "Add" to confirm',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white mt-0.5">{i + 1}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{text}</p>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
              💡 For a one-tap install: access this site using <strong>https://</strong> at the start of the URL
            </p>
          </div>
        </div>
        <div className="p-4 pt-0 sm:p-5 sm:pt-0">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero ─── */
function LandingHero({ installPrompt, promptInstall }) {
  const [showManualInstall, setShowManualInstall] = useState(false);

  const handleInstallClick = async () => {
    if (installPrompt) {
      await promptInstall();
    } else {
      setShowManualInstall(true);
    }
  };

  return (
    <section id="home" className="relative overflow-hidden bg-white dark:bg-slate-900">
      {showManualInstall && <ManualInstallModal onClose={() => setShowManualInstall(false)} />}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/30" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:grid lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8 lg:py-16">

        {/* Left — text content */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
            <Lock className="h-3 w-3" />
            Secure child protection reporting
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Childwatch
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:mt-4 sm:text-base lg:text-lg">
            A trusted digital platform for reporting missing children and child abuse cases, built for rapid action, community safety, and compassionate response.
          </p>

          {/* CTA buttons — stacked on mobile, 2-col on sm+ */}
          <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:grid sm:grid-cols-2">
            <Link
              to="/report"
              className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-extrabold text-white shadow-sm hover:bg-red-700 transition-colors active:scale-[0.98]"
            >
              <ShieldAlert className="h-5 w-5 shrink-0" />
              Report Missing or Abuse
            </Link>
            <a
              href="tel:116"
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-900 px-5 py-4 text-sm font-extrabold text-white shadow-sm hover:bg-blue-950 transition-colors active:scale-[0.98]"
            >
              <Phone className="h-5 w-5 shrink-0" />
              Emergency Hotline 116
            </a>
            <button
              onClick={handleInstallClick}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-colors active:scale-[0.98] sm:col-span-2"
            >
              <Download className="h-5 w-5 shrink-0" />
              Install Mobile App
            </button>
          </div>

          {/* Stats strip */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
            {[
              ["24/7", "Community reporting"],
              ["1.4h", "Avg. response"],
              ["36", "Partners"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 sm:rounded-2xl sm:p-4">
                <p className="text-lg font-extrabold text-blue-950 dark:text-white sm:text-2xl">{value}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — hero image (hidden on mobile, visible sm+) */}
        <div className="relative mt-8 hidden sm:mt-0 sm:block">
          <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <div className="relative min-h-[280px] overflow-hidden rounded-2xl sm:min-h-[380px] lg:min-h-[460px]">
              <img src={heroImage} alt="Childwatch family and community protection" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="relative flex h-full min-h-[280px] flex-col justify-between gap-4 p-4 sm:min-h-[380px] sm:p-6 lg:min-h-[460px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-extrabold text-white backdrop-blur-md">
                    Community Response Active
                  </span>
                  <Globe className="h-5 w-5 shrink-0 text-white/80" />
                </div>
                <div className="mx-auto w-full max-w-sm">
                  <FamilyIllustration />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 sm:text-sm">Missing child alert</p>
                    <p className="mt-1 font-mono text-sm font-extrabold text-blue-700">CW-2026-00124</p>
                  </div>
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-3 shadow-sm sm:p-4">
                    <p className="text-xs font-bold text-red-700 sm:text-sm">Urgent review</p>
                    <p className="mt-1 text-xs font-semibold text-red-700 sm:text-sm">Authorities notified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Mobile report card (replaces table rows on small screens) ─── */
function ReportCard({ report }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-sm font-extrabold text-blue-700">{report.id}</p>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusClasses(report.status)}`}>
          {report.status}
        </span>
      </div>
      <p className="mt-2 font-semibold text-slate-800 dark:text-slate-200">{report.type}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>{report.district}</span>
        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span>{report.time}</span>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function ChildwatchPublicPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statsData, setStatsData] = useState(mockStats);
  const [reportsData, setReportsData] = useState(mockRecentReports);
  const [districtsData, setDistrictsData] = useState(mockDistricts);
  const { installPrompt, promptInstall } = useInstallPrompt();

  useEffect(() => {
    fetchPublicStats().then(data => {
      setStatsData([
        { label: "Missing Children", value: data.missing, trend: "Live update", icon: Search, tone: "blue" },
        { label: "Abuse Reports", value: data.abuse, trend: "Live update", icon: ShieldAlert, tone: "red" },
        { label: "Active Investigations", value: data.active, trend: "Live update", icon: Activity, tone: "amber" },
        { label: "Safe / Resolved", value: data.resolved, trend: "Live update", icon: CheckCircle2, tone: "green" },
      ]);
    }).catch(console.error);

    fetchPublicReports().then(data => {
      setReportsData(data.reports.map(r => ({
        id: r.caseId, type: r.type, district: r.district,
        time: new Date(r.reportedAt).toLocaleDateString(),
        status: r.status,
      })));
    }).catch(console.error);

    fetchDistrictStats().then(data => {
      const colors = ["#2563EB", "#10B981", "#1E3A8A", "#F59E0B", "#8B5CF6", "#EC4899", "#EF4444", "#3B82F6"];
      setDistrictsData(data.districts.map((d, i) => ({
        name: d.district, value: d.total, color: colors[i % colors.length],
      })));
    }).catch(console.error);
  }, []);

  const totalDistrictCases = useMemo(() => districtsData.reduce((sum, item) => sum + item.value, 0), [districtsData]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <PublicNav open={sidebarOpen} onOpen={() => setSidebarOpen(true)} onClose={() => setSidebarOpen(false)} />

      <main>
        <LandingHero installPrompt={installPrompt} promptInstall={promptInstall} />

        <div className="mx-auto max-w-7xl space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">

          {/* Overview */}
          <section id="overview" className="grid gap-4 sm:gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                    <Activity className="h-3.5 w-3.5" />
                    Live public safety overview
                  </span>
                  <h2 className="mt-4 text-xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-3xl">
                    Response dashboard for child protection teams.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    A concise operational view of missing child reports, abuse reports, active investigations, emergency alerts, and community reporting activity.
                  </p>
                  <div className="mt-4 flex flex-col gap-2.5 sm:grid sm:grid-cols-2 sm:mt-6">
                    <Link to="/report" className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-red-700 transition-colors">
                      <ShieldAlert className="h-5 w-5 shrink-0" />
                      Report Missing or Abuse
                    </Link>
                    <a href="tel:116" className="flex items-center justify-center gap-2 rounded-2xl bg-blue-900 px-4 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-950 transition-colors">
                      <Phone className="h-5 w-5 shrink-0" />
                      Emergency Hotline 116
                    </a>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <FamilyIllustration />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Community Reporting Portal</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">Open 24/7</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Anonymous reports, case tracking, photo evidence, and emergency escalation are available from any device.
                </p>
                <Link to="/report" className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-blue-700 dark:text-blue-400 hover:underline">
                  Start a report <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-3">
                  <HeartHandshake className="h-6 w-6 shrink-0 text-emerald-700" />
                  <p className="font-extrabold text-emerald-900">Child-centered response</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-emerald-800/80">
                  Built to feel calm and supportive while preserving the urgency needed for emergency response.
                </p>
              </div>
            </div>
          </section>

          {/* Mission & Impact */}
          <section id="impact" className="mt-8 sm:mt-12 grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30">
                <HeartHandshake className="h-3.5 w-3.5" /> Our Mission
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-950 dark:text-white sm:text-4xl lg:text-5xl tracking-tight">
                Reuniting Families, Restoring Hope
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                Every second counts when a child is missing or in danger. Childwatch empowers communities and authorities to act swiftly, turning anxious moments into tears of joy.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {statsData.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1 border-l-4 border-blue-600 pl-4 py-1">
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{item.value}</p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <img src={parentReunionImage} alt="Parent reunited with child" className="w-full aspect-[4/3] object-cover rounded-2xl" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl dark:border-emerald-500/20 dark:bg-slate-900 hidden sm:block">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-inner">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white">Community Driven</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Together we protect</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Community Support */}
          <section className="mt-20 sm:mt-28 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <img src={communitySupportImage} alt="Community support for children" className="w-full aspect-[4/3] object-cover rounded-2xl" />
              </div>
              <div className="absolute -top-6 -right-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-xl dark:border-blue-500/20 dark:bg-slate-900 hidden sm:block">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-inner">
                    <Shield className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white">Trusted Authorities</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Swift & safe action</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:pl-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30">
                <Users className="h-3.5 w-3.5" /> A Network of Care
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-950 dark:text-white sm:text-4xl lg:text-5xl tracking-tight">
                Bridging the Gap Between Citizens and Protectors
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                Our system ensures that the moment a report is submitted, the right professionals are alerted. Social workers, police, and medical personnel collaborate seamlessly to ensure every child is placed in a safe environment.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Secure and anonymous reporting for all citizens.",
                  "Instant notifications to the nearest authorities.",
                  "Dedicated tracking for recovered and vulnerable children."
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-base font-medium text-slate-700 dark:text-slate-300">{text}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-10">
                 <Link to="/report" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white px-6 py-4 text-sm font-extrabold text-white dark:text-slate-900 shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all">
                    See How It Works <ChevronRight className="w-4 h-4" />
                 </Link>
              </div>
            </div>
          </section>

          {/* How it Works */}
          <section id="how-it-works" className="mt-8">
            <HowItWorks />
          </section>

        </div>
      </main>
    </div>
  );
}