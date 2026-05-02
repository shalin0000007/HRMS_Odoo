/**
 * EmPay — Role Guard Middleware (RBAC)
 * Usage: roleGuard(['admin', 'payroll_officer'])
 * Must be used AFTER auth middleware.
 */

const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

// Pre-defined role combinations for convenience
roleGuard.ADMIN_ONLY       = roleGuard(['admin']);
roleGuard.ADMIN_HR         = roleGuard(['admin', 'hr_officer', 'payroll_officer']);
roleGuard.ADMIN_PAYROLL    = roleGuard(['admin', 'payroll_officer']);
roleGuard.ALL_STAFF        = roleGuard(['admin', 'hr_officer', 'payroll_officer', 'employee']);
roleGuard.MANAGEMENT       = roleGuard(['admin', 'hr_officer', 'payroll_officer']);

module.exports = roleGuard;
