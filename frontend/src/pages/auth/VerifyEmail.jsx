import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { authAPI } from '../../api/endpoints';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading, success, error, expired
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const calledOnce = useRef(false);

  useEffect(() => {
    if (!token || calledOnce.current) {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided. Please check your email link.');
      }
      return;
    }

    calledOnce.current = true;
    verifyToken();
  }, [token]);

  async function verifyToken() {
    try {
      const res = await authAPI.verifyEmail(token);
      setStatus('success');
      setMessage(res.data.message || 'Your email has been verified successfully!');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.expired) {
        setStatus('expired');
        setEmail(errorData.email || '');
        setMessage(errorData.message || 'Verification token has expired.');
      } else {
        setStatus('error');
        setMessage(errorData?.message || 'Failed to verify email. The link may be invalid or expired.');
      }
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResendSuccess(false);

    try {
      await authAPI.resendVerification({ email });
      setResendSuccess(true);
    } catch (err) {
      // Silent fail - don't reveal if user exists
      setResendSuccess(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-[48%] bg-black relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#3B82F6]/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3B82F6] flex items-center justify-center">
            <Mail size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white">EmPay</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Email <span className="text-[#3B82F6]">Verification</span>
          </h1>
          <p className="text-[#9CA3AF] leading-relaxed">
            Secure your account by verifying your email address. This helps us keep your account safe.
          </p>
        </div>
        <p className="relative z-10 text-xs text-[#6B7280]">© 2025 EmPay HRMS</p>
      </div>

      {/* Right content */}
      <div className="flex-1 flex items-center justify-center bg-[#F5F6F8] px-6 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="bg-white rounded-2xl p-10 card-shadow-lg text-center">
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 bg-[#3B82F6]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 size={32} className="text-[#3B82F6] animate-spin" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#111827] mb-2">Verifying Email...</h2>
                <p className="text-[#6B7280]">Please wait while we verify your email address.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={32} className="text-[#10B981]" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#111827] mb-2">Email Verified!</h2>
                <p className="text-[#6B7280] mb-6">{message}</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 px-6 rounded-full text-sm transition-all"
                >
                  Go to Login <ArrowRight size={16} />
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-[#EF4444]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle size={32} className="text-[#EF4444]" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#111827] mb-2">Verification Failed</h2>
                <p className="text-[#6B7280] mb-6">{message}</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-[#6B7280] hover:bg-[#4B5563] text-white font-bold py-3 px-6 rounded-full text-sm transition-all"
                >
                  Back to Login
                </Link>
              </>
            )}

            {status === 'expired' && (
              <>
                <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail size={32} className="text-[#F59E0B]" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#111827] mb-2">Link Expired</h2>
                <p className="text-[#6B7280] mb-6">{message}</p>

                {resendSuccess ? (
                  <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-4 mb-4">
                    <p className="text-[#10B981] text-sm">
                      Verification email sent! Please check your inbox.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none"
                    />
                    <button
                      onClick={handleResend}
                      disabled={resending || !email}
                      className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold py-3 rounded-full text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      {resending ? (
                        <><Loader2 size={16} className="animate-spin" /> Sending...</>
                      ) : (
                        <>Resend Verification Email</>
                      )}
                    </button>
                  </div>
                )}

                <p className="mt-6 text-sm text-[#9CA3AF]">
                  <Link to="/login" className="text-[#3B82F6] hover:underline font-semibold">
                    Back to Login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
