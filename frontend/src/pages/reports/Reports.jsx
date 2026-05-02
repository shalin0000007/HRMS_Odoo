import AppLayout from '../../components/AppLayout';
import { Download, TrendingUp, Users, Calendar, DollarSign, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// ==========================================
// 1. ANALYTICS DATA (DEMO)
// ==========================================
// These datasets are currently static for the presentation demo.
// They illustrate workforce patterns like Payroll Trends, Attendance, and Department Distribution.
const payrollTrend = [
  { month: 'Jan', amount: 195000 }, { month: 'Feb', amount: 200000 },
  { month: 'Mar', amount: 214000 }, { month: 'Apr', amount: 237000 },
  { month: 'May', amount: 237500 }, { month: 'Jun', amount: 240000 },
];

const attendanceTrend = [
  { month: 'Jan', pct: 94 }, { month: 'Feb', pct: 92 },
  { month: 'Mar', pct: 96 }, { month: 'Apr', pct: 93 },
  { month: 'May', pct: 95 },
];

const leaveData = [
  { type: 'Casual', used: 8, total: 10 },
  { type: 'Sick', used: 3, total: 12 },
  { type: 'Unpaid', used: 2, total: 5 },
];

const deptStrength = [
  { name: 'Engineering', value: 18, color: '#3B82F6' },
  { name: 'Sales', value: 12, color: '#10B981' },
  { name: 'HR', value: 8, color: '#EC4899' },
  { name: 'Finance', value: 6, color: '#F59E0B' },
  { name: 'Product', value: 6, color: '#8B5CF6' },
];

const lateArrivals = [
  { week: 'W1', count: 3 }, { week: 'W2', count: 5 },
  { week: 'W3', count: 2 }, { week: 'W4', count: 4 },
];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#111827] text-white px-4 py-2 rounded-xl shadow-xl text-xs">
      <strong>{label}</strong>: {payload[0]?.value}{typeof payload[0]?.value === 'number' && payload[0]?.value > 1000 ? '' : '%'}
    </div>
  );
};

export default function Reports() {
  return (
    <AppLayout>
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Reports</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">Analytics and workforce insights</p>
          </div>
          <button className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white px-4 py-2 rounded-full text-xs font-semibold transition-all">
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>


      <div className="p-6 lg:p-8 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Employees', value: '50', icon: Users, color: '#3B82F6' },
            { label: 'Avg Attendance', value: '94.2%', icon: Calendar, color: '#10B981' },
            { label: 'Monthly Payroll', value: '₹2.37L', icon: DollarSign, color: '#F59E0B' },
            { label: 'Late Arrivals', value: '14/mo', icon: Clock, color: '#EC4899' },
          ].map((s, i) => (
            <div key={s.label} className={`bg-white rounded-2xl card-shadow p-5 animate-fade-in-up delay-${i + 1}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}12` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-extrabold text-[#111827]">{s.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div> "print" hello</div>
        {/* ==========================================
            2. VISUALIZATION ROW 1: TRENDS
            ========================================== 
            We use AreaChart for financial growth and LineChart for percentage stability.
            These provide high-level insights for management decision making.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Payroll trend */}
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-3">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Payroll Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={payrollTrend}>
                <defs>
                  <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} fill="url(#payGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance trend */}
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-4">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={attendanceTrend}>
                <XAxis dataKey="month" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} domain={[85, 100]} />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="pct" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Leave usage */}
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-5">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Leave Usage</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={leaveData} layout="vertical" barSize={14}>
                <XAxis type="number" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="type" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} width={55} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="used" name="Used" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dept distribution */}
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-5">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Department Distribution</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie data={deptStrength} dataKey="value" innerRadius={40} outerRadius={58} paddingAngle={3} strokeWidth={0}>
                      {deptStrength.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-lg font-extrabold text-[#111827]">50</p>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {deptStrength.map(d => (
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

          {/* ==========================================
              3. VISUALIZATION ROW 2: DETAILED STATS
              ========================================== 
              Bar charts and Pie charts are used to show structural data like 
              Leave consumption and Department-wise headcount.
          */}
          {/* Late arrivals */}
          <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-6">
            <h3 className="font-bold text-[#111827] text-sm mb-4">Late Arrivals / Week</h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={lateArrivals} barSize={24}>
                <XAxis dataKey="week" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="count" fill="#EC4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
