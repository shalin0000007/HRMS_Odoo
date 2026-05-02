const express = require('express');
const router = express.Router();
const controller = require('./leaveReport.controller');
const auth = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

// All reporting routes require admin or HR officer roles
router.get('/summary', auth, roleGuard.MANAGEMENT, controller.getLeaveSummary);
router.get('/export',  auth, roleGuard.MANAGEMENT, controller.exportLeaveReport);

module.exports = router;
