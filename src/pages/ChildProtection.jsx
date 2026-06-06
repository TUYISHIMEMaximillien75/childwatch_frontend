// ChildProtectionDashboard.jsx — Child Protection Officer Panel
import { useState } from "react";
import {
  LayoutDashboard, FolderOpen, CheckCircle2, AlertTriangle, Shield,
  ArrowRightLeft, Bell, Flag, FileText, Eye, Edit2, Send,
  Menu, LogOut, Plus, Download, Star, Clock, Users, X,
  XCircle, TrendingUp, Activity, Calendar, Search, UserCheck,
  MessageSquare, Filter
} from "lucide-react";

const STATS = [
  { label:"Active Protection Cases", value:"47", icon:FolderOpen,   color:"blue"  },
  { label:"Verified Cases",          value:"31", icon:CheckCircle2, color:"green" },
  { label:"Unverified / Pending",    value:"16", icon:Clock,        color:"amber" },
  { label:"Urgent / Escalated",      value:"8",  icon:AlertTriangle,color:"red"   },
  { label:"Inter-Agency Referrals",  value:"22", icon:ArrowRightLeft,color:"blue" },
  { label:"Children at High Risk",   value:"12", icon:Flag,         color:"red"   },
  { label:"Closed Cases",            value:"19", icon:XCircle,      color:"green" },
  { label:"Alerts Requiring Action", value:"5",  icon:Bell,         color:"amber" },
];

const CASES = [
  { id:"CW-2026-001", child:"Mutoni Aline",    type:"Missing", status:"urgent",    verified:true,  district:"Gasabo",     assigned:"Police",        risk:"high"   },
  { id:"CW-2026-007", child:"Keza Brian",      type:"Abuse",   status:"active",    verified:true,  district:"Kicukiro",   assigned:"Social Worker", risk:"high"   },
  { id:"CW-2026-014", child:"Ingabire Diana",  type:"Neglect", status:"pending",   verified:false, district:"Gasabo",     assigned:"—",             risk:"medium" },
  { id:"CW-2026-021", child:"Nkurunziza Tom",  type:"Abuse",   status:"escalated", verified:true,  district:"Nyarugenge", assigned:"Police",        risk:"high"   },
  { id:"CW-2026-030", child:"Uwimana Sarah",   type:"Missing", status:"pending",   verified:false, district:"Rubavu",     assigned:"—",             risk:"low"    },
];

const NAV = [
  { id:"dashboard",   label:"Dashboard",          icon:LayoutDashboard },
  { id:"cases",       label:"All Cases",          icon:FolderOpen      },
  { id:"verify",      label:"Verify Reports",     icon:UserCheck       },
  { id:"assign",      label:"Assign Cases",       icon:ArrowRightLeft  },
  { id:"escalate",    label:"Escalate / Urgent",  icon:AlertTriangle   },
  { id:"monitor",     label:"Monitor Progress",   icon:Activity        },
  { id:"reports",     label:"Case Summaries",     icon:FileText        },
  { id:"alerts",      label:"Alerts",             icon:Bell            },
];

const STATUS_CONFIG = {
  urgent:    { bg:"bg-red-50",   text:"text-red-700",   border:"border-red-200",   dot:"bg-red-500"   },
  active:    { bg:"bg-yellow-50",  text:"text-yellow-700",  border:"border-yellow-200",  dot:"bg-yellow-500"  },
  pending:   { bg:"bg-amber-50", text:"text-amber-700", border:"border-amber-200", dot:"bg-amber-500" },
  escalated: { bg:"bg-red-50",   text:"text-red-700",   border:"border-red-200",   dot:"bg-red-500"   },
  closed:    { bg:"bg-green-50", text:"text-green-700", border:"border-green-200", dot:"bg-green-500" },
};

const RISK_DOT = { high:"bg-red-500", medium:"bg-amber-500", low:"bg-green-500" };

