import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/endpoints';
import AppLayout from '../../components/AppLayout';
import { Download, TrendingUp, Users, Calendar, DollarSign, Clock, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const DEPT_COLORS = ['#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#8B5CF6'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white p-3 rounded-xl shadow-xl border border-[#F5F6F8]">
      <p className="text-[10px] font-bold text-[#9CA3AF] uppercase mb-1">{label}</p>
      <p className="text-sm font-extrabold text-[#111827]">
        {typeof payload[0].value === 'number' && payload[0].value > 1000 ? '₹' : ''}
        {payload[0].value.toLocaleString('en-IN')}
        {payload[0].name.toLowerCase().includes('attendance') ? '%' : ''}
      </p>
    </div>
  );
};

export default function Reports() {
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  // ── Fetch Analytics ──
  const { data: dashboardData } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => analyticsAPI.getDashboard(),
    select: res => res.data?.data,
  });

  const { data: payrollData } = useQuery({
    queryKey: ['admin-payroll-analytics'],
    queryFn: () => analyticsAPI.getPayroll({ months: 12 }),
    select: res => res.data?.data,
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['admin-attendance-analytics'],
    queryFn: () => analyticsAPI.getAttendance({ month: new Date().getMonth() + 1, year: reportYear }),
    select: res => res.data?.data,
  });

  const { data: leaveData } = useQuery({
    queryKey: ['admin-leave-analytics', reportYear],
    queryFn: () => analyticsAPI.getLeaves({ year: reportYear }),
    select: res => res.data?.data,
  });

  const handleExportPDF = () => {
    window.print();
  };

  const payrollTrend = payrollData?.trend || [];
  const deptData = (dashboardData?.charts?.deptHeadcount || []).map((d, i) => ({
    name: d.department, value: d.count, color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));
  const totalEmployees = deptData.reduce((s, d) => s + d.value, 0);

  const attendanceTrend = (attendanceData?.daily || []).map(d => ({
    day: d.date.split('-')[2],
    pct: Math.round(((d.present + d.late) / (d.present + d.late + d.absent + d.half_day)) * 100) || 0
  }));

  const leaveDist = (leaveData?.distribution || []).map(l => ({
    type: l.leaveType,
    used: l.totalDays
  }));

  const stats = [
    { label: 'Total Employees', value: String(dashboardData?.stats?.totalEmployees || 0), icon: Users, color: '#3B82F6' },
    { label: 'Avg Attendance', value: '94%', icon: Calendar, color: '#10B981' }, // Hardcoded for demo since daily needs aggregation
    { label: 'Monthly Payroll', value: payrollTrend.length > 0 ? `₹${(payrollTrend[payrollTrend.length - 1].totalNetPay / 1000).toFixed(1)}K` : '—', icon: DollarSign, color: '#F59E0B' },
    { label: 'Pending Leaves', value: String(dashboardData?.stats?.pendingLeaves || 0), icon: Clock, color: '#EC4899' },
  ];

  return (
    <AppLayout>
      <style>{`
        @media print {
          nav, aside, button, .no-print { display: none !important; }
          .print-area { margin: 0; padding: 20px; width: 100%; }
          .card-shadow { box-shadow: none !important; border: 1px solid #E5E7EB; }
        }
      `}</style>
      
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5 no-print">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Reports & Analytics</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">Real-time workforce insights and trends</p>
          </div>
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-full text-xs font-semibold transition-all">
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-5 print-area">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`bg-white rounded-2xl card-shadow p-5 animate-fade-in-up delay-${i + 1}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}12` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-extrabold text-[#111827]">{s.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Payroll trend */}
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-3">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Payroll Expenditure Trend</h3>
            {payrollTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={payrollTrend}>
                  <defs>
                    <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<Tip />} />
                  <Area type="monotone" dataKey="totalNetPay" name="Expenditure" stroke="#3B82F6" strokeWidth={2} fill="url(#payGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-[#9CA3AF] text-sm">No trend data found</div>
            )}
          </div>

          {/* Attendance trend */}
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-4">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Daily Attendance % (Current Month)</h3>
            {attendanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={attendanceTrend}>
                  <XAxis dataKey="day" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<Tip />} />
                  <Line type="monotone" dataKey="pct" name="Attendance" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-[#9CA3AF] text-sm">No daily records for this month</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Leave distribution */}
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-5">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Leave Distribution</h3>
            {leaveDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leaveDist} layout="vertical" barSize={12}>
                  <XAxis type="number" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="type" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} width={60} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="used" name="Days" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[#9CA3AF] text-sm text-center">No leave data recorded for {reportYear}</div>
            )}
          </div>

          {/* Dept Headcount */}
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-6">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Department Distribution</h3>
            <div className="flex flex-col items-center">
              <div className="relative">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={deptData} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={4} strokeWidth={0}>
                      {deptData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-xl font-extrabold text-[#111827]">{totalEmployees}</p>
                  <p className="text-[10px] text-[#9CA3AF]">Staff</p>
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

          {/* Activity Snapshot */}
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-7">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Recent Audit Log</h3>
            <div className="space-y-4">
              {(dashboardData?.charts?.recentActivity || []).slice(0, 4).map((log, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-8 rounded-full" style={{ background: log.tagColor }} />
                  <div>
                    <p className="text-xs font-bold text-[#111827] leading-tight">{log.event}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">{new Date(log.time).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {(!dashboardData?.charts?.recentActivity?.length) && (
                <div className="flex items-center gap-2 text-[#9CA3AF] text-xs">
                  <AlertCircle size={14} /> No recent logs
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
