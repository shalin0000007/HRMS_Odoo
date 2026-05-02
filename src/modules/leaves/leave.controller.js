/**
 * EmPay — Leave Management Controller
 * State machine: Pending → Approved | Rejected
 *
 * RBAC:
 *   POST /leaves             → employee (apply)
 *   GET  /leaves/my          → employee (own list)
 *   GET  /leaves             → management (all leaves)
 *   GET  /leaves/pending     → payroll_officer, admin (approval queue)
 *   PATCH /leaves/:id/approve → payroll_officer, admin
 *   PATCH /leaves/:id/reject  → payroll_officer, admin
 *   GET  /leaves/balances/:userId → all staff
 *   PUT  /leaves/balances/:userId → hr_officer, admin
 */

const prisma = require('../../prismaClient');

// ── APPLY FOR LEAVE ───────────────────────────────────────────────
async function applyLeave(req, res, next) {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;
    const employeeId = req.user.sub;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const from = new Date(fromDate);
    const to   = new Date(toDate);

    if (from > to) {
      return res.status(400).json({ success: false, message: 'fromDate must be before toDate.' });
    }

    // Calculate working days (Mon-Fri only)
    const totalDays = countWorkdays(from, to);

    // Check leave balance (skip for unpaid)
    if (leaveType !== 'unpaid') {
      const profile = await prisma.employeeProfile.findUnique({ where: { userId: employeeId } });
      if (!profile) return res.status(404).json({ success: false, message: 'Employee profile not found.' });

      const balance = await prisma.leaveBalance.findUnique({
        where: {
          profileId_leaveType_year: {
            profileId: profile.id,
            leaveType,
            year: from.getFullYear(),
          },
        },
      });

      if (!balance) {
        return res.status(400).json({ success: false, message: 'No leave balance found for this type.' });
      }

      const remaining = balance.totalDays - balance.consumed;
      if (totalDays > remaining) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance. Remaining: ${remaining} day(s).`,
        });
      }
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        fromDate: from,
        toDate:   to,
        totalDays,
        reason,
        status: 'pending',
      },
    });

    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    next(err);
  }
}

// ── MY LEAVE REQUESTS ─────────────────────────────────────────────
async function getMyLeaves(req, res, next) {
  try {
    const { year, status } = req.query;

    const where = {
      employeeId: req.user.sub,
      ...(status && { status }),
      ...(year && {
        fromDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      }),
    };

    const leaves = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        approver: {
          select: { email: true, profile: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    res.json({ success: true, data: leaves });
  } catch (err) {
    next(err);
  }
}

// ── ALL LEAVE REQUESTS (management) ──────────────────────────────
async function getAllLeaves(req, res, next) {
  try {
    const { status, employeeId, month, year, page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(status     && { status }),
      ...(employeeId && { employeeId }),
      ...(month && year && {
        fromDate: {
          gte: new Date(Number(year), Number(month) - 1, 1),
          lte: new Date(Number(year), Number(month), 0, 23, 59, 59),
        },
      }),
    };

    const [total, leaves] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          employee: {
            include: { profile: true },
          },
          approver: {
            select: { email: true, profile: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: leaves,
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

// ── PENDING QUEUE (approval queue) ───────────────────────────────
async function getPendingLeaves(req, res, next) {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      where: { status: 'pending' },
      include: {
        employee: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: leaves });
  } catch (err) {
    next(err);
  }
}

// ── APPROVE LEAVE ─────────────────────────────────────────────────
async function approveLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { approverNote } = req.body;

    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { include: { profile: true } } },
    });

    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Leave is already ${leave.status}.` });
    }

    // Side effect 1: Update leave request status
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status:      'approved',
        approverId:  req.user.sub,
        approverNote: approverNote || null,
      },
    });

    // Side effect 2: Decrement leave balance (skip for unpaid — it's unlimited)
    if (leave.leaveType !== 'unpaid' && leave.employee.profile) {
      const year = leave.fromDate.getFullYear();
      await prisma.leaveBalance.updateMany({
        where: {
          profileId: leave.employee.profile.id,
          leaveType: leave.leaveType,
          year,
        },
        data: {
          consumed: { increment: leave.totalDays },
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId:    req.user.sub,
        entity:     'leave_request',
        entityId:   id,
        action:     'approve',
        beforeValue: { status: 'pending' },
        afterValue:  { status: 'approved' },
        note:       approverNote,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ── REJECT LEAVE ──────────────────────────────────────────────────
async function rejectLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { approverNote } = req.body;

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Leave is already ${leave.status}.` });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status:      'rejected',
        approverId:  req.user.sub,
        approverNote: approverNote || 'Request rejected.',
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId:    req.user.sub,
        entity:     'leave_request',
        entityId:   id,
        action:     'reject',
        beforeValue: { status: 'pending' },
        afterValue:  { status: 'rejected' },
        note:       approverNote,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ── GET LEAVE BALANCES ────────────────────────────────────────────
async function getLeaveBalances(req, res, next) {
  try {
    const { userId } = req.params;
    const year = Number(req.query.year) || new Date().getFullYear();

    // Employees can only see own balances
    if (req.user.role === 'employee' && req.user.sub !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const profile = await prisma.employeeProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

    const balances = await prisma.leaveBalance.findMany({
      where: { profileId: profile.id, year },
    });

    res.json({ success: true, data: balances });
  } catch (err) {
    next(err);
  }
}

// ── ALLOCATE LEAVE BALANCE (HR) ───────────────────────────────────
async function allocateLeaveBalance(req, res, next) {
  try {
    const { userId } = req.params;
    const { leaveType, year, totalDays } = req.body;

    const profile = await prisma.employeeProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

    const balance = await prisma.leaveBalance.upsert({
      where: {
        profileId_leaveType_year: {
          profileId: profile.id,
          leaveType,
          year: Number(year),
        },
      },
      update: { totalDays: Number(totalDays) },
      create: {
        profileId: profile.id,
        leaveType,
        year: Number(year),
        totalDays: Number(totalDays),
        consumed: 0,
      },
    });

    res.json({ success: true, data: balance });
  } catch (err) {
    next(err);
  }
}

// ── HELPER: Count Mon-Fri days between two dates ──────────────────
function countWorkdays(from, to) {
  let count = 0;
  const current = new Date(from);
  while (current <= to) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  getLeaveBalances,
  allocateLeaveBalance,
};