function StatCard({ label, value, icon:Icon, color }) {
  const C = { blue:"bg-yellow-50 text-yellow-600 ring-yellow-100", green:"bg-green-50 text-green-600 ring-green-100", amber:"bg-amber-50 text-amber-600 ring-amber-100", red:"bg-red-50 text-red-500 ring-red-100" }[color];
  const [bg,ic,ring] = C.split(" ");
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${bg} ring-4 ${ring} flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${ic}`}/></div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status]||STATUS_CONFIG.pending;
  return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}><span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>{status}</span>;
}
function Btn({ children, variant="primary", size="sm", onClick, className="" }) {
  const V = { primary:"bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm", green:"bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm", outline:"border border-slate-200 bg-white hover:bg-[var(--simba-bg-main)] text-slate-700", danger:"bg-red-50 hover:bg-red-100 text-red-600 border border-red-200", ghost:"text-slate-500 hover:bg-slate-100" }[variant];
  const S = { sm:"px-3 py-1.5 text-[12px]", md:"px-4 py-2.5 text-[13px]" }[size];
  return <button onClick={onClick} className={`inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all active:scale-[0.97] ${V} ${S} ${className}`}>{children}</button>;
}
function SectionTitle({ title, sub }) {
  return <div className="mb-5"><h2 className="text-[17px] font-extrabold text-slate-900">{title}</h2>{sub && <p className="text-[12px] text-slate-500 mt-0.5">{sub}</p>}</div>;
}

function DashboardView({ onNav }) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-yellow-600 rounded-2xl px-6 py-5 text-white">
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-yellow-500 rounded-full opacity-50 pointer-events-none"/>
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-green-500 rounded-full opacity-10 pointer-events-none"/>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-blue-200 mb-1">Child Protection Officer</p>
            <h2 className="text-[20px] font-extrabold">Officer Marie Kayitesi</h2>
            <p className="text-[13px] text-blue-200 mt-0.5">Child Protection Unit · Rwanda</p>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>onNav("verify")} className="flex items-center gap-2 px-4 py-2.5 bg-white text-yellow-700 font-bold text-[13px] rounded-xl hover:bg-yellow-50">
              <UserCheck className="w-4 h-4"/>Verify Reports
            </button>
            <button onClick={()=>onNav("escalate")} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-[13px] rounded-xl">
              <AlertTriangle className="w-4 h-4"/>Escalate
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {STATS.map(s=><StatCard key={s.label} {...s}/>)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4"><p className="font-extrabold text-slate-800">Cases Requiring Action</p><button onClick={()=>onNav("cases")} className="text-[12px] font-semibold text-yellow-600">View all →</button></div>
          <div className="space-y-2">
            {CASES.filter(c=>!c.verified||c.status==="urgent"||c.status==="escalated").map(c=>(
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--simba-bg-main)]">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${RISK_DOT[c.risk]}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800 truncate">{c.child}</p>
                  <p className="text-[11px] text-slate-400">{c.id} · {c.district}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!c.verified && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">UNVERIFIED</span>}
                  <StatusBadge status={c.status}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="font-extrabold text-slate-800 mb-3">Quick Actions</p>
            <div className="space-y-2">
              {[{l:"Verify pending reports",n:"verify",icon:UserCheck,c:"text-amber-600"},{l:"Assign new cases",n:"assign",icon:ArrowRightLeft,c:"text-yellow-600"},{l:"Escalate urgent cases",n:"escalate",icon:AlertTriangle,c:"text-red-600"},{l:"Generate summaries",n:"reports",icon:FileText,c:"text-green-700"}].map(a=>(
                <button key={a.l} onClick={()=>onNav(a.n)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--simba-bg-main)] hover:bg-slate-100 transition-colors text-left">
                  <a.icon className={`w-4 h-4 ${a.c} shrink-0`}/>
                  <span className="text-[12px] font-semibold text-slate-700">{a.l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifyView() {
  const [decisions, setDecisions] = useState({});
  const unverified = CASES.filter(c=>!c.verified);
  return (
    <div className="space-y-5">
      <SectionTitle title="Verify Reports" sub="Review and approve or reject incoming reports"/>
      {unverified.map(c=>(
        <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-mono text-[11px] text-yellow-600 font-bold">{c.id}</span>
              <h3 className="text-[15px] font-extrabold text-slate-900 mt-0.5">{c.child}</h3>
              <p className="text-[12px] text-slate-400">{c.type} · {c.district}</p>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">Awaiting Verification</span>
          </div>
          <textarea rows={2} placeholder="Add verification notes or rejection reason…" className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl outline-none focus:border-blue-400 resize-none bg-white"/>
          {decisions[c.id] ? (
            <div className={`flex items-center gap-2 text-[13px] font-bold ${decisions[c.id]==="approved"?"text-green-700":"text-red-600"}`}>
              {decisions[c.id]==="approved"?<CheckCircle2 className="w-4 h-4"/>:<XCircle className="w-4 h-4"/>}
              {decisions[c.id]==="approved"?"Report verified and approved":"Report rejected"}
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={()=>setDecisions(p=>({...p,[c.id]:"approved"}))} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-[13px] rounded-xl transition-colors"><CheckCircle2 className="w-4 h-4"/>Approve</button>
              <button onClick={()=>setDecisions(p=>({...p,[c.id]:"rejected"}))} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] rounded-xl transition-colors"><XCircle className="w-4 h-4"/>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AssignView() {
  return (
    <div className="space-y-5">
      <SectionTitle title="Assign Cases" sub="Assign or re-assign cases to police, social workers, or hospitals"/>
      {CASES.filter(c=>c.verified).map(c=>(
        <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-mono text-[11px] text-yellow-600 font-bold">{c.id}</span>
              <h3 className="text-[15px] font-extrabold text-slate-900 mt-0.5">{c.child}</h3>
              <p className="text-[12px] text-slate-400">Currently assigned to: <span className="font-semibold text-slate-600">{c.assigned}</span></p>
            </div>
            <StatusBadge status={c.status}/>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["Police","Social Worker","Hospital"].map(agency=>(
              <button key={agency} className={`py-2.5 rounded-xl text-[12px] font-bold border transition-all ${c.assigned===agency?"bg-yellow-500 text-white border-yellow-600":"bg-white text-slate-700 border-slate-200 hover:bg-[var(--simba-bg-main)]"}`}>{agency}</button>
            ))}
          </div>
          <Btn variant="primary"><Send className="w-3.5 h-3.5"/>Confirm Assignment</Btn>
        </div>
      ))}
    </div>
  );
}

function EscalateView() {
  return (
    <div className="space-y-5">
      <SectionTitle title="Escalate Urgent Cases" sub="Flag and escalate cases requiring immediate response"/>
      {CASES.filter(c=>c.risk==="high").map(c=>(
        <div key={c.id} className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-mono text-[11px] text-red-500 font-bold">{c.id}</span>
              <h3 className="text-[15px] font-extrabold text-red-900 mt-0.5">{c.child}</h3>
              <p className="text-[12px] text-red-600">{c.type} · {c.district}</p>
            </div>
            <StatusBadge status={c.status}/>
          </div>
          <textarea rows={2} placeholder="Escalation reason and recommended action…" className="w-full px-3 py-2.5 text-[13px] border border-red-200 rounded-xl outline-none focus:border-red-400 resize-none bg-white"/>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] rounded-xl"><AlertTriangle className="w-4 h-4"/>Escalate Now</button>
            <Btn variant="outline"><Bell className="w-3.5 h-3.5"/>Notify All</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

function MonitorView() {
  return (
    <div className="space-y-5">
      <SectionTitle title="Monitor Case Progress" sub="Overview of all active case statuses and agency collaboration"/>
      <div className="grid gap-3">
        {CASES.map(c=>(
          <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <span className="font-mono text-[11px] text-yellow-600 font-bold">{c.id}</span>
                <h3 className="text-[14px] font-extrabold text-slate-900 mt-0.5">{c.child} · {c.type}</h3>
                <p className="text-[12px] text-slate-400">Assigned: <span className="font-semibold text-slate-600">{c.assigned}</span></p>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <StatusBadge status={c.status}/>
                <span className={`text-[10px] font-bold ${c.verified?"text-green-600":"text-amber-600"}`}>{c.verified?"✓ Verified":"⏳ Pending"}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn variant="outline"><Eye className="w-3.5 h-3.5"/>View</Btn>
              <Btn variant="outline"><Edit2 className="w-3.5 h-3.5"/>Update</Btn>
              <Btn variant="outline"><MessageSquare className="w-3.5 h-3.5"/>Recommend</Btn>
              {c.status!=="closed" && <Btn variant="green"><CheckCircle2 className="w-3.5 h-3.5"/>Close Case</Btn>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsView() {
  return (
    <div className="space-y-5">
      <SectionTitle title="Case Summaries & Reports"/>
      <div className="grid sm:grid-cols-2 gap-4">
        {[{t:"Protection Case Summary",s:"Full case outcome report",i:FileText},{t:"Agency Collaboration Report",s:"Inter-agency referral history",i:ArrowRightLeft},{t:"Child Safety Outcomes",s:"Children safe vs at risk",i:Shield},{t:"Monthly Protection Report",s:"All cases this month",i:Calendar}].map(r=>(
          <div key={r.t} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center mb-3"><r.i className="w-5 h-5 text-yellow-600"/></div>
            <h3 className="text-[14px] font-bold text-slate-800 mb-1">{r.t}</h3>
            <p className="text-[12px] text-slate-500 mb-4">{r.s}</p>
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

export default function ChildProtectionDashboard() {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const SECTIONS = {
    dashboard: <DashboardView onNav={setActive}/>,
    cases:     <MonitorView/>,
    verify:    <VerifyView/>,
    assign:    <AssignView/>,
    escalate:  <EscalateView/>,
    monitor:   <MonitorView/>,
    reports:   <ReportsView/>,
    alerts:    <div className="text-slate-500 p-4">No new alerts.</div>,
  };
  const cur = NAV.find(n=>n.id===active);
  return (
    <div className="flex h-screen bg-[var(--simba-bg-main)] overflow-hidden font-sans">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={()=>setSidebarOpen(false)}/>}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 xl:w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen?"translate-x-0":"-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-600 flex items-center justify-center shadow-sm"><Shield className="w-5 h-5 text-white"/></div>
            <div><p className="text-[14px] font-extrabold text-yellow-700">Childwatch</p><p className="text-[10px] text-slate-400 font-medium">Protection Officer</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {NAV.map(item=>{const Icon=item.icon;const isA=active===item.id;return <button key={item.id} onClick={()=>{setActive(item.id);setSidebarOpen(false);}} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${isA?"bg-yellow-600 text-white shadow-sm":"text-slate-600 hover:bg-[var(--simba-bg-main)]"}`}><Icon className="w-4 h-4 shrink-0"/>{item.label}</button>;})}
        </nav>
        <div className="px-4 pb-5 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--simba-bg-main)]">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><span className="text-[11px] font-extrabold text-yellow-700">MK</span></div>
            <div className="flex-1 min-w-0"><p className="text-[12px] font-bold text-slate-800 truncate">Marie Kayitesi</p><p className="text-[10px] text-slate-400">CPO Officer</p></div>
            <button className="text-slate-400 hover:text-slate-700"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100"><Menu className="w-5 h-5 text-slate-600"/></button>
            <h1 className="text-[14px] font-extrabold text-slate-800">{cur?.label}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-slate-100"><Bell className="w-5 h-5 text-slate-500"/><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"/></button>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-[11px] font-bold text-yellow-700">MK</span></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{SECTIONS[active]}</main>
        <div className="lg:hidden border-t border-slate-100 bg-white flex items-center justify-around px-1 py-2 shrink-0">
          {[{id:"dashboard",icon:LayoutDashboard,label:"Home"},{id:"cases",icon:FolderOpen,label:"Cases"},{id:"verify",icon:UserCheck,label:"Verify"},{id:"escalate",icon:AlertTriangle,label:"Escalate"},{id:"reports",icon:FileText,label:"Reports"}].map(item=>{const Icon=item.icon;const isA=active===item.id;return <button key={item.id} onClick={()=>setActive(item.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl"><Icon className={`w-5 h-5 ${isA?"text-yellow-700":"text-slate-400"}`}/><span className={`text-[9px] font-bold ${isA?"text-yellow-700":"text-slate-400"}`}>{item.label}</span></button>;})}</div>
      </div>
    </div>
  );
}
