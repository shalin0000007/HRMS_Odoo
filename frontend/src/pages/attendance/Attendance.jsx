import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/AppLayout';
import useAuthStore from '../../store/authStore';
import { Clock, ChevronLeft, ChevronRight, CalendarDays, Users, TrendingUp, AlertCircle, Edit3, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { attendanceAPI } from '../../api/endpoints';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const statusConfig = {
  present:  { dot: 'bg-[#10B981]', bg: 'bg-white hover:bg-[#F0FDF4]', text: 'text-[#111827]', label: 'Present',  ring: 'ring-[#10B981]/20', color: '#10B981' },
  late:     { dot: 'bg-[#F59E0B]', bg: 'bg-white hover:bg-[#FFFBEB]', text: 'text-[#111827]', label: 'Late',     ring: 'ring-[#F59E0B]/20', color: '#F59E0B' },
  absent:   { dot: 'bg-[#EF4444]', bg: 'bg-white hover:bg-[#FEF2F2]', text: 'text-[#111827]', label: 'Absent',   ring: 'ring-[#EF4444]/20', color: '#EF4444' },
  half_day: { dot: 'bg-[#8B5CF6]', bg: 'bg-white hover:bg-[#F5F3FF]', text: 'text-[#111827]', label: 'Half Day', ring: 'ring-[#8B5CF6]/20', color: '#8B5CF6' },
  leave:    { dot: 'bg-[#3B82F6]', bg: 'bg-white hover:bg-[#EFF6FF]', text: 'text-[#111827]', label: 'Leave',    ring: 'ring-[#3B82F6]/20', color: '#3B82F6' },
  weekend:  { dot: 'bg-[#E5E7EB]', bg: 'bg-[#FAFAFA]',               text: 'text-[#D1D5DB]', label: 'Weekend',  ring: '', color: '#E5E7EB' },
  future:   { dot: 'bg-transparent', bg: 'bg-white',                  text: 'text-[#D1D5DB]', label: 'Upcoming', ring: '', color: '#D1D5DB' },
  empty:    { dot: '', bg: '', text: '', label: '', ring: '', color: '' },
};

// ==========================================
// 1. CALENDAR DATA BUILDER
// ==========================================
// This helper function takes the raw backend attendance records (which only include actual check-in days)
// and maps them onto a complete 31-day calendar matrix so the UI can draw the grid correctly.
// It also figures out which days are weekends vs. future days.
function buildCalendar(year, month, records) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();
  const recordMap = {};
  (records || []).forEach(r => {
    const d = new Date(r.date).getDate();
    recordMap[d] = r;
  });
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push({ day: null, status: 'empty' });
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isFuture = isCurrentMonth && d > todayDate;
    const isToday = isCurrentMonth && d === todayDate;
    const rec = recordMap[d];
    let status = 'future';
    let clockIn = null;
    if (isWeekend) status = 'weekend';
    else if (rec) { status = rec.status; clockIn = rec.clockIn ? new Date(rec.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null; }
    else if (!isFuture) status = 'absent';
    days.push({ day: d, status, isToday, isWeekend, isFuture, clockIn, recordId: rec?.id });
  }
  return days;
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return <div className="bg-[#111827] text-white px-4 py-2 rounded-xl shadow-xl text-xs"><strong>{label}</strong>: {payload[0]?.value}%</div>;
};

