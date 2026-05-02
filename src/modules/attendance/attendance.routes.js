const express   = require('express');
const router    = express.Router();
const auth      = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');
const c         = require('./attendance.controller');

router.use(auth);

// POST /api/attendance/clock-in    — employees only
router.post('/clock-in',   roleGuard.ALL_STAFF, c.clockIn);

// POST /api/attendance/clock-out   — employees only
router.post('/clock-out',  roleGuard.ALL_STAFF, c.clockOut);

// GET  /api/attendance/today       — self: check if clocked in today
router.get('/today',       roleGuard.ALL_STAFF, c.getTodayStatus);

// GET  /api/attendance/my/:month/:year — own calendar view
router.get('/my/:month/:year', roleGuard.ALL_STAFF, c.getMyAttendance);

// GET  /api/attendance             — HR/admin/payroll monitor
router.get('/',            roleGuard.MANAGEMENT, c.getAllAttendance);

// PUT  /api/attendance/:id/override — admin only
router.put('/:id/override', roleGuard.ADMIN_ONLY, c.overrideAttendance);

module.exports = router;
