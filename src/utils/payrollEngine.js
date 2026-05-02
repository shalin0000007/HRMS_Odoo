/**
 * EmPay — Payroll Computation Engine
 * Pure function: same inputs → same outputs, always.
 * Based on Indian payroll compliance research (see EmPay_Complete_Research.html §5)
 *
 * Formula:
 *   Basic      = CTC_annual × basicPct% ÷ 12
 *   HRA        = Basic × hraPct%
 *   SpecAllow  = (CTC_annual ÷ 12) - Basic - HRA - EmployerPF
 *   Gross      = Basic + HRA + SpecAllow
 *   PF         = Basic × 12%            (if pfEnabled)
 *   PT         = state slab lookup      (see ptSlab.js)
 *   ESIC       = Gross × 0.75%          (if esicEnabled AND gross ≤ 21000)
 *   LOP        = (Gross ÷ workingDays) × lopDays
 *   Net        = Gross - PF - PT - ESIC - LOP
 */

const { getProfessionalTax } = require('./ptSlab');

/**
 * @param {object} employee        - { id, ... }
 * @param {object} salaryStructure - { ctcAnnual, basicPct, hraPct, pfEnabled, esicEnabled, state }
 * @param {object} attendanceSummary - { workingDays, presentDays, leaveDays, absentDays, lopDays }
 * @returns {object} Full payslip breakdown
 */
function computePayslip(employee, salaryStructure, attendanceSummary) {
  const ctc           = Number(salaryStructure.ctcAnnual);
  const basicPct      = Number(salaryStructure.basicPct) / 100;   // e.g. 0.40
  const hraPct        = Number(salaryStructure.hraPct)  / 100;   // e.g. 0.50

  // ── Earnings ──────────────────────────────────────────────────
  const basic         = round2(ctc * basicPct / 12);
  const hra           = round2(basic * hraPct);
  const employerPF    = salaryStructure.pfEnabled ? round2(basic * 0.12) : 0;

  // Special Allowance fills the gap between monthly CTC and known components
  const specialAllow  = round2((ctc / 12) - basic - hra - employerPF);
  const grossSalary   = round2(basic + hra + specialAllow);

  // ── Deductions ────────────────────────────────────────────────
  const pfDeduction   = salaryStructure.pfEnabled  ? round2(basic * 0.12) : 0;

  const ptDeduction   = getProfessionalTax(
    grossSalary,
    salaryStructure.state || 'Maharashtra',
  );

  // ESIC: 0.75% of gross, only if enabled AND gross ≤ ₹21,000
  const esicDeduction = (salaryStructure.esicEnabled && grossSalary <= 21000)
    ? round2(grossSalary * 0.0075)
    : 0;

  // LOP: (gross / working_days) × lop_days
  const { workingDays, presentDays, leaveDays, absentDays, lopDays } = attendanceSummary;
  const perDayWage    = workingDays > 0 ? round2(grossSalary / workingDays) : 0;
  const lopDeduction  = round2(perDayWage * lopDays);

  // ── Net ───────────────────────────────────────────────────────
  const totalDeductions = round2(pfDeduction + ptDeduction + esicDeduction + lopDeduction);
  const netPay          = round2(grossSalary - totalDeductions);

  return {
    // Earnings
    ctcAnnual:    ctc,
    basicSalary:  basic,
    hra,
    specialAllow,
    grossSalary,

    // Deductions
    pfDeduction,
    ptDeduction,
    esicDeduction,
    lopDeduction,
    totalDeductions,

    // Net
    netPay,

    // Attendance summary (stored on payslip for audit)
    workingDays:  workingDays || 0,
    presentDays:  presentDays || 0,
    leaveDays:    leaveDays   || 0,
    absentDays:   absentDays  || 0,
    lopDays:      lopDays     || 0,
  };
}

/**
 * Round to 2 decimal places (avoids JS floating-point drift)
 */
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate working days in a given month-year (Mon–Fri)
 */
function getWorkingDaysInMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

module.exports = { computePayslip, getWorkingDaysInMonth };
