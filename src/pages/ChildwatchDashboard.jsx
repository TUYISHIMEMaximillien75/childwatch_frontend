import React, { useMemo, useState } from "react";
import {
  Bell,
  ShieldAlert,
  Search,
  Menu,
  X,
  Users,
  FileWarning,
  Siren,
  HeartHandshake,
  Hospital,
  UserCog,
  BarChart3,
  MapPin,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  MessageSquareWarning,
  Eye,
  ArrowUpRight,
  Filter,
  Download,
  Plus,
  Phone,
  UserCircle2,
} from "lucide-react";

const navItems = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "cases", label: "Cases", icon: FolderKanban },
  { key: "alerts", label: "Alerts", icon: ShieldAlert },
  { key: "users", label: "Users", icon: Users },
  { key: "institutions", label: "Institutions", icon: Hospital },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: UserCog },
];

const roleCards = [
  {
    role: "Public Reporter / Parent",
    icon: UserCircle2,
    color: "bg-yellow-50 text-yellow-700 border-blue-100",
    features: [
      "Report missing child",
      "Report abuse anonymously",
      "Track submitted case",
      "Upload photos and evidence",
      "Get notifications and updates",
    ],
  },
  {
    role: "Police Officer",
    icon: ShieldAlert,
    color: "bg-red-50 text-red-700 border-red-100",
    features: [
      "View assigned cases",
      "Update investigations",
      "Manage urgent cases",
      "Add suspect and recovery notes",
      "Generate investigation reports",
    ],
  },
  {
    role: "Social Worker",
    icon: HeartHandshake,
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    features: [
      "Review child welfare cases",
      "Schedule follow-ups",
      "Add assessments",
      "Refer to police or hospital",
      "Track child safety status",
    ],
  },
  {
    role: "Healthcare Provider",
    icon: Hospital,
    color: "bg-cyan-50 text-cyan-700 border-cyan-100",
    features: [
      "View medical referrals",
      "Upload treatment reports",
      "Record assessments",
      "Handle emergency cases",
      "Share verified findings",
    ],
  },
  {
    role: "Child Protection Officer",
    icon: FileWarning,
    color: "bg-amber-50 text-amber-700 border-amber-100",
    features: [
      "Verify reports",
      "Assign to institutions",
      "Escalate urgent incidents",
      "Monitor progress",
      "Coordinate multi-agency response",
    ],
  },
  {
    role: "Super Admin",
    icon: UserCog,
    color: "bg-slate-100 text-slate-700 border-slate-200",
    features: [
      "Manage users and roles",
      "Manage institutions",
      "View national analytics",
      "Monitor audit logs",
      "Control system settings",
    ],
  },
];

const metricCards = [
  {
    title: "Total Active Cases",
    value: "1,284",
    detail: "+14 this week",
    icon: FolderKanban,
  },
  {
    title: "Urgent Alerts",
    value: "38",
    detail: "8 need immediate action",
    icon: Siren,
  },
  {
    title: "Resolved Cases",
    value: "842",
    detail: "+52 this month",
    icon: CheckCircle2,
  },
  {
    title: "Registered Users",
    value: "5,406",
    detail: "Across all roles",
    icon: Users,
  },
];

const quickActions = [
  {
    title: "Create New Case",
    text: "Open a new missing child or abuse case report.",
    icon: Plus,
  },
  {
    title: "Send Emergency Alert",
    text: "Notify police, hospitals, and social workers instantly.",
    icon: Bell,
  },
  {
    title: "Search Child Record",
    text: "Find case by child name, case ID, or location.",
    icon: Search,
  },
  {
    title: "Export Monthly Report",
    text: "Download dashboard statistics and case summaries.",
    icon: Download,
  },
];

