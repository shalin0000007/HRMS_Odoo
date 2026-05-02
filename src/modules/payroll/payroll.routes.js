const express   = require('express');
const router    = express.Router();
const auth      = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');
const c         = require('./payroll.controller');

router.use(auth);

// POST /api/payroll/runs              — admin, payroll_officer
router.post('/runs',                  roleGuard.ADMIN_PAYROLL, c.triggerPayrun);

// GET  /api/payroll/runs              — admin, payroll_officer
router.get('/runs',                   roleGuard.ADMIN_PAYROLL, c.listPayruns);

// GET  /api/payroll/runs/:id          — admin, payroll_officer
router.get('/runs/:id',               roleGuard.ADMIN_PAYROLL, c.getPayrun);

// PATCH /api/payroll/runs/:id/finalize — admin, payroll_officer
router.patch('/runs/:id/finalize',    roleGuard.ADMIN_PAYROLL, c.finalizePayrun);

// GET  /api/payroll/payslips/my       — all staff (own payslips)
router.get('/payslips/my',            roleGuard.ALL_STAFF, c.getMyPayslips);

// GET  /api/payroll/payslips/:id      — management or self
router.get('/payslips/:id',           roleGuard.ALL_STAFF, c.getPayslip);

// GET  /api/payroll/payslips/:id/pdf  — management or self
router.get('/payslips/:id/pdf',       roleGuard.ALL_STAFF, c.downloadPayslipPDF);

module.exports = router;
