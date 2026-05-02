import { useState } from 'react';
import AppLayout from '../../components/AppLayout';
import useAuthStore from '../../store/authStore';
import { Clock, MapPin, ChevronLeft, ChevronRight, CalendarDays, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/* ── Data ──────────────────────────────────────────────────────── */
const weeklyTrend = [
  { day: 'Mon', pct: 96 }, { day: 'Tue', pct: 94 }, { day: 'Wed', pct: 98 },
  { day: 'Thu', pct: 91 }, { day: 'Fri', pct: 87 },
];

const todayLog = [
  { id: 1, employee: 'Alice Fernandes', checkIn: '09:02 AM', checkOut: '06:15 PM', hours: '9h 13m', status: 'On Time', location: 'Office — Mumbai' },
  { id: 2, employee: 'Bob Sharma',      checkIn: '09:45 AM', checkOut: '—',        hours: '—',      status: 'Late',    location: 'Remote' },
  { id: 3, employee: 'Priya Nair',      checkIn: '08:55 AM', checkOut: '05:30 PM', hours: '8h 35m', status: 'On Time', location: 'Office — Mumbai' },
  { id: 4, employee: 'Raj Mehta',       checkIn: '—',        checkOut: '—',        hours: '—',      status: 'Absent',  location: '—' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* Generate realistic attendance data for a month */
function generateMonthData(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const days = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: null, status: 'empty' });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFuture = isCurrentMonth && d > todayDate;
    const isToday = isCurrentMonth && d === todayDate;

    let status = 'present';
    let checkIn = null;
    let note = null;

    if (isWeekend) {
      status = 'weekend';
    } else if (isFuture) {
      status = 'future';
    } else {
      // Deterministic but varied pattern
      const seed = (d * 7 + month * 3) % 10;
      if (seed === 0) { status = 'absent'; note = 'No show'; }
      else if (seed === 1) { status = 'late'; checkIn = '10:15 AM'; }
      else if (seed === 3) { status = 'half_day'; checkIn = '09:00 AM'; note = 'Left early'; }
      else if (seed === 5) { status = 'leave'; note = 'Sick Leave'; }
      else { status = 'present'; checkIn = `0${8 + (d % 2)}:${String(d % 60).padStart(2, '0')} AM`; }
    }

    days.push({ day: d, status, isToday, isWeekend, isFuture, checkIn, note });
  }

  return days;
}

/* ── Status styling maps ──────────────────────────────────────── */
const statusConfig = {
  present:  { dot: 'bg-[#10B981]', bg: 'bg-white hover:bg-[#F0FDF4]',     text: 'text-[#111827]', label: 'Present',  ring: 'ring-[#10B981]/20' },
  late:     { dot: 'bg-[#F59E0B]', bg: 'bg-white hover:bg-[#FFFBEB]',     text: 'text-[#111827]', label: 'Late',     ring: 'ring-[#F59E0B]/20' },
  absent:   { dot: 'bg-[#EF4444]', bg: 'bg-white hover:bg-[#FEF2F2]',     text: 'text-[#111827]', label: 'Absent',   ring: 'ring-[#EF4444]/20' },
  leave:    { dot: 'bg-[#3B82F6]', bg: 'bg-white hover:bg-[#EFF6FF]',     text: 'text-[#111827]', label: 'Leave',    ring: 'ring-[#3B82F6]/20' },
  half_day: { dot: 'bg-[#8B5CF6]', bg: 'bg-white hover:bg-[#F5F3FF]',     text: 'text-[#111827]', label: 'Half Day', ring: 'ring-[#8B5CF6]/20' },
  weekend:  { dot: 'bg-[#E5E7EB]', bg: 'bg-[#FAFAFA]',                    text: 'text-[#D1D5DB]', label: 'Weekend',  ring: '' },
  future:   { dot: 'bg-transparent', bg: 'bg-white',                       text: 'text-[#D1D5DB]', label: 'Upcoming', ring: '' },
  empty:    { dot: '', bg: '', text: '', label: '', ring: '' },
};

const logStatusStyle = {
  'On Time': 'bg-[#10B981]/8 text-[#10B981]',
  Late:      'bg-[#F59E0B]/8 text-[#F59E0B]',
  Absent:    'bg-[#EF4444]/8 text-[#EF4444]',
};

const Tip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return <div className="bg-[#111827] text-white px-4 py-2 rounded-xl shadow-xl text-xs"><strong>{label}</strong>: {payload[0]?.value}%</div>;
};

