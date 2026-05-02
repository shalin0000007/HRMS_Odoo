import { useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import useAuthStore from '../../store/authStore';
import { Clock, MapPin, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const weeklyTrend = [
  { day: 'Mon', pct: 96 }, { day: 'Tue', pct: 94 }, { day: 'Wed', pct: 98 },
  { day: 'Thu', pct: 91 }, { day: 'Fri', pct: 87 },
];

const todayLog = [
  { id: 1, employee: 'Alice Fernandes', checkIn: '09:02 AM', status: 'On Time', location: 'Office — Mumbai' },
  { id: 2, employee: 'Bob Sharma',      checkIn: '09:45 AM', status: 'Late',    location: 'Remote' },
  { id: 3, employee: 'Priya Nair',      checkIn: '08:55 AM', status: 'On Time', location: 'Office — Mumbai' },
  { id: 4, employee: 'Raj Mehta',       checkIn: '—',        status: 'Absent',  location: '—' },
];

const calendarDays = Array.from({ length: 30 }, (_, i) => {
  const statuses = ['present','present','present','present','late','absent'];
  return { day: i + 1, status: (i + 1) % 7 === 0 ? 'weekend' : statuses[i % 6] };
});

const statusColors = { present: 'bg-[#10B981]', late: 'bg-[#F59E0B]', absent: 'bg-[#EF4444]', weekend: 'bg-[#E5E7EB]' };
const statusBg = { present: 'bg-[#10B981]/8 text-[#10B981]', late: 'bg-[#F59E0B]/8 text-[#F59E0B]', absent: 'bg-[#EF4444]/8 text-[#EF4444]', weekend: 'bg-[#F5F6F8] text-[#D1D5DB]' };
const logStatusStyle = { 'On Time': 'bg-[#10B981]/8 text-[#10B981]', Late: 'bg-[#F59E0B]/8 text-[#F59E0B]', Absent: 'bg-[#EF4444]/8 text-[#EF4444]' };

const Tip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return <div className="bg-[#111827] text-white px-4 py-2 rounded-xl shadow-xl text-xs"><strong>{label}</strong>: {payload[0]?.value}%</div>;
};

export default function Attendance() {
  const { user } = useAuthStore();
  const isManager = ['admin', 'hr_officer'].includes(user?.role);
  const [checkedIn, setCheckedIn] = useState(false);

  return (
    <AppLayout>
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Attendance</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">Track check-ins and working hours</p>
          </div>
          <button id="check-in-btn" onClick={() => setCheckedIn(!checkedIn)}
            className={`flex items-center gap-2 font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-lg ${
              checkedIn ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-[#EF4444]/25' : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-[#3B82F6]/25'
            }`}>
            <Clock size={15} /> {checkedIn ? 'Check Out' : 'Check In'}
          </button>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-5">
        {checkedIn && (
          <div className="flex items-center gap-3 bg-[#10B981]/8 border border-[#10B981]/15 rounded-xl px-5 py-3 animate-fade-in-up">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#10B981] font-semibold text-sm">Checked in since 09:00 AM</span>
            <span className="text-[#9CA3AF] text-xs ml-auto font-mono">2h 15m elapsed</span>
          </div>
        )}

        {/* Trend chart */}
        <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-1">
          <h3 className="font-bold text-[#111827] text-sm mb-4">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#D1D5DB" fontSize={11} tickLine={false} axisLine={false} domain={[80, 100]} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="pct" stroke="#3B82F6" strokeWidth={2} fill="url(#blueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[#111827] text-sm">May 2025</h3>
            <div className="flex gap-3">
              {Object.entries(statusColors).map(([key, cls]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${cls}`} />
                  <span className="text-[10px] text-[#9CA3AF] capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
              <div key={`hdr-${i}`} className="text-center text-[10px] text-[#9CA3AF] font-semibold uppercase pb-2">{d}</div>
            ))}
            {calendarDays.map(d => (
              <div key={`day-${d.day}`} className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all hover:scale-105 ${statusBg[d.status]}`}>
                {d.day}
              </div>
            ))}
          </div>
        </div>

        {/* Today's log */}
        {isManager && (
          <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-3">
            <div className="px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[#111827] text-sm">Today's Check-ins</h3>
            </div>
            <div className="divide-y divide-[#F5F6F8]">
              {todayLog.map(l => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F5F6F8]/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {l.employee.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#111827] text-sm">{l.employee}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[#9CA3AF] flex items-center gap-1"><Clock size={10} />{l.checkIn}</span>
                      <span className="text-xs text-[#9CA3AF] flex items-center gap-1"><MapPin size={10} />{l.location}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${logStatusStyle[l.status]}`}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
