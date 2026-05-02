import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Zap, Shield, BarChart2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../api/endpoints';

const DEMO_USERS = [
  { role: 'admin',           email: 'admin@empay.dev',   password: 'Admin@123',   label: 'Admin',       color: 'bg-[#3B82F6]' },
  { role: 'hr_officer',      email: 'hr@empay.dev',      password: 'Hr@123',      label: 'HR Officer',  color: 'bg-[#10B981]' },
  { role: 'payroll_officer', email: 'payroll@empay.dev', password: 'Payroll@123', label: 'Payroll',     color: 'bg-[#F59E0B]' },
  { role: 'employee',        email: 'alice@empay.dev',   password: 'Alice@123',   label: 'Employee',    color: 'bg-[#8B5CF6]' },
];

export default function Login() {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  
  const navigate                = useNavigate();
  const { setUser, setToken }   = useAuthStore();

  // ==========================================
  // 2. DEMO LOGIN HANDLER (For Presentation)
  // ==========================================
  // This bypasses typing the email/password manually and automatically submits the request.
  const handleDemoLogin = async (u) => {
    setEmail(u.email);
    setPassword(u.password);
    setLoading(true); setError(''); setNeedsVerification(false);
    console.log('Demo login attempt:', u.email);
    try {
      // Calls the backend /api/auth/login route
      const res = await authAPI.login({ email: u.email, password: u.password });
      console.log('Login success - response:', res.data);
      
      // Store token and user data
      const { token, user } = res.data;
      console.log('Setting token:', token ? 'Token exists' : 'No token');
      console.log('Setting user:', user);
      
      setToken(token);
      setUser(user);
      
      // Small delay to ensure state is persisted before navigation
      setTimeout(() => {
        console.log('Navigating to dashboard...');
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      const errorData = err.response?.data;
      if (errorData?.needsVerification) {
        setNeedsVerification(true);
        setError(errorData.message || 'Please verify your email before logging in.');
      } else {
        setError(errorData?.message || 'Backend not connected or invalid credentials.');
      }
    } finally { setLoading(false); }
  };

  // ==========================================
  // 3. STANDARD LOGIN HANDLER
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setNeedsVerification(false);
    try {
      const res = await authAPI.login({ email, password });
      setToken(res.data.token); setUser(res.data.user); navigate('/dashboard');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.needsVerification) {
        setNeedsVerification(true);
        setError(errorData.message || 'Please verify your email before logging in.');
      } else {
        setError(errorData?.message || 'Backend not connected — use Quick Access below ↓');
      }
    } finally { setLoading(false); }
  };

  // ==========================================
  // 4. RESEND VERIFICATION HANDLER
  // ==========================================
  const handleResendVerification = async () => {
    if (!email) return;
    setResending(true);
    try {
      await authAPI.resendVerification({ email });
      setError('Verification email sent! Please check your inbox.');
      setNeedsVerification(false);
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── Left: Dark branding panel ──────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-black relative overflow-hidden flex-col justify-between p-12">
        {/* Background blobs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#3B82F6]/10 blur-3xl" />
        <div className="absolute bottom-20 -left-20 w-60 h-60 rounded-full bg-[#3B82F6]/5 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-2xl bg-[#3B82F6]/8 rotate-12 animate-float" />

        {/* Logo top */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3B82F6] flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">EmPay</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Elevating<br />
            <span className="text-[#3B82F6]">Human Resource</span><br />
            Intelligence
          </h1>
          <p className="text-[#9CA3AF] text-lg leading-relaxed mb-10">
            Next-gen HRMS for Indian enterprises. Payroll, attendance, and workforce analytics — unified in one platform.
          </p>

          {/* Trust badges */}
          <div className="flex gap-4 flex-wrap">
            {[
              { icon: Shield,    text: 'ISO 27001',     color: '#10B981' },
              { icon: Zap,       text: 'Real-Time',     color: '#F59E0B' },
              { icon: BarChart2, text: 'India Ready',   color: '#3B82F6' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                <b.icon size={14} style={{ color: b.color }} />
                <span className="text-xs font-semibold text-white/70">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex gap-10">
          {[
            { val: '99.9%', label: 'Uptime' },
            { val: '50K+',  label: 'Payslips' },
            { val: '<2s',   label: 'Response' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-[#3B82F6]">{s.val}</p>
              <p className="text-xs text-[#6B7280] uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: White login form ────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-[#F5F6F8] px-6 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6] flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold text-[#111827]">EmPay</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl p-10 card-shadow-lg">
            <h2 className="text-2xl font-extrabold text-[#111827] mb-1">Welcome back</h2>
            <p className="text-[#9CA3AF] text-sm mb-8">Sign in to your EmPay workspace</p>

            {error && (
              <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${needsVerification ? 'bg-[#F59E0B]/8 border border-[#F59E0B]/15 text-[#F59E0B]' : 'bg-[#EF4444]/8 border border-[#EF4444]/15 text-[#EF4444]'}`}>
                <p>{error}</p>
                {needsVerification && (
                  <button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="mt-2 text-[#3B82F6] hover:text-[#2563EB] font-semibold text-xs underline disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Work Email</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="name@company.com"
                  className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 text-[#111827] placeholder-[#D1D5DB] rounded-xl px-4 py-3.5 text-sm outline-none transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input id="password" type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                    className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 text-[#111827] placeholder-[#D1D5DB] rounded-xl px-4 py-3.5 text-sm outline-none transition-all pr-12" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <a href="#" className="text-xs text-[#3B82F6] hover:underline font-medium">Forgot Password?</a>
                </div>
              </div>

              <button type="submit" id="sign-in-btn" disabled={loading}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold py-3.5 rounded-full transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#3B82F6]/25">
                {loading ? 'Authenticating...' : <>Sign In <ArrowRight size={16} /></>}
              </button>
            </form>

            <p className="text-center text-sm text-[#9CA3AF] mt-6">
              New here? <Link to="/signup" className="text-[#3B82F6] hover:underline font-semibold">Create account</Link>
            </p>

            {/* Quick Demo */}
            <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
              <p className="text-center text-xs text-[#D1D5DB] mb-3 uppercase tracking-widest font-semibold">Quick Demo Access</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map(u => (
                  <button key={u.role} type="button" onClick={(e) => { e.preventDefault(); handleDemoLogin(u); }} id={`demo-${u.role}`}
                    className={`${u.color} hover:opacity-90 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition-all hover:scale-[1.02] shadow-sm`}>
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-[#D1D5DB] mt-6 font-mono">v1.0 · EmPay HRMS</p>
        </div>
      </div>
    </div>
  );
}
