import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Zap } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#3B82F6]/10 blur-3xl" />
      <div className="absolute bottom-20 -left-20 w-60 h-60 rounded-full bg-[#EF4444]/5 blur-3xl" />

      <div className="w-full max-w-md relative z-10 text-center animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-12">
          <div className="w-10 h-10 rounded-xl bg-[#3B82F6] flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">EmPay</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl">
          <div className="w-20 h-20 bg-[#EF4444]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} className="text-[#EF4444]" />
          </div>
          
          <h1 className="text-4xl font-black text-white mb-3">Access Denied</h1>
          <p className="text-[#9CA3AF] text-sm leading-relaxed mb-10">
            You don't have the necessary permissions to view this section. Please contact your administrator if you believe this is an error.
          </p>

          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 bg-white text-black hover:bg-[#F5F6F8] font-bold py-3.5 px-8 rounded-full text-sm transition-all shadow-xl shadow-white/5"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        <p className="mt-8 text-[10px] text-[#6B7280] uppercase tracking-[0.2em] font-semibold">Error 403 · Forbidden</p>
      </div>
    </div>
  );
}
