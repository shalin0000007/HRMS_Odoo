import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, FileText,
  DollarSign, BarChart2, Settings, LogOut, Zap, X
} from 'lucide-react';
import useAuthStore from '../store/authStore';

// ==========================================
// 1. NAVIGATION CONFIGURATION
// ==========================================
// We define all navigation items here.
// The 'roles' array is critical: it defines which user roles are allowed to see which link.
// This is our primary Role-Based Access Control (RBAC) mechanism in the UI.

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard', roles: ['admin', 'hr_officer', 'payroll_officer', 'employee'] },
  { label: 'Employees', icon: Users, to: '/employees', roles: ['admin', 'hr_officer', 'payroll_officer'] },
  { label: 'Attendance', icon: Calendar, to: '/attendance', roles: ['admin', 'hr_officer', 'payroll_officer', 'employee'] },
  { label: 'Leaves', icon: FileText, to: '/leaves', roles: ['admin', 'hr_officer', 'payroll_officer', 'employee'] },
  { label: 'Payroll', icon: DollarSign, to: '/payroll', roles: ['admin', 'payroll_officer', 'hr_officer'] },
  { label: 'Reports', icon: BarChart2, to: '/reports', roles: ['admin', 'payroll_officer', 'hr_officer'] },
  { label: 'Settings', icon: Settings, to: '/settings', roles: ['admin', 'hr_officer', 'payroll_officer', 'employee'] },
];

const roleLabel = {
  admin: 'Administrator',
  hr_officer: 'HR Officer',
  payroll_officer: 'Payroll Officer',
  employee: 'Employee',
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  // ==========================================
  // 2. DYNAMIC VISIBILITY FILTERING
  // ==========================================
  // We check the logged-in user's role and filter the navigation items accordingly.
  // This ensures an Employee never sees the "Employees" or "Payroll" management links.

  const userRole = user?.role || 'employee';
  const visibleItems = navItems.filter(item => item.roles.includes(userRole));
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[240px] bg-black flex flex-col shrink-0 transition-transform duration-300 lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo & Close Button */}
        <div className="flex items-center justify-between gap-3 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3B82F6] flex items-center justify-center shrink-0 shadow-lg shadow-[#3B82F6]/30">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-extrabold text-white tracking-tight">EmPay</span>
          </div>
          
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {visibleItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                  ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="text-[13px] font-semibold">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm shrink-0 border-2 border-white/10">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
              </p>
              <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                {roleLabel[userRole]}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-[#6B7280] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all text-sm font-bold"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
