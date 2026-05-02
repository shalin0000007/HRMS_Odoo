import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { Plus, CheckCircle, XCircle, ChevronDown, ChevronUp, FileText, Info, AlertTriangle, Download } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { leavesAPI } from '../../api/endpoints';

const LEAVE_COLORS = { casual: '#3B82F6', sick: '#EF4444', earned: '#10B981', unpaid: '#F59E0B' };

export default function Leaves() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isManager = ['admin', 'hr_officer', 'payroll_officer'].includes(user?.role);
  const [expanded, setExpanded] = useState(null);

  // Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  // ==========================================
  // 1. DATA FETCHING (REACT QUERY)
  // ==========================================
  // Fetch leave requests (management sees all, employee sees own)
  // The query logic conditionally calls getAll() or getMyLeaves() based on RBAC
  const { data: leavesRes, isLoading, isError } = useQuery({
    queryKey: ['leaves', isManager ? 'all' : 'my'],
    queryFn: () => isManager ? leavesAPI.getAll() : leavesAPI.getMyLeaves(),
    select: res => res.data,
  });

  const requests = leavesRes?.data || [];

  // Fetch leave balances for current user
  const { data: balancesRes } = useQuery({
    queryKey: ['leave-balances', user?.id],
    queryFn: () => leavesAPI.getBalances(user?.id),
    select: res => res.data?.data,
    enabled: !!user?.id,
  });

  const balances = balancesRes || [];

  // ==========================================
  // 2. MUTATIONS (APPROVE, REJECT, APPLY)
  // ==========================================
  // applyMutation posts a new leave request. On success, it triggers a background refetch
  // of both the "leaves" list and "leave-balances" so the UI updates instantly.
  const applyMutation = useMutation({
    mutationFn: (data) => leavesAPI.apply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      setShowApplyModal(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => leavesAPI.approve(id, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, approverNote }) => leavesAPI.reject(id, { approverNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setShowRejectModal(null);
      setRejectNote('');
    },
  });

  const handleApplySubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    applyMutation.mutate({
      leaveType: fd.get('leaveType'),
      fromDate:  fd.get('fromDate'),
      toDate:    fd.get('toDate'),
      reason:    fd.get('reason'),
    });
  };

  // ==========================================
  // 3. DATA TRANSFORMATION FOR UI
  // ==========================================
  // We map the raw balance array from the DB to format the colorful stat cards.
  // Leave balance cards
  const balanceCards = [
    { type: 'casual',  label: 'Casual Leave', color: '#3B82F6' },
    { type: 'sick',    label: 'Sick Leave',   color: '#EF4444' },
    { type: 'earned',  label: 'Earned Leave', color: '#10B981' },
    { type: 'unpaid',  label: 'Unpaid Leave', color: '#F59E0B' },
  ].map(card => {
    const b = balances.find(bl => bl.leaveType === card.type);
    return {
      ...card,
      remaining: b ? (b.totalDays - b.consumed) : '—',
      total:     b ? b.totalDays : '—',
    };
  });

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
            <h1 className="text-3xl font-extrabold text-white">Leave Management</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">Track time off and manage requests</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} 
              className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 px-4 py-2 rounded-full text-xs font-semibold transition-all">
              <Download size={13} /> Export PDF
            </button>
            <button onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-lg shadow-[#3B82F6]/25 transition-all">
              <Plus size={15} /> Apply Leave
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-5 print-area">
        {/* Balance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balanceCards.map((lt, i) => (
            <div key={lt.type} className={`bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-${i + 1}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-semibold">{lt.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${lt.color}12` }}>
                  <FileText size={14} style={{ color: lt.color }} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-[#111827]">{lt.remaining}</p>
              <p className="text-xs text-[#D1D5DB] mt-1">of {lt.total} remaining</p>
              {lt.type !== 'unpaid' && lt.remaining !== '—' && (
                <div className="h-1.5 bg-[#F5F6F8] rounded-full mt-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(lt.remaining / lt.total) * 100}%`, background: lt.color }} />
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

        {/* Loading */}
        {isLoading && (
          <div className="bg-white rounded-2xl card-shadow p-8">
            <SkeletonCard />
          </div>
        )}

        {/* Error */}
        {isError && (
          <EmptyState icon={AlertTriangle} title="Failed to Load" message="Could not connect to the backend." />
        )}

        {/* ==========================================
            4. DYNAMIC LEAVE REQUEST LIST
            ========================================== 
            We map over the requests array. We use conditional rendering to show 
            Approve/Reject buttons ONLY if the user is a manager and the request is 'pending'.
        */}
        {!isLoading && !isError && (
          <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-5">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="font-bold text-[#111827] text-sm">Leave Requests</h3>
              <span className="text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-full">{requests.length}</span>
            </div>

            {requests.length === 0 ? (
              <EmptyState title="No Leave Requests" message="There are no pending or past leave requests to display." />
            ) : (
              <div className="divide-y divide-[#F5F6F8]">
                {requests.map((req, idx) => {
                  const empName = req.employee?.profile
                    ? `${req.employee.profile.firstName} ${req.employee.profile.lastName}`
                    : req.employee?.email || '—';
                  const leaveColor = LEAVE_COLORS[req.leaveType] || '#6B7280';

                  return (
                    <div key={req.id}>
                      <div onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F5F6F8]/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-sm" style={{ color: leaveColor }}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <p className="font-semibold text-[#111827] text-sm">
                              {req.leaveType?.toUpperCase()} LEAVE — {req.totalDays} Day{req.totalDays > 1 ? 's' : ''}
                            </p>
                            {isManager && <p className="text-xs text-[#9CA3AF]">{empName}</p>}
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
                            <div><p className="text-[10px] text-[#D1D5DB] uppercase tracking-widest">From</p><p className="text-sm text-[#111827]">{new Date(req.fromDate).toLocaleDateString('en-IN')}</p></div>
                            <div><p className="text-[10px] text-[#D1D5DB] uppercase tracking-widest">To</p><p className="text-sm text-[#111827]">{new Date(req.toDate).toLocaleDateString('en-IN')}</p></div>
                            <div className="col-span-2"><p className="text-[10px] text-[#D1D5DB] uppercase tracking-widest">Reason</p><p className="text-sm text-[#6B7280] italic">"{req.reason}"</p></div>
                            {req.approverNote && (
                              <div className="col-span-2"><p className="text-[10px] text-[#D1D5DB] uppercase tracking-widest">Manager Note</p><p className="text-sm text-[#6B7280]">{req.approverNote}</p></div>
                            )}
                          </div>
                          {isManager && req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => approveMutation.mutate(req.id)}
                                disabled={approveMutation.isPending}
                                className="flex items-center gap-1.5 bg-[#10B981]/8 hover:bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/15 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                                <CheckCircle size={13} /> {approveMutation.isPending ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => setShowRejectModal(req.id)}
                                className="flex items-center gap-1.5 bg-[#EF4444]/8 hover:bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/15 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                                <XCircle size={13} /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════ APPLY LEAVE MODAL ═══════ */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowApplyModal(false)}>
          <form onSubmit={handleApplySubmit} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-[#111827] flex items-center gap-2">
                <FileText size={20} className="text-[#3B82F6]" /> Request Leave
              </h3>
              <button type="button" onClick={() => setShowApplyModal(false)} className="text-[#9CA3AF] hover:text-[#111827] transition">✕</button>
            </div>

            {applyMutation.isError && (
              <div className="mb-4 px-4 py-3 bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl text-xs text-[#EF4444]">
                {applyMutation.error?.response?.data?.message || 'Failed to apply leave.'}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Leave Type</label>
                <select name="leaveType" required className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none">
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Start Date</label>
                  <input type="date" name="fromDate" required className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">End Date</label>
                  <input type="date" name="toDate" required className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Reason</label>
                <textarea name="reason" required rows={3} placeholder="Please provide a brief reason for your leave..."
                  className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] placeholder-[#D1D5DB] rounded-xl px-4 py-3 text-sm outline-none resize-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-[#F5F6F8]">
              <button type="submit" disabled={applyMutation.isPending}
                className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-[#3B82F6]/25 transition-all disabled:opacity-50">
                {applyMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => setShowApplyModal(false)} className="px-6 border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F5F6F8] hover:text-[#111827] rounded-xl text-sm font-bold transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════ REJECT LEAVE MODAL ═══════ */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowRejectModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 text-[#EF4444]">
              <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                <XCircle size={20} />
              </div>
              <h3 className="text-lg font-extrabold text-[#111827]">Reject Request</h3>
            </div>

            <p className="text-sm text-[#6B7280] mb-4">Please provide a reason for rejecting this leave request. This will be visible to the employee.</p>

            <textarea
              autoFocus value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              rows={3} placeholder="e.g. Due to project deadlines..."
              className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#EF4444] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none resize-none mb-6" />

            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(null)} className="flex-1 border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F5F6F8] rounded-xl py-2.5 text-sm font-bold transition-all">Cancel</button>
              <button
                onClick={() => rejectMutation.mutate({ id: showRejectModal, approverNote: rejectNote })}
                disabled={rejectMutation.isPending}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold py-2.5 rounded-xl text-sm shadow-lg shadow-[#EF4444]/25 transition-all disabled:opacity-50">
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
