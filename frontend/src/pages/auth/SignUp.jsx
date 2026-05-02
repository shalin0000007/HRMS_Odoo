import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Zap, Info, Loader2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../api/endpoints';

const ROLES = [
  { value: 'employee',        label: 'Employee' },
  { value: 'hr_officer',      label: 'HR Officer' },
  { value: 'payroll_officer', label: 'Payroll Officer' },
];

// ==========================================
// 1. DYNAMIC LOGIN ID GENERATION
// ==========================================
// This logic creates a unique employee code automatically as the user types.
// Format: OI + Initials + Year + Serial (e.g. OISD20250001).
function generateLoginId(first, last, year) {
  const f2 = (first || 'XX').substring(0, 2).toUpperCase();
  const l2 = (last  || 'XX').substring(0, 2).toUpperCase();
  const yr = year || new Date().getFullYear();
  return `OI${f2}${l2}${yr}0001`;
}

export default function SignUp() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirm: '',
    role: 'employee', department: '', designation: '', phone: '',
    joiningDate: '', ctcAnnual: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [k]: value }));
    
    // Live password validation
    if (k === 'password' || k === 'confirm') {
      const newForm = { ...form, [k]: value };
      if (newForm.password && newForm.confirm) {
        if (newForm.password !== newForm.confirm) {
          setPasswordError('Passwords do not match');
        } else if (newForm.password.length < 6) {
          setPasswordError('Password must be at least 6 characters');
        } else {
          setPasswordError('');
        }
      } else {
        setPasswordError('');
      }
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return form.firstName && 
           form.lastName && 
           form.email && 
           form.department && 
           form.designation && 
           form.password && 
           form.confirm && 
           form.password === form.confirm && 
           form.password.length >= 6;
  };
  
  // useMemo ensures we only recalculate the ID when the name actually changes.
  const loginId = useMemo(() => generateLoginId(form.firstName, form.lastName, new Date().getFullYear()), [form.firstName, form.lastName]);

  // ==========================================
  // 2. SIGNUP HANDLER
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      // Use generated loginId as employeeCode
      const payload = {
        ...form,
        employeeCode: loginId,
        joiningDate: form.joiningDate || new Date().toISOString().split('T')[0],
      };
      delete payload.confirm;

      const res = await authAPI.register(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'firstName',  label: 'First Name',  type: 'text',     half: true },
    { key: 'lastName',   label: 'Last Name',   type: 'text',     half: true },
    { key: 'email',      label: 'Work Email',  type: 'email' },
    { key: 'phone',      label: 'Phone',       type: 'tel' },
    { key: 'department', label: 'Department',  type: 'text',     half: true },
    { key: 'designation', label: 'Designation', type: 'text',     half: true },
    { key: 'joiningDate', label: 'Joining Date', type: 'date',   half: true },
    { key: 'ctcAnnual',  label: 'CTC (Annual)', type: 'number', half: true },
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

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-2">Registration Successful!</h3>
                <p className="text-[#6B7280] mb-6">
                  We've sent a verification email to <strong className="text-[#111827]">{form.email}</strong>.<br/>
                  Please check your inbox and click the verification link to activate your account.
                </p>
                <Link to="/login" className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 px-6 rounded-full text-sm transition-all">
                  Go to Login <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                {error && <div className="mb-4 px-4 py-3 bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl text-[#EF4444] text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {fields.filter(f => f.half).map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">{f.label}</label>
                        <input 
                          type={f.type} 
                          value={form[f.key]} 
                          onChange={set(f.key)} 
                          required={['firstName','lastName','email','department','designation','password','confirm'].includes(f.key)}
                          className={`w-full bg-[#F5F6F8] border ${(f.key === 'password' || f.key === 'confirm') && passwordError ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/10' : 'border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10'} text-[#111827] rounded-xl px-4 py-3 text-sm outline-none transition-all`} 
                        />
                      </div>
                    ))}
                  </div>
                  {fields.filter(f => !f.half).map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">{f.label}</label>
                      <input 
                        type={f.type} 
                        value={form[f.key]} 
                        onChange={set(f.key)} 
                        required={['firstName','lastName','email','department','designation','password','confirm'].includes(f.key)}
                        className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 text-[#111827] rounded-xl px-4 py-3 text-sm outline-none transition-all" 
                      />
                    </div>
                  ))}
                  
                  {/* Live Password Validation Error */}
                  {passwordError && (
                    <div className="px-4 py-2 bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl text-[#EF4444] text-sm">
                      {passwordError}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading || !isFormValid()}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-full text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#3B82F6]/25 transition-all mt-2"
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</> : <>Create Account <ArrowRight size={16} /></>}
                  </button>
                </form>

                <p className="text-center text-sm text-[#9CA3AF] mt-6">
                  Already have an account? <Link to="/login" className="text-[#3B82F6] hover:underline font-semibold">Sign In</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
