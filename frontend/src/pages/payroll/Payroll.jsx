import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollAPI } from '../../api/endpoints';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import { AlertTriangle, CreditCard, Play, ChevronRight, DollarSign, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WARNINGS = []; // We can add dynamic warnings if needed in future

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Payroll() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // ==========================================
  // 1. DATA FETCHING (PAYRUN HISTORY)
  // ==========================================
  // We fetch all historical payroll runs from the backend.
  // This allows the admin to see past payslips and their status.
  const { data: payrunsResponse, isLoading } = useQuery({
    queryKey: ['payruns'],
    queryFn: async () => {
      const res = await payrollAPI.getPayruns();
      return res.data;
    }
  });

  const payruns = payrunsResponse?.data || [];

  // ==========================================
  // 2. RUN PAYROLL MUTATION
  // ==========================================
  // This handles the process of triggering a new payroll run for a specific month/year.
  // On success, we invalidate the 'payruns' cache so the list updates immediately.
  const runPayrollMutation = useMutation({
    mutationFn: async ({ month, year }) => {
      const res = await payrollAPI.runPayroll({ month, year });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payruns']);
      setShowModal(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message;
      alert(`Error running payroll: ${msg}`);
    }
  });

  const handleRunPayroll = () => {
    runPayrollMutation.mutate({ month: Number(selectedMonth), year: Number(selectedYear) });
  };

  return (
    <AppLayout>
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Payroll</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">Manage compensation and payslips</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-6 py-2.5 rounded-full text-sm shadow-lg shadow-[#3B82F6]/25 transition-all">
            <Play size={15} /> Run Payroll
          </button>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-5">
        {/* Warnings */}
        {WARNINGS.map((w, i) => (
          <div key={i} className={`flex items-start gap-4 bg-white rounded-xl card-shadow px-5 py-4 animate-fade-in-up delay-${i + 1}`}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${w.color}12` }}>
              <AlertTriangle size={16} style={{ color: w.color }} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#111827]">{w.title}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{w.desc}</p>
            </div>
          </div>
        ))}

        {/* Payrun list */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-6">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="font-bold text-[#111827] text-sm">Payrun History</h3>
          </div>
          
          {/* ==========================================
              3. RENDER PAYRUN LIST
              ========================================== 
              If data is loading, we show a spinner.
              If empty, we show a professional empty state with a "Run Payroll" call to action.
          */}
          {isLoading ? (
            <div className="p-8 flex justify-center text-[#9CA3AF]">
              <Loader2 className="animate-spin" />
            </div>
          ) : payruns.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[#F5F6F8] rounded-full flex items-center justify-center mb-4">
                <DollarSign size={24} className="text-[#9CA3AF]" />
              </div>
              <h3 className="text-[#111827] font-bold text-lg">No Payruns Yet</h3>
              <p className="text-[#6B7280] text-sm mt-1">Run payroll to generate payslips for your employees.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F5F6F8]">
              {payruns.map(pr => (
                <div key={pr.id} onClick={() => navigate(`/payroll/payrun/${pr.id}`)}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#F5F6F8]/50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/8 flex items-center justify-center group-hover:bg-[#3B82F6] transition-colors">
                      <DollarSign size={16} className="text-[#3B82F6] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#111827] text-sm group-hover:text-[#3B82F6] transition-colors">
                        Payrun — {MONTH_NAMES[pr.month - 1]} {pr.year}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Generated {new Date(pr.createdAt).toLocaleDateString()} · {pr._count?.payslips || 0} payslips
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge status={pr.status} />
                    <ChevronRight size={14} className="text-[#D1D5DB] group-hover:text-[#3B82F6] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl card-shadow-lg p-8 w-full max-w-md animate-fade-in-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-extrabold text-[#111827] mb-6">Run Payroll</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Month</label>
                  <select 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none">
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Year</label>
                  <select 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(e.target.value)}
                    className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none">
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleRunPayroll}
                  disabled={runPayrollMutation.isPending}
                  className="flex-1 flex justify-center bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-full text-sm shadow-lg shadow-[#3B82F6]/25 transition-all disabled:opacity-50">
                  {runPayrollMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Generate"}
                </button>
                <button 
                  onClick={() => setShowModal(false)} 
                  disabled={runPayrollMutation.isPending}
                  className="px-5 border border-[#E5E7EB] text-[#6B7280] rounded-full text-sm transition-all disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