/* ── Component ─────────────────────────────────────────────────── */
export default function Attendance() {
  const { user } = useAuthStore();
  const isManager = ['admin', 'hr_officer'].includes(user?.role);
  const [checkedIn, setCheckedIn] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const days = generateMonthData(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };
  const goToday = () => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); };

  // Stats for the month
  const stats = days.reduce((acc, d) => {
    if (d.status === 'present' || d.status === 'late' || d.status === 'half_day') acc.worked++;
    if (d.status === 'absent') acc.absent++;
    if (d.status === 'leave') acc.leave++;
    if (d.status === 'late') acc.late++;
    return acc;
  }, { worked: 0, absent: 0, leave: 0, late: 0 });

  return (
    <AppLayout>
      {/* Black hero header */}
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Attendance</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">Track check-ins, working hours, and patterns</p>
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
        {/* Live check-in bar */}
        {checkedIn && (
          <div className="flex items-center gap-3 bg-[#10B981]/8 border border-[#10B981]/15 rounded-xl px-5 py-3 animate-fade-in-up">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#10B981] font-semibold text-sm">Checked in since 09:00 AM</span>
            <span className="text-[#9CA3AF] text-xs ml-auto font-mono">2h 15m elapsed</span>
          </div>
        )}

        {/* Monthly stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up delay-1">
          {[
            { label: 'Days Worked', value: stats.worked, icon: CalendarDays, color: '#10B981' },
            { label: 'Absent',      value: stats.absent,  icon: AlertCircle,  color: '#EF4444' },
            { label: 'On Leave',    value: stats.leave,   icon: Users,        color: '#3B82F6' },
            { label: 'Late Arrivals', value: stats.late,  icon: TrendingUp,   color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl card-shadow px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#111827]">{s.value}</p>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══════ PREMIUM CALENDAR ═══════ */}
        <div className="bg-white rounded-2xl card-shadow-lg overflow-hidden animate-fade-in-up delay-2">
          {/* Calendar Header — dark strip */}
          <div className="bg-[#111827] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <ChevronLeft size={16} className="text-white" />
              </button>
              <div className="text-center min-w-[160px]">
                <h3 className="text-lg font-extrabold text-white">{MONTHS[viewMonth]} {viewYear}</h3>
              </div>
              <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <ChevronRight size={16} className="text-white" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={goToday} className="text-xs font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-full transition-all">
                Today
              </button>
              {/* Legend */}
              <div className="hidden lg:flex items-center gap-3 ml-3">
                {[
                  { label: 'Present', color: '#10B981' },
                  { label: 'Late',    color: '#F59E0B' },
                  { label: 'Absent',  color: '#EF4444' },
                  { label: 'Leave',   color: '#3B82F6' },
                  { label: 'Half',    color: '#8B5CF6' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span className="text-[10px] text-white/50">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[#F5F6F8]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div key={d} className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider ${
                i === 0 || i === 6 ? 'text-[#D1D5DB]' : 'text-[#9CA3AF]'
              }`}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((d, i) => {
              if (d.status === 'empty') {
                return <div key={`e-${i}`} className="min-h-[80px] bg-[#FAFAFA] border-b border-r border-[#F5F6F8]" />;
              }

              const cfg = statusConfig[d.status];
              const isHovered = hoveredDay === i;

              return (
                <div
                  key={`d-${i}`}
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`relative min-h-[80px] p-2 border-b border-r border-[#F5F6F8] transition-all duration-150 cursor-default
                    ${cfg.bg}
                    ${d.isToday ? 'ring-2 ring-inset ring-[#3B82F6]/40 bg-[#EFF6FF]/50' : ''}
                    ${isHovered && d.status !== 'future' ? `ring-1 ring-inset ${cfg.ring}` : ''}
                  `}
                >
                  {/* Day number + status dot */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${d.isToday ? 'text-[#3B82F6]' : cfg.text} ${d.status === 'future' ? 'text-[#E5E7EB]' : ''}`}>
                      {d.isToday ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#3B82F6] text-white text-xs font-bold">
                          {d.day}
                        </span>
                      ) : d.day}
                    </span>
                    {d.status !== 'weekend' && d.status !== 'future' && (
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    )}
                  </div>

                  {/* Status label + check-in time */}
                  {d.status !== 'weekend' && d.status !== 'future' && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: cfg.dot.includes('10B981') ? '#10B981' : cfg.dot.includes('F59E0B') ? '#F59E0B' : cfg.dot.includes('EF4444') ? '#EF4444' : cfg.dot.includes('3B82F6') ? '#3B82F6' : '#8B5CF6' }}>
                        {cfg.label}
                      </p>
                      {d.checkIn && (
                        <p className="text-[9px] text-[#9CA3AF] font-mono">{d.checkIn}</p>
                      )}
                      {d.note && (
                        <p className="text-[9px] text-[#D1D5DB] italic truncate">{d.note}</p>
                      )}
                    </div>
                  )}

                  {/* Weekend label */}
                  {d.status === 'weekend' && (
                    <p className="text-[9px] text-[#E5E7EB] uppercase tracking-wider mt-1">Off</p>
                  )}

                  {/* Hover tooltip */}
                  {isHovered && d.status !== 'empty' && d.status !== 'future' && d.status !== 'weekend' && (
                    <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#111827] text-white px-3 py-2 rounded-xl shadow-xl text-xs whitespace-nowrap animate-fade-in">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className="font-bold">{MONTHS[viewMonth]} {d.day}</span>
                      </div>
                      <p className="text-[#9CA3AF]">Status: <span className="text-white">{cfg.label}</span></p>
                      {d.checkIn && <p className="text-[#9CA3AF]">Check-in: <span className="text-white font-mono">{d.checkIn}</span></p>}
                      {d.note && <p className="text-[#9CA3AF]">Note: <span className="text-white italic">{d.note}</span></p>}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#111827] rotate-45 -mt-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend for mobile */}
          <div className="lg:hidden px-5 py-3 border-t border-[#F5F6F8] flex flex-wrap gap-3">
            {[
              { label: 'Present', color: '#10B981' },
              { label: 'Late',    color: '#F59E0B' },
              { label: 'Absent',  color: '#EF4444' },
              { label: 'Leave',   color: '#3B82F6' },
              { label: 'Half Day', color: '#8B5CF6' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                <span className="text-[10px] text-[#9CA3AF]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trend chart */}
        <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-3">
          <h3 className="font-bold text-[#111827] text-sm mb-4">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={140}>
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

        {/* Today's log */}
        {isManager && (
          <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-4">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="font-bold text-[#111827] text-sm">Today's Check-ins</h3>
              <span className="text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/8 px-2 py-0.5 rounded-full">{todayLog.length} entries</span>
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
                      {l.hours !== '—' && <span className="text-xs text-[#9CA3AF]">· {l.hours}</span>}
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
