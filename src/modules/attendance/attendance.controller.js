/**
 * EmPay — Attendance Module Controller
 * RBAC:
 *   POST /clock-in          → employee (self)
 *   GET  /my/:month/:year   → employee (own calendar)
 *   GET  /                  → admin, hr_officer, payroll_officer (monitor)
 *   PUT  /:id/override      → admin only (with audit log)
 */

const prisma = require('../../prismaClient');

// ── CLOCK IN ──────────────────────────────────────────────────────
async function clockIn(req, res, next) {
  try {
    const employeeId = req.user.sub;
    const now        = new Date();

    // Use IST date (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow    = new Date(now.getTime() + istOffset);
    const todayDate = new Date(istNow.toISOString().split('T')[0]); // YYYY-MM-DD at midnight UTC

    // Check for existing record (idempotent)
    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: todayDate } },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Already clocked in today.',
        data: existing,
      });
    }

    // Determine status: late if after 09:30 IST
    const istHour   = istNow.getUTCHours();
    const istMinute = istNow.getUTCMinutes();
    const isLate    = istHour > 9 || (istHour === 9 && istMinute > 30);
    const status    = isLate ? 'late' : 'present';

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        date:    todayDate,
        status,
        clockIn: now,
      },
    });

    res.status(201).json({
      success: true,
      message: `Clock-in recorded as ${status}.`,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

// ── CLOCK OUT ─────────────────────────────────────────────────────
async function clockOut(req, res, next) {
  try {
    const employeeId = req.user.sub;
    const now        = new Date();
    const istOffset  = 5.5 * 60 * 60 * 1000;
    const todayDate  = new Date(new Date(now.getTime() + istOffset).toISOString().split('T')[0]);

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: todayDate } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'No clock-in record for today.' });
    }

    if (existing.clockOut) {
      return res.status(409).json({ success: false, message: 'Already clocked out today.' });
    }

    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data:  { clockOut: now },
    });

    res.json({ success: true, message: 'Clock-out recorded.', data: record });
  } catch (err) {
    next(err);
  }
}

// ── MY ATTENDANCE (calendar view) ────────────────────────────────
async function getMyAttendance(req, res, next) {
  try {
    const employeeId = req.user.sub;
    const { month, year } = req.params;

    const start = new Date(Number(year), Number(month) - 1, 1);
    const end   = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    });

    // Build summary
    const summary = {
      present:  records.filter(r => r.status === 'present').length,
      late:     records.filter(r => r.status === 'late').length,
      absent:   records.filter(r => r.status === 'absent').length,
      halfDay:  records.filter(r => r.status === 'half_day').length,
    };

    res.json({ success: true, data: { records, summary } });
  } catch (err) {
    next(err);
  }
}

// ── MONITOR ALL EMPLOYEES (HR/Admin) ─────────────────────────────
async function getAllAttendance(req, res, next) {
  try {
    const { month, year, employeeId, department, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where = {};

    if (employeeId) where.employeeId = employeeId;
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end   = new Date(Number(year), Number(month), 0, 23, 59, 59);
      where.date  = { gte: start, lte: end };
    }

    const [total, records] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          employee: {
            include: { profile: true },
          },
        },
        orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
      }),
    ]);

    res.json({
      success: true,
      data: records,
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

// ── ADMIN OVERRIDE ────────────────────────────────────────────────
async function overrideAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const { status, overrideNote } = req.body;

    if (!['present', 'absent', 'late', 'half_day'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const old = await prisma.attendance.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ success: false, message: 'Attendance record not found.' });

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        status,
        overrideBy:   req.user.sub,
        overrideNote: overrideNote || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId:     req.user.sub,
        entity:      'attendance',
        entityId:    id,
        action:      'override',
        beforeValue: { status: old.status },
        afterValue:  { status, overrideNote },
        note:        overrideNote,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ── TODAY STATUS ──────────────────────────────────────────────────
async function getTodayStatus(req, res, next) {
  try {
    const employeeId = req.user.sub;
    const istOffset  = 5.5 * 60 * 60 * 1000;
    const todayDate  = new Date(new Date(Date.now() + istOffset).toISOString().split('T')[0]);

    const record = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: todayDate } },
    });

    res.json({ success: true, data: record || null, clockedIn: !!record });
  } catch (err) {
    next(err);
  }
}

module.exports = { clockIn, clockOut, getMyAttendance, getAllAttendance, overrideAttendance, getTodayStatus };
