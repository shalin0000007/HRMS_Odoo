const express   = require('express');
const router    = express.Router();
const auth      = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');
const c         = require('./analytics.controller');

router.use(auth);

// GET /api/analytics/dashboard       — admin only
router.get('/dashboard',    roleGuard.ADMIN_ONLY, c.getDashboard);

// GET /api/analytics/attendance      — management
router.get('/attendance',   roleGuard.MANAGEMENT, c.getAttendanceAnalytics);

// GET /api/analytics/payroll         — admin, payroll_officer
router.get('/payroll',      roleGuard.ADMIN_PAYROLL, c.getPayrollAnalytics);

// GET /api/analytics/leaves          — management
router.get('/leaves',       roleGuard.MANAGEMENT, c.getLeaveAnalytics);

// GET /api/analytics/me              — employee self-summary
router.get('/me',           roleGuard.ALL_STAFF, c.getEmployeeSummary);

module.exports = router;
