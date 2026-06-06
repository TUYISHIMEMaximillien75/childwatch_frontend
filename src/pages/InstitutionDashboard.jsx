// InstitutionAdminDashboard.jsx — Childwatch Institution Admin Panel (Live Data)
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, FolderOpen, CheckCircle2, Clock,
  BarChart3, Bell, Shield, Building2, Menu, LogOut, Plus,
  Edit2, Download, Send, FileText, Activity, Settings,
  ArrowRightLeft, AlertTriangle, Lock, RefreshCw, TrendingUp, X,
} from "lucide-react";
import { clearAuthSession, getAuthProfile } from "../utils/authStorage";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ProfilePage from "../components/ProfilePage";
import {
  getInstitutionStats,
  getInstitutionStaff,
  getInstitutionCases,
  getInstitutionMonthly,
  getInstitutionLogs,
} from "../services/institutionApi";

/* ── nav ── */
const NAV = [
  { id: "dashboard",   label: "Dashboard",            icon: LayoutDashboard },
  { id: "staff",       label: "Staff Management",     icon: Users           },
  { id: "cases",       label: "Institution Cases",    icon: FolderOpen      },
  { id: "assign",      label: "Assign Cases",         icon: ArrowRightLeft  },
  { id: "performance", label: "Staff Performance",    icon: BarChart3       },
  { id: "activity",    label: "Activity Logs",        icon: Activity        },
  { id: "permissions", label: "Permissions",          icon: Lock            },
  { id: "reports",     label: "Reports & Export",     icon: FileText        },
  { id: "settings",    label: "Institution Settings", icon: Settings        },
];

/* ── shared atoms ── */
function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

function StatCard({ label, value, icon: Icon, color, loading }) {
  const palette = {
    blue:  "bg-yellow-50 text-yellow-600 ring-yellow-100",
    green: "bg-green-50 text-green-600 ring-green-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    red:   "bg-red-50 text-red-500 ring-red-100",
  };
  const cls = palette[color] || palette.blue;
  const [bg, ic, ring] = cls.split(" ");
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${bg} ring-4 ${ring} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${ic}`} />
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{loading ? "—" : value}</p>
      <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function Btn({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false }) {
  const V = {
    primary: "bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm",
    outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
    danger:  "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
    ghost:   "text-slate-500 hover:bg-slate-100",
  }[variant];
  const S = { sm: "px-3 py-1.5 text-[12px]", md: "px-4 py-2.5 text-[13px]" }[size];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 ${V} ${S} ${className}`}>
      {children}
    </button>
  );
}

function SectionTitle({ title, sub, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-[17px] font-extrabold text-slate-900">{title}</h2>
        {sub && <p className="text-[12px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm transition-all"
          style={{ height: `${(v / max) * 56}px`, background: i === data.length - 1 ? "#2563EB" : "#BFDBFE" }} />
      ))}
    </div>
  );
}

