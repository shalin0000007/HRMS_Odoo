import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api/endpoints';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, Zap, ArrowRight } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => authAPI.resetPassword(data),
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to reset password. The link may be expired.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return alert("Passwords don't match");
    if (password.length < 6) return alert("Password must be at least 6 characters");
    mutation.mutate({ token, password });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-10 text-center">
          <h1 className="text-2xl font-black text-[#EF4444] mb-4">Invalid Link</h1>
          <p className="text-[#6B7280] mb-8 font-medium">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-[#3B82F6] font-bold hover:underline">Request a new link</Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-10 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h1 className="text-3xl font-black text-[#111827] mb-4 tracking-tight">Success!</h1>
          <p className="text-[#6B7280] text-sm leading-relaxed mb-8 font-medium">
            Your password has been reset successfully. You can now use your new password to log in.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-4 rounded-2xl shadow-xl shadow-[#3B82F6]/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            Go to Login <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-10 animate-fade-in">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center shadow-lg shadow-[#3B82F6]/30">
            <Zap className="text-white" size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-black text-[#111827] tracking-tight">EmPay</span>
        </div>

        <h1 className="text-3xl font-black text-[#111827] mb-3 tracking-tight">Set New Password</h1>
        <p className="text-[#6B7280] text-sm mb-8 font-medium leading-relaxed">
          Choose a strong password for your EmPay account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em] ml-1">New Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within:text-[#3B82F6] transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full bg-[#F5F6F8] border-2 border-transparent focus:border-[#3B82F6] focus:bg-white text-[#111827] rounded-2xl pl-12 pr-12 py-4 text-sm font-semibold outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9CA3AF] hover:text-[#3B82F6] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em] ml-1">Confirm New Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within:text-[#3B82F6] transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full bg-[#F5F6F8] border-2 border-transparent focus:border-[#3B82F6] focus:bg-white text-[#111827] rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold outline-none transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-4 rounded-2xl shadow-xl shadow-[#3B82F6]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
