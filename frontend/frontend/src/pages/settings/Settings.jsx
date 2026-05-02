import { useState } from 'react';
import AppLayout from '../../components/AppLayout';
import useAuthStore from '../../store/authStore';
import { Lock, Eye, EyeOff, Shield, ChevronDown, ChevronUp, Bell, Globe, User } from 'lucide-react';

const SECTIONS = [
  { key: 'security', label: 'Security',       icon: Lock,   desc: 'Password & authentication' },
  { key: 'access',   label: 'Access Rights',  icon: Shield, desc: 'Role-based permissions',   adminOnly: true },
  { key: 'notif',    label: 'Notifications',  icon: Bell,   desc: 'Email & push preferences' },
  { key: 'general',  label: 'General',        icon: Globe,  desc: 'Language & region' },
];

export default function Settings() {
  const { user } = useAuthStore();
  const role = user?.role || 'employee';
  const isAdmin = role === 'admin';
  const [expanded, setExpanded] = useState('security');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState(null);

  const visible = SECTIONS.filter(s => !s.adminOnly || isAdmin);

  return (
    <AppLayout>
      <div className="bg-black px-6 lg:px-8 pt-6 pb-5">
        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-extrabold text-white">Settings</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">Manage your account and preferences</p>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-5 max-w-2xl">
        {/* Account card */}
        <div className="bg-white rounded-2xl card-shadow p-6 animate-fade-in-up delay-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-[#3B82F6]/20">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p className="font-extrabold text-[#111827] text-lg">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-[#9CA3AF]">{user?.email || 'admin@empay.in'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm bg-[#F5F6F8] rounded-xl px-4 py-3">
            <span className="text-[#9CA3AF]">Role</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#3B82F6] bg-[#3B82F6]/8 px-2.5 py-0.5 rounded-full">{role.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {visible.map((s, i) => (
            <div key={s.key} className={`bg-white rounded-2xl card-shadow overflow-hidden animate-fade-in-up delay-${i + 2}`}>
              <button onClick={() => setExpanded(expanded === s.key ? null : s.key)}
                className="flex items-center justify-between w-full px-5 py-4 hover:bg-[#F5F6F8]/50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/8 flex items-center justify-center">
                    <s.icon size={16} className="text-[#3B82F6]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827] text-sm">{s.label}</p>
                    <p className="text-xs text-[#9CA3AF]">{s.desc}</p>
                  </div>
                </div>
                {expanded === s.key
                  ? <ChevronUp size={16} className="text-[#3B82F6]" />
                  : <ChevronDown size={16} className="text-[#D1D5DB]" />}
              </button>

              {/* Security panel */}
              {expanded === s.key && s.key === 'security' && (
                <div className="px-5 pb-6 border-t border-[#F5F6F8] pt-5 space-y-4">
                  {msg && (
                    <div className={`px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-[#10B981]/8 border border-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/8 border border-[#EF4444]/15 text-[#EF4444]'}`}>
                      {msg.text}
                    </div>
                  )}
                  {['Old Password', 'New Password', 'Confirm Password'].map((label, idx) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">{label}</label>
                      <div className="relative">
                        <input type={idx === 0 ? (showOld ? 'text' : 'password') : (showNew ? 'text' : 'password')} placeholder="••••••••"
                          className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 text-[#111827] placeholder-[#D1D5DB] rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all" />
                        <button type="button" onClick={() => idx === 0 ? setShowOld(!showOld) : setShowNew(!showNew)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition">
                          {(idx === 0 ? showOld : showNew) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setMsg({ type: 'success', text: 'Password updated successfully.' })}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-6 py-3 rounded-full text-sm shadow-lg shadow-[#3B82F6]/25 transition-all">
                    Update Password
                  </button>
                </div>
              )}

              {/* Access rights panel */}
              {expanded === s.key && s.key === 'access' && (
                <div className="px-5 pb-6 border-t border-[#F5F6F8] pt-5 space-y-3">
                  {[
                    { role: 'admin',           label: 'Administrator',   desc: 'Full access to all modules including settings and access control.' },
                    { role: 'hr_officer',      label: 'HR Officer',      desc: 'Employees, Attendance, Leaves. No payroll access.' },
                    { role: 'payroll_officer', label: 'Payroll Officer', desc: 'Payroll, Reports, Attendance. No employee management.' },
                    { role: 'employee',        label: 'Employee',        desc: 'Own Attendance, Leaves, Profile and Settings.' },
                  ].map(r => (
                    <div key={r.role} className="flex items-start gap-3 p-4 bg-[#F5F6F8] rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#3B82F6] bg-[#3B82F6]/8 px-2 py-0.5 rounded-full mt-0.5 shrink-0">{r.label}</span>
                      <p className="text-xs text-[#6B7280]">{r.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Notifications panel */}
              {expanded === s.key && s.key === 'notif' && (
                <div className="px-5 pb-6 border-t border-[#F5F6F8] pt-5 space-y-4">
                  {['Email notifications for leave approvals', 'Push alerts for attendance reminders', 'Monthly payslip email'].map(opt => (
                    <label key={opt} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-[#111827]">{opt}</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-[#3B82F6]" />
                    </label>
                  ))}
                </div>
              )}

              {/* General panel */}
              {expanded === s.key && s.key === 'general' && (
                <div className="px-5 pb-6 border-t border-[#F5F6F8] pt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Language</label>
                    <select className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none">
                      <option>English (India)</option>
                      <option>Hindi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Timezone</label>
                    <select className="w-full bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3B82F6] text-[#111827] rounded-xl px-4 py-3 text-sm outline-none">
                      <option>Asia/Kolkata (IST +5:30)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
