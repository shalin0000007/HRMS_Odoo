import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import PayslipPDF from '../../components/PayslipPDF';
import { ArrowLeft, Printer, CheckCircle, DollarSign, X, Download, FileDown, Loader2 } from 'lucide-react';

const EMPLOYEES_PAY = [
  { id: 1, name: 'Alice Fernandes', dept: 'Engineering', wage: 50000 },
  { id: 2, name: 'Bob Sharma',      dept: 'Sales',       wage: 60000 },
  { id: 3, name: 'Priya Nair',      dept: 'HR',          wage: 45000 },
  { id: 4, name: 'Raj Mehta',       dept: 'Finance',     wage: 42000 },
  { id: 5, name: 'Sara Khan',       dept: 'Product',     wage: 55000 },
];

const calcPayslip = (wage) => {
  const basic = wage * 0.5, hra = basic * 0.5, stdAllow = wage * 0.1, lta = wage * 0.05;
  const fixed = wage - basic - hra - stdAllow - lta;
  const grossEarnings = wage;
  const pf = basic * 0.12, profTax = 200, totalDeductions = pf + profTax;
  return { basic, hra, stdAllow, lta, fixed: Math.max(fixed, 0), grossEarnings, pf, profTax, totalDeductions, net: grossEarnings - totalDeductions };
};

const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const MONTH = 'April 2025';

