import { useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import { AlertTriangle, CreditCard, Play, ChevronRight, DollarSign, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WARNINGS = [
  { icon: CreditCard, color: '#F59E0B', title: '1 Employee without Bank Account', desc: 'Raj Mehta — Add bank details before payrun.' },
  { icon: Users,      color: '#EF4444', title: '1 Employee without Manager',      desc: 'Priya Nair — Assign a reporting manager.' },
];

const PAYRUNS = [
  { id: 1, month: 'April 2025', payslips: 5, status: 'finalized', net: '2,14,300', date: 'Apr 30, 2025' },
  { id: 2, month: 'March 2025', payslips: 5, status: 'finalized', net: '2,14,300', date: 'Mar 31, 2025' },
  { id: 3, month: 'Feb 2025',   payslips: 4, status: 'finalized', net: '1,71,440', date: 'Feb 28, 2025' },
];

export default function Payroll() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

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

        {/* Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Payout', value: '₹2,14,300', sub: 'Net · This month', color: '#3B82F6' },
            { label: 'Payslips Generated', value: '5', sub: 'All validated', color: '#10B981' },
            { label: 'Employer Cost', value: '₹2,64,000', sub: 'Including PF contribution', color: '#8B5CF6' },
          ].map((s, i) => (
            <div key={s.label} className={`bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-${i + 3}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-semibold">{s.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12` }}>
                  <DollarSign size={14} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-[#111827]">{s.value}</p>
              <p className="text-xs text-[#D1D5DB] mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Payrun list */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-6">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="font-bold text-[#111827] text-sm">Payrun History</h3>
          </div>
          <div className="divide-y divide-[#F5F6F8]">
            {PAYRUNS.map(pr => (
              <div key={pr.id} onClick={() => navigate(`/payroll/payrun/${pr.id}`)}
                className="flex items-center justify-between px-5 py-4 hover:bg-[#F5F6F8]/50 cursor-pointer transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/8 flex items-center justify-center group-hover:bg-[#3B82F6] transition-colors">
                    <DollarSign size={16} className="text-[#3B82F6] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827] text-sm group-hover:text-[#3B82F6] transition-colors">Payrun — {pr.month}</p>
                    <p className="text-xs text-[#9CA3AF]">{pr.date} · {pr.payslips} payslips</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-[#111827] font-mono hidden sm:block">₹{pr.net}</span>
                  <Badge status={pr.status} />
                  <ChevronRight size={14} className="text-[#D1D5DB] group-hover:text-[#3B82F6] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl card-shadow-lg p-8 w-full max-w-md animate-fade-in-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-extrabold text-[#111827] mb-6">Run Payroll</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {['Month', 'Year'].map(l => (
                  <div key={l}>
                    <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">{l}</label>
                    <select className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none">
                      <option>{l === 'Month' ? 'May' : '2025'}</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-full text-sm shadow-lg shadow-[#3B82F6]/25 transition-all">Generate</button>
                <button onClick={() => setShowModal(false)} className="px-5 border border-[#E5E7EB] text-[#6B7280] rounded-full text-sm transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