const recentCases = [
  {
    id: "CW-2026-00124",
    child: "Niyonsenga Aline",
    type: "Missing Child",
    district: "Gasabo",
    status: "Under Investigation",
    priority: "Urgent",
  },
  {
    id: "CW-2026-00125",
    child: "Iradukunda Eric",
    type: "Physical Abuse",
    district: "Kicukiro",
    status: "Verified",
    priority: "High",
  },
  {
    id: "CW-2026-00126",
    child: "Uwimana Keza",
    type: "Neglect",
    district: "Nyarugenge",
    status: "Assigned",
    priority: "Medium",
  },
  {
    id: "CW-2026-00127",
    child: "Mugisha Prince",
    type: "Trafficking Suspicion",
    district: "Musanze",
    status: "Escalated",
    priority: "Urgent",
  },
  {
    id: "CW-2026-00128",
    child: "Mukamana Joyeuse",
    type: "Sexual Abuse",
    district: "Rubavu",
    status: "Medical Review",
    priority: "High",
  },
];

const alerts = [
  {
    title: "Emergency report from Gasabo sector",
    text: "Possible child abduction reported 18 minutes ago.",
    tag: "Critical",
  },
  {
    title: "Medical referral awaiting upload",
    text: "Hospital assessment for case CW-2026-00128 is pending.",
    tag: "Pending",
  },
  {
    title: "Police reassignment completed",
    text: "Two urgent cases moved to district response unit.",
    tag: "Info",
  },
];

function StatusBadge({ label }) {
  const styles = {
    "Under Investigation": "bg-yellow-50 text-yellow-700 ring-yellow-100",
    Verified: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Assigned: "bg-amber-50 text-amber-700 ring-amber-100",
    Escalated: "bg-red-50 text-red-700 ring-red-100",
    "Medical Review": "bg-cyan-50 text-cyan-700 ring-cyan-100",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[label] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {label}
    </span>
  );
}

