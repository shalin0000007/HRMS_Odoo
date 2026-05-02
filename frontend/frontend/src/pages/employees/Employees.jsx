import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import { Plus, Search, CreditCard, AlertTriangle, User, ChevronRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const EMPLOYEES = [
  { id: 1, firstName: 'Alice', lastName: 'Fernandes', empCode: 'OIALEN20220001', department: 'Engineering', designation: 'Software Engineer', status: 'active',   bankAc: true,  manager: 'Bob Sharma' },
  { id: 2, firstName: 'Bob',   lastName: 'Sharma',    empCode: 'OIBOSH20220002', department: 'Sales',       designation: 'Sales Manager',     status: 'active',   bankAc: true,  manager: 'Admin' },
  { id: 3, firstName: 'Priya', lastName: 'Nair',      empCode: 'OIPRNA20230001', department: 'HR',          designation: 'HR Executive',      status: 'active',   bankAc: true,  manager: null },
  { id: 4, firstName: 'Raj',   lastName: 'Mehta',     empCode: 'OIRAME20230002', department: 'Finance',     designation: 'Finance Analyst',   status: 'active',   bankAc: false, manager: 'Bob Sharma' },
  { id: 5, firstName: 'Sara',  lastName: 'Khan',      empCode: 'OISAKH20240001', department: 'Product',     designation: 'Product Manager',   status: 'inactive', bankAc: true,  manager: 'Alice Fernandes' },
];

export default function Employees() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = ['admin', 'hr_officer'].includes(user?.role);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = EMPLOYEES.filter(e =>
    `${e.firstName} ${e.lastName} ${e.department} ${e.designation}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppLayout>
      {/* Black hero header */}
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Employees</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">{EMPLOYEES.length} members in your organisation</p>
          </div>
          {isAdmin && (
            <button id="add-employee-btn" onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all shadow-lg shadow-[#3B82F6]/25">
              <Plus size={15} /> Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-5">
        {/* Warnings */}
        {isAdmin && (
          <div className="space-y-2 animate-fade-in-up delay-1">
            {EMPLOYEES.filter(e => !e.bankAc).map(e => (
              <div key={`b-${e.id}`} className="flex items-center gap-3 bg-[#F59E0B]/8 border border-[#F59E0B]/15 rounded-xl px-5 py-3">
                <CreditCard size={16} className="text-[#F59E0B] shrink-0" />
                <p className="text-sm text-[#6B7280]"><span className="text-[#111827] font-semibold">{e.firstName} {e.lastName}</span> — No bank account on file</p>
              </div>
            ))}
            {EMPLOYEES.filter(e => !e.manager).map(e => (
              <div key={`m-${e.id}`} className="flex items-center gap-3 bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl px-5 py-3">
                <AlertTriangle size={16} className="text-[#EF4444] shrink-0" />
                <p className="text-sm text-[#6B7280]"><span className="text-[#111827] font-semibold">{e.firstName} {e.lastName}</span> — No manager assigned</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm animate-fade-in-up delay-2">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3B82F6]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employees..."
            className="w-full bg-white border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 text-[#111827] placeholder-[#D1D5DB] pl-11 pr-4 py-3 rounded-xl text-sm outline-none card-shadow transition-all" />
        </div>

        {/* Employee list */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-3">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-[#9CA3AF] border-b border-[#F5F6F8]">
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold hidden md:table-cell">Department</th>
                <th className="px-5 py-3 font-semibold hidden lg:table-cell">Employee ID</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F6F8]">
              {filtered.map(emp => (
                <tr key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)} className="hover:bg-[#F5F6F8]/60 cursor-pointer transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-[#111827] text-sm group-hover:text-[#3B82F6] transition-colors">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-[#9CA3AF]">{emp.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#6B7280] hidden md:table-cell">{emp.department}</td>
                  <td className="px-5 py-4 text-xs text-[#9CA3AF] font-mono hidden lg:table-cell">{emp.empCode}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {!emp.bankAc && <CreditCard size={12} className="text-[#F59E0B]" />}
                      {!emp.manager && <AlertTriangle size={12} className="text-[#EF4444]" />}
                      <Badge status={emp.status} />
                    </div>
                  </td>
                  <td className="px-5 py-4"><ChevronRight size={14} className="text-[#D1D5DB] group-hover:text-[#3B82F6] transition-colors" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Employee Slide-over */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50" onClick={() => setShowForm(false)}>
            <div className="bg-white w-full max-w-md h-full overflow-y-auto p-8 space-y-5 animate-slide-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-extrabold text-[#111827]">Add Employee</h3>
                <button onClick={() => setShowForm(false)} className="text-[#9CA3AF] hover:text-[#111827] text-xl transition">✕</button>
              </div>
              <div className="bg-[#3B82F6]/8 border border-[#3B82F6]/15 rounded-xl px-4 py-3 text-xs text-[#3B82F6]">
                Login ID will be auto-generated using format OI[F2+L2][Year][Serial]
              </div>
              {['First Name', 'Last Name', 'Work Email', 'Department', 'Designation', 'Annual CTC (₹)'].map(label => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">{label}</label>
                  <input className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none transition-all" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-full text-sm shadow-lg shadow-[#3B82F6]/25 transition-all">Save Employee</button>
                <button onClick={() => setShowForm(false)} className="px-5 border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] rounded-full text-sm transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
