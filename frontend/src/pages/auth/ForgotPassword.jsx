import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api/endpoints';
import { Mail, ArrowLeft, Loader2, CheckCircle, Zap } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => authAPI.forgotPassword(data),
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Something went wrong. Please try again.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ email });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-10 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h1 className="text-3xl font-black text-[#111827] mb-4 tracking-tight">Check Your Inbox</h1>
          <p className="text-[#6B7280] text-sm leading-relaxed mb-8 font-medium">
            We've sent a password reset link to <span className="text-[#111827] font-bold">{email}</span>. Please check your email to continue.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[#3B82F6] font-bold text-sm hover:gap-3 transition-all"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
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

        <h1 className="text-3xl font-black text-[#111827] mb-3 tracking-tight">Forgot Password?</h1>
        <p className="text-[#6B7280] text-sm mb-8 font-medium leading-relaxed">
          No worries! Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em] ml-1">Work Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9CA3AF] group-focus-within:text-[#3B82F6] transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                className="w-full bg-[#F5F6F8] border-2 border-transparent focus:border-[#3B82F6] focus:bg-white text-[#111827] rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold outline-none transition-all placeholder:text-[#9CA3AF]"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#3B82F6] font-bold text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
