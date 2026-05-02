import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login          from '../pages/auth/Login';
import SignUp         from '../pages/auth/SignUp';
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

const AppRouter = () => (
  <Router>
    <Routes>
      {/* ── Public ─────────────────────────────── */}
      <Route path="/login"        element={<Login />} />
      <Route path="/signup"       element={<SignUp />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ── All authenticated roles ─────────────── */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/leaves"     element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
      <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* ── Admin + HR Officer ──────────────────── */}
      <Route path="/employees"     element={<ProtectedRoute allowedRoles={['admin','hr_officer']}><Employees /></ProtectedRoute>} />
      <Route path="/employees/:id" element={<ProtectedRoute allowedRoles={['admin','hr_officer','payroll_officer']}><EmployeeProfile /></ProtectedRoute>} />

      {/* ── Admin + Payroll Officer ─────────────── */}
      <Route path="/payroll"              element={<ProtectedRoute allowedRoles={['admin','payroll_officer']}><Payroll /></ProtectedRoute>} />
      <Route path="/payroll/payrun/:id"   element={<ProtectedRoute allowedRoles={['admin','payroll_officer']}><PayrunDetail /></ProtectedRoute>} />
      <Route path="/reports"             element={<ProtectedRoute allowedRoles={['admin','payroll_officer']}><Reports /></ProtectedRoute>} />

      {/* ── Redirects ───────────────────────────── */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Router>
);

export default AppRouter;
