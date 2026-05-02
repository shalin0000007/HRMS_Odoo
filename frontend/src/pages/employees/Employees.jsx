import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/AppLayout';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { Plus, Search, CreditCard, AlertTriangle, Mail, MoreVertical, Users, Download } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { employeesAPI } from '../../api/endpoints';

import Avatar from '../../components/Avatar';
import { getAvatarUrl } from '../../utils/avatar';

export default function Employees() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = ['admin', 'hr_officer', 'payroll_officer'].includes(user?.role);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // ==========================================
  // 1. DATA FETCHING (REACT QUERY)
  // ==========================================
  // useQuery fetches the employee list. 
  // 'queryKey' includes 'query' (the search string), so if the user types in the search box,
  // React Query automatically refetches the data with the new search parameter.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['employees', query],
    queryFn: () => employeesAPI.getAll({ search: query || undefined }),
    select: (res) => res.data,
    keepPreviousData: true, // Keeps the old list visible while fetching the new search results
  });

  const employees = data?.data || [];
  const total = data?.pagination?.total || employees.length;

  // ==========================================
  // 2. DATA MUTATION (CREATING EMPLOYEE)
  // ==========================================
  // useMutation handles POST requests.
  // When successful, we call 'queryClient.invalidateQueries' to tell React Query 
  // that the 'employees' list is stale. React Query will instantly refetch the latest list!
  const createMutation = useMutation({
    mutationFn: (formData) => employeesAPI.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowForm(false); // Close the slide-over form
    },
  });

  // ==========================================
  // 3. FORM SUBMISSION HANDLER
  // ==========================================
  // This prevents the page from reloading. We use FormData to extract all inputs natively 
  // instead of creating 10 different useState hooks.
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    createMutation.mutate({
      email:        fd.get('email'),
      firstName:    fd.get('firstName'),
      lastName:     fd.get('lastName'),
      department:   fd.get('department'),
      designation:  fd.get('designation'),
      employeeCode: fd.get('employeeCode'),
      joiningDate:  new Date().toISOString(), // Automatically set joining date to today
      ctcAnnual:    Number(fd.get('ctcAnnual')) || undefined, // Convert string to number safely
    });
  };

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

      {/* Black hero header */}
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5 no-print">
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Employees</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">{total} members in your organisation</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} 
              className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 px-4 py-2 rounded-full text-xs font-semibold transition-all">
              <Download size={13} /> Export PDF
            </button>
            {isAdmin && (
              <button id="add-employee-btn" onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all shadow-lg shadow-[#3B82F6]/25">
                <Plus size={15} /> Add Employee
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-6 print-area">
        {/* Search & Actions Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in-up delay-2">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3B82F6]" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employees..."
              className="w-full bg-white border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 text-[#111827] placeholder-[#D1D5DB] pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none card-shadow transition-all" />
          </div>
          <div className="text-sm text-[#6B7280] font-semibold">
            Showing <span className="text-[#111827]">{employees.length}</span> employees
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <EmptyState icon={AlertTriangle} title="Failed to load employees" message="Could not connect to the backend. Make sure the server is running on port 5000." />
        )}

        {/* Empty State */}
        {!isLoading && !isError && employees.length === 0 && (
          <EmptyState icon={Users} title="No Employees Found" message={query ? 'No employees match your search.' : 'Add your first employee to get started.'} />
        )}

        {/* ==========================================
            4. DYNAMIC EMPLOYEE GRID RENDERING
            ========================================== 
            We map over the `employees` array to render each employee card.
            If the employee has no salary structure setup, we show a red warning Badge (Admin only).
        */}
        {!isLoading && !isError && employees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in-up delay-3">
            {employees.map(emp => {
              const p = emp.profile;
              const fullName = p ? `${p.firstName} ${p.lastName}` : emp.email;
              const hasSalary = !!p?.salaryStructure;

              return (
                <div key={emp.id} className="bg-white rounded-2xl card-shadow-lg overflow-hidden group hover:shadow-xl transition-shadow relative">
                  {/* Card Header & Avatar */}
                  <div className="relative h-20 bg-gradient-to-r from-[#F5F6F8] to-[#E5E7EB]">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === emp.id ? null : emp.id);
                      }} 
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center text-[#6B7280] transition-colors z-10"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {menuOpenId === emp.id && (
                      <div className="absolute top-12 right-3 w-40 bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 py-1 animate-in fade-in zoom-in duration-200">
                        <button onClick={() => alert(`Editing ${fullName}...`)} className="w-full text-left px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F5F6F8] transition-colors">Edit Profile</button>
                        <button onClick={() => alert(`Resetting password for ${fullName}...`)} className="w-full text-left px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F5F6F8] transition-colors">Reset Password</button>
                        <hr className="my-1 border-[#F5F6F8]" />
                        <button onClick={() => alert(`Deleting ${fullName}...`)} className="w-full text-left px-4 py-2 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/5 transition-colors">Terminate</button>
                      </div>
                    )}
                  </div>
                  <div className="px-6 pb-6 pt-0 relative flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white -mt-12 overflow-hidden relative z-10">
                      <Avatar user={emp} className="w-full h-full" />
                    </div>
                    
                    {/* Info */}
                    <div className="text-center mt-3">
                      <h3 className="text-lg font-extrabold text-[#111827] group-hover:text-[#3B82F6] transition-colors">
                        {fullName}
                      </h3>
                      <p className="text-xs font-semibold text-[#6B7280] mt-0.5">{p?.designation || '—'}</p>
                      <p className="text-[10px] text-[#9CA3AF] font-mono mt-1">{p?.employeeCode || emp.email}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-full">
                        {p?.department || 'Unassigned'}
                      </span>
                      <Badge status={emp.isActive ? 'active' : 'inactive'} />
                    </div>

                    {/* Warnings */}
                    {!hasSalary && isAdmin && (
                      <div className="flex items-center gap-2 mt-3 text-[10px] text-[#EF4444] bg-[#EF4444]/5 px-3 py-1.5 rounded-lg w-full justify-center">
                        <CreditCard size={12} />
                        <span className="font-semibold">No Salary Info</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full mt-6 pt-5 border-t border-[#F5F6F8]">
                      <button onClick={() => navigate(`/employees/${emp.id}`)}
                        className="flex-1 bg-[#F5F6F8] hover:bg-[#3B82F6] text-[#111827] hover:text-white py-2 rounded-xl text-xs font-bold transition-colors">
                        View Profile
                      </button>
                      <div className="flex gap-2">
                        <a href={`mailto:${emp.email}`} className="w-9 h-9 rounded-xl border border-[#E5E7EB] hover:border-[#3B82F6] hover:text-[#3B82F6] text-[#9CA3AF] flex items-center justify-center transition-colors">
                          <Mail size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Employee Slide-over */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50" onClick={() => setShowForm(false)}>
            <form onSubmit={handleCreateSubmit} className="bg-white w-full max-w-md h-full overflow-y-auto p-8 space-y-5 animate-slide-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-extrabold text-[#111827]">Add Employee</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-[#9CA3AF] hover:text-[#111827] text-xl transition">✕</button>
              </div>

              {createMutation.isError && (
                <div className="bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl px-4 py-3 text-xs text-[#EF4444]">
                  {createMutation.error?.response?.data?.message || 'Failed to create employee.'}
                </div>
              )}

              <div className="bg-[#3B82F6]/8 border border-[#3B82F6]/15 rounded-xl px-4 py-3 text-xs text-[#3B82F6]">
                Default password is <strong>Empay@123</strong>. Employee can change it after first login.
              </div>

              {[
                { name: 'firstName',    label: 'First Name' },
                { name: 'lastName',     label: 'Last Name' },
                { name: 'email',        label: 'Work Email' },
                { name: 'employeeCode', label: 'Employee Code' },
                { name: 'department',   label: 'Department' },
                { name: 'designation',  label: 'Designation' },
                { name: 'ctcAnnual',    label: 'Annual CTC (₹)' },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">{field.label}</label>
                  <input name={field.name} required={field.name !== 'ctcAnnual'}
                    className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none transition-all" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 rounded-full text-sm shadow-lg shadow-[#3B82F6]/25 transition-all disabled:opacity-50">
                  {createMutation.isPending ? 'Creating...' : 'Save Employee'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] rounded-full text-sm transition-all">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Global click handler to close menus */}
      {menuOpenId && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
      )}
    </AppLayout>
  );
}
