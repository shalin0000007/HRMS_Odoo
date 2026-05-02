import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// ==========================================
// PROTECTED ROUTE WRAPPER (RBAC Logic)
// ==========================================
// This component is a "Guard" that wraps any page requiring authentication.
// It checks two things:
// 1. Is the user logged in? (Does a JWT token exist in Zustand?)
// 2. Does the user have the required Role for this specific page?
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();
  
  // If no token exists, the user is not logged in.
  // We force them to the login page immediately.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is provided (e.g. ['admin']), we check if 
  // the current user's role matches any of those allowed roles.
  // If not, we show the 'Unauthorized' page.
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If all checks pass, we render the actual page (children).
  return children;
};

export default ProtectedRoute;
