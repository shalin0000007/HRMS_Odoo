import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '../../components/AppLayout';
import { SkeletonCard } from '../../components/Skeleton';
import {
  Search, Bell, Plus, Download, Users, Calendar, Clock,
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CheckCircle, AlertCircle, MessageSquare, FileText, ChevronRight,
  Umbrella, Briefcase
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import useAuthStore from '../../store/authStore';
import { analyticsAPI } from '../../api/endpoints';

/* ── Fallback mock data (used when API has no data yet) ──────── */
const fallbackTasks = [
  { id: 1, title: 'Review Bob\'s leave request',   assignee: 'BS', status: 'pending',  priority: 'high' },
  { id: 2, title: 'Approve April payslips',         assignee: 'RM', status: 'pending',  priority: 'medium' },
  { id: 3, title: 'Update Priya\'s salary info',   assignee: 'PN', status: 'done',     priority: 'low' },
];

const fallbackTimeline = [
  { id: 1, time: '09:02 AM', event: 'Alice checked in',            tag: 'Attendance', tagColor: '#10B981' },
  { id: 2, time: '09:15 AM', event: 'Bob requested sick leave',    tag: 'Leave',      tagColor: '#F59E0B' },
  { id: 3, time: '10:30 AM', event: 'Payrun April validated',      tag: 'Payroll',    tagColor: '#3B82F6' },
  { id: 4, time: '11:00 AM', event: 'Sara profile updated',        tag: 'HR',         tagColor: '#8B5CF6' },
];

const DEPT_COLORS = ['#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#8B5CF6', '#EF4444'];
const priorityDot = { high: 'bg-[#EF4444]', medium: 'bg-[#F59E0B]', low: 'bg-[#10B981]' };

/* ── Custom Tooltip ────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? '₹' + Math.round(p.value).toLocaleString('en-IN') : p.value}</p>
      ))}
    </div>
  );
};

/* ── Dashboard ─────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuthStore();
  const firstName = user?.firstName || 'User';
  const isManagement = ['admin', 'hr_officer', 'payroll_officer'].includes(user?.role);
  const isAdmin = isManagement;
  const [activeTab, setActiveTab] = useState('dashboard');

  // ==========================================
  // 1. DATA FETCHING (REACT QUERY)
  // ==========================================
  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard', isAdmin ? 'admin' : 'employee'],
    queryFn: () => isAdmin ? analyticsAPI.getDashboard() : analyticsAPI.getMyStats(),
    select: res => res.data?.data,
    retry: 1,
  });

  // ── Build admin stats from API data ──
  const adminStats = dashData?.stats ? [
    { label: 'Total Employees', value: String(dashData.stats.totalEmployees || 0), icon: Users,      iconBg: 'bg-[#3B82F6]/10', iconColor: 'text-[#3B82F6]' },
    { label: 'Active Today',    value: String(dashData.stats.activeToday || 0),    icon: Calendar,   iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]' },
    { label: 'Pending Leaves',  value: String(dashData.stats.pendingLeaves || 0),  icon: Clock,      iconBg: 'bg-[#EC4899]/10', iconColor: 'text-[#EC4899]' },
    { label: 'Latest Payrun',   value: dashData.stats.latestPayrun ? `${dashData.stats.latestPayrun.month}/${dashData.stats.latestPayrun.year}` : '—', icon: DollarSign, iconBg: 'bg-[#F59E0B]/10', iconColor: 'text-[#F59E0B]' },
  ] : [
    { label: 'Total Employees', value: '—', icon: Users,      iconBg: 'bg-[#3B82F6]/10', iconColor: 'text-[#3B82F6]' },
    { label: 'Active Today',    value: '—', icon: Calendar,   iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]' },
    { label: 'Pending Leaves',  value: '—', icon: Clock,      iconBg: 'bg-[#EC4899]/10', iconColor: 'text-[#EC4899]' },
    { label: 'Latest Payrun',   value: '—', icon: DollarSign, iconBg: 'bg-[#F59E0B]/10', iconColor: 'text-[#F59E0B]' },
  ];

  // ── Build employee stats from API data ──
  const empAttendance = dashData?.thisMonthAttendance || [];
  const presentCount = empAttendance.find(a => a.status === 'present')?._count?.status || 0;
  const totalChecked = empAttendance.reduce((s, a) => s + (a._count?.status || 0), 0);
  const attendancePct = totalChecked > 0 ? Math.round((presentCount / totalChecked) * 100) : '—';

  const empLeaveBalances = dashData?.leaveBalances || [];
  const totalLeaveBalance = empLeaveBalances.reduce((s, b) => s + (b.totalDays - b.consumed), 0);

  const empStats = [
    { label: 'Attendance Score', value: `${attendancePct}%`, icon: CheckCircle, iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]' },
    { label: 'Leave Balance',    value: String(totalLeaveBalance || '—'), icon: Umbrella,   iconBg: 'bg-[#3B82F6]/10', iconColor: 'text-[#3B82F6]' },
    { label: 'Recent Payslips',  value: String(dashData?.recentPayslips?.length || 0), icon: Briefcase,  iconBg: 'bg-[#F59E0B]/10', iconColor: 'text-[#F59E0B]' },
    { label: 'Department',       value: dashData?.profile?.department || '—', icon: Calendar,   iconBg: 'bg-[#8B5CF6]/10', iconColor: 'text-[#8B5CF6]' },
  ];

  const stats = isAdmin ? adminStats : empStats;

  // ==========================================
  // 2. DATA TRANSFORMATION FOR CHARTS
  // ==========================================
  const payrollTrend = dashData?.charts?.payrollTrend || [];
  const deptData = (dashData?.charts?.deptHeadcount || []).map((d, i) => ({
    name: d.department, value: d.count, color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));
  const totalHeadcount = deptData.reduce((s, d) => s + d.value, 0);

  return (
    <AppLayout>
      {/* ═══════ BLACK HERO HEADER ═══════ */}
      <div className="bg-black px-6 lg:px-8 pt-6 pb-0">
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div />
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Search size={14} className="text-[#9CA3AF]" />
              <input placeholder="Search..." className="bg-transparent text-white text-xs outline-none w-36 placeholder-[#6B7280]" />
              <kbd className="text-[10px] text-[#6B7280] bg-white/10 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </div>
            <button className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
              <Bell size={16} className="text-[#9CA3AF]" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-[#3B82F6]/20">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between flex-wrap gap-4 pb-5 animate-fade-in-up delay-1">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight">Hi, {firstName}! 👋</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">{isAdmin ? 'This is your HR report today!' : 'Here is your daily snapshot.'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 px-4 py-2 rounded-full text-xs font-semibold transition-all">
              <Download size={13} /> Export
            </button>
            {isAdmin && (
              <button className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-[#3B82F6]/25">
                <Plus size={14} /> New entry
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6 animate-fade-in-up delay-2">
          {['Dashboard', isAdmin ? 'Reports' : 'My Schedule', 'Activity'].map(tab => (
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

        {/* ==========================================
            3. DYNAMIC STAT CARDS RENDERING
            ========================================== 
        */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={s.label} className={`bg-white rounded-2xl p-5 card-shadow animate-fade-in-up delay-${i + 1}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                    <s.icon size={18} className={s.iconColor} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-[#111827]">{s.value}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Middle Row: Tasks + Timeline + Chart ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tasks */}
          <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-3">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[#111827] text-sm">Task To-Do</h3>
              <span className="text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/8 px-2 py-0.5 rounded-full">
                {fallbackTasks.filter(t => t.status === 'pending').length} pending
              </span>
            </div>
            <div className="divide-y divide-[#F5F6F8]">
              {fallbackTasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F5F6F8]/50 transition-colors cursor-pointer">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[t.priority]}`} />
                  <div className="w-7 h-7 rounded-full bg-[#F5F6F8] flex items-center justify-center text-[10px] font-bold text-[#6B7280] shrink-0">{t.assignee}</div>
                  <p className={`text-sm flex-1 ${t.status === 'done' ? 'line-through text-[#D1D5DB]' : 'text-[#111827]'}`}>{t.title}</p>
                  {t.status === 'done' ? <CheckCircle size={14} className="text-[#10B981] shrink-0" /> : <div className="w-4 h-4 rounded-full border border-[#D1D5DB] shrink-0" />}
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
                  {fallbackTimeline.map(t => (
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

          {/* ==========================================
              4. DATA VISUALIZATION (RECHARTS)
              ========================================== 
          */}
          <div className="bg-white rounded-2xl card-shadow p-5 animate-fade-in-up delay-5">
            <h3 className="font-bold text-[#111827] text-sm mb-4">{isAdmin ? 'Payroll Trend' : 'My Attendance'}</h3>
            {payrollTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={payrollTrend} barGap={2}>
                  <XAxis dataKey="label" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="totalNetPay" name="Net Pay" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-[#9CA3AF] text-sm">No payroll data yet</div>
            )}
          </div>
        </div>

        {/* ── Bottom Row: Department Donut (admin) ──── */}
        {isAdmin && deptData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    <p className="text-2xl font-extrabold text-[#111827]">{totalHeadcount}</p>
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
        )}

        {/* Employee payslips (non-admin) */}
        {!isAdmin && dashData?.recentPayslips?.length > 0 && (
          <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[#111827] text-sm">Recent Payslips</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[#9CA3AF] border-b border-[#F5F6F8]">
                  <th className="px-5 py-3 font-semibold">Period</th>
                  <th className="px-5 py-3 font-semibold">Gross</th>
                  <th className="px-5 py-3 font-semibold">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F6F8]">
                {dashData.recentPayslips.map(p => (
                  <tr key={p.id} className="hover:bg-[#F5F6F8]/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#111827]">{p.payrun?.month}/{p.payrun?.year}</td>
                    <td className="px-5 py-3.5 text-sm font-mono text-[#6B7280]">₹{Math.round(Number(p.grossSalary)).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 text-sm font-mono font-bold text-[#111827]">₹{Math.round(Number(p.netPay)).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
