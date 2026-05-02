import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

/* ── Register Font (optional — falls back to Helvetica) ───────── */
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa25L7W0Q5n-wU.woff2',
// });

/* ── Helpers ──────────────────────────────────────────────────── */
const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

/* ── Styles ───────────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },

  /* Header band */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  brand: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  docTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#3B82F6',
    textAlign: 'right',
  },
  docSub: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 2,
  },

  /* Info grid */
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    borderRadius: 8,
    padding: 12,
  },
  infoLabel: {
    fontSize: 7,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },

  /* Section */
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingBottom: 4,
  },
  earningsTitle: {
    color: '#10B981',
    borderBottomWidth: 1,
    borderBottomColor: '#10B981',
  },
  deductionsTitle: {
    color: '#EF4444',
    borderBottomWidth: 1,
    borderBottomColor: '#EF4444',
  },

  /* Table rows */
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  rowAlt: {
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  rowLabel: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
  },
  rowValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'right',
    width: 100,
  },
  rowValueRed: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#EF4444',
    textAlign: 'right',
    width: 100,
  },

  /* Total row */
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    flex: 1,
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'right',
    width: 100,
  },

  /* Net pay banner */
  netBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  netLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#3B82F6',
  },
  netValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#3B82F6',
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: '#D1D5DB',
  },
});

/* ── Component ────────────────────────────────────────────────── */
export default function PayslipPDF({ employee, payslip, month = 'April 2025', companyName = 'EmPay HRMS' }) {
  const earnings = [
    { label: 'Basic Salary',        amount: payslip.basic },
    { label: 'House Rent Allowance', amount: payslip.hra },
    { label: 'Standard Allowance',   amount: payslip.stdAllow },
    { label: 'Leave Travel Allowance', amount: payslip.lta },
    { label: 'Fixed Allowance',      amount: payslip.fixed },
  ];

  const deductions = [
    { label: 'Provident Fund (12%)',  amount: payslip.pf },
    { label: 'Professional Tax',      amount: payslip.profTax },
  ];

  return (
    <Document title={`Payslip - ${employee.name} - ${month}`} author={companyName}>
      <Page size="A4" style={s.page}>
        {/* ── Header ──────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <View style={s.logoBadge}>
              <Text style={s.logoText}>EP</Text>
            </View>
            <Text style={s.brand}>{companyName}</Text>
          </View>
          <View>
            <Text style={s.docTitle}>PAYSLIP</Text>
            <Text style={s.docSub}>{month} · Confidential</Text>
          </View>
        </View>

        {/* ── Employee Info ───────────────────────────── */}
        <View style={s.infoGrid}>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Employee Name</Text>
            <Text style={s.infoValue}>{employee.name}</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Department</Text>
            <Text style={s.infoValue}>{employee.dept}</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Pay Period</Text>
            <Text style={s.infoValue}>{month}</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Payable Days</Text>
            <Text style={s.infoValue}>30 / 30</Text>
          </View>
        </View>

        {/* ── Earnings ────────────────────────────────── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, s.earningsTitle]}>Earnings</Text>
          {earnings.map((e, i) => (
            <View key={e.label} style={[s.row, i % 2 === 1 && s.rowAlt]}>
              <Text style={s.rowLabel}>{e.label}</Text>
              <Text style={s.rowValue}>{fmt(e.amount)}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Gross Earnings</Text>
            <Text style={s.totalValue}>{fmt(payslip.grossEarnings)}</Text>
          </View>
        </View>

        {/* ── Deductions ──────────────────────────────── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, s.deductionsTitle]}>Deductions</Text>
          {deductions.map((d, i) => (
            <View key={d.label} style={[s.row, i % 2 === 1 && s.rowAlt]}>
              <Text style={s.rowLabel}>{d.label}</Text>
              <Text style={s.rowValueRed}>-{fmt(d.amount)}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Deductions</Text>
            <Text style={{ ...s.totalValue, color: '#EF4444' }}>-{fmt(payslip.totalDeductions)}</Text>
          </View>
        </View>

        {/* ── Net Pay Banner ──────────────────────────── */}
        <View style={s.netBanner}>
          <Text style={s.netLabel}>NET PAY (Take Home)</Text>
          <Text style={s.netValue}>{fmt(payslip.net)}</Text>
        </View>

        {/* ── Employer Contribution (info) ─────────── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: '#9CA3AF', borderBottomColor: '#E5E7EB' }]}>Employer Contribution (Not deducted from salary)</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>EPF — Employer Share (12%)</Text>
            <Text style={s.rowValue}>{fmt(payslip.pf)}</Text>
          </View>
        </View>

        {/* ── Footer ──────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>This is a computer-generated payslip and does not require a signature.</Text>
          <Text style={s.footerText}>{companyName} · Generated {new Date().toLocaleDateString('en-IN')}</Text>
        </View>
      </Page>
    </Document>
  );
}
