const prisma = require('../../prismaClient');

/**
 * GET /api/leaves/reports/summary
 * Returns aggregated leave data for charts/reports
 */
async function getLeaveSummary(req, res, next) {
  try {
    const { startDate, endDate, department } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.startDate = { gte: new Date(startDate) };
      where.endDate = { lte: new Date(endDate) };
    }
    if (department) {
      where.employee = { department };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: true,
      },
    });

    // Group by type
    const byType = leaves.reduce((acc, l) => {
      acc[l.leaveType] = (acc[l.leaveType] || 0) + l.daysCount;
      return acc;
    }, {});

    // Group by status
    const byStatus = leaves.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalRequests: leaves.length,
        byType,
        byStatus,
        recentLeaves: leaves.slice(0, 10),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leaves/reports/export
 * Generates a downloadable report (logic for PDF/CSV)
 */
async function exportLeaveReport(req, res, next) {
  try {
    const { format = 'json' } = req.query;
    const leaves = await prisma.leaveRequest.findMany({
      include: { employee: true },
    });

    if (format === 'csv') {
      let csv = 'Employee,Type,Start,End,Days,Status\n';
      leaves.forEach(l => {
        csv += `${l.employee.firstName} ${l.employee.lastName},${l.leaveType},${l.startDate.toISOString().split('T')[0]},${l.endDate.toISOString().split('T')[0]},${l.daysCount},${l.status}\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leave_report.csv');
      return res.send(csv);
    }

    res.json({ success: true, data: leaves });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leaves/last-month/report
 * Returns leave records specifically for the previous calendar month
 */
async function getLastMonthReport(req, res, next) {
  try {
    const now = new Date();
    // Start of last month
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // End of last month
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        OR: [
          { fromDate: { gte: startDate, lte: endDate } },
          { toDate: { gte: startDate, lte: endDate } }
        ]
      },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { firstName: true, lastName: true, employeeCode: true, department: true }
            }
          }
        }
      },
      orderBy: { fromDate: 'desc' }
    });

    res.json({
      success: true,
      meta: {
        reportName: "Last Month Leave Report",
        period: `${startDate.toDateString()} to ${endDate.toDateString()}`,
        count: leaves.length
      },
      data: leaves
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLeaveSummary, exportLeaveReport, getLastMonthReport };
