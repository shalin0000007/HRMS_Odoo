/**
 * EmPay — Employee Module Controller
 * Handles CRUD for users + profiles + salary structures
 * RBAC:
 *   GET  /employees         → admin, hr_officer, payroll_officer
 *   POST /employees         → admin, hr_officer
 *   PUT  /employees/:id     → admin, hr_officer
 *   DELETE /employees/:id   → admin only (soft delete)
 *   GET  /employees/:id/salary → admin, payroll_officer
 *   PUT  /employees/:id/salary → admin, payroll_officer
 */

const bcrypt  = require('bcryptjs');
const path    = require('path');
const fs      = require('fs');
const prisma  = require('../../prismaClient');

// ── LIST EMPLOYEES ────────────────────────────────────────────────
async function listEmployees(req, res, next) {
  try {
    const { department, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      role: { in: ['employee', 'hr_officer', 'payroll_officer'] },
      isActive: true,
      ...(department && {
        profile: { department },
      }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { profile: { firstName: { contains: search, mode: 'insensitive' } } },
          { profile: { lastName:  { contains: search, mode: 'insensitive' } } },
          { profile: { employeeCode: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, employees] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          profile: {
            include: { salaryStructure: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: employees.map(sanitize),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET SINGLE EMPLOYEE ───────────────────────────────────────────
async function getEmployee(req, res, next) {
  try {
    const { id } = req.params;

    // Employees can only view themselves
    if (req.user.role === 'employee' && req.user.sub !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const employee = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            salaryStructure: true,
            leaveBalances: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.json({ success: true, data: sanitize(employee) });
  } catch (err) {
    next(err);
  }
}

// ── CREATE EMPLOYEE ───────────────────────────────────────────────
async function createEmployee(req, res, next) {
  try {
    const {
      email, password = 'Empay@123', role = 'employee',
      firstName, lastName, phone, department, designation,
      employeeCode, joiningDate, gender = 'other',
      ctcAnnual, basicPct = 40, hraPct = 50,
      pfEnabled = true, esicEnabled = false, state = 'Maharashtra',
    } = req.body;

    if (!email || !firstName || !lastName || !department || !designation || !employeeCode || !joiningDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        profile: {
          create: {
            firstName,
            lastName,
            phone,
            department,
            designation,
            employeeCode,
            joiningDate: new Date(joiningDate),
            gender,
            ...(ctcAnnual && {
              salaryStructure: {
                create: {
                  ctcAnnual: Number(ctcAnnual),
                  basicPct:  Number(basicPct),
                  hraPct:    Number(hraPct),
                  pfEnabled,
                  esicEnabled,
                  state,
                  effectiveFrom: new Date(joiningDate),
                },
              },
            }),
          },
        },
      },
      include: {
        profile: { include: { salaryStructure: true } },
      },
    });

    // Auto-create leave balances for the current year
    if (user.profile) {
      const year = new Date().getFullYear();
      await prisma.leaveBalance.createMany({
        data: [
          { profileId: user.profile.id, leaveType: 'casual',  year, totalDays: 12 },
          { profileId: user.profile.id, leaveType: 'sick',    year, totalDays: 12 },
          { profileId: user.profile.id, leaveType: 'earned',  year, totalDays: 15 },
          { profileId: user.profile.id, leaveType: 'unpaid',  year, totalDays: 999 },
        ],
        skipDuplicates: true,
      });
    }

    res.status(201).json({ success: true, data: sanitize(user) });
  } catch (err) {
    next(err);
  }
}

// ── UPDATE EMPLOYEE PROFILE ───────────────────────────────────────
async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, department, designation, gender } = req.body;

    const profile = await prisma.employeeProfile.update({
      where: { userId: id },
      data:  { firstName, lastName, phone, department, designation, gender },
    });

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

// ── SOFT DELETE ───────────────────────────────────────────────────
async function deactivateEmployee(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data:  { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        actorId:   req.user.sub,
        entity:    'employee',
        entityId:  id,
        action:    'deactivate',
        afterValue: { isActive: false },
      },
    });

    res.json({ success: true, message: 'Employee deactivated.' });
  } catch (err) {
    next(err);
  }
}

// ── GET SALARY STRUCTURE ──────────────────────────────────────────
async function getSalary(req, res, next) {
  try {
    const { id } = req.params;

    const profile = await prisma.employeeProfile.findUnique({
      where: { userId: id },
      include: { salaryStructure: true },
    });

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

    res.json({ success: true, data: profile.salaryStructure });
  } catch (err) {
    next(err);
  }
}

// ── UPDATE SALARY STRUCTURE ───────────────────────────────────────
async function updateSalary(req, res, next) {
  try {
    const { id } = req.params;
    const { ctcAnnual, basicPct, hraPct, pfEnabled, esicEnabled, state, effectiveFrom } = req.body;

    const profile = await prisma.employeeProfile.findUnique({ where: { userId: id } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

    const oldSalary = await prisma.salaryStructure.findUnique({ where: { profileId: profile.id } });

    const salary = await prisma.salaryStructure.upsert({
      where:  { profileId: profile.id },
      update: {
        ctcAnnual: ctcAnnual !== undefined ? Number(ctcAnnual) : undefined,
        basicPct:  basicPct  !== undefined ? Number(basicPct)  : undefined,
        hraPct:    hraPct    !== undefined ? Number(hraPct)    : undefined,
        pfEnabled,
        esicEnabled,
        state,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      },
      create: {
        profileId: profile.id,
        ctcAnnual: Number(ctcAnnual),
        basicPct:  Number(basicPct  || 40),
        hraPct:    Number(hraPct    || 50),
        pfEnabled:   pfEnabled   !== undefined ? pfEnabled   : true,
        esicEnabled: esicEnabled !== undefined ? esicEnabled : false,
        state:       state || 'Maharashtra',
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId:     req.user.sub,
        entity:      'salary_structure',
        entityId:    salary.id,
        action:      'update',
        beforeValue: oldSalary,
        afterValue:  salary,
      },
    });

    res.json({ success: true, data: salary });
  } catch (err) {
    next(err);
  }
}

// ── UPLOAD PROFILE PICTURE ───────────────────────────────────────
// HOW PROFILE PICTURES WORK:
//   1. Frontend sends multipart/form-data POST with field name "avatar"
//   2. Multer (upload.js middleware) intercepts, validates type+size,
//      writes the file to  backend/uploads/avatars/<uuid>.jpg
//   3. This controller saves the relative URL to employee_profiles.avatarUrl
//   4. Express serves /uploads as static so frontend can show it via:
//        <img src="http://localhost:5000/uploads/avatars/<uuid>.jpg" />
//   5. Old avatar file is deleted from disk to avoid orphan files
async function uploadAvatar(req, res, next) {
  try {
    const { id } = req.params;

    // Only self OR admin/HR can upload
    if (req.user.role === 'employee' && req.user.sub !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    // req.file.path now contains the Cloudinary SECURE URL
    const avatarUrl = req.file.path;

    const profile = await prisma.employeeProfile.update({
      where: { userId: id },
      data:  { avatarUrl },
    });

    res.json({
      success: true,
      message: 'Profile picture updated.',
      data: { avatarUrl: profile.avatarUrl },
    });
  } catch (err) {
    next(err);
  }
}

async function logActivity(req, res, next) {
  try {
    const { id } = req.params;
    const { action, detail } = req.body;

    if (!action || !detail) {
      return res.status(400).json({ success: false, message: 'Action and detail are required.' });
    }

    const log = await prisma.auditLog.create({
      data: {
        actorId: req.user.sub,
        entity: 'employee_activity',
        entityId: id,
        action: action, // e.g. "CLIENT_MEETING"
        afterValue: { detail },
      },
    });

    res.json({ success: true, message: 'Activity logged successfully.', data: log });
  } catch (err) {
    next(err);
  }
}

function sanitize(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  getSalary,
  updateSalary,
  uploadAvatar,
  logActivity,
};
