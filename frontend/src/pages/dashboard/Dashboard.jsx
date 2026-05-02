import { useState } from 'react';
import AppLayout from '../../components/AppLayout';
import {
  Search, Bell, Plus, Download, Users, Calendar, Clock,
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CheckCircle, AlertCircle, MessageSquare, FileText, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import useAuthStore from '../../store/authStore';

/* ── Mock Data ─────────────────────────────────────────────────── */
const completionData = [
  { month: 'Jan', onTime: 42, late: 5 },
  { month: 'Feb', onTime: 44, late: 3 },
  { month: 'Mar', onTime: 47, late: 4 },
  { month: 'Apr', onTime: 50, late: 2 },
  { month: 'May', onTime: 52, late: 3 },
  { month: 'Jun', onTime: 55, late: 1 },
];

const deptData = [
  { name: 'Engineering', value: 18, color: '#3B82F6' },
  { name: 'Sales',       value: 12, color: '#10B981' },
  { name: 'HR',          value: 8,  color: '#EC4899' },
  { name: 'Finance',     value: 6,  color: '#F59E0B' },
  { name: 'Product',     value: 6,  color: '#8B5CF6' },
];

const tasks = [
  { id: 1, title: 'Review Bob\'s leave request',   assignee: 'BS', status: 'pending',  priority: 'high' },
  { id: 2, title: 'Approve April payslips',         assignee: 'RM', status: 'pending',  priority: 'medium' },
  { id: 3, title: 'Update Priya\'s salary info',   assignee: 'PN', status: 'done',     priority: 'low' },
  { id: 4, title: 'Onboard new intern — Finance',   assignee: 'AF', status: 'pending',  priority: 'low' },
];

const timeline = [
  { id: 1, time: '09:02 AM', event: 'Alice checked in',            tag: 'Attendance', tagColor: '#10B981' },
  { id: 2, time: '09:15 AM', event: 'Bob requested sick leave',    tag: 'Leave',      tagColor: '#F59E0B' },
  { id: 3, time: '10:30 AM', event: 'Payrun April validated',      tag: 'Payroll',    tagColor: '#3B82F6' },
  { id: 4, time: '11:00 AM', event: 'Sara profile updated',        tag: 'HR',         tagColor: '#8B5CF6' },
  { id: 5, time: '02:00 PM', event: 'Team meeting — Engineering',  tag: 'Meeting',    tagColor: '#EC4899' },
];

const projects = [
  { id: 1, name: 'Payroll Migration',   lead: 'RM', members: 3, progress: 78, status: 'On Track' },
  { id: 2, name: 'Leave Module v2',     lead: 'PN', members: 2, progress: 45, status: 'At Risk' },
  { id: 3, name: 'Onboarding Portal',   lead: 'AF', members: 4, progress: 92, status: 'On Track' },
  { id: 4, name: 'Attendance Biometric', lead: 'BS', members: 2, progress: 30, status: 'Delayed' },
];

const priorityDot = { high: 'bg-[#EF4444]', medium: 'bg-[#F59E0B]', low: 'bg-[#10B981]' };
const statusStyle = {
  'On Track': 'text-[#10B981] bg-[#10B981]/8',
  'At Risk':  'text-[#F59E0B] bg-[#F59E0B]/8',
  'Delayed':  'text-[#EF4444] bg-[#EF4444]/8',
};

/* ── Custom Tooltip ────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

/* ── Dashboard ─────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuthStore();
  const firstName = user?.firstName || 'Admin';
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = [
    { label: 'Total Employees', value: '50',       change: '+3',   up: true,  icon: Users,      iconBg: 'bg-[#3B82F6]/10', iconColor: 'text-[#3B82F6]' },
    { label: 'On Leave Today',  value: '3',        change: '-1',   up: false, icon: Calendar,   iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]' },
    { label: 'Late Arrivals',   value: '2',        change: '+1',   up: true,  icon: Clock,      iconBg: 'bg-[#EC4899]/10', iconColor: 'text-[#EC4899]' },
    { label: 'Monthly Payroll', value: '₹2.37L',   change: '+15%', up: true,  icon: DollarSign, iconBg: 'bg-[#F59E0B]/10', iconColor: 'text-[#F59E0B]' },
  ];

  return (
    <AppLayout>
      {/* ═══════ BLACK HERO HEADER ═══════ */}
      <div className="bg-black px-6 lg:px-8 pt-6 pb-0">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div /> {/* spacer — nav links would go here */}
          <div className="flex items-center gap-3">
            {/* Search pill */}
            <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Search size={14} className="text-[#9CA3AF]" />
              <input placeholder="Search..." className="bg-transparent text-white text-xs outline-none w-36 placeholder-[#6B7280]" />
              <kbd className="text-[10px] text-[#6B7280] bg-white/10 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </div>
            <button className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
              <Bell size={16} className="text-[#9CA3AF]" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#EF4444] rounded-full border-2 border-black text-[8px] text-white font-bold flex items-center justify-center">3</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-[#3B82F6]/20">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div className="flex items-end justify-between flex-wrap gap-4 pb-5 animate-fade-in-up delay-1">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight">Hi, {firstName}! 👋</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">This is your HR report today!</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 px-4 py-2 rounded-full text-xs font-semibold transition-all">
              <Download size={13} /> Export
            </button>
            <button className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-[#3B82F6]/25">
              <Plus size={14} /> New entry
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 animate-fade-in-up delay-2">
          {['Dashboard', 'Pay', 'Reports', 'Activity'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab.toLowerCase()
                  ? 'text-white border-[#3B82F6]'
                  : 'text-[#6B7280] border-transparent hover:text-[#9CA3AF]'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ LIGHT CONTENT AREA ═══════ */}
      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Stat Cards Row ──────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`bg-white rounded-2xl p-5 card-shadow animate-fade-in-up delay-${i + 1}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                  <s.icon size={18} className={s.iconColor} />
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold ${s.up ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {s.change}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-[#111827]">{s.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Middle Row: Tasks + Timeline + Chart ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tasks */}
          <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-3">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[#111827] text-sm">Task To-Do</h3>
              <span className="text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/8 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'pending').length} pending</span>
            </div>
            <div className="divide-y divide-[#F5F6F8]">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F5F6F8]/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[t.priority]}`} />
                  <div className="w-7 h-7 rounded-full bg-[#F5F6F8] flex items-center justify-center text-[10px] font-bold text-[#6B7280] shrink-0">{t.assignee}</div>
                  <p className={`text-sm flex-1 ${t.status === 'done' ? 'line-through text-[#D1D5DB]' : 'text-[#111827]'}`}>{t.title}</p>
                  {t.status === 'done' && <CheckCircle size={14} className="text-[#10B981] shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[#111827] text-sm">Activity Timeline</h3>
              <span className="text-xs text-[#9CA3AF]">Today</span>
            </div>
            <div className="p-5">
              <div className="relative">
                <div className="absolute left-[6px] top-2 bottom-2 w-[2px] bg-[#E5E7EB]" />
                <div className="space-y-5">
                  {timeline.map(t => (
                    <div key={t.id} className="flex gap-4 relative">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white shrink-0 z-10" style={{ background: t.tagColor }} />
                      <div className="flex-1 -mt-0.5">
                        <p className="text-sm text-[#111827] leading-snug">{t.event}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[#9CA3AF] font-mono">{t.time}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: t.tagColor, background: `${t.tagColor}15` }}>{t.tag}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Bar Chart */}
          <div className="bg-white rounded-2xl card-shadow p-5 animate-fade-in-up delay-5">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={completionData} barGap={2}>
                <XAxis dataKey="month" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="onTime" name="On Time" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="late" name="Late" fill="#E5E7EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Bottom Row: Table + Donut ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Project Table (spanning 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[#111827] text-sm">All Initiatives</h3>
              <button className="text-xs text-[#3B82F6] font-semibold hover:underline">View All</button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[#9CA3AF] border-b border-[#F5F6F8]">
                  <th className="px-5 py-3 font-semibold">Initiative</th>
                  <th className="px-5 py-3 font-semibold">Lead</th>
                  <th className="px-5 py-3 font-semibold">Members</th>
                  <th className="px-5 py-3 font-semibold">Progress</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F6F8]">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-[#F5F6F8]/50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/8 flex items-center justify-center">
                          <FileText size={14} className="text-[#3B82F6]" />
                        </div>
                        <span className="text-sm font-semibold text-[#111827]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-[10px] font-bold text-white">{p.lead}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#6B7280]">{p.members}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: p.progress > 70 ? '#10B981' : p.progress > 40 ? '#3B82F6' : '#EF4444' }} />
                        </div>
                        <span className="text-xs font-semibold text-[#6B7280] w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusStyle[p.status]}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Department Donut */}
          <div className="bg-white rounded-2xl card-shadow p-5 animate-fade-in-up delay-6">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Department Overview</h3>
            <div className="flex flex-col items-center">
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={deptData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                      {deptData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-2xl font-extrabold text-[#111827]">50</p>
                  <p className="text-[10px] text-[#9CA3AF]">Total</p>
                </div>
              </div>
              <div className="w-full space-y-2 mt-4">
                {deptData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs text-[#6B7280]">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#111827]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