/* ── Dashboard section ── */
function DashboardView({ stats, staff, pending, monthly, statsLoading, onNav, profile }) {
  const STAT_CARDS = [
    { label: "Total Staff",         value: stats.totalStaff,        icon: Users,         color: "blue"  },
    { label: "Cases Handled",       value: stats.casesHandled,      icon: FolderOpen,    color: "blue"  },
    { label: "Open Cases",          value: stats.openCases,         icon: Clock,         color: "amber" },
    { label: "Closed Cases",        value: stats.closedCases,       icon: CheckCircle2,  color: "green" },
    { label: "Pending Assignments", value: stats.pendingAssignments,icon: ArrowRightLeft,color: "amber" },
    { label: "Monthly Cases",       value: stats.monthlyCases,      icon: BarChart3,     color: "green" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-yellow-600 rounded-2xl px-6 py-5 text-white">
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-yellow-500 rounded-full opacity-50 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-green-500 rounded-full opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-blue-200 mb-1">Institution Administrator</p>
            <h2 className="text-[20px] font-extrabold">{profile?.fullName || "Institution Admin"}</h2>
            <p className="text-[13px] text-blue-200 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />{profile?.district || "Your"} Institution · {profile?.role}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onNav("staff")} className="flex items-center gap-2 px-4 py-2.5 bg-white text-yellow-700 font-bold text-[13px] rounded-xl hover:bg-yellow-50">
              <Users className="w-4 h-4" />Manage Staff
            </button>
            <button onClick={() => onNav("assign")} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/30 text-white font-bold text-[13px] rounded-xl hover:bg-white/20">
              <ArrowRightLeft className="w-4 h-4" />Assign Cases
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAT_CARDS.map(s => <StatCard key={s.label} {...s} loading={statsLoading} />)}
      </div>

      {/* Chart + Staff + Pending */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Monthly chart */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="font-extrabold text-slate-800">Monthly Case Summary</p>
              <span className="text-[11px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">Last 12 months</span>
            </div>
            <BarChart data={monthly.length ? monthly : Array(12).fill(0)} />
            <div className="flex justify-between mt-2">
              {["J","F","M","A","M","J","J","A","S","O","N","D"].map(m => (
                <span key={m} className="text-[9px] text-slate-400 flex-1 text-center">{m}</span>
              ))}
            </div>
          </div>

          {/* Staff overview */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="font-extrabold text-slate-800">Staff Overview</p>
              <button onClick={() => onNav("staff")} className="text-[12px] font-semibold text-yellow-600">Manage →</button>
            </div>
            {staff.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No staff found for your institution.</p>
            ) : (
              <div className="space-y-2">
                {staff.slice(0, 4).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-extrabold text-yellow-700">
                        {(s.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-400">{s.role}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      s.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>{s.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Pending assignments */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="font-extrabold text-slate-800 mb-4">Pending Assignments</p>
            {pending.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No pending assignments.</p>
            ) : (
              <div className="space-y-3">
                {pending.slice(0, 3).map(p => (
                  <div key={p.id} className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="font-mono text-[10px] text-amber-600 font-bold">{p.caseId}</p>
                    <p className="text-[12px] font-bold text-slate-800">{p.child}</p>
                    <p className="text-[11px] text-slate-500">{p.type} · {p.district}</p>
                    <button onClick={() => onNav("assign")} className="mt-2 text-[11px] font-bold text-yellow-600 hover:text-yellow-800">Assign →</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile card */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
            <p className="font-extrabold text-yellow-800 mb-3">Institution Profile</p>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-yellow-600">Role</span><span className="font-bold text-yellow-900">{profile?.role}</span></div>
              <div className="flex justify-between"><span className="text-yellow-600">District</span><span className="font-bold text-yellow-900">{profile?.district}</span></div>
              <div className="flex justify-between"><span className="text-yellow-600">Staff</span><span className="font-bold text-yellow-900">{stats.activeStaff || 0} active</span></div>
              <div className="flex justify-between"><span className="text-yellow-600">Status</span><span className="font-bold text-green-700">Operational</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Staff section ── */
function StaffView({ staff, loading }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Staff Management"
        sub={loading ? "Loading…" : `${staff.length} staff members in your district`}
        action={<Btn onClick={() => setShowModal(true)}><Plus className="w-3.5 h-3.5" />Add Staff</Btn>}
      />
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
          <Users className="w-12 h-12" />
          <p className="text-sm">No staff found for your institution.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map(s => (
            <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-[13px] font-extrabold text-yellow-700">
                  {(s.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-800">{s.name}</p>
                <p className="text-[12px] text-slate-400">{s.role} · {s.email} · Joined {s.joinedAt ? new Date(s.joinedAt).toLocaleDateString() : "—"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  s.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-500 border-slate-200"
                }`}>{s.status}</span>
                <Btn variant="ghost"><Edit2 className="w-3.5 h-3.5" /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-extrabold text-slate-800">Add Staff Member</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-5">New staff members must be created by an admin with a specified role and district. Contact your system administrator to add new accounts.</p>
            <Btn variant="outline" size="md" onClick={() => setShowModal(false)} className="w-full justify-center">Close</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Cases section ── */
function CasesView({ cases, loading }) {
  const statusColor = s => ({
    submitted: "bg-yellow-50 text-yellow-700",
    verified: "bg-emerald-50 text-emerald-700",
    "under-investigation": "bg-blue-50 text-blue-700",
    resolved: "bg-green-50 text-green-700",
  }[s?.toLowerCase()] || "bg-slate-100 text-slate-600");

  return (
    <div className="space-y-5">
      <SectionTitle title="Institution Cases" sub={loading ? "Loading…" : `${cases.length} case${cases.length!==1?"s":""} assigned to your institution`} />
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
          <FolderOpen className="w-12 h-12" />
          <p className="text-sm">No cases have been assigned to your institution staff yet.</p>
          <p className="text-xs text-slate-300">Cases are assigned by the admin and visible here once your staff are assigned.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {["Case ID","Type","Child","District","Status","Urgency","Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-yellow-700 font-semibold text-xs">{c.caseId}</td>
                    <td className="px-4 py-3">{c.type}</td>
                    <td className="px-4 py-3">{c.child}</td>
                    <td className="px-4 py-3">{c.district}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusColor(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${c.urgency === "critical" ? "text-red-600" : c.urgency === "urgent" ? "text-amber-600" : "text-slate-400"}`}>
                        {c.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Assign section ── */
function AssignView({ pending, staff, loading }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Assign Cases Internally" sub="Assign pending cases to active staff members" />
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
          <CheckCircle2 className="w-12 h-12" />
          <p className="text-sm">No pending cases to assign.</p>
        </div>
      ) : (
        pending.map(p => (
          <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] text-yellow-600 font-bold">{p.caseId}</span>
                <h3 className="text-[15px] font-extrabold text-slate-900 mt-0.5">{p.child}</h3>
                <p className="text-[12px] text-slate-400">{p.type} · {p.district}</p>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">Unassigned</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Assign to staff member</label>
              <select className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-white">
                <option value="">Select staff member…</option>
                {staff.filter(s => s.status === "active").map(s => (
                  <option key={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
            <Btn variant="primary"><Send className="w-3.5 h-3.5" />Assign Case</Btn>
          </div>
        ))
      )}
    </div>
  );
}

/* ── Performance section ── */
function PerformanceView({ staff, totalCases, loading }) {
  const max = Math.max(...staff.map(() => 1), 1);
  return (
    <div className="space-y-5">
      <SectionTitle title="Staff Performance" sub="Case handling metrics per staff member" />
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : staff.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">No staff data available.</p>
      ) : (
        <div className="space-y-3">
          {staff.map(s => (
            <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-[12px] font-extrabold text-yellow-700">
                    {(s.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-slate-800">{s.name}</p>
                  <p className="text-[12px] text-slate-400">{s.role} · {s.status}</p>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-2 rounded-full bg-yellow-500" style={{ width: "40%" }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Joined {s.joinedAt ? new Date(s.joinedAt).toLocaleDateString() : "—"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Activity section ── */
function ActivityView({ logs, loading }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Activity Logs" sub="Recent actions in your institution district" />
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">No activity logs found.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l, i) => (
            <div key={l.id || i} className="flex gap-3 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-slate-800">{l.action}</p>
                <p className="text-[11px] text-slate-400 font-mono">{l.details} · {l.time ? new Date(l.time).toLocaleString() : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Permissions section (static — role config) ── */
function PermissionsView({ profile }) {
  const perms = [
    { role: "Police Officer",    can: ["View cases", "Update status", "Add notes", "Upload evidence"] },
    { role: "Social Worker",     can: ["View cases", "Update status", "Add notes", "Schedule follow-ups"] },
    { role: "Healthcare Provider", can: ["View cases", "Add medical notes", "Upload reports"] },
  ];
  return (
    <div className="space-y-5">
      <SectionTitle title="Permissions Management" sub="What each role can do in the system" />
      {perms.map(p => (
        <div key={p.role} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-extrabold text-slate-800">{p.role}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${profile?.role === p.role ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500"}`}>
              {profile?.role === p.role ? "Your role" : "Peer role"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.can.map(c => (
              <span key={c} className="px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-[12px] font-semibold">
                <CheckCircle2 className="w-3 h-3 inline mr-1" />{c}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Reports section ── */
function ReportsView() {
  return (
    <div className="space-y-5">
      <SectionTitle title="Reports & Export" />
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { t: "Institution Case Report",  s: "All cases handled by institution",    i: FolderOpen  },
          { t: "Staff Activity Report",     s: "Staff login and action history",      i: Users       },
          { t: "Monthly Summary",           s: "Month-by-month case breakdown",       i: BarChart3   },
          { t: "Performance Analysis",      s: "Staff efficiency metrics",            i: TrendingUp  },
        ].map(r => (
          <div key={r.t} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center mb-3">
              <r.i className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 mb-1">{r.t}</h3>
            <p className="text-[12px] text-slate-500 mb-4">{r.s}</p>
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

/* ── Settings section ── */
function SettingsView({ profile }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Institution Settings" />
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <p className="font-extrabold text-slate-800">Institution Profile</p>
        {[
          ["Full Name", profile?.fullName || ""],
          ["Role / Department", profile?.role || ""],
          ["District", profile?.district || ""],
          ["Email", profile?.email || ""],
        ].map(([lbl, val]) => (
          <div key={lbl}>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{lbl}</label>
            <input defaultValue={val} readOnly
              className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl outline-none bg-slate-50 text-slate-600 cursor-not-allowed" />
          </div>
        ))}
        <p className="text-xs text-slate-400">To update institution details, contact your system administrator.</p>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function InstitutionAdminDashboard() {
  const navigate = useNavigate();
  const profile = getAuthProfile();

  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats]     = useState({});
  const [staff, setStaff]     = useState([]);
  const [cases, setCases]     = useState([]);
  const [pending, setPending] = useState([]);
  const [monthly, setMonthly] = useState(Array(12).fill(0));
  const [logs, setLogs]       = useState([]);

  const [statsLoading, setStatsLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(true);
  const [logsLoading, setLogsLoading]   = useState(true);

  useEffect(() => {
    // Stats
    getInstitutionStats()
      .then(d => setStats(d.stats || {}))
      .catch(() => {})
      .finally(() => setStatsLoading(false));

    // Staff
    getInstitutionStaff()
      .then(d => setStaff(d.staff || []))
      .catch(() => {})
      .finally(() => setStaffLoading(false));

    // Cases
    getInstitutionCases()
      .then(d => {
        const all = d.cases || [];
        setCases(all);
        setPending(all.filter(c => c.status === "submitted"));
      })
      .catch(() => {})
      .finally(() => setCasesLoading(false));

    // Monthly
    getInstitutionMonthly()
      .then(d => setMonthly(d.monthly || Array(12).fill(0)))
      .catch(() => {});

    // Logs
    getInstitutionLogs()
      .then(d => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, []);

  const handleSignOut = () => { clearAuthSession(); navigate("/login"); };

  const cur = NAV.find(n => n.id === active);

  const SECTIONS = {
    dashboard:   <DashboardView stats={stats} staff={staff} pending={pending} monthly={monthly} statsLoading={statsLoading} onNav={setActive} profile={profile} />,
    staff:       <StaffView staff={staff} loading={staffLoading} />,
    cases:       <CasesView cases={cases} loading={casesLoading} />,
    assign:      <AssignView pending={pending} staff={staff} loading={casesLoading} />,
    performance: <PerformanceView staff={staff} totalCases={stats.casesHandled || 0} loading={staffLoading} />,
    activity:    <ActivityView logs={logs} loading={logsLoading} />,
    permissions: <PermissionsView profile={profile} />,
    reports:     <ReportsView />,
    settings:    <SettingsView profile={profile} />,
    profile:     <ProfilePage accentColor="purple" />,
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-100">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-yellow-600 flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-extrabold text-yellow-700">Childwatch</p>
            <p className="text-[10px] text-slate-400 font-medium">Institution Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV.map(item => {
          const Icon = item.icon;
          const isA = active === item.id;
          return (
            <button key={item.id} onClick={() => { setActive(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                isA ? "bg-yellow-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              }`}>
              <Icon className="w-4 h-4 shrink-0" />{item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pb-5 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-extrabold text-yellow-700">
              {(profile?.fullName || "I").split(" ").map(w => w[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-slate-800 truncate">{profile?.fullName || "Institution Admin"}</p>
            <p className="text-[10px] text-slate-400">{profile?.role}</p>
          </div>
          <button onClick={handleSignOut} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 xl:w-64 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {SidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50 relative">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-[14px] font-extrabold text-slate-800">{cur?.label}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button onClick={() => window.location.reload()} className="p-2 rounded-lg hover:bg-slate-100">
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-[11px] font-bold text-yellow-700">
                {(profile?.fullName || "I").split(" ").map(w => w[0]).join("").slice(0, 2)}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{SECTIONS[active]}</main>

        {/* Mobile bottom nav */}
        <div className="lg:hidden border-t border-slate-100 bg-white flex items-center justify-around px-1 py-2 shrink-0">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Home"   },
            { id: "staff",     icon: Users,           label: "Staff"  },
            { id: "assign",    icon: ArrowRightLeft,  label: "Assign" },
            { id: "cases",     icon: FolderOpen,      label: "Cases"  },
            { id: "settings",  icon: Settings,        label: "Settings"},
          ].map(item => {
            const Icon = item.icon;
            const isA = active === item.id;
            return (
              <button key={item.id} onClick={() => setActive(item.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl">
                <Icon className={`w-5 h-5 ${isA ? "text-yellow-700" : "text-slate-400"}`} />
                <span className={`text-[9px] font-bold ${isA ? "text-yellow-700" : "text-slate-400"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

