const express    = require('express');
const router     = express.Router();
const auth       = require('../../middleware/auth');
const roleGuard  = require('../../middleware/roleGuard');
const upload     = require('../../middleware/upload');
const c          = require('./employee.controller');

// All employee routes require authentication
router.use(auth);

// GET  /api/employees           — all staff (Directory access)
router.get('/',    roleGuard.ALL_STAFF, c.listEmployees);

// GET  /api/employees/:id       — management OR self
router.get('/:id', roleGuard.ALL_STAFF, c.getEmployee);

// POST /api/employees           — admin, hr_officer
router.post('/',   roleGuard.ADMIN_HR, c.createEmployee);

// PUT  /api/employees/:id       — admin, hr_officer OR self
router.put('/:id', roleGuard.ALL_STAFF, c.updateEmployee);

// DELETE /api/employees/:id     — admin only (soft delete)
router.delete('/:id', roleGuard.ADMIN_ONLY, c.deactivateEmployee);

// GET  /api/employees/:id/salary — admin, payroll_officer
router.get('/:id/salary',  roleGuard.ADMIN_PAYROLL, c.getSalary);

// PUT  /api/employees/:id/salary — admin, payroll_officer
router.put('/:id/salary',  roleGuard.ADMIN_PAYROLL, c.updateSalary);

// POST /api/employees/:id/avatar — self OR admin/HR
// multipart/form-data, field name: "avatar", max 2MB, JPEG/PNG/WebP
router.post('/:id/avatar', roleGuard.ALL_STAFF, upload.single('avatar'), c.uploadAvatar);

module.exports = router;
