const express   = require('express');
const router    = express.Router();
const auth      = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');
const c         = require('./leave.controller');

router.use(auth);

// POST /api/leaves                  — all staff (apply for leave)
router.post('/',                   roleGuard.ALL_STAFF, c.applyLeave);

// GET  /api/leaves/my               — own leave history
router.get('/my',                  roleGuard.ALL_STAFF, c.getMyLeaves);

// GET  /api/leaves/pending          — payroll_officer, admin (queue)
router.get('/pending',             roleGuard.ADMIN_PAYROLL, c.getPendingLeaves);

// GET  /api/leaves/balances/:userId — own or management
router.get('/balances/:userId',    roleGuard.ALL_STAFF, c.getLeaveBalances);

// PUT  /api/leaves/balances/:userId — hr_officer, admin
router.put('/balances/:userId',    roleGuard.ADMIN_HR, c.allocateLeaveBalance);

// GET  /api/leaves                  — management full list
router.get('/',                    roleGuard.MANAGEMENT, c.getAllLeaves);

// GET  /api/leaves/last-month       — management (last month leaves)
router.get('/last-month',          roleGuard.MANAGEMENT, c.getLastMonthLeaves);

// GET  /api/leaves/last-month/report — management (last month leave report)
router.get('/last-month/report',   roleGuard.MANAGEMENT, c.getLastMonthLeaveReport);

// GET  /api/leaves/report?month=4&year=2026 — flexible month/year JSON report
router.get('/report',              roleGuard.MANAGEMENT, c.getLeaveReportByMonth);

// GET  /api/leaves/export?month=4&year=2026 — CSV download (all staff)
router.get('/export',              roleGuard.ALL_STAFF, c.exportLeaveReportCSV);

// PATCH /api/leaves/:id/approve     — payroll_officer, admin
router.patch('/:id/approve',       roleGuard.ADMIN_PAYROLL, c.approveLeave);

// PATCH /api/leaves/:id/reject      — payroll_officer, admin
router.patch('/:id/reject',        roleGuard.ADMIN_PAYROLL, c.rejectLeave);

module.exports = router;
