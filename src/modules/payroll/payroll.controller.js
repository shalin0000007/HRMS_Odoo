/**
 * EmPay — Payroll Module Controller
 * The most complex backend component.
 *
 * Flow:
 *   1. Payroll Officer/Admin triggers a payrun for month/year
 *   2. Engine reads attendance + approved leaves per employee
 *   3. Computes payslip via pure computePayslip() function
 *   4. Saves payroll_run + individual payslips
 *   5. Payslip PDF downloadable via GET /payroll/payslips/:id/pdf
 *
 * RBAC:
 *   POST /payroll/runs             → admin, payroll_officer
 *   GET  /payroll/runs             → admin, payroll_officer
 *   GET  /payroll/runs/:id         → admin, payroll_officer
 *   PATCH /payroll/runs/:id/finalize → admin, payroll_officer
 *   GET  /payroll/payslips/my      → employee (own payslips)
 *   GET  /payroll/payslips/:id     → admin, payroll_officer, or self
 *   GET  /payroll/payslips/:id/pdf → admin, payroll_officer, or self
 */

const prisma                               = require('../../prismaClient');
const { computePayslip, getWorkingDaysInMonth } = require('../../utils/payrollEngine');
const { generatePayslipPDF }               = require('../../utils/pdf');

// ── TRIGGER PAYRUN ────────────────────────────────────────────────
async function triggerPayrun(req, res, next) {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'month and year are required.' });
    }

    const m = Number(month);
    const y = Number(year);

    if (m < 1 || m > 12) {
      return res.status(400).json({ success: false, message: 'Month must be 1–12.' });
    }

    // Prevent duplicate payruns
    const existing = await prisma.payrollRun.findUnique({ where: { month_year: { month: m, year: y } } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Payrun for ${m}/${y} already exists. Status: ${existing.status}`,
        data: existing,
      });
    }

    // Create payrun header first
    const payrun = await prisma.payrollRun.create({
      data: {
        month: m,
        year:  y,
        status: 'draft',
        triggeredBy: req.user.sub,
      },
    });

    // Fetch all active employees with salary structures
    const employees = await prisma.user.findMany({
      where: { isActive: true, role: { in: ['employee', 'hr_officer', 'payroll_officer'] } },
      include: {
        profile: {
          include: { salaryStructure: true },
        },
      },
    });

    const workingDays = getWorkingDaysInMonth(y, m);

    const payslipData = [];
    const errors      = [];

    for (const emp of employees) {
      if (!emp.profile?.salaryStructure) {
        errors.push({ employeeId: emp.id, error: 'No salary structure configured.' });
        continue;
      }

      // Fetch attendance for the month
      const startDate = new Date(y, m - 1, 1);
      const endDate   = new Date(y, m, 0, 23, 59, 59);

      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate },
        },
      });

      // Fetch approved leaves for the month
      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: emp.id,
          status: 'approved',
          fromDate: { gte: startDate },
          toDate:   { lte: endDate },
        },
      });

      const presentDays  = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
      const halfDays     = attendanceRecords.filter(r => r.status === 'half_day').length;
      const paidLeaveDays = approvedLeaves
        .filter(l => l.leaveType !== 'unpaid')
        .reduce((acc, l) => acc + l.totalDays, 0);
      const unpaidLeaveDays = approvedLeaves
        .filter(l => l.leaveType === 'unpaid')
        .reduce((acc, l) => acc + l.totalDays, 0);

      const effectivePresentDays = presentDays + (halfDays * 0.5) + paidLeaveDays;
      const absentDays  = Math.max(0, workingDays - attendanceRecords.length);
      const lopDays     = absentDays + unpaidLeaveDays;

      const attendanceSummary = {
        workingDays,
        presentDays: Math.round(effectivePresentDays),
        leaveDays:   paidLeaveDays,
        absentDays,
        lopDays,
      };

      const computed = computePayslip(emp, emp.profile.salaryStructure, attendanceSummary);

      payslipData.push({
        payrunId:        payrun.id,
        employeeId:      emp.id,
        ctcAnnual:       computed.ctcAnnual,
        basicSalary:     computed.basicSalary,
        hra:             computed.hra,
        specialAllow:    computed.specialAllow,
        grossSalary:     computed.grossSalary,
        pfDeduction:     computed.pfDeduction,
        ptDeduction:     computed.ptDeduction,
        esicDeduction:   computed.esicDeduction,
        lopDeduction:    computed.lopDeduction,
        totalDeductions: computed.totalDeductions,
        netPay:          computed.netPay,
        workingDays:     computed.workingDays,
        presentDays:     computed.presentDays,
        leaveDays:       computed.leaveDays,
        absentDays:      computed.absentDays,
        lopDays:         computed.lopDays,
      });
    }

    // Bulk insert payslips
    await prisma.payslip.createMany({ data: payslipData, skipDuplicates: true });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId:    req.user.sub,
        entity:     'payroll_run',
        entityId:   payrun.id,
        action:     'create',
        afterValue: { month: m, year: y, employeesProcessed: payslipData.length },
      },
    });

    res.status(201).json({
      success: true,
      message: `Payrun created. ${payslipData.length} payslips generated.`,
      data: payrun,
      processed: payslipData.length,
      errors,
    });
  } catch (err) {
    next(err);
  }
}

// ── LIST PAYRUNS ──────────────────────────────────────────────────
async function listPayruns(req, res, next) {
  try {
    const runs = await prisma.payrollRun.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        _count: { select: { payslips: true } },
      },
    });
    res.json({ success: true, data: runs });
  } catch (err) {
    next(err);
  }
}

// ── GET PAYRUN DETAIL ─────────────────────────────────────────────
async function getPayrun(req, res, next) {
  try {
    const { id } = req.params;
    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        payslips: {
          include: {
            employee: {
              include: { profile: true },
            },
          },
        },
      },
    });
    if (!run) return res.status(404).json({ success: false, message: 'Payrun not found.' });
    res.json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
}

// ── FINALIZE PAYRUN ───────────────────────────────────────────────
async function finalizePayrun(req, res, next) {
  try {
    const { id } = req.params;

    const run = await prisma.payrollRun.findUnique({ where: { id } });
    if (!run) return res.status(404).json({ success: false, message: 'Payrun not found.' });
    if (run.status === 'finalized') {
      return res.status(400).json({ success: false, message: 'Payrun already finalized.' });
    }

    const finalized = await prisma.payrollRun.update({
      where: { id },
      data:  { status: 'finalized', finalizedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actorId:    req.user.sub,
        entity:     'payroll_run',
        entityId:   id,
        action:     'finalize',
        beforeValue: { status: 'draft' },
        afterValue:  { status: 'finalized' },
      },
    });

    res.json({ success: true, data: finalized });
  } catch (err) {
    next(err);
  }
}

// ── MY PAYSLIPS (employee) ────────────────────────────────────────
async function getMyPayslips(req, res, next) {
  try {
    const payslips = await prisma.payslip.findMany({
      where: { employeeId: req.user.sub },
      include: {
        payrun: true,
      },
      orderBy: [{ payrun: { year: 'desc' } }, { payrun: { month: 'desc' } }],
    });
    res.json({ success: true, data: payslips });
  } catch (err) {
    next(err);
  }
}

// ── GET SINGLE PAYSLIP ────────────────────────────────────────────
async function getPayslip(req, res, next) {
  try {
    const { id } = req.params;
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        payrun: true,
        employee: { include: { profile: true } },
      },
    });

    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found.' });

    // Employees can only view own payslips
    if (req.user.role === 'employee' && req.user.sub !== payslip.employeeId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: payslip });
  } catch (err) {
    next(err);
  }
}

// ── DOWNLOAD PAYSLIP PDF ──────────────────────────────────────────
async function downloadPayslipPDF(req, res, next) {
  try {
    const { id } = req.params;
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        payrun: true,
        employee: { include: { profile: true } },
      },
    });

    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found.' });

    // Employees can only download own payslips
    if (req.user.role === 'employee' && req.user.sub !== payslip.employeeId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const profile = payslip.employee.profile;
    const fileName = `empay_payslip_${profile?.employeeCode || payslip.employeeId}_${payslip.payrun.year}-${String(payslip.payrun.month).padStart(2, '0')}.pdf`;

    const pdfBuffer = await generatePayslipPDF({
      employee: {
        firstName:    profile?.firstName    || 'N/A',
        lastName:     profile?.lastName     || '',
        employeeCode: profile?.employeeCode || 'N/A',
        designation:  profile?.designation  || 'N/A',
        department:   profile?.department   || 'N/A',
      },
      payslip: {
        ctcAnnual:      Number(payslip.ctcAnnual),
        basicSalary:    Number(payslip.basicSalary),
        hra:            Number(payslip.hra),
        specialAllow:   Number(payslip.specialAllow),
        grossSalary:    Number(payslip.grossSalary),
        pfDeduction:    Number(payslip.pfDeduction),
        ptDeduction:    Number(payslip.ptDeduction),
        esicDeduction:  Number(payslip.esicDeduction),
        lopDeduction:   Number(payslip.lopDeduction),
        totalDeductions: Number(payslip.totalDeductions),
        netPay:         Number(payslip.netPay),
        workingDays:    payslip.workingDays,
        presentDays:    payslip.presentDays,
        leaveDays:      payslip.leaveDays,
        absentDays:     payslip.absentDays,
        lopDays:        payslip.lopDays,
      },
      month: payslip.payrun.month,
      year:  payslip.payrun.year,
    });

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length':      pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  triggerPayrun,
  listPayruns,
  getPayrun,
  finalizePayrun,
  getMyPayslips,
  getPayslip,
  downloadPayslipPDF,
};
