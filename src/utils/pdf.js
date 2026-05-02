/**
 * EmPay — PDF Payslip Generator
 * Generates a professional payslip PDF using PDFKit (server-side)
 * Returns a Buffer that can be streamed or saved.
 */

const PDFDocument = require('pdfkit');

/**
 * @param {object} data
 * @param {object} data.employee    - { firstName, lastName, employeeCode, designation, department }
 * @param {object} data.payslip     - All payslip fields from computePayslip()
 * @param {number} data.month       - 1–12
 * @param {number} data.year
 * @returns {Promise<Buffer>}
 */
function generatePayslipPDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const { employee, payslip, month, year } = data;
    const monthName = new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long' });
    const INR = (n) => `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // ── HEADER ───────────────────────────────────────────────────
    doc.rect(0, 0, 595, 80).fill('#0D1B2A');

    doc.fontSize(24).fillColor('#00B4D8').font('Helvetica-Bold')
       .text('EmPay', 50, 22);

    doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica')
       .text('HR & Payroll Management System', 50, 50);

    doc.fontSize(10).fillColor('#A0C4D8').font('Helvetica')
       .text(`Payslip for ${monthName} ${year}`, 350, 35, { align: 'right', width: 195 });

    // ── EMPLOYEE DETAILS ─────────────────────────────────────────
    doc.moveDown(3);
    doc.fillColor('#0D1B2A').fontSize(13).font('Helvetica-Bold')
       .text('Employee Details', 50);

    doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).strokeColor('#00B4D8').lineWidth(1.5).stroke();
    doc.moveDown(0.5);

    const detailY = doc.y;
    doc.fontSize(10).font('Helvetica').fillColor('#333333');

    const leftDetails = [
      ['Employee Name',   `${employee.firstName} ${employee.lastName}`],
      ['Employee Code',   employee.employeeCode],
      ['Designation',     employee.designation],
      ['Department',      employee.department],
    ];

    const rightDetails = [
      ['Pay Period',      `${monthName} ${year}`],
      ['Working Days',    String(payslip.workingDays)],
      ['Present Days',    String(payslip.presentDays)],
      ['LOP Days',        String(payslip.lopDays)],
    ];

    leftDetails.forEach(([label, value], i) => {
      const y = detailY + i * 18;
      doc.fillColor('#666666').text(label, 50, y);
      doc.fillColor('#0D1B2A').font('Helvetica-Bold').text(value, 200, y);
      doc.font('Helvetica');
    });

    rightDetails.forEach(([label, value], i) => {
      const y = detailY + i * 18;
      doc.fillColor('#666666').text(label, 320, y);
      doc.fillColor('#0D1B2A').font('Helvetica-Bold').text(value, 460, y);
      doc.font('Helvetica');
    });

    // ── EARNINGS & DEDUCTIONS TABLE ───────────────────────────────
    const tableY = detailY + 90;

    // Table headers
    doc.rect(50, tableY, 495, 24).fill('#0D1B2A');
    doc.fillColor('#00B4D8').font('Helvetica-Bold').fontSize(10)
       .text('EARNINGS', 60, tableY + 7)
       .text('AMOUNT', 245, tableY + 7)
       .text('DEDUCTIONS', 310, tableY + 7)
       .text('AMOUNT', 490, tableY + 7);

    // Rows
    const earnings = [
      ['Basic Salary',        INR(payslip.basicSalary)],
      ['House Rent Allowance', INR(payslip.hra)],
      ['Special Allowance',   INR(payslip.specialAllow)],
    ];

    const deductions = [
      ['Provident Fund',      INR(payslip.pfDeduction)],
      ['Professional Tax',    INR(payslip.ptDeduction)],
      ['ESIC',                INR(payslip.esicDeduction)],
      ['Loss of Pay (LOP)',   INR(payslip.lopDeduction)],
    ];

    const maxRows = Math.max(earnings.length, deductions.length);
    let rowY = tableY + 30;

    for (let i = 0; i < maxRows; i++) {
      const bg = i % 2 === 0 ? '#F8FBFC' : '#FFFFFF';
      doc.rect(50, rowY, 495, 20).fill(bg);

      doc.fillColor('#333333').font('Helvetica').fontSize(10);

      if (earnings[i]) {
        doc.text(earnings[i][0], 60, rowY + 5)
           .fillColor('#0D1B2A').font('Helvetica-Bold')
           .text(earnings[i][1], 200, rowY + 5);
      }

      doc.font('Helvetica').fillColor('#333333');

      if (deductions[i]) {
        doc.text(deductions[i][0], 310, rowY + 5)
           .fillColor('#C0392B').font('Helvetica-Bold')
           .text(deductions[i][1], 460, rowY + 5);
      }

      rowY += 20;
    }

    // Totals row
    doc.rect(50, rowY, 495, 26).fill('#1A2B3C');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10)
       .text('Gross Salary', 60, rowY + 8)
       .text(INR(payslip.grossSalary), 200, rowY + 8)
       .text('Total Deductions', 310, rowY + 8)
       .text(INR(payslip.totalDeductions), 460, rowY + 8);

    rowY += 30;

    // NET PAY banner
    doc.rect(50, rowY, 495, 40).fill('#00B4D8');
    doc.fillColor('#0D1B2A').font('Helvetica-Bold').fontSize(14)
       .text('NET PAY (TAKE-HOME)', 60, rowY + 13)
       .text(INR(payslip.netPay), 350, rowY + 13, { width: 185, align: 'right' });

    rowY += 55;

    // ── FOOTER ──────────────────────────────────────────────────
    doc.fontSize(8).fillColor('#888888').font('Helvetica')
       .text('This is a computer-generated payslip and does not require a signature.', 50, rowY)
       .text(`Generated on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, 50, rowY + 14)
       .text('EmPay HRMS — Confidential', 50, rowY + 28);

    doc.end();
  });
}

module.exports = { generatePayslipPDF };
