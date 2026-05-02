/**
 * EmPay — Analytics Module Controller
 * Powers the dashboard cards, charts, and summary metrics.
 *
 * RBAC:
 *   GET /analytics/dashboard   → admin (full stats)
 *   GET /analytics/attendance  → admin, hr_officer, payroll_officer
 *   GET /analytics/payroll     → admin, payroll_officer
 *   GET /analytics/leaves      → admin, hr_officer, payroll_officer
 *   GET /analytics/employee-summary → employee (own stats)
 */

const prisma = require('../../prismaClient');

// ── ADMIN DASHBOARD OVERVIEW ──────────────────────────────────────
async function getDashboard(req, res, next) {
  try {
    const now        = new Date();
    const thisMonth  = now.getMonth() + 1;
    const thisYear   = now.getFullYear();

    const [
      totalEmployees,
      activeToday,
      pendingLeaves,
      latestPayrun,
    ] = await Promise.all([
      // Total active employees
      prisma.user.count({
        where: { isActive: true, role: { in: ['employee', 'hr_officer', 'payroll_officer'] } },
      }),

      // Clocked in today
      prisma.attendance.count({
        where: {
          date:   { gte: startOfDay(), lte: endOfDay() },
          status: { in: ['present', 'late'] },
        },
      }),

      // Pending leave requests
      prisma.leaveRequest.count({ where: { status: 'pending' } }),

      // Latest payrun
      prisma.payrollRun.findFirst({
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: { _count: { select: { payslips: true } } },
      }),
    ]);

    // Monthly payroll total (last 6 months)
    const payrollTrend = await getPayrollTrend(6);

    // Attendance summary for current month
    const attendanceSummary = await getMonthlyAttendanceSummary(thisMonth, thisYear);

    // Leave type distribution (current year)
    const leaveDistribution = await getLeaveDistribution(thisYear);

    // Department headcount
    const deptHeadcount = await getDeptHeadcount();

    // Recent activity (Audit Logs)
    const recentActivity = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { actor: { include: { profile: true } } }
    });

    // Pending tasks (Leave Requests + Draft Payruns)
    const [pendingLeaveTasks, draftPayruns] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { status: 'pending' },
        take: 3,
        include: { employee: { include: { profile: true } } }
      }),
      prisma.payrollRun.findMany({
        where: { status: 'draft' },
        take: 2
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          activeToday,
          pendingLeaves,
          latestPayrun: latestPayrun
            ? {
                month:      latestPayrun.month,
                year:       latestPayrun.year,
                status:     latestPayrun.status,
                payslipCount: latestPayrun._count.payslips,
              }
            : null,
        },
        charts: {
          payrollTrend,
          attendanceSummary,
          leaveDistribution,
          deptHeadcount,
          recentActivity: recentActivity.map(log => ({
            id: log.id,
            time: log.createdAt,
            event: `${log.actor.profile?.firstName || 'User'} ${log.action} ${log.entity}`,
            tag: log.entity.toUpperCase(),
            tagColor: log.entity === 'attendance' ? '#10B981' : log.entity === 'leave' ? '#F59E0B' : '#3B82F6'
          })),
          tasks: [
            ...pendingLeaveTasks.map(l => ({
              id: l.id,
              title: `Review ${l.employee.profile?.firstName}'s leave`,
              assignee: l.employee.profile?.firstName?.[0] || 'U',
              status: 'pending',
              priority: 'high'
            })),
            ...draftPayruns.map(p => ({
              id: p.id,
              title: `Finalize ${p.month}/${p.year} payroll`,
              assignee: 'P',
              status: 'pending',
              priority: 'medium'
            }))
          ]
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── MONTHLY ATTENDANCE ANALYTICS ─────────────────────────────────
async function getAttendanceAnalytics(req, res, next) {
  try {
    const { month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year)  || new Date().getFullYear();

    const summary = await getMonthlyAttendanceSummary(m, y);
    const daily   = await getDailyAttendance(m, y);

    res.json({ success: true, data: { summary, daily } });
  } catch (err) {
    next(err);
  }
}

// ── PAYROLL ANALYTICS ─────────────────────────────────────────────
async function getPayrollAnalytics(req, res, next) {
  try {
    const { months = 6 } = req.query;
    const trend = await getPayrollTrend(Number(months));

    // Top earners (latest payrun)
    const latestRun = await prisma.payrollRun.findFirst({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    let topEarners = [];
    if (latestRun) {
      topEarners = await prisma.payslip.findMany({
        where: { payrunId: latestRun.id },
        orderBy: { netPay: 'desc' },
        take: 5,
        include: {
          employee: { include: { profile: true } },
        },
      });
    }

    res.json({ success: true, data: { trend, topEarners } });
  } catch (err) {
    next(err);
  }
}

// ── LEAVE ANALYTICS ───────────────────────────────────────────────
async function getLeaveAnalytics(req, res, next) {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const [distribution, monthlyTrend, pendingList] = await Promise.all([
      getLeaveDistribution(year),
      getMonthlyLeaveTrend(year),
      prisma.leaveRequest.findMany({
        where: { status: 'pending' },
        include: { employee: { include: { profile: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    res.json({ success: true, data: { distribution, monthlyTrend, pendingList } });
  } catch (err) {
    next(err);
  }
}

// ── EMPLOYEE SELF SUMMARY ─────────────────────────────────────────
async function getEmployeeSummary(req, res, next) {
  try {
    const userId = req.user.sub;
    const year   = new Date().getFullYear();
    const month  = new Date().getMonth() + 1;

    const [profile, attendance, leaveBalances, payslips] = await Promise.all([
      prisma.employeeProfile.findUnique({
        where: { userId },
        include: { salaryStructure: true },
      }),

      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          employeeId: userId,
          date: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0, 23, 59, 59),
          },
        },
        _count: { status: true },
      }),

      prisma.leaveBalance.findMany({
        where: { profileId: (await prisma.employeeProfile.findUnique({ where: { userId } }))?.id, year },
      }),

      prisma.payslip.findMany({
        where: { employeeId: userId },
        orderBy: [{ payrun: { year: 'desc' } }, { payrun: { month: 'desc' } }],
        take: 3,
        include: { payrun: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        profile,
        thisMonthAttendance: attendance,
        leaveBalances,
        recentPayslips: payslips,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── HELPER FUNCTIONS ──────────────────────────────────────────────

async function getPayrollTrend(months) {
  const result = [];
  const now    = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m    = d.getMonth() + 1;
    const y    = d.getFullYear();
    const label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

    const payrun = await prisma.payrollRun.findUnique({
      where: { month_year: { month: m, year: y } },
    });

    if (payrun) {
      const agg = await prisma.payslip.aggregate({
        where: { payrunId: payrun.id },
        _sum:  { netPay: true, grossSalary: true },
        _count: { id: true },
      });
      result.push({
        label,
        month: m,
        year:  y,
        totalNetPay:   Number(agg._sum.netPay    || 0),
        totalGross:    Number(agg._sum.grossSalary || 0),
        headcount:     agg._count.id,
      });
    } else {
      result.push({ label, month: m, year: y, totalNetPay: 0, totalGross: 0, headcount: 0 });
    }
  }

  return result;
}

async function getMonthlyAttendanceSummary(month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate   = new Date(year, month, 0, 23, 59, 59);

  const grouped = await prisma.attendance.groupBy({
    by: ['status'],
    where: { date: { gte: startDate, lte: endDate } },
    _count: { status: true },
  });

  const result = { present: 0, late: 0, absent: 0, half_day: 0 };
  grouped.forEach(g => { result[g.status] = g._count.status; });
  return result;
}

async function getDailyAttendance(month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate   = new Date(year, month, 0, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    select: { date: true, status: true },
    orderBy: { date: 'asc' },
  });

  // Group by date
  const byDate = {};
  records.forEach(r => {
    const key = r.date.toISOString().split('T')[0];
    if (!byDate[key]) byDate[key] = { present: 0, late: 0, absent: 0, half_day: 0 };
    byDate[key][r.status] = (byDate[key][r.status] || 0) + 1;
  });

  return Object.entries(byDate).map(([date, counts]) => ({ date, ...counts }));
}

async function getLeaveDistribution(year) {
  const leaves = await prisma.leaveRequest.groupBy({
    by: ['leaveType', 'status'],
    where: {
      createdAt: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59),
      },
    },
    _count: { id: true },
    _sum:   { totalDays: true },
  });

  return leaves.map(l => ({
    leaveType: l.leaveType,
    status:    l.status,
    count:     l._count.id,
    totalDays: l._sum.totalDays || 0,
  }));
}

async function getMonthlyLeaveTrend(year) {
  const result = [];
  for (let m = 1; m <= 12; m++) {
    const count = await prisma.leaveRequest.count({
      where: {
        status: 'approved',
        fromDate: {
          gte: new Date(year, m - 1, 1),
          lte: new Date(year, m, 0, 23, 59, 59),
        },
      },
    });
    const label = new Date(year, m - 1, 1).toLocaleString('en-IN', { month: 'short' });
    result.push({ label, month: m, count });
  }
  return result;
}

async function getDeptHeadcount() {
  const profiles = await prisma.employeeProfile.groupBy({
    by: ['department'],
    where: { isActive: true },
    _count: { department: true },
  });

  return profiles.map(p => ({
    department: p.department,
    count:      p._count.department,
  }));
}

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

module.exports = {
  getDashboard,
  getAttendanceAnalytics,
  getPayrollAnalytics,
  getLeaveAnalytics,
  getEmployeeSummary,
};
