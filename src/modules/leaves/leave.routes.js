const express   = require('express');
const router    = express.Router();
const auth      = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');
const c         = require('./leave.controller');
const reportRoutes = require('./leaveReport.routes');

router.use('/reports', reportRoutes);

router.use(auth);

// POST /api/leaves                  — all staff (apply for leave)
router.post('/',                   roleGuard.ALL_STAFF, c.applyLeave);

// GET  /api/leaves/my               — own leave history
router.get('/my',                  roleGuard.ALL_STAFF, c.getMyLeaves);

// GET  /api/leaves/pending          — management (queue)
router.get('/pending',             roleGuard.MANAGEMENT, c.getPendingLeaves);

// GET  /api/leaves/balances/:userId — own or management
router.get('/balances/:userId',    roleGuard.ALL_STAFF, c.getLeaveBalances);

// PUT  /api/leaves/balances/:userId — hr_officer, admin
router.put('/balances/:userId',    roleGuard.ADMIN_HR, c.allocateLeaveBalance);

// GET  /api/leaves                  — management full list
router.get('/',                    roleGuard.MANAGEMENT, c.getAllLeaves);

// PATCH /api/leaves/:id/approve     — management
router.patch('/:id/approve',       roleGuard.MANAGEMENT, c.approveLeave);

// PATCH /api/leaves/:id/reject      — management
router.patch('/:id/reject',        roleGuard.MANAGEMENT, c.rejectLeave);

module.exports = router;
