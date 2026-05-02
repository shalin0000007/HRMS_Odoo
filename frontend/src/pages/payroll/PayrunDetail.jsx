import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollAPI } from '../../api/endpoints';
import Avatar from '../../components/Avatar';
import { getAvatarUrl } from '../../utils/avatar';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import { ArrowLeft, CheckCircle, Download, FileDown, Loader2 } from 'lucide-react';

const fmt = (n) => '₹' + Math.round(Number(n)).toLocaleString('en-IN');
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function PayrunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [payslipModal, setPayslipModal] = useState(null);
  const [downloading, setDownloading] = useState(null);

  // ==========================================
  // 1. FETCH PAYRUN DATA
  // ==========================================
  // We fetch all individual payslips generated for a specific month.
  // The 'id' is passed via the URL (useParams).
  const { data: payrunResponse, isLoading } = useQuery({
    queryKey: ['payrun', id],
    queryFn: async () => {
      const res = await payrollAPI.getPayrun(id);
      return res.data;
    }
  });

  // ==========================================
  // 2. FINALIZE (VALIDATE) PAYRUN
  // ==========================================
  // Once the admin reviews the generated payslips, they can "Validate" (finalize) them.
  // This locks the payrun so no more changes can be made.
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const res = await payrollAPI.finalizePayrun(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payrun', id]);
      queryClient.invalidateQueries(['payruns']);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message;
      alert(`Error finalizing: ${msg}`);
    }
  });

  const payrun = payrunResponse?.data;
  const payslips = payrun?.payslips || [];
  const totalNet = payslips.reduce((s, p) => s + Number(p.netPay), 0);
  const totalGross = payslips.reduce((s, p) => s + Number(p.grossSalary), 0);
  const totalDeductions = payslips.reduce((s, p) => s + Number(p.totalDeductions), 0);

  const openPayslip = payslipModal ? payslips.find(p => p.id === payslipModal) : null;

  // ==========================================
  // 3. PDF GENERATION & DOWNLOAD
  // ==========================================
  // This calls the backend API to generate a professional PDF payslip using PDFKit.
  // The backend returns a binary Blob, which we then trigger as a browser download.
  const handleDownloadOne = async (p) => {
    setDownloading(p.id);
    try {
      const res = await payrollAPI.downloadPDF(p.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${p.employee?.profile?.firstName || 'Emp'}_${payrun.month}_${payrun.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading('all');
    try {
      for (const p of payslips) {
        await handleDownloadOne(p);
        await new Promise(r => setTimeout(r, 400));
      }
    } catch (err) {
      console.error('Bulk PDF failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading || !payrun) {
    return (
      <AppLayout>
        <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[#9CA3AF]" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/payroll')} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ArrowLeft size={16} className="text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Payrun — {MONTH_NAMES[payrun.month - 1]} {payrun.year}</h1>
              <p className="text-[#9CA3AF] text-sm mt-0.5">{payslips.length} employees · Total Net: {fmt(totalNet)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={payrun.status} />

            <button onClick={handleDownloadAll} disabled={downloading === 'all'}
              className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 px-4 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-50">
              {downloading === 'all'
                ? <><Loader2 size={13} className="animate-spin" /> Generating...</>
                : <><FileDown size={13} /> Download All PDFs</>
              }
            </button>

            {payrun.status === 'draft' && (
              <button onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending}
                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-lg shadow-[#10B981]/25 transition-all disabled:opacity-50">
                {finalizeMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <><CheckCircle size={15} /> Validate</>}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-[#9CA3AF] border-b border-[#F5F6F8]">
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold hidden md:table-cell">Dept</th>
                <th className="px-5 py-3 font-semibold text-right">Gross</th>
                <th className="px-5 py-3 font-semibold text-right">Deductions</th>
                <th className="px-5 py-3 font-semibold text-right">Net Pay</th>
                <th className="px-5 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F6F8]">
              {payslips.map(p => {
                const name = `${p.employee?.profile?.firstName || 'Unknown'} ${p.employee?.profile?.lastName || ''}`;
                const dept = p.employee?.profile?.department || 'N/A';
                return (
                  <tr key={p.id} className="hover:bg-[#F5F6F8]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={p.employee} className="w-8 h-8" />
                        <span className="text-sm font-semibold text-[#111827]">{name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#6B7280] hidden md:table-cell">{dept}</td>
                    <td className="px-5 py-4 text-sm text-[#111827] font-mono text-right">{fmt(p.grossSalary)}</td>
                    <td className="px-5 py-4 text-sm text-[#EF4444] font-mono text-right">-{fmt(p.totalDeductions)}</td>
                    <td className="px-5 py-4 text-sm text-[#111827] font-bold font-mono text-right">{fmt(p.netPay)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setPayslipModal(p.id)}
                          className="text-[#3B82F6] hover:underline text-xs font-semibold mx-1">
                          View
                        </button>
                        <button onClick={() => handleDownloadOne(p)} disabled={downloading === p.id}
                          className="w-7 h-7 rounded-lg bg-[#3B82F6]/8 hover:bg-[#3B82F6]/15 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Download PDF">
                          {downloading === p.id
                            ? <Loader2 size={12} className="text-[#3B82F6] animate-spin" />
                            : <Download size={12} className="text-[#3B82F6]" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#F5F6F8] border-t border-[#E5E7EB]">
                <td className="px-5 py-3 font-bold text-sm text-[#111827]" colSpan={2}>Total</td>
                <td className="px-5 py-3 font-bold text-sm text-[#111827] font-mono text-right">{fmt(totalGross)}</td>
                <td className="px-5 py-3 font-bold text-sm text-[#EF4444] font-mono text-right">-{fmt(totalDeductions)}</td>
                <td className="px-5 py-3 font-bold text-sm text-[#111827] font-mono text-right">{fmt(totalNet)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payslip Modal */}
        {openPayslip && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPayslipModal(null)}>
            <div className="bg-white rounded-2xl card-shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
                <h3 className="text-lg font-extrabold text-[#111827]">Payslip</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPayslipModal(null)} className="text-[#9CA3AF] hover:text-[#111827] transition">✕</button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F5F6F8] rounded-xl p-4">
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Department</p>
                    <p className="text-sm font-semibold text-[#111827] mt-1">{openPayslip.employee?.profile?.department || 'N/A'}</p>
                  </div>
                  <div className="bg-[#F5F6F8] rounded-xl p-4">
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Month</p>
                    <p className="text-sm font-semibold text-[#111827] mt-1">{MONTH_NAMES[payrun.month - 1]} {payrun.year}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#10B981] uppercase tracking-widest mb-3">Earnings</h4>
                  <div className="space-y-2">
                    {[
                      ['Basic Salary', openPayslip.basicSalary],
                      ['HRA', openPayslip.hra],
                      ['Special Allowance', openPayslip.specialAllow],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">{label}</span>
                        <span className="font-mono text-[#111827]">{fmt(val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#E5E7EB]">
                      <span className="text-[#111827]">Total Gross</span>
                      <span className="font-mono text-[#111827]">{fmt(openPayslip.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#EF4444] uppercase tracking-widest mb-3">Deductions</h4>
                  <div className="space-y-2">
                    {[
                      ['Provident Fund (12%)', openPayslip.pfDeduction],
                      ['Professional Tax', openPayslip.ptDeduction],
                      ['Loss of Pay', openPayslip.lopDeduction],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">{label}</span>
                        <span className="font-mono text-[#EF4444]">-{fmt(val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#E5E7EB]">
                      <span className="text-[#111827]">Total Deductions</span>
                      <span className="font-mono text-[#EF4444]">-{fmt(openPayslip.totalDeductions)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#3B82F6]/8 border border-[#3B82F6]/15 rounded-xl p-4 flex justify-between items-center">
                  <span className="font-bold text-[#3B82F6] text-sm">NET PAY</span>
                  <span className="text-2xl font-extrabold text-[#3B82F6] font-mono">{fmt(openPayslip.netPay)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
