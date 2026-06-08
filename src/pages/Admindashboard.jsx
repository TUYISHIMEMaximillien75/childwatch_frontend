// AdminDashboard.jsx — Childwatch Admin Panel
// Stack: React + Tailwind CSS + lucide-react
// No external chart lib needed — uses inline SVG bar/line charts

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, FolderOpen, Bell, BarChart3,
  Paperclip, Search, FileDown, Settings, ScrollText, Shield,
  ChevronDown, ChevronRight, Menu, X, Plus, Edit2, Trash2,
  Eye, Download, Lock, Power, RefreshCw, Filter, ArrowUpDown,
  AlertTriangle, CheckCircle2, Clock, XCircle, MapPin, User,
  Phone, Mail, Calendar, TrendingUp, Activity, Zap, Flag,
  MoreVertical, LogOut, ArrowRight, ChevronUp, Info, Star,
  Hash, Database, Sun, Moon
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { clearAuthSession, getAuthProfile } from "../utils/authStorage";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import ProfilePage from "../components/ProfilePage";
import {
  createManagedUser,
  deleteManagedUser,
  getManagedUserById,
  getManagedUsers,
  setManagedUserActive,
  updateManagedUser,
} from "../services/adminUsersApi";
import { getAdminReports, updateAdminReportStatus } from "../services/adminReportsApi";
import { assignCase, updateCasePriority } from "../services/caseApi";
import { fetchAuditLogs } from "../services/adminAuditApi";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../services/notificationApi";
import {
  fetchAdminStats,
  fetchAdminAnalytics,
  fetchAdminAlerts,
  sendAdminAlert,
  fetchAdminEvidence,
  deleteEvidence,
  downloadExport,
  fetchAdminInstitutions,
  fetchAdminInstitutionById,
  createAdminInstitution,
  updateAdminInstitution,
  deleteAdminInstitution,
} from "../services/adminExtendedApi";

// ── Constants ────────────────────────────────────────────────────

const ROLE_COLORS = {
  "Police":          "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Hospital":        "bg-green-50 text-green-700 border-green-200",
  "Social Worker":   "bg-teal-50 text-teal-700 border-teal-200",
  "Parent/Reporter": "bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
};

const STATUS_COLORS = {
  urgent:        "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30",
  high:          "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30",
  medium:        "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30",
  "under-review":"bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30",
  resolved:      "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30",
  submitted: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/30 dark:text-slate-400 dark:border-slate-600",
  verified: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30",
  "under-investigation": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
};

const NAV_ITEMS = [
  { id:"dashboard",    labelKey:"nav.dashboard",    defaultLabel:"Dashboard",        icon:LayoutDashboard },
  { id:"users",        labelKey:"nav.users",        defaultLabel:"User Management",  icon:Users           },
  { id:"institutions", labelKey:"nav.institutions", defaultLabel:"Institutions",     icon:Building2       },
  { id:"cases",        labelKey:"nav.cases",        defaultLabel:"Case Management",  icon:FolderOpen      },
  { id:"alerts",       labelKey:"nav.alerts",       defaultLabel:"Alerts & Emergency",icon:Bell           },
  { id:"analytics",    labelKey:"nav.analytics",    defaultLabel:"Analytics",        icon:BarChart3       },
  { id:"evidence",     labelKey:"nav.evidence",     defaultLabel:"Evidence",         icon:Paperclip       },
  { id:"search",       labelKey:"nav.search",       defaultLabel:"Advanced Search",  icon:Search          },
  { id:"reports",      labelKey:"nav.reports",      defaultLabel:"Reports & Export", icon:FileDown        },
  { id:"audit",        labelKey:"nav.audit",        defaultLabel:"Audit Logs",       icon:ScrollText      },
];

// ── Reusable components ──────────────────────────────────────────

