import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Zap, Info } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const ROLES = [
  { value: 'employee',        label: 'Employee' },
  { value: 'hr_officer',      label: 'HR Officer' },
  { value: 'payroll_officer', label: 'Payroll Officer' },
];

function generateLoginId(first, last, year) {
  const f2 = (first || 'XX').substring(0, 2).toUpperCase();
  const l2 = (last  || 'XX').substring(0, 2).toUpperCase();
  const yr = year || new Date().getFullYear();
  return `OI${f2}${l2}${yr}0001`;
}

export default function SignUp() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '', role: 'employee', department: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));
  const loginId = useMemo(() => generateLoginId(form.firstName, form.lastName, new Date().getFullYear()), [form.firstName, form.lastName]);

  const handleSubmit = (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setToken('demo-jwt-' + form.role);
    setUser({ ...form, loginId });
    navigate('/dashboard');
  };

  const fields = [
    { key: 'firstName',  label: 'First Name',  type: 'text',     half: true },
    { key: 'lastName',   label: 'Last Name',   type: 'text',     half: true },
    { key: 'email',      label: 'Work Email',  type: 'email' },
    { key: 'department', label: 'Department',   type: 'text' },
    { key: 'password',   label: 'Password',    type: 'password', half: true },
    { key: 'confirm',    label: 'Confirm',     type: 'password', half: true },
  ];

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-[48%] bg-black relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#3B82F6]/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3B82F6] flex items-center justify-center"><Zap size={20} className="text-white" /></div>
          <span className="text-2xl font-extrabold text-white">EmPay</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">Join <span className="text-[#3B82F6]">EmPay</span> Today</h1>
          <p className="text-[#9CA3AF] leading-relaxed">Create your account and get instant access to the complete HRMS platform — payroll, attendance, leaves and more.</p>
        </div>
        <p className="relative z-10 text-xs text-[#6B7280]">© 2025 EmPay HRMS</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center bg-[#F5F6F8] px-6 py-12">
        <div className="w-full max-w-lg animate-fade-in-up">
          <div className="bg-white rounded-2xl p-10 card-shadow-lg">
            <h2 className="text-2xl font-extrabold text-[#111827] mb-1">Create Account</h2>
            <p className="text-[#9CA3AF] text-sm mb-6">Fill in your details to get started</p>

            {/* Auto-generated Login ID preview */}
            <div className="flex items-center gap-2 bg-[#3B82F6]/8 border border-[#3B82F6]/15 rounded-xl px-4 py-3 mb-6">
              <Info size={14} className="text-[#3B82F6] shrink-0" />
              <span className="text-xs text-[#3B82F6]">Your Login ID: <strong className="font-mono">{loginId}</strong></span>
            </div>

            {error && <div className="mb-4 px-4 py-3 bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl text-[#EF4444] text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {fields.filter(f => f.half).map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">{f.label}</label>
                    <input type={f.type} value={form[f.key]} onChange={set(f.key)} required
                      className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 text-[#111827] rounded-xl px-4 py-3 text-sm outline-none transition-all" />
                  </div>
                ))}
              </div>
              {fields.filter(f => !f.half).map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={set(f.key)} required
                    className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 text-[#111827] rounded-xl px-4 py-3 text-sm outline-none transition-all" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Role</label>
                <select value={form.role} onChange={set('role')}
                  className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3.5 rounded-full text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#3B82F6]/25 transition-all mt-2">
                Create Account <ArrowRight size={16} />
              </button>
            </form>

            <p className="text-center text-sm text-[#9CA3AF] mt-6">
              Already have an account? <Link to="/login" className="text-[#3B82F6] hover:underline font-semibold">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