export default function Attendance() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isManager = ['admin', 'hr_officer'].includes(user?.role);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // ==========================================
  // 2. FETCH TODAY'S CLOCK-IN STATUS
  // ==========================================
  // Checks if the logged-in user has already clocked in today.
  // This powers the dynamic Check In / Check Out button in the header.
  const { data: todayStatus } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceAPI.getTodayStatus(),
    select: res => res.data,
  });
  const clockedIn = todayStatus?.clockedIn || false;
  const todayRecord = todayStatus?.data;

  // Fetch my attendance for the calendar
  const { data: myAttendance } = useQuery({
    queryKey: ['my-attendance', viewMonth + 1, viewYear],
    queryFn: () => attendanceAPI.getMyAttendance(viewMonth + 1, viewYear),
    select: res => res.data?.data,
  });

  const days = buildCalendar(viewYear, viewMonth, myAttendance?.records);
  const summary = myAttendance?.summary || { present: 0, late: 0, absent: 0, halfDay: 0 };

  // Fetch all attendance for managers (today's log)
  const { data: allAttendance } = useQuery({
    queryKey: ['all-attendance-today'],
    queryFn: () => attendanceAPI.getAll({ month: today.getMonth() + 1, year: today.getFullYear(), limit: 10 }),
    select: res => res.data?.data || [],
    enabled: isManager,
  });

  // ==========================================
  // 3. CLOCK IN / OUT MUTATIONS
  // ==========================================
  // When the user clicks the check-in button, we call the backend.
  // On success, we tell React Query to instantly refresh both the "today status" and "my calendar"
  // so the UI updates in real time without refreshing the page.
  const clockInMut = useMutation({
    mutationFn: () => attendanceAPI.clockIn(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['attendance-today'] }); queryClient.invalidateQueries({ queryKey: ['my-attendance'] }); },
  });
  const clockOutMut = useMutation({
    mutationFn: () => attendanceAPI.clockOut(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['attendance-today'] }); queryClient.invalidateQueries({ queryKey: ['my-attendance'] }); },
  });

  // Admin mutation to manually fix/override someone's attendance record
  const overrideMut = useMutation({
    mutationFn: ({ id, status, overrideNote }) => attendanceAPI.override(id, { status, overrideNote }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-attendance-today'] }); setOverrideModal(null); },
  });

  // Decides whether to clock-in or clock-out based on current state
  const handleClockToggle = () => {
    if (clockedIn && !todayRecord?.clockOut) clockOutMut.mutate();
    else if (!clockedIn) clockInMut.mutate();
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };
  const goToday = () => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); };

  const weeklyTrend = [{ day: 'Mon', pct: summary.present > 0 ? 96 : 0 }, { day: 'Tue', pct: 94 }, { day: 'Wed', pct: 98 }, { day: 'Thu', pct: 91 }, { day: 'Fri', pct: 87 }];

  const logStatusStyle = { present: 'bg-[#10B981]/8 text-[#10B981]', late: 'bg-[#F59E0B]/8 text-[#F59E0B]', absent: 'bg-[#EF4444]/8 text-[#EF4444]', half_day: 'bg-[#8B5CF6]/8 text-[#8B5CF6]' };

  return (
    <AppLayout>
      <style>{`
        @media print {
          nav, aside, button, header, .no-print { display: none !important; }
          .print-area { margin: 0; padding: 20px !important; background: white !important; }
          .bg-black { background: white !important; padding: 0 !important; }
          .text-white { color: #111827 !important; }
          .card-shadow { box-shadow: none !important; border: 1px solid #E5E7EB; }
        }
      `}</style>

      <div className="bg-black px-6 lg:px-8 pt-6 pb-5 no-print">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Attendance</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">Track check-ins, working hours, and patterns</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} 
              className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 px-4 py-2 rounded-full text-xs font-semibold transition-all">
              <Download size={13} /> Export PDF
            </button>
            <button id="check-in-btn" onClick={handleClockToggle}
              disabled={clockInMut.isPending || clockOutMut.isPending}
              className={`flex items-center gap-2 font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-lg disabled:opacity-50 ${
                clockedIn ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-[#EF4444]/25' : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-[#3B82F6]/25'
              }`}>
              <Clock size={15} /> {clockInMut.isPending || clockOutMut.isPending ? 'Processing...' : clockedIn ? 'Check Out' : 'Check In'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-5 print-area">
        {clockedIn && todayRecord?.clockIn && (
          <div className="flex items-center gap-3 bg-[#10B981]/8 border border-[#10B981]/15 rounded-xl px-5 py-3 animate-fade-in-up">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#10B981] font-semibold text-sm">Checked in at {new Date(todayRecord.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-5">
          {/* CALENDAR */}
          <div className="flex-1 bg-white rounded-2xl card-shadow-lg overflow-hidden animate-fade-in-up delay-1">
            <div className="bg-white px-6 py-5 border-b border-[#F5F6F8] flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-[#F5F6F8] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors"><ChevronLeft size={16} className="text-[#6B7280]" /></button>
                <div className="text-center min-w-[150px]"><h3 className="text-lg font-extrabold text-[#111827]">{MONTHS[viewMonth]} {viewYear}</h3></div>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-[#F5F6F8] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors"><ChevronRight size={16} className="text-[#6B7280]" /></button>
                <button onClick={goToday} className="hidden sm:block ml-2 text-xs font-bold text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB] hover:bg-[#F5F6F8] px-3 py-1.5 rounded-full transition-all">Today</button>
              </div>
              <div className="hidden lg:flex items-center gap-3">
                {[{ label: 'Present', color: '#10B981' }, { label: 'Late', color: '#F59E0B' }, { label: 'Absent', color: '#EF4444' }, { label: 'Half', color: '#8B5CF6' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: l.color }} /><span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider">{l.label}</span></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-[#F5F6F8] bg-[#FAFAFA]">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i) => (
                <div key={d} className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider ${i===0||i===6?'text-[#D1D5DB]':'text-[#6B7280]'}`}>{d}</div>
              ))}
            </div>
            {/* ==========================================
                4. DYNAMIC CALENDAR GRID
                ========================================== 
                This loops through our generated `days` array.
                If it's an empty pad (for offset), it renders an empty square.
                Otherwise it renders the status dot (Green, Yellow, Red) and timestamp.
            */}
            <div className="grid grid-cols-7">
              {days.map((d, i) => {
                if (d.status === 'empty') return <div key={`e-${i}`} className="min-h-[90px] bg-[#FAFAFA] border-b border-r border-[#F5F6F8]" />;
                const cfg = statusConfig[d.status] || statusConfig.future;
                const isHovered = hoveredDay === i;
                return (
                  <div key={`d-${i}`} onMouseEnter={() => setHoveredDay(i)} onMouseLeave={() => setHoveredDay(null)}
                    className={`relative min-h-[90px] p-2 border-b border-r border-[#F5F6F8] transition-all duration-150 cursor-default ${cfg.bg} ${d.isToday ? 'ring-2 ring-inset ring-[#3B82F6]/40 bg-[#EFF6FF]/50' : ''} ${isHovered && d.status !== 'future' ? `ring-1 ring-inset ${cfg.ring}` : ''}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-semibold ${d.isToday ? 'text-[#3B82F6]' : cfg.text}`}>
                        {d.isToday ? <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#3B82F6] text-white text-xs font-bold shadow-md shadow-[#3B82F6]/30">{d.day}</span> : d.day}
                      </span>
                      {d.status !== 'weekend' && d.status !== 'future' && <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
                    </div>
                    {d.status !== 'weekend' && d.status !== 'future' && (
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</p>
                        {d.clockIn && <p className="text-[10px] text-[#9CA3AF] font-mono">{d.clockIn}</p>}
                      </div>
                    )}
                    {d.status === 'weekend' && <p className="text-[9px] text-[#D1D5DB] uppercase tracking-wider mt-1">Off</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full xl:w-80 space-y-5 shrink-0">
            <div className="bg-white rounded-2xl card-shadow-lg p-5 animate-fade-in-up delay-2">
              <h3 className="font-bold text-[#111827] text-sm mb-4">Monthly Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Present', value: summary.present + (summary.late || 0), icon: CalendarDays, color: '#10B981' },
                  { label: 'Absent', value: summary.absent, icon: AlertCircle, color: '#EF4444' },
                  { label: 'Half Day', value: summary.halfDay || 0, icon: Users, color: '#8B5CF6' },
                  { label: 'Late', value: summary.late || 0, icon: TrendingUp, color: '#F59E0B' },
                ].map(s => (
                  <div key={s.label} className="bg-[#FAFAFA] rounded-xl border border-[#F5F6F8] p-3 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${s.color}15` }}><s.icon size={14} style={{ color: s.color }} /></div>
                    <p className="text-xl font-extrabold text-[#111827]">{s.value}</p>
                    <p className="text-[9px] text-[#9CA3AF] uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl card-shadow-lg p-5 animate-fade-in-up delay-3">
              <h3 className="font-bold text-[#111827] text-sm mb-4">Weekly Trend</h3>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={weeklyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="day" stroke="#D1D5DB" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#D1D5DB" fontSize={10} tickLine={false} axisLine={false} domain={[80, 100]} />
                  <Tooltip content={<Tip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="pct" stroke="#3B82F6" strokeWidth={2.5} fill="url(#blueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {isManager && allAttendance && allAttendance.length > 0 && (
              <div className="bg-white rounded-2xl card-shadow-lg overflow-hidden animate-fade-in-up delay-4">
                <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]">
                  <h3 className="font-bold text-[#111827] text-sm">Recent Check-ins</h3>
                  <span className="text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-full">{allAttendance.length}</span>
                </div>
                <div className="divide-y divide-[#F5F6F8]">
                  {allAttendance.slice(0, 5).map(rec => {
                    const name = rec.employee?.profile ? `${rec.employee.profile.firstName} ${rec.employee.profile.lastName}` : rec.employee?.email || '—';
                    return (
                      <div key={rec.id} className="group relative flex flex-col gap-2 p-4 hover:bg-[#F5F6F8]/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <p className="font-semibold text-[#111827] text-xs">{name}</p>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${logStatusStyle[rec.status] || ''}`}>{rec.status}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#9CA3AF] pl-9">
                          <span className="text-[10px] font-mono flex items-center gap-1"><Clock size={10} />{rec.clockIn ? new Date(rec.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                        </div>
                        <button onClick={() => setOverrideModal(rec)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-white border border-[#E5E7EB] hover:border-[#3B82F6] text-[#3B82F6] p-1.5 rounded-lg transition-all card-shadow">
                          <Edit3 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OVERRIDE MODAL */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setOverrideModal(null)}>
          <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.target); overrideMut.mutate({ id: overrideModal.id, status: fd.get('status'), overrideNote: fd.get('overrideNote') }); }}
            className="bg-white rounded-2xl card-shadow-lg w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-[#111827]">Override Attendance</h3>
              <button type="button" onClick={() => setOverrideModal(null)} className="text-[#9CA3AF] hover:text-[#111827] transition">✕</button>
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#111827]">{overrideModal.employee?.profile?.firstName} {overrideModal.employee?.profile?.lastName}</p>
              <p className="text-xs text-[#6B7280]">Current: <span className="font-bold">{overrideModal.status}</span></p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">New Status</label>
                <select name="status" defaultValue={overrideModal.status} className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none">
                  <option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option><option value="half_day">Half Day</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Override Reason</label>
                <input name="overrideNote" placeholder="e.g. Forgot to punch in" className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
            </div>
            <button type="submit" disabled={overrideMut.isPending}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-[#3B82F6]/25 transition-all disabled:opacity-50">
              {overrideMut.isPending ? 'Saving...' : 'Save Override'}
            </button>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