function Badge({ children, color = "blue" }) {
  const map = {
    blue:   "bg-yellow-50 text-yellow-700 border border-yellow-200",
    green:  "bg-green-50 text-green-700 border border-green-200",
    red:    "bg-red-50 text-red-700 border border-red-200",
    amber:  "bg-amber-50 text-amber-700 border border-amber-200",
    slate:  "bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${map[color]}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, delta, color }) {
  const up = delta?.startsWith("+");
  const colors = {
    blue:  { bg:"bg-yellow-50",  icon:"text-yellow-600",  ring:"ring-yellow-100"  },
    green: { bg:"bg-green-50", icon:"text-green-600", ring:"ring-green-100" },
    amber: { bg:"bg-amber-50", icon:"text-amber-600", ring:"ring-amber-100" },
    red:   { bg:"bg-red-50",   icon:"text-red-500",   ring:"ring-red-100"   },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} ring-4 ${c.ring} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <span className={`text-[12px] font-semibold ${up ? "text-green-600" : "text-red-500"}`}>{delta}</span>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-[16px] font-extrabold text-slate-800 dark:text-slate-200">{title}</h2>
        {sub && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Btn({ children, variant = "primary", size = "sm", onClick, className = "" }) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all active:scale-[0.97]";
  const sizes = { sm: "px-3 py-1.5 text-[12px]", md: "px-4 py-2 text-[13px]" };
  const variants = {
    primary:  "bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm",
    green:    "bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm",
    outline:  "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300",
    danger:   "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
    ghost:    "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100",
  };
  return (
    <button onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function TableWrap({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
      <table className="w-full text-[13px]">{children}</table>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 ${className}`}>{children}</td>;
}

// ── Mini bar chart ───────────────────────────────────────────────
function BarChart({ data, color = "#2563EB" }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-20 w-full">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{ height: `${(v / max) * 72}px`, background: color, opacity: i === data.length - 1 ? 1 : 0.55 }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Mini donut chart ─────────────────────────────────────────────
function DonutChart({ segments }) {
  // segments: [{value, color, label}]
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circ;
          const gap = circ - dash;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ}
              strokeLinecap="butt"
            />
          );
          offset += frac;
          return el;
        })}
        <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1F2937">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-[12px] text-slate-600 dark:text-slate-400">{s.label}</span>
            <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 ml-auto">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SECTIONS ──────────────────────────────────────────────────────

function DashboardSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminStats()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = data ? [
    { label: "Total Reports",    value: data.stats.total.toLocaleString(),    icon: FolderOpen,    delta: "", color: "blue"  },
    { label: "Missing Children", value: data.stats.missing.toLocaleString(),  icon: AlertTriangle, delta: "", color: "amber" },
    { label: "Abuse Cases",      value: data.stats.abuse.toLocaleString(),    icon: Flag,          delta: "", color: "red"   },
    { label: "Resolved Cases",   value: data.stats.resolved.toLocaleString(), icon: CheckCircle2,  delta: "", color: "green" },
    { label: "Active Users",     value: data.stats.activeUsers.toLocaleString(), icon: Users,      delta: "", color: "blue"  },
    { label: "Active Cases",     value: data.stats.active.toLocaleString(),   icon: Activity,      delta: "", color: "amber" },
  ] : [];

  const monthly   = data?.monthlyData || Array(12).fill(0);
  const districts = data?.districts   || [];
  const maxCases  = districts.length ? Math.max(...districts.map(d => d.cases), 1) : 1;
  const recent    = data?.recentCases || [];

  return (
    <div className="space-y-6">
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error} — showing sample data</div>}
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm animate-pulse h-28" />
            ))
          : stats.map(s => <StatCard key={s.label} {...s} />)
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Monthly trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[14px] font-extrabold text-slate-800 dark:text-slate-200">Monthly Case Trends</p>
              <p className="text-[12px] text-slate-400">Jan – Dec (last 12 months)</p>
            </div>
            <Badge color="blue">Live Data</Badge>
          </div>
          <BarChart data={monthly} />
          <div className="flex justify-between mt-2">
            {["J","F","M","A","M","J","J","A","S","O","N","D"].map((m, i) => (
              <span key={i} className="text-[10px] text-slate-400 flex-1 text-center">{m}</span>
            ))}
          </div>
        </div>

        {/* Case breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="text-[14px] font-extrabold text-slate-800 dark:text-slate-200 mb-4">Case Breakdown</p>
          <DonutChart segments={[
            { value: data?.stats.missing  || 0, color: "#2563EB", label: "Missing"  },
            { value: data?.stats.abuse    || 0, color: "#DC2626", label: "Abuse"    },
            { value: data?.stats.resolved || 0, color: "#16A34A", label: "Resolved" },
            { value: data?.stats.active   || 0, color: "#F59E0B", label: "Active"   },
          ]} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Cases by district */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="text-[14px] font-extrabold text-slate-800 dark:text-slate-200 mb-4">Cases by District</p>
          <div className="space-y-3">
            {districts.map(d => (
              <div key={d.name}>
                <div className="flex justify-between text-[12px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  <span>{d.name}</span><span className="font-bold text-slate-800 dark:text-slate-200">{d.cases}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full bg-yellow-500 transition-all" style={{ width: `${(d.cases / maxCases) * 100}%` }} />
                </div>
              </div>
            ))}
            {districts.length === 0 && <p className="text-[12px] text-slate-400 text-center py-4">No district data yet</p>}
          </div>
        </div>

        {/* Recent cases */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <SectionHeader title="Recent Cases" action={<Badge color="green">Live</Badge>} />
          <div className="space-y-2 mt-3">
            {recent.slice(0,6).map(c => (
              <div key={c.caseId || c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${c.status==="resolved"?"bg-green-500":c.status==="urgent"?"bg-red-500":"bg-yellow-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{c.child}</p>
                  <p className="text-[11px] text-slate-400">{c.caseId || c.id} · {c.district}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_COLORS[c.status]||STATUS_COLORS.submitted}`}>
                  {c.status?.replace("-"," ")}
                </span>
              </div>
            ))}
            {recent.length === 0 && <p className="text-[12px] text-slate-400 text-center py-4">No cases yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersSection() {
  const EMPTY_FORM = {
    fullName: "",
    email: "",
    phone: "",
    role: "Police",
    district: "Gasabo",
    password: "",
  };

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formError, setFormError] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getManagedUsers();
      setUsers(data.users || []);
    } catch (error) {
      setFormError(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (roleFilter === "All" || u.role === roleFilter) &&
      (u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  });

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUserId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openViewOrEdit = async (id, mode) => {
    try {
      setFormError("");
      const data = await getManagedUserById(id);
      setModalMode(mode);
      setSelectedUserId(id);
      setForm({
        fullName: data.user.fullName || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        role: data.user.role || "Police",
        district: data.user.district || "Gasabo",
        password: "",
      });
      setShowModal(true);
    } catch (error) {
      setFormError(error.message || "Failed to fetch user");
    }
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.role || !form.district) {
      setFormError("Full name, email, role and district are required");
      return;
    }

    if (modalMode === "create" && !form.password) {
      setFormError("Password is required for new users");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      if (modalMode === "create") {
        await createManagedUser({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          district: form.district,
          password: form.password,
        });
      } else if (modalMode === "edit" && selectedUserId) {
        await updateManagedUser(selectedUserId, {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          district: form.district,
          password: form.password || undefined,
        });
      }

      setShowModal(false);
      setForm(EMPTY_FORM);
      await loadUsers();
    } catch (error) {
      setFormError(error.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this user permanently?");
    if (!confirmDelete) return;

    try {
      await deleteManagedUser(id);
      await loadUsers();
    } catch (error) {
      setFormError(error.message || "Failed to delete user");
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await setManagedUserActive(user.id, user.status !== "active");
      await loadUsers();
    } catch (error) {
      setFormError(error.message || "Failed to update user status");
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="User Management"
        sub={`${users.length} users registered`}
        action={<Btn onClick={openCreateModal}><Plus className="w-3.5 h-3.5" /> Add User</Btn>}
      />

      {formError && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {formError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white dark:bg-slate-900"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-800 rounded-xl outline-none bg-white dark:bg-slate-900 focus:border-blue-400">
          {["All","Police","Hospital","Social Worker","Parent/Reporter"].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <TableWrap>
        <thead>
          <tr><Th>User</Th><Th>Role</Th><Th>District</Th><Th>Status</Th><Th>Created</Th><Th>Actions</Th></tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 text-center" colSpan={6}>Loading users...</td>
            </tr>
          )}
          {!loading && filtered.length === 0 && (
            <tr>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 text-center" colSpan={6}>No users found</td>
            </tr>
          )}
          {filtered.map(u => (
            <tr key={u.id} className="hover:bg-slate-50 dark:bg-slate-800/30 transition-colors">
              <Td>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-yellow-700 font-bold text-[12px]">
                    {u.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-[13px]">{u.fullName}</p>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </div>
                </div>
              </Td>
              <Td><span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${ROLE_COLORS[u.role]||""}`}>{u.role}</span></Td>
              <Td><span className="text-[12px]">{u.district}</span></Td>
              <Td>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${u.status==="active"?"bg-green-50 text-green-700 border-green-200":"bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.status==="active"?"bg-green-500":"bg-slate-400"}`} />
                  {u.status}
                </span>
              </Td>
              <Td><span className="text-[12px] text-slate-400">{formatDate(u.createdAt)}</span></Td>
              <Td>
                <div className="flex items-center gap-1">
                  <Btn variant="ghost" onClick={() => openViewOrEdit(u.id, "view")}><Eye className="w-3.5 h-3.5" /></Btn>
                  <Btn variant="ghost" onClick={() => openViewOrEdit(u.id, "edit")}><Edit2 className="w-3.5 h-3.5" /></Btn>
                  <Btn variant="ghost" onClick={() => handleToggleActive(u)}><Power className="w-3.5 h-3.5" /></Btn>
                  <Btn variant="danger" onClick={() => handleDelete(u.id)}><Trash2 className="w-3.5 h-3.5" /></Btn>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-extrabold text-slate-800 dark:text-slate-200">
                {modalMode === "create" ? "Add New User" : modalMode === "edit" ? "Edit User" : "View User"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {[["Full Name","fullName","text"],["Email","email","email"],["Phone","phone","text"]].map(([lbl,key,type]) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{lbl}</label>
                  <input
                    type={type}
                    value={form[key]}
                    disabled={modalMode === "view"}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-800 dark:text-amber-500 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
                </div>
              ))}
              {[["Role","role",["Police","Hospital","Social Worker","Parent/Reporter"]],
                ["District","district",["Gasabo","Kicukiro","Nyarugenge","Bugesera","Gatsibo","Kayonza","Kirehe","Ngoma","Nyagatare","Rwamagana","Burera","Gakenke","Gicumbi","Musanze","Rulindo","Gisagara","Huye","Kamonyi","Muhanga","Nyamagabe","Nyamasheke","Nyanza","Ruhango","Karongi","Ngororero","Nyabihu","Rubavu","Rutsiro","Rusizi"]]].map(([lbl,key,opts]) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{lbl}</label>
                  <select
                    value={form[key]}
                    disabled={modalMode === "view"}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 dark:text-amber-500 text-[13px] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-400 bg-white dark:bg-slate-900">
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {modalMode !== "view" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Password {modalMode === "edit" ? "(optional)" : ""}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={modalMode === "edit" ? "Leave blank to keep old password" : "Set login password"}
                    className="w-full px-3 dark:text-amber-500 py-2.5 text-[13px] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Btn variant="outline" size="md" onClick={() => setShowModal(false)} className="flex-1 justify-center">Cancel</Btn>
              {modalMode !== "view" && (
                <Btn variant="primary" size="md" onClick={handleSubmit} className="flex-1 justify-center">
                  {submitting ? "Saving..." : modalMode === "create" ? "Create User" : "Save Changes"}
                </Btn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const INST_EMPTY = {
  name: "", type: "Police", district: "Gasabo", address: "", phone: "", email: "", contactPerson: "", status: "active"
};

function InstitutionModal({ mode, institution, onClose, onSaved }) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";
  const [form, setForm] = useState(
    institution
      ? { name: institution.name || "", type: institution.type || "Police", district: institution.district || "Gasabo",
          address: institution.address || "", phone: institution.phone || "", email: institution.email || "",
          contactPerson: institution.contact_person || "", status: institution.status || "active" }
      : { ...INST_EMPTY }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.name.trim() || !form.type || !form.district) {
      setError("Name, type, and district are required"); return;
    }
    try {
      setSaving(true); setError("");
      if (isCreate) await createAdminInstitution(form);
      else if (isEdit) await updateAdminInstitution(institution.id, form);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 text-[13px] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-500/10 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900 dark:text-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20 dark:border-white/5">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/20">
          <div>
            <h3 className="text-[18px] font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              {isCreate ? "Register New Institution" : isEdit ? "Edit Institution Details" : "Institution Profile"}
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
              {isCreate ? "Add a partner facility to the network." : "Manage existing institution information."}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Full Width Name */}
            <div className="md:col-span-2">
              <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">Institution Name *</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input disabled={isView} value={form.name} onChange={e => setForm({...form, name:e.target.value})}
                  className={`${inputClass} pl-11`} placeholder="e.g. Kigali Central Hospital" />
              </div>
            </div>

            {/* Type & District */}
            <div>
              <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">Facility Type *</label>
              <select disabled={isView} value={form.type} onChange={e => setForm({...form, type:e.target.value})} className={inputClass}>
                {["Police", "Hospital", "Social Worker", "NGO"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">District *</label>
              <select disabled={isView} value={form.district} onChange={e => setForm({...form, district:e.target.value})} className={inputClass}>
                {["Gasabo","Kicukiro","Nyarugenge","Bugesera","Gatsibo","Kayonza","Kirehe","Ngoma","Nyagatare","Rwamagana","Burera","Gakenke","Gicumbi","Musanze","Rulindo","Gisagara","Huye","Kamonyi","Muhanga","Nyamagabe","Nyamasheke","Nyanza","Ruhango","Karongi","Ngororero","Nyabihu","Rubavu","Rutsiro","Rusizi"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Contact Details */}
            <div>
              <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input disabled={isView} value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} className={`${inputClass} pl-11`} placeholder="+250 788 000 000" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input disabled={isView} value={form.email} onChange={e => setForm({...form, email:e.target.value})} className={`${inputClass} pl-11`} placeholder="contact@institution.rw" />
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">Contact Person</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input disabled={isView} value={form.contactPerson} onChange={e => setForm({...form, contactPerson:e.target.value})} className={`${inputClass} pl-11`} placeholder="Dr. John Doe" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">Operational Status</label>
              <select disabled={isView} value={form.status} onChange={e => setForm({...form, status:e.target.value})} className={inputClass}>
                {["active","maintenance","inactive"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Full Width Address */}
            <div className="md:col-span-2">
              <label className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">Physical Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                <textarea disabled={isView} value={form.address} onChange={e => setForm({...form, address:e.target.value})} rows={2} className={`${inputClass} pl-11 resize-none py-3.5`} placeholder="Street name, Sector, Cell..." />
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-[13px] text-red-600 dark:text-red-400 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
            {isView ? "Close" : "Cancel"}
          </button>
          {!isView && (
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-[13px] font-bold text-slate-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2">
              {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : isCreate ? <><CheckCircle2 className="w-4 h-4" /> Register</> : <><CheckCircle2 className="w-4 h-4" /> Save Changes</>}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function InstitutionsSection() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // {mode, institution}
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const d = await fetchAdminInstitutions();
      setInstitutions(d.institutions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this institution?")) return;
    try { await deleteAdminInstitution(id); await load(); } catch(e) { setError(e.message); }
  };

  const filtered = institutions.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.district.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-yellow-500" /> Institution Network
          </h2>
          <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Manage partner facilities, hospitals, and police stations.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-yellow-500 transition-colors" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or district..." 
              className="w-full md:w-64 pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[13px] font-medium rounded-2xl outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-500/10 transition-all dark:text-slate-200"
            />
          </div>
          <button 
            onClick={() => setModal({mode:"create", institution:null})}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-5 py-3 rounded-2xl text-[13px] font-bold shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Register New
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-[13px] font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_,i) => (
            <div key={i} className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-pulse h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl py-24 text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-[18px] font-extrabold text-slate-800 dark:text-slate-200 mb-1">No Institutions Found</h3>
          <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-6 max-w-sm">There are no facilities matching your search criteria, or none have been registered yet.</p>
          <button onClick={() => setModal({mode:"create", institution:null})} className="text-yellow-600 dark:text-yellow-500 font-bold text-[14px] hover:underline flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add your first institution
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(inst => (
            <div key={inst.id} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden">
              
              {/* Type Accent Strip */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${inst.type==="Police"?"bg-blue-500":inst.type==="Hospital"?"bg-green-500":inst.type==="NGO"?"bg-purple-500":"bg-yellow-500"}`} />

              <div className="flex justify-between items-start mb-5 mt-1">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner
                  ${inst.type==="Police"?"bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400":
                    inst.type==="Hospital"?"bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400":
                    inst.type==="NGO"?"bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400":
                    "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400"}`}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border
                  ${inst.status==="active"?"bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20":
                    inst.status==="maintenance"?"bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20":
                    "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}`}>
                  {inst.status}
                </div>
              </div>

              <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-slate-100 mb-1.5 line-clamp-1" title={inst.name}>{inst.name}</h3>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400 font-medium mb-4">
                <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{inst.district}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 mx-1" />
                <span>{inst.type}</span>
              </div>

              {/* Stats Bar */}
              <div className="flex bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 mb-5 mt-auto border border-slate-100 dark:border-slate-800">
                <div className="flex-1 text-center border-r border-slate-200 dark:border-slate-700">
                  <p className="text-[18px] font-black text-slate-800 dark:text-slate-200">{inst.users_count}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Users</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[18px] font-black text-slate-800 dark:text-slate-200">{inst.cases_count}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cases</p>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-3 gap-2 mt-auto">
                <button onClick={() => setModal({mode:"view",institution:inst})} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => setModal({mode:"edit",institution:inst})} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(inst.id)} className="flex items-center justify-center py-2 rounded-xl text-red-500 hover:text-white bg-red-50 hover:bg-red-500 dark:bg-red-500/10 dark:hover:bg-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <InstitutionModal mode={modal.mode} institution={modal.institution} onClose={() => setModal(null)} onSaved={load} />
      )}
    </div>
  );
}

function CasesSection() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminReports({ status: statusFilter, q: search.trim() });
      setReports(data.reports || []);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    getManagedUsers().then(d => setUsers(d.users || [])).catch(() => {});
  }, [statusFilter, search]);

  const handleStatusUpdate = async (reportId, status) => {
    try {
      setUpdatingId(reportId);
      await updateAdminReportStatus(reportId, status);
      setReports((items) => items.map((item) => (item.id === reportId ? { ...item, status } : item)));
    } catch (updateError) {
      setError(updateError.message || "Failed to update case status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePriorityUpdate = async (caseId, priority) => {
    try {
      await updateCasePriority(caseId, priority);
      setReports(items => items.map(item => item.caseId === caseId ? { ...item, priority } : item));
    } catch (err) {
      setError(err.message || "Failed to update priority");
    }
  };

  const handleAssign = async (caseId, userId) => {
    if (!userId) return;
    try {
      await assignCase(caseId, parseInt(userId, 10));
      const user = users.find(u => String(u.id) === String(userId));
      setReports(items => items.map(item => item.caseId === caseId ? { ...item, assignedTo: user?.fullName || "Assigned" } : item));
    } catch (err) {
      setError(err.message || "Failed to assign case");
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
  };

  const [viewCase, setViewCase] = useState(null);

  // Only Police, Hospital, Social Worker can be assigned cases
  const assignableUsers = users.filter(u =>
    ["Police", "Hospital", "Social Worker"].includes(u.role)
  );

  const formatStatus = (s) =>
    s ? s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "—";

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Case Management — Global View"
        sub={`${reports.length} total cases`}
        action={<Btn variant="outline" onClick={loadReports}><RefreshCw className="w-3.5 h-3.5" /> Refresh</Btn>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by child name or case ID…"
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-yellow-400 bg-white dark:bg-slate-900 dark:text-slate-300" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-800 rounded-xl outline-none bg-white dark:bg-slate-900 dark:text-slate-300">
          {["All","submitted","verified","under-investigation","resolved"].map(s =>
            <option key={s} value={s}>{formatStatus(s)}</option>
          )}
        </select>
      </div>

      {error && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>
      )}

      <TableWrap>
        <thead>
          <tr>
            <Th>Case ID</Th>
            <Th>Type</Th>
            <Th>Child</Th>
            <Th>District</Th>
            <Th>Priority</Th>
            <Th>Status</Th>
            <Th>Assigned To</Th>
            <Th>Date</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-400 text-[13px]" colSpan={9}>
                <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />Loading cases…
              </td>
            </tr>
          )}
          {!loading && reports.length === 0 && (
            <tr>
              <td className="px-4 py-10 text-center text-slate-400 text-[13px]" colSpan={9}>
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No cases found</p>
              </td>
            </tr>
          )}
          {!loading && reports.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">

              {/* Case ID */}
              <Td>
                <span className="font-mono text-[12px] text-yellow-600 dark:text-yellow-400 font-bold">
                  {c.caseId}
                </span>
              </Td>

              {/* Type */}
              <Td>
                <Badge color={c.type === "Missing" ? "blue" : "red"}>{c.type}</Badge>
              </Td>

              {/* Child */}
              <Td>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{c.child || "—"}</span>
              </Td>

              {/* District */}
              <Td>
                <span className="text-[12px]">{c.district || "—"}</span>
              </Td>

              {/* Priority — inline dropdown */}
              <Td>
                <select
                  value={c.priority || "medium"}
                  onChange={e => handlePriorityUpdate(c.caseId, e.target.value)}
                  className="px-2 py-1 text-[11px] font-semibold border rounded-lg bg-white dark:bg-slate-900 dark:text-slate-300 outline-none cursor-pointer
                    border-slate-200 dark:border-slate-700 focus:border-yellow-400"
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </Td>

              {/* Status — inline dropdown with colour badge preview */}
              <Td>
                <select
                  value={c.status}
                  disabled={updatingId === c.id}
                  onChange={e => handleStatusUpdate(c.id, e.target.value)}
                  className={`px-2 py-1 text-[11px] font-bold border rounded-lg outline-none cursor-pointer
                    bg-white dark:bg-slate-900 dark:text-slate-300
                    border-slate-200 dark:border-slate-700 focus:border-yellow-400
                    ${updatingId === c.id ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {["submitted","verified","under-investigation","resolved"].map(s => (
                    <option key={s} value={s}>{formatStatus(s)}</option>
                  ))}
                </select>
                {updatingId === c.id && (
                  <span className="ml-1 text-[10px] text-slate-400">saving…</span>
                )}
              </Td>

              {/* Assign — restricted to Police, Hospital, Social Worker only */}
              <Td>
                {assignableUsers.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">No staff available</span>
                ) : (
                  <select
                    value={users.find(u => u.fullName === c.assignedTo)?.id || ""}
                    onChange={e => handleAssign(c.caseId, e.target.value)}
                    className="px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded-lg
                      bg-white dark:bg-slate-900 dark:text-slate-300 outline-none max-w-[160px] cursor-pointer
                      focus:border-yellow-400"
                  >
                    <option value="">
                      {c.assignedTo ? `✓ ${c.assignedTo}` : "— Assign to —"}
                    </option>
                    {assignableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} · {u.role}
                      </option>
                    ))}
                  </select>
                )}
              </Td>

              {/* Date */}
              <Td>
                <span className="text-[12px] text-slate-400 whitespace-nowrap">
                  {formatDate(c.createdAt)}
                </span>
              </Td>

              {/* Actions */}
              <Td>
                <Btn variant="ghost" onClick={() => setViewCase(c)} title="View Case Details">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[11px]">View</span>
                </Btn>
              </Td>

            </tr>
          ))}
        </tbody>
      </TableWrap>

      {/* ── Case Detail Modal ─────────────────────────────────── */}
      {viewCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Case Details</p>
                <h3 className="text-[16px] font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                  {viewCase.caseId}
                </h3>
              </div>
              <button onClick={() => setViewCase(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status badge at top */}
            <div className="mb-4">
              <span className={`px-3 py-1 rounded-lg text-[12px] font-bold border ${STATUS_COLORS[viewCase.status] || STATUS_COLORS.submitted}`}>
                {formatStatus(viewCase.status)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Child Name",    viewCase.child || "—"],
                  ["Age",           viewCase.age   || "—"],
                  ["Gender",        viewCase.gender || "—"],
                  ["Report Type",   viewCase.type],
                  ["District",      viewCase.district || "—"],
                  ["Priority",      formatStatus(viewCase.priority || "medium")],
                  ["Assigned To",   viewCase.assignedTo || "Unassigned"],
                  ["Date Reported", formatDate(viewCase.createdAt)],
                  ["Anonymous",     viewCase.anonymous ? "Yes" : "No"],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{label}</p>
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Location</p>
                <p className="text-[13px] text-slate-700 dark:text-slate-300">{viewCase.location || "—"}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Description</p>
                <p className="text-[13px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {viewCase.description || "—"}
                </p>
              </div>
              
              {/* Images / Evidence */}
              {viewCase.images && viewCase.images.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Attached Evidence</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {viewCase.images.map((img, i) => {
                      const src = img.startsWith('http') ? img : `https://childwatch-backend.onrender.com${img.startsWith('/') ? '' : '/'}${img}`;
                      return (
                        <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                          <img src={src} alt="Evidence" className="w-full h-24 object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <Btn variant="outline" size="md" onClick={() => setViewCase(null)} className="flex-1 justify-center">Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function AlertsSection() {
  const [alertType, setAlertType] = useState("Police");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = () => {
    setLoadingHistory(true);
    fetchAdminAlerts()
      .then(d => setHistory(d.alerts || []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSend = async () => {
    if (!msg.trim()) { setSendError("Message is required"); return; }
    try {
      setSending(true);
      setSendError("");
      await sendAdminAlert(alertType, msg.trim());
      setSendSuccess(`Alert sent to ${alertType}!`);
      setMsg("");
      loadHistory();
      setTimeout(() => setSendSuccess(""), 3000);
    } catch (e) {
      setSendError(e.message || "Failed to send alert");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Alert & Emergency System" sub="Trigger and broadcast alerts to response teams" />
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Compose */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-red-600" />
            </div>
            <p className="font-extrabold text-slate-800 dark:text-slate-200">Broadcast Alert</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Send to</label>
              <div className="flex flex-wrap gap-2">
                {["Police","Hospitals","Social Workers","All Users"].map(t => (
                  <button key={t} onClick={() => setAlertType(t)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all
                      ${alertType===t?"bg-yellow-500 text-white border-yellow-600":"bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Message</label>
              <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4} placeholder="Type your alert message…"
                className="w-full px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-400 resize-none bg-white dark:bg-slate-900 dark:text-slate-400" />
            </div>
            {sendError && <p className="text-[12px] text-red-600">{sendError}</p>}
            {sendSuccess && <p className="text-[12px] text-green-600 font-semibold">{sendSuccess}</p>}
            <Btn variant="primary" size="md" className="w-full justify-center" onClick={handleSend}>
              {sending ? "Sending…" : <><Zap className="w-4 h-4" /> Send Emergency Alert</>}
            </Btn>
          </div>
        </div>
        {/* History */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="font-extrabold text-slate-800 dark:text-slate-200 mb-4">Alert History</p>
          {loadingHistory && <p className="text-[12px] text-slate-400 py-4 text-center">Loading…</p>}
          <div className="space-y-3">
            {!loadingHistory && history.length === 0 && (
              <p className="text-[12px] text-slate-400 text-center py-4">No alerts sent yet</p>
            )}
            {history.map((a, i) => (
              <div key={a.id || i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                  <Bell className="w-3.5 h-3.5 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">→ {a.sent_to}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">{a.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400">{new Date(a.sent_at).toLocaleDateString()}</p>
                  <Badge color="green">{a.status || "delivered"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminAnalytics()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis || {};
  const monthly = data?.monthlyData || Array(12).fill(0);
  const typeDist = data?.typeDistribution || [];
  const COLORS = ["#2563EB","#DC2626","#16A34A","#F59E0B","#8B5CF6"];

  return (
    <div className="space-y-5">
      <SectionHeader title="Analytics & Reports" sub="System-wide performance overview — live data" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_,i) => <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm animate-pulse h-28" />)
          : [
              { label:"Resolution Rate",    value: kpis.resolutionRate   || "—", icon:TrendingUp, color:"green", delta:"" },
              { label:"Reports This Month", value: String(kpis.reportsThisMonth ?? "—"), icon:Activity, color:"blue", delta:"" },
              { label:"Active Cases",       value: String(kpis.activeCases      ?? "—"), icon:Flag,     color:"amber",delta:"" },
              { label:"Total Reports",      value: String(kpis.totalReports     ?? "—"), icon:FolderOpen,color:"blue",delta:"" },
            ].map(s => <StatCard key={s.label} {...s} />)
        }
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="font-extrabold text-slate-800 dark:text-slate-200 mb-4">Monthly Case Volume</p>
          <BarChart data={monthly.length ? monthly : Array(12).fill(0)} />
          <div className="flex justify-between mt-2">
            {["J","F","M","A","M","J","J","A","S","O","N","D"].map(m=>(
              <span key={m} className="text-[10px] text-slate-400 flex-1 text-center">{m}</span>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="font-extrabold text-slate-800 dark:text-slate-200 mb-4">Type Distribution</p>
          {typeDist.length > 0
            ? <DonutChart segments={typeDist.map((t,i) => ({ value:t.value, color:COLORS[i%COLORS.length], label:t.label }))} />
            : <p className="text-[12px] text-slate-400 text-center py-8">No data yet</p>
          }
        </div>
      </div>
    </div>
  );
}

function EvidenceSection() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetchAdminEvidence()
      .then(d => setFiles(d.attachments || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this file permanently?")) return;
    try {
      await deleteEvidence(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Evidence Management"
        sub={`${files.length} files uploaded across all cases`}
        action={<Btn variant="outline" onClick={load}><RefreshCw className="w-3.5 h-3.5" /> Refresh</Btn>}
      />
      {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
      <TableWrap>
        <thead><tr><Th>Case ID</Th><Th>File Name</Th><Th>Type</Th><Th>Uploaded By</Th><Th>Date</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {loading && (
            <tr><td className="px-4 py-6 text-center text-slate-400 text-[13px]" colSpan={6}>Loading evidence…</td></tr>
          )}
          {!loading && files.length === 0 && (
            <tr><td className="px-4 py-6 text-center text-slate-400 text-[13px]" colSpan={6}>No evidence files uploaded yet</td></tr>
          )}
          {files.map(f => (
            <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <Td><span className="font-mono text-[12px] text-yellow-600 font-bold">{f.case_id}</span></Td>
              <Td><span className="text-[13px] font-medium">{f.file_name}</span></Td>
              <Td><Badge color={f.file_type==="image"?"blue":f.file_type==="video"?"amber":"green"}>{f.file_type}</Badge></Td>
              <Td><span className="text-[12px] text-slate-500 dark:text-slate-400">{f.uploaded_by_name}</span></Td>
              <Td><span className="text-slate-400 text-[12px]">{new Date(f.uploaded_at).toLocaleDateString()}</span></Td>
              <Td>
                <div className="flex gap-1">
                  <Btn variant="ghost" onClick={() => window.open(f.file_url, "_blank")}><Eye className="w-3.5 h-3.5" /></Btn>
                  <Btn variant="ghost" onClick={() => { const a=document.createElement('a');a.href=f.file_url;a.download=f.file_name;a.click(); }}><Download className="w-3.5 h-3.5" /></Btn>
                  <Btn variant="danger" onClick={() => handleDelete(f.id)}><Trash2 className="w-3.5 h-3.5" /></Btn>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}

function SearchSection() {
  const [q, setQ] = useState("");
  const [by, setBy] = useState("Child Name");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!q.trim()) return;
    try {
      setLoading(true);
      setError("");
      const data = await getAdminReports({ q: q.trim() });
      setResults(data.reports || []);
      setSearched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Advanced Search" sub="Search across all cases, users, and reports" />
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select value={by} onChange={e=>setBy(e.target.value)}
            className="px-3 py-2.5 text-[13px] border border-slate-200 dark:border-slate-800 rounded-xl outline-none bg-white dark:bg-slate-900 shrink-0">
            {["Child Name","Case ID","Location","District"].map(b=><option key={b}>{b}</option>)}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={q}
              onChange={e=>setQ(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && handleSearch()}
              placeholder={`Search by ${by.toLowerCase()}…`}
              className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-400 bg-white dark:bg-slate-900" />
          </div>
          <Btn variant="primary" size="md" onClick={handleSearch}>
            {loading ? "Searching…" : <><Search className="w-4 h-4" /> Search</>}
          </Btn>
        </div>
        {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
        {!searched && !q && (
          <div className="text-center py-12 text-slate-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-[13px]">Type a term and press Search</p>
          </div>
        )}
        {searched && results.length === 0 && (
          <p className="text-center py-8 text-[13px] text-slate-400">No cases found for "{q}"</p>
        )}
        {results.length > 0 && (
          <TableWrap>
            <thead><tr><Th>Case ID</Th><Th>Type</Th><Th>Child</Th><Th>District</Th><Th>Status</Th><Th>Date</Th></tr></thead>
            <tbody>
              {results.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <Td><span className="font-mono text-[12px] text-yellow-600 font-bold">{c.caseId}</span></Td>
                  <Td><Badge color={c.type==="Missing"?"blue":"red"}>{c.type}</Badge></Td>
                  <Td>
                    <span className="font-semibold tracking-wide">
                      {c.child}
                    </span>
                  </Td>
                  <Td>{c.district}</Td>
                  <Td><span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${STATUS_COLORS[c.status]||STATUS_COLORS.submitted}`}>{c.status}</span></Td>
                  <Td><span className="text-[12px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span></Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>
    </div>
  );
}

function ExportsSection() {
  const [downloading, setDownloading] = useState("");

  const handleDownload = async (type, format) => {
    const key = `${type}-${format}`;
    try {
      setDownloading(key);
      await downloadExport(type, format);
    } catch (e) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setDownloading("");
    }
  };

  const exports = [
    { title:"Monthly Report",    sub:"Full case summary for current month",  icon:Calendar,  type:"monthly"  },
    { title:"District Report",   sub:"Cases grouped by district",            icon:MapPin,    type:"district" },
    { title:"Case Summary",      sub:"Detailed case-by-case breakdown",      icon:FolderOpen,type:"cases"    },
    { title:"User Activity",     sub:"All registered users export",          icon:Users,     type:"users"    },
    { title:"Audit Logs",        sub:"Full system audit trail",              icon:ScrollText,type:"audit"    },
    { title:"Custom Export",     sub:"All cases — no date filter",           icon:Filter,    type:"cases"    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Reports & Export" sub="Generate and download system reports as CSV" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exports.map(r => (
          <div key={r.title} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center mb-3">
              <r.icon className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-1">{r.title}</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">{r.sub}</p>
            <div className="flex gap-2">
              <Btn
                variant="outline" className="flex-1 justify-center"
                onClick={() => handleDownload(r.type, "csv")}>
                {downloading===`${r.type}-csv` ? "Downloading…" : <><FileDown className="w-3.5 h-3.5" /> CSV</>}
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function AuditSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs().then(data => {
      setLogs(data.logs || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const TYPE_COLORS = {
    delete:      "bg-red-50 text-red-600",
    create:      "bg-green-50 text-green-600",
    update:      "bg-yellow-50 text-yellow-600",
    assign:      "bg-teal-50 text-teal-600",
    login:       "bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400",
    upload_file: "bg-blue-50 text-blue-600",
    broadcast_alert: "bg-red-50 text-red-600",
  };

  const getTypeKey = (action) => {
    if (!action) return "update";
    const a = action.toLowerCase();
    if (a.includes("delete") || a.includes("delet")) return "delete";
    if (a.includes("create") || a.includes("creat") || a.includes("register")) return "create";
    if (a.includes("assign")) return "assign";
    if (a.includes("login")) return "login";
    if (a.includes("upload")) return "upload_file";
    if (a.includes("alert") || a.includes("broadcast")) return "broadcast_alert";
    return "update";
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Audit Logs" sub="Full trail of all system actions" />
      <TableWrap>
        <thead><tr><Th>#</Th><Th>User</Th><Th>Action</Th><Th>Target</Th><Th>Time</Th><Th>Type</Th></tr></thead>
        <tbody>
          {loading ? (
            <tr><Td colSpan="6" className="text-center py-4 text-slate-500 dark:text-slate-400">Loading audit logs...</Td></tr>
          ) : logs.length === 0 ? (
            <tr><Td colSpan="6" className="text-center py-4 text-slate-400">No audit logs yet</Td></tr>
          ) : logs.map(l => (
            <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <Td><span className="font-mono text-[11px] text-slate-400">#{l.id}</span></Td>
              <Td><span className="font-semibold text-[13px]">{l.user_name || l.user}</span></Td>
              <Td>{l.action}</Td>
              <Td><span className="font-mono text-[12px] text-yellow-600">{l.record_id || l.target || "—"}</span></Td>
              <Td><span className="text-[12px] text-slate-400">{new Date(l.created_at || l.time).toLocaleString()}</span></Td>
              <Td>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  TYPE_COLORS[getTypeKey(l.action)] || TYPE_COLORS.update
                }`}>{getTypeKey(l.action)}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ── Notification Bell ─────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const TYPE_ICON = {
    assignment: "📋",
    update: "🔔",
    alert: "🚨",
    resolved: "✅",
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[13px] font-extrabold text-slate-800 dark:text-slate-200">
                Notifications {unread > 0 && <span className="ml-1 text-[11px] bg-red-100 text-red-600 rounded-full px-1.5 py-0.5">{unread} new</span>}
              </p>
              {unread > 0 && (
                <button onClick={handleMarkAll} className="text-[11px] text-yellow-600 hover:underline font-semibold">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
              {loading && (
                <div className="py-6 text-center text-[12px] text-slate-400">Loading…</div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="py-8 text-center text-[12px] text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No notifications yet
                </div>
              )}
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${!n.is_read ? "bg-yellow-50/60 dark:bg-yellow-900/10" : ""}`}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                >
                  <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] leading-snug ${!n.is_read ? "font-semibold text-slate-800 dark:text-slate-200" : "text-slate-600 dark:text-slate-400"}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 bg-yellow-500 rounded-full shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { setOpen(false); load(); }} className="w-full text-[11px] text-slate-400 hover:text-slate-600 text-center">
                Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const profile = getAuthProfile();
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  const SECTIONS = {
    dashboard: <DashboardSection />,
    users:     <UsersSection />,
    institutions:<InstitutionsSection />,
    cases:     <CasesSection />,
    alerts:    <AlertsSection />,
    analytics: <AnalyticsSection />,
    evidence:  <EvidenceSection />,
    search:    <SearchSection />,
    reports:   <ExportsSection />,
    audit:     <AuditSection />,
    profile:   <ProfilePage accentColor="blue" />,
  };

  const { t } = useTranslation();
  const currentNav = NAV_ITEMS.find(n => n.id === active);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">

      {/* ── Sidebar ── */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 xl:w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col
          transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

          {/* Logo */}
          <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[14px] font-extrabold text-yellow-700">Childwatch</p>
                <p className="text-[10px] text-slate-400 font-medium">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button key={item.id} onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all
                    ${isActive
                      ? "bg-yellow-500 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/30 hover:text-slate-900 dark:text-white"}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {t(item.labelKey, item.defaultLabel)}
                </button>
              );
            })}
          </nav>

          {/* Admin badge */}
          <div className="px-4 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-[11px] font-bold text-yellow-700">
                  {(profile?.fullName || "Admin").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{profile?.fullName || "Admin User"}</p>
                <p className="text-[10px] text-slate-400">{profile?.role || "Super Admin"}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 dark:text-slate-400"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </aside>
      </>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50 relative">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-[14px] font-extrabold text-slate-800 dark:text-slate-200">
                {currentNav ? t(currentNav.labelKey, currentNav.defaultLabel) : ""}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <LanguageSwitcher />
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationBell />
            <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors" title="Logout">
              <span className="text-[11px] font-bold text-yellow-700">
                {(profile?.fullName || "Admin").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {SECTIONS[active]}
        </main>
      </div>
    </div>
  );
}