function PriorityBadge({ label }) {
  const styles = {
    Urgent: "bg-red-100 text-red-700",
    High: "bg-amber-100 text-amber-700",
    Medium: "bg-blue-100 text-yellow-700",
    Low: "bg-slate-100 text-slate-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[label] || styles.Low}`}>{label}</span>;
}

export default function ChildwatchDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("overview");
  const [search, setSearch] = useState("");

  const filteredCases = useMemo(() => {
    const q = search.toLowerCase();
    return recentCases.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        item.child.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q)
    );
  }, [search]);

  const Sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-lg font-bold tracking-wide">Childwatch</p>
          <p className="text-xs text-slate-400">Protection Dashboard</p>
        </div>
        <button
          className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3 py-4">
        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Logged In As</p>
          <p className="mt-2 font-semibold">Super Admin</p>
          <p className="text-sm text-slate-400">National Childwatch Center</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeNav;
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveNav(item.key);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                active
                  ? "bg-yellow-500 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
            <div>
              <p className="font-semibold text-red-300">Emergency Hotline</p>
              <p className="mt-1 text-sm text-slate-300">Keep urgent child rescue contacts visible at all times.</p>
              <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                <Phone className="h-4 w-4" /> Call Response Unit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="lg:flex">
        <aside className="hidden h-screen w-72 shrink-0 lg:sticky lg:top-0 lg:block">{Sidebar}</aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="w-72">{Sidebar}</div>
            <button
              className="flex-1 bg-slate-950/50"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        )}

        <main className="flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <button
                className="rounded-xl border border-slate-200 p-2 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-bold sm:text-2xl">Childwatch Dashboard</h1>
                <p className="text-sm text-slate-500">Manage missing child and abuse response across all institutions.</p>
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <button className="rounded-xl border border-slate-200 p-2 text-slate-600">
                  <Bell className="h-5 w-5" />
                </button>
                <button className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                  + New Case
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-4 sm:p-6 lg:space-y-8 lg:p-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">{item.title}</p>
                        <p className="mt-2 text-2xl font-bold sm:text-3xl">{item.value}</p>
                        <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
                      </div>
                      <div className="rounded-2xl bg-yellow-50 p-3 text-yellow-700">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Case Management Overview</h2>
                    <p className="text-sm text-slate-500">Track, filter, and review active child protection cases.</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[var(--simba-bg-main)] px-3 py-2">
                      <Search className="h-4 w-4 text-slate-500" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search child, case ID, district..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72"
                      />
                    </div>
                    <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                      <Filter className="h-4 w-4" /> Filter
                    </button>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[var(--simba-bg-main)] text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Case ID</th>
                          <th className="px-4 py-3 font-semibold">Child Name</th>
                          <th className="px-4 py-3 font-semibold">Case Type</th>
                          <th className="px-4 py-3 font-semibold">District</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">Priority</th>
                          <th className="px-4 py-3 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredCases.map((item) => (
                          <tr key={item.id} className="hover:bg-[var(--simba-bg-main)]">
                            <td className="px-4 py-3 font-medium text-yellow-700">{item.id}</td>
                            <td className="px-4 py-3">{item.child}</td>
                            <td className="px-4 py-3">{item.type}</td>
                            <td className="px-4 py-3">{item.district}</td>
                            <td className="px-4 py-3"><StatusBadge label={item.status} /></td>
                            <td className="px-4 py-3"><PriorityBadge label={item.priority} /></td>
                            <td className="px-4 py-3">
                              <button className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                <Eye className="h-3.5 w-3.5" /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Urgent Alerts</h2>
                      <p className="text-sm text-slate-500">Latest critical activity across the system.</p>
                    </div>
                    <MessageSquareWarning className="h-5 w-5 text-red-500" />
                  </div>

                  <div className="mt-5 space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.title} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{alert.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{alert.text}</p>
                          </div>
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            {alert.tag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-slate-900 p-5 text-white shadow-sm sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-100">Live Incident Map</p>
                      <h3 className="mt-1 text-xl font-bold">Case Hotspots</h3>
                    </div>
                    <MapPin className="h-5 w-5 text-blue-100" />
                  </div>

                  <div className="mt-5 rounded-3xl bg-white/10 p-6">
                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-blue-100">Gasabo</p>
                        <p className="mt-2 text-2xl font-bold">14</p>
                        <p className="text-blue-100">Open incidents</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-blue-100">Kicukiro</p>
                        <p className="mt-2 text-2xl font-bold">9</p>
                        <p className="text-blue-100">Open incidents</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4 col-span-2 sm:col-span-1">
                        <p className="text-blue-100">Nyarugenge</p>
                        <p className="mt-2 text-2xl font-bold">7</p>
                        <p className="text-blue-100">Open incidents</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Quick Actions</h2>
                  <p className="text-sm text-slate-500">Fast access to the most important system tasks.</p>
                </div>
                <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white">
                  View All Modules <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.title}
                      className="rounded-3xl border border-slate-200 bg-[var(--simba-bg-main)] p-5 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                    >
                      <div className="rounded-2xl bg-yellow-50 p-3 w-fit text-yellow-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-bold">{action.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{action.text}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold">Features by User Role</h2>
                <p className="text-sm text-slate-500">This dashboard structure covers all major Childwatch user groups.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roleCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.role} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                      <div className={`inline-flex rounded-2xl border p-3 ${item.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold">{item.role}</h3>
                      <ul className="mt-4 space-y-2 text-sm text-slate-600">
                        {item.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 xl:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">System Analytics Snapshot</h2>
                    <p className="text-sm text-slate-500">Example analytics area for charts, trends, and reporting modules.</p>
                  </div>
                  <Clock3 className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Missing Child", "34%"],
                    ["Physical Abuse", "22%"],
                    ["Neglect", "18%"],
                    ["Trafficking", "9%"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[var(--simba-bg-main)] p-4">
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="mt-2 text-2xl font-bold">{value}</p>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-yellow-500" style={{ width: value }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                <h2 className="text-xl font-bold">Top Web Features</h2>
                <p className="mt-1 text-sm text-slate-500">Recommended for your management dashboard.</p>
                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  {[
                    "Role-based login and permissions",
                    "Case management and assignment",
                    "Real-time alerts and notifications",
                    "Search, filters, and report tracking",
                    "Evidence and document upload",
                    "Analytics and district statistics",
                    "Audit logs and security controls",
                    "Mobile responsive UI for all screens",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

