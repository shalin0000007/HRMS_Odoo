import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/endpoints';
import useAuthStore from '../../store/authStore';
import AppLayout from '../../components/AppLayout';
import { 
  Users, Calendar, Clock, DollarSign, 
  Search, Bell, Download, Plus, 
  CheckCircle, Briefcase, Umbrella,
  FileText, Zap, ChevronRight, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/Avatar';
import { getAvatarUrl } from '../../utils/avatar';

const DEPT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const fallbackTasks = [
  { id: 1, title: 'Review leave requests', assignee: 'P', status: 'pending', priority: 'high' },
  { id: 2, title: 'Generate monthly reports', assignee: 'R', status: 'pending', priority: 'medium' },
  { id: 3, title: 'Update payroll rules', assignee: 'A', status: 'done', priority: 'low' },
];

const fallbackTimeline = [
  { id: 1, event: 'Alice requested 2 days leave', time: '10:30 AM', tag: 'LEAVE', tagColor: '#F59E0B' },
  { id: 2, event: 'Payroll for April finalized', time: 'Yesterday', tag: 'PAYROLL', tagColor: '#3B82F6' },
  { id: 3, event: 'New employee joined: Bob', time: '2 days ago', tag: 'EMPLOYEE', tagColor: '#10B981' },
];

const priorityDot = {
  high: 'bg-[#EF4444]',
  medium: 'bg-[#F59E0B]',
  low: 'bg-[#10B981]'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isManagement } = useAuthStore();
  const firstName = user?.firstName || 'User';
  const isAdmin = isManagement();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [localTasks, setLocalTasks] = useState(fallbackTasks);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState([
    { time: '10:00 AM', title: 'Client Pulled: Project Orion', type: 'Meeting', color: '#3B82F6' },
    { time: '01:30 PM', title: 'Internal Client Meeting Done', type: 'Review', color: '#10B981' },
    { time: '04:00 PM', title: 'Weekly Sprint Sync', type: 'Internal', color: '#F59E0B' },
  ]);

  const [newEvent, setNewEvent] = useState({ title: '', time: '', type: 'Meeting', color: '#3B82F6' });

  // ── 1. DATA FETCHING ──
  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard', isAdmin ? 'admin' : 'employee'],
    queryFn: () => isAdmin ? analyticsAPI.getDashboard() : analyticsAPI.getMyStats(),
    select: res => res.data?.data,
    retry: 1,
  });

  // Sync tasks when data arrives
  useEffect(() => {
    if (dashData?.charts?.tasks) {
      setLocalTasks(dashData.charts.tasks);
    }
  }, [dashData]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/employees?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleTask = (id) => {
    setLocalTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t
    ));
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.time) return;
    setEvents(prev => [...prev, newEvent]);
    setNewEvent({ title: '', time: '', type: 'Meeting', color: '#3B82F6' });
    setShowEventModal(false);
  };

  const handleExport = () => {
    window.print();
  };

  // ── Build stats ──
  const adminStats = dashData?.stats ? [
    { label: 'Total Employees', value: String(dashData.stats.totalEmployees || 0), icon: Users,      iconBg: 'bg-[#3B82F6]/10', iconColor: 'text-[#3B82F6]' },
    { label: 'Active Today',    value: String(dashData.stats.activeToday || 0),    icon: Calendar,   iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]' },
    { label: 'Pending Leaves',  value: String(dashData.stats.pendingLeaves || 0),  icon: Clock,      iconBg: 'bg-[#EC4899]/10', iconColor: 'text-[#EC4899]' },
    { label: 'Latest Payrun',   value: dashData.stats.latestPayrun ? `${dashData.stats.latestPayrun.month}/${dashData.stats.latestPayrun.year}` : '—', icon: DollarSign, iconBg: 'bg-[#F59E0B]/10', iconColor: 'text-[#F59E0B]' },
  ] : [];

  const empAttendance = dashData?.thisMonthAttendance || [];
  const presentCount = empAttendance.find(a => a.status === 'present')?._count?.status || 0;
  const totalChecked = empAttendance.reduce((s, a) => s + (a._count?.status || 0), 0);
  const attendancePct = totalChecked > 0 ? Math.round((presentCount / totalChecked) * 100) : '—';
  const totalLeaveBalance = (dashData?.leaveBalances || []).reduce((s, b) => s + (b.totalDays - b.consumed), 0);

  const empStats = [
    { label: 'Attendance Score', value: `${attendancePct}%`, icon: CheckCircle, iconBg: 'bg-[#10B981]/10', iconColor: 'text-[#10B981]' },
    { label: 'Leave Balance',    value: String(totalLeaveBalance || '—'), icon: Umbrella,   iconBg: 'bg-[#3B82F6]/10', iconColor: 'text-[#3B82F6]' },
    { label: 'Recent Payslips',  value: String(dashData?.recentPayslips?.length || 0), icon: Briefcase,  iconBg: 'bg-[#F59E0B]/10', iconColor: 'text-[#F59E0B]' },
    { label: 'Department',       value: dashData?.profile?.department || '—', icon: Calendar,   iconBg: 'bg-[#8B5CF6]/10', iconColor: 'text-[#8B5CF6]' },
  ];

  const stats = isAdmin ? adminStats : empStats;
  const payrollTrend = dashData?.charts?.payrollTrend || [];
  const deptData = (dashData?.charts?.deptHeadcount || []).map((d, i) => ({
    name: d.department, value: d.count, color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));
  const totalHeadcount = deptData.reduce((s, d) => s + d.value, 0);

  return (
    <AppLayout>
      <style>{`
        @media print {
          nav, aside, button, header, .no-print { display: none !important; }
          .print-area { margin: 0; padding: 20px !important; background: white !important; }
          .bg-black { background: white !important; padding: 0 !important; }
          .text-white { color: #111827 !important; }
          .text-[#9CA3AF] { color: #6B7280 !important; }
          .card-shadow { box-shadow: none !important; border: 1px solid #E5E7EB; }
          .animate-fade-in-up { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <div className="bg-black px-6 lg:px-8 pt-6 pb-0 no-print">
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div />
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 border border-white/5 focus-within:border-white/20 transition-all">
              <Search size={14} className="text-[#9CA3AF]" />
              <input 
                placeholder="Search employees..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="bg-transparent text-white text-xs outline-none w-36 placeholder-[#6B7280]" 
              />
              <kbd className="text-[10px] text-[#6B7280] bg-white/10 px-1.5 py-0.5 rounded font-mono">↵</kbd>
            </div>
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)} 
                className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
              >
                <Bell size={16} className="text-[#9CA3AF]" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-black" />
              </button>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden shadow-lg shadow-[#3B82F6]/20">
              <Avatar user={user} className="w-full h-full" />
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between flex-wrap gap-4 pb-5 animate-fade-in-up delay-1">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight">Hi, {firstName}! 👋</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">{isAdmin ? 'This is your HR report today!' : 'Here is your daily snapshot.'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 px-4 py-2 rounded-full text-xs font-semibold transition-all">
              <Download size={13} /> Export PDF
            </button>
            {isAdmin && (
              <button onClick={() => navigate('/employees')} className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-[#3B82F6]/25">
                <Plus size={14} /> New entry
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6 animate-fade-in-up delay-2">
          {['Dashboard', 'My Schedule', 'Activity'].map(tab => (
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

      <div className="p-6 lg:p-8 space-y-6 print-area">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse card-shadow" />)}
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

        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-3">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
                  <h3 className="font-bold text-[#111827] text-sm">Task To-Do</h3>
                  <span className="text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/8 px-2 py-0.5 rounded-full">
                    {localTasks.filter(t => t.status === 'pending').length} pending
                  </span>
                </div>
                <div className="divide-y divide-[#F5F6F8]">
                  {localTasks.map(t => (
                    <div key={t.id} onClick={() => toggleTask(t.id)}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F5F6F8]/50 transition-colors cursor-pointer group">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[t.priority] || 'bg-gray-400'}`} />
                      <div className="w-7 h-7 rounded-full bg-[#F5F6F8] flex items-center justify-center text-[10px] font-bold text-[#6B7280] shrink-0">{t.assignee}</div>
                      <p className={`text-sm flex-1 ${t.status === 'done' ? 'line-through text-[#D1D5DB]' : 'text-[#111827]'}`}>{t.title}</p>
                      {t.status === 'done' ? <CheckCircle size={14} className="text-[#10B981] shrink-0" /> : <div className="w-4 h-4 rounded-full border border-[#D1D5DB] group-hover:border-[#3B82F6] shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

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

              <div className="bg-white rounded-2xl card-shadow p-5 animate-fade-in-up delay-5">
                <h3 className="font-bold text-[#111827] text-sm mb-4">{isAdmin ? 'Payroll Trend' : 'My Attendance'}</h3>
                {payrollTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={payrollTrend} barGap={2}>
                      <XAxis dataKey="label" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="totalNetPay" name="Net Pay" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-[#9CA3AF] text-sm text-center">
                    <div className="space-y-2">
                      <Zap size={24} className="mx-auto text-[#E5E7EB]" />
                      <p>No payroll data found.<br/>Wait for next payrun.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'my schedule' && (
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#111827] text-lg">Upcoming Schedule</h3>
              <button onClick={() => setShowEventModal(true)} className="text-[#3B82F6] text-xs font-bold">+ Add Event</button>
            </div>
            <div className="space-y-4">
              {events.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[#F5F6F8]/50 hover:bg-[#F5F6F8] transition-colors group cursor-pointer">
                  <div className="w-16 text-xs font-mono text-[#9CA3AF]">{item.time}</div>
                  <div className="w-1 h-8 rounded-full" style={{ background: item.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#111827]">{item.title}</p>
                    <p className="text-[10px] text-[#6B7280]">{item.type}</p>
                  </div>
                  <ChevronRight size={14} className="text-[#D1D5DB] group-hover:text-[#3B82F6] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}

        {showEventModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#111827]">New Event</h3>
                <button onClick={() => setShowEventModal(false)} className="text-[#9CA3AF] hover:text-[#111827]"><X size={20}/></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1.5">Event Title</label>
                  <input 
                    className="w-full bg-[#F5F6F8] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#3B82F6]" 
                    placeholder="Meeting with..."
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1.5">Time</label>
                    <input 
                      type="time"
                      className="w-full bg-[#F5F6F8] border-none rounded-xl px-4 py-3 text-sm" 
                      value={newEvent.time}
                      onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1.5">Type</label>
                    <select 
                      className="w-full bg-[#F5F6F8] border-none rounded-xl px-4 py-3 text-sm"
                      value={newEvent.type}
                      onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                    >
                      <option>Meeting</option>
                      <option>Review</option>
                      <option>Focus</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleAddEvent}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3.5 rounded-full text-sm mt-4 shadow-lg shadow-[#3B82F6]/25"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up">
            <h3 className="font-bold text-[#111827] text-lg mb-6">Detailed Activity Log</h3>
            <div className="space-y-6">
              <p className="text-sm text-[#6B7280]">No recent system activity found.</p>
            </div>
          </div>
        )}

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
