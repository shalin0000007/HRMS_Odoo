import { useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import { Plus, CheckCircle, XCircle, ChevronDown, ChevronUp, FileText, Info } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const LEAVE_TYPES = [
  { value: 'paid',   label: 'Casual Leave',  balance: 1,  total: 2,  color: '#3B82F6' },
  { value: 'sick',   label: 'Sick Leave',    balance: 9,  total: 12, color: '#EF4444' },
  { value: 'unpaid', label: 'Unpaid Leave',  balance: '∞', total: '∞', color: '#F59E0B' },
];

const REQUESTS = [
  { id: 1, num: '01', employee: 'Alice Fernandes', type: 'sick',   days: 2, from: '2025-05-12', to: '2025-05-13', reason: 'Fever and cold',      status: 'pending' },
  { id: 2, num: '02', employee: 'Bob Sharma',      type: 'paid',   days: 1, from: '2025-05-20', to: '2025-05-20', reason: 'Festival',              status: 'approved' },
  { id: 3, num: '03', employee: 'Priya Nair',      type: 'unpaid', days: 3, from: '2025-05-08', to: '2025-05-10', reason: 'Personal work',         status: 'rejected' },
  { id: 4, num: '04', employee: 'Raj Mehta',       type: 'paid',   days: 1, from: '2025-05-25', to: '2025-05-25', reason: 'Doctor appointment',    status: 'pending' },
];

export default function Leaves() {
  const { user } = useAuthStore();
  const isManager = ['admin', 'hr_officer'].includes(user?.role);
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <AppLayout>
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Leave Management</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">Track time off and manage requests</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-lg shadow-[#3B82F6]/25 transition-all">
            <Plus size={15} /> Apply Leave
          </button>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-5">
        {/* Balance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {LEAVE_TYPES.map((lt, i) => (
            <div key={lt.value} className={`bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-${i + 1}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-semibold">{lt.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${lt.color}12` }}>
                  <FileText size={14} style={{ color: lt.color }} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-[#111827]">{lt.balance}</p>
              <p className="text-xs text-[#D1D5DB] mt-1">of {lt.total} remaining</p>
              {lt.value !== 'unpaid' && (
                <div className="h-1.5 bg-[#F5F6F8] rounded-full mt-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(lt.balance / lt.total) * 100}%`, background: lt.color }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 bg-[#F59E0B]/8 border border-[#F59E0B]/15 rounded-xl px-5 py-4 text-sm text-[#6B7280] animate-fade-in-up delay-4">
          <Info size={16} className="text-[#F59E0B] shrink-0 mt-0.5" />
          <div><strong className="text-[#111827]">Payroll Impact:</strong> Unpaid leaves reduce payable days during payslip computation.</div>
        </div>

        {/* Apply form */}
        {showForm && (
          <div className="bg-white border border-[#3B82F6]/15 rounded-2xl card-shadow p-6 animate-fade-in-up">
            <h3 className="text-lg font-extrabold text-[#111827] mb-5 flex items-center gap-2">
              <FileText size={18} className="text-[#3B82F6]" /> New Leave Request
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Leave Type</label>
                <select className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none">
                  {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Start Date</label>
                <input type="date" className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">End Date</label>
                <input type="date" className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Reason</label>
              <textarea rows={2} placeholder="Describe reason..." className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] placeholder-[#D1D5DB] rounded-xl px-4 py-3 text-sm outline-none resize-none" />
            </div>
            <div className="flex gap-3">
              <button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-6 py-2.5 rounded-full text-sm shadow-lg shadow-[#3B82F6]/25 transition-all">Submit</button>
              <button onClick={() => setShowForm(false)} className="border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] px-6 py-2.5 rounded-full text-sm transition-all">Cancel</button>
            </div>
          </div>
        )}

        {/* Request list */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-5">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="font-bold text-[#111827] text-sm">Leave Requests</h3>
          </div>
          <div className="divide-y divide-[#F5F6F8]">
            {REQUESTS.map(req => (
              <div key={req.id}>
                <div onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F5F6F8]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-[#3B82F6] font-mono font-bold text-sm">{req.num}</span>
                    <div>
                      <p className="font-semibold text-[#111827] text-sm">{req.type.toUpperCase()} LEAVE — {req.days} Day{req.days > 1 ? 's' : ''}</p>
                      {isManager && <p className="text-xs text-[#9CA3AF]">{req.employee}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={req.status} />
                    {expanded === req.id ? <ChevronUp size={14} className="text-[#9CA3AF]" /> : <ChevronDown size={14} className="text-[#D1D5DB]" />}
                  </div>
                </div>
                {expanded === req.id && (
                  <div className="px-5 pb-5 pt-1 border-t border-[#F5F6F8]">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div><p className="text-[10px] text-[#D1D5DB] uppercase tracking-widest">From</p><p className="text-sm text-[#111827]">{req.from}</p></div>
                      <div><p className="text-[10px] text-[#D1D5DB] uppercase tracking-widest">To</p><p className="text-sm text-[#111827]">{req.to}</p></div>
                      <div className="col-span-2"><p className="text-[10px] text-[#D1D5DB] uppercase tracking-widest">Reason</p><p className="text-sm text-[#6B7280] italic">"{req.reason}"</p></div>
                    </div>
                    {isManager && req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 bg-[#10B981]/8 hover:bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/15 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button className="flex items-center gap-1.5 bg-[#EF4444]/8 hover:bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/15 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
