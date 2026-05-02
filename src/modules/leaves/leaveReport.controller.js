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

module.exports = { getLeaveSummary, exportLeaveReport };