/* ── PDF Download Helper ───────────────────────────────────────── */
async function downloadPayslip(employee, payslip) {
  const blob = await pdf(
    <PayslipPDF employee={employee} payslip={payslip} month={MONTH} />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Payslip_${employee.name.replace(/\s+/g, '_')}_${MONTH.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadAllPayslips(payslips) {
  for (const p of payslips) {
    await downloadPayslip(p, p);
    // Small delay between downloads so browser doesn't block them
    await new Promise(r => setTimeout(r, 400));
  }
}

/* ── Component ─────────────────────────────────────────────────── */
export default function PayrunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('draft');
  const [payslipModal, setPayslipModal] = useState(null);
  const [downloading, setDownloading] = useState(null); // employee id or 'all'

  const payslips = EMPLOYEES_PAY.map(e => ({ ...e, ...calcPayslip(e.wage) }));
  const totalNet = payslips.reduce((s, p) => s + p.net, 0);

  const openPayslip = payslipModal ? payslips.find(p => p.id === payslipModal) : null;

  const handleDownloadOne = async (p) => {
    setDownloading(p.id);
    try { await downloadPayslip(p, p); }
    catch (err) { console.error('PDF generation failed:', err); }
    finally { setDownloading(null); }
  };

  const handleDownloadAll = async () => {
    setDownloading('all');
    try { await downloadAllPayslips(payslips); }
    catch (err) { console.error('Bulk PDF failed:', err); }
    finally { setDownloading(null); }
  };

  return (
    <AppLayout>
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/payroll')} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ArrowLeft size={16} className="text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Payrun — {MONTH}</h1>
              <p className="text-[#9CA3AF] text-sm mt-0.5">{payslips.length} employees · Total Net: {fmt(totalNet)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={status} />

            {/* Download All PDFs button */}
            <button onClick={handleDownloadAll} disabled={downloading === 'all'}
              className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 px-4 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-50">
              {downloading === 'all'
                ? <><Loader2 size={13} className="animate-spin" /> Generating...</>
                : <><FileDown size={13} /> Download All PDFs</>
              }
            </button>

            {status === 'draft' && (
              <button onClick={() => setStatus('finalized')}
                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-lg shadow-[#10B981]/25 transition-all">
                <CheckCircle size={15} /> Validate
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
              {payslips.map(p => (
                <tr key={p.id} className="hover:bg-[#F5F6F8]/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-[10px] font-bold">
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-semibold text-[#111827]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#6B7280] hidden md:table-cell">{p.dept}</td>
                  <td className="px-5 py-4 text-sm text-[#111827] font-mono text-right">{fmt(p.grossEarnings)}</td>
                  <td className="px-5 py-4 text-sm text-[#EF4444] font-mono text-right">-{fmt(p.totalDeductions)}</td>
                  <td className="px-5 py-4 text-sm text-[#111827] font-bold font-mono text-right">{fmt(p.net)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setPayslipModal(p.id)}
                        className="text-[#3B82F6] hover:underline text-xs font-semibold">
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
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#F5F6F8] border-t border-[#E5E7EB]">
                <td className="px-5 py-3 font-bold text-sm text-[#111827]" colSpan={2}>Total</td>
                <td className="px-5 py-3 font-bold text-sm text-[#111827] font-mono text-right">{fmt(payslips.reduce((s, p) => s + p.grossEarnings, 0))}</td>
                <td className="px-5 py-3 font-bold text-sm text-[#EF4444] font-mono text-right">-{fmt(payslips.reduce((s, p) => s + p.totalDeductions, 0))}</td>
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
                <h3 className="text-lg font-extrabold text-[#111827]">Payslip — {openPayslip.name}</h3>
                <div className="flex items-center gap-2">
                  {/* PDF Download from modal */}
                  <button onClick={() => handleDownloadOne(openPayslip)}
                    disabled={downloading === openPayslip.id}
                    className="w-8 h-8 rounded-lg bg-[#3B82F6]/8 hover:bg-[#3B82F6]/15 flex items-center justify-center transition-colors"
                    title="Download PDF">
                    {downloading === openPayslip.id
                      ? <Loader2 size={14} className="text-[#3B82F6] animate-spin" />
                      : <Download size={14} className="text-[#3B82F6]" />
                    }
                  </button>
                  <button onClick={() => window.print()} className="w-8 h-8 rounded-lg bg-[#F5F6F8] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors">
                    <Printer size={14} className="text-[#6B7280]" />
                  </button>
                  <button onClick={() => setPayslipModal(null)} className="w-8 h-8 rounded-lg bg-[#F5F6F8] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors">
                    <X size={14} className="text-[#6B7280]" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F5F6F8] rounded-xl p-4">
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Department</p>
                    <p className="text-sm font-semibold text-[#111827] mt-1">{openPayslip.dept}</p>
                  </div>
                  <div className="bg-[#F5F6F8] rounded-xl p-4">
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Month</p>
                    <p className="text-sm font-semibold text-[#111827] mt-1">{MONTH}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#10B981] uppercase tracking-widest mb-3">Earnings</h4>
                  <div className="space-y-2">
                    {[
                      ['Basic Salary', openPayslip.basic],
                      ['HRA', openPayslip.hra],
                      ['Standard Allowance', openPayslip.stdAllow],
                      ['LTA', openPayslip.lta],
                      ['Fixed Allowance', openPayslip.fixed],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">{label}</span>
                        <span className="font-mono text-[#111827]">{fmt(val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#E5E7EB]">
                      <span className="text-[#111827]">Total Gross</span>
                      <span className="font-mono text-[#111827]">{fmt(openPayslip.grossEarnings)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#EF4444] uppercase tracking-widest mb-3">Deductions</h4>
                  <div className="space-y-2">
                    {[
                      ['Provident Fund (12%)', openPayslip.pf],
                      ['Professional Tax', openPayslip.profTax],
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
                  <span className="text-2xl font-extrabold text-[#3B82F6] font-mono">{fmt(openPayslip.net)}</span>
                </div>

                {/* Download button inside modal */}
                <button onClick={() => handleDownloadOne(openPayslip)}
                  disabled={downloading === openPayslip.id}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-full text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#3B82F6]/25 transition-all disabled:opacity-50">
                  {downloading === openPayslip.id
                    ? <><Loader2 size={15} className="animate-spin" /> Generating PDF...</>
                    : <><Download size={15} /> Download Payslip PDF</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
