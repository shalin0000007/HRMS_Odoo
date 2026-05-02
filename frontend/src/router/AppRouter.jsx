import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login          from '../pages/auth/Login';
import SignUp         from '../pages/auth/SignUp';
import VerifyEmail    from '../pages/auth/VerifyEmail';
import Unauthorized   from '../pages/auth/Unauthorized';
import Dashboard      from '../pages/dashboard/Dashboard';
import Attendance     from '../pages/attendance/Attendance';
import Leaves         from '../pages/leaves/Leaves';
import Payroll        from '../pages/payroll/Payroll';
import PayrunDetail   from '../pages/payroll/PayrunDetail';
import Employees      from '../pages/employees/Employees';
import EmployeeProfile from '../pages/employees/EmployeeProfile';
import Reports        from '../pages/reports/Reports';
import Settings       from '../pages/settings/Settings';
import ProtectedRoute from './ProtectedRoute';

// ==========================================
// CENTRAL ROUTING CONFIGURATION
// ==========================================
// This file defines the entire URL structure of the EmPay HRMS.
// We use React Router (v6) to map paths like '/dashboard' or '/payroll' to components.
const AppRouter = () => (
  <Router>
    <Routes>
      {/* ==========================================
          1. PUBLIC ROUTES
          ========================================== 
          These pages are accessible to everyone (no login required).
      */}
      <Route path="/login"        element={<Login />} />
      <Route path="/signup"       element={<SignUp />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ==========================================
          2. PROTECTED ROUTES (LOGGED-IN ONLY)
          ========================================== 
          We wrap these routes in the <ProtectedRoute> component.
          It checks if a user is logged in before allowing access.
      */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/leaves"     element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
      <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* ==========================================
          3. ROLE-BASED ACCESS CONTROL (RBAC)
          ========================================== 
          For specific management pages, we pass an 'allowedRoles' array.
          The ProtectedRoute component will check the user's role and block access 
          if they are just a standard employee.
      */}
      <Route path="/employees"     element={<ProtectedRoute allowedRoles={['admin','hr_officer','payroll_officer']}><Employees /></ProtectedRoute>} />
      <Route path="/employees/:id" element={<ProtectedRoute allowedRoles={['admin','hr_officer','payroll_officer','employee']}><EmployeeProfile /></ProtectedRoute>} />

      <Route path="/payroll"              element={<ProtectedRoute allowedRoles={['admin','payroll_officer','hr_officer']}><Payroll /></ProtectedRoute>} />
      <Route path="/payroll/payrun/:id"   element={<ProtectedRoute allowedRoles={['admin','payroll_officer','hr_officer']}><PayrunDetail /></ProtectedRoute>} />
      <Route path="/reports"             element={<ProtectedRoute allowedRoles={['admin','payroll_officer','hr_officer']}><Reports /></ProtectedRoute>} />

      {/* Default Redirection */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Router>
);

export default AppRouter;
