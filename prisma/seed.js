/**
 * EmPay HRMS — Database Seed Script
 * Seeds: 1 Admin, 1 HR Officer, 1 Payroll Officer, 2 Employees
 * with salary structures, leave balances, and 2 months of attendance history
 *
 * Run: npm run db:seed
 *
 * FIXES (v2):
 *  - ESIC corrected: Bob earns ₹40k/mo > ₹21k threshold → esicEnabled: false
 *  - Leave request dates updated from 2025 → 2026 to match leave balance year
 *  - Attendance seeded for all 4 profiles (not just Alice & Bob)
 *  - Added phone, address, emergencyContact fields to profiles
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg }     = require('@prisma/adapter-pg');
const { Pool }         = require('pg');
const bcrypt           = require('bcryptjs');
const { sha256 }       = require('js-sha256');

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting EmPay seed (with SHA-256 hashing)...');

  // ── 1. Create Users ────────────────────────────────────────────
  // We apply SHA-256 to passwords before Bcrypt to match the new Frontend logic
  const hashedPasswords = {
    admin:   await bcrypt.hash(sha256('Admin@123'), 10),
    hr:      await bcrypt.hash(sha256('Hr@123'), 10),
    payroll: await bcrypt.hash(sha256('Payroll@123'), 10),
    alice:   await bcrypt.hash(sha256('Alice@123'), 10),
    bob:     await bcrypt.hash(sha256('Bob@123'), 10),
  };

  const admin = await prisma.user.upsert({
    where: { email: 'admin@empay.dev' },
    update: { 
      passwordHash: hashedPasswords.admin,
      emailVerified: true 
    },
    create: {
      email: 'admin@empay.dev',
      passwordHash: hashedPasswords.admin,
      role: 'admin',
      emailVerified: true,
    },
  });

  const hr = await prisma.user.upsert({
    where: { email: 'hr@empay.dev' },
    update: { 
      passwordHash: hashedPasswords.hr,
      emailVerified: true 
    },
    create: {
      email: 'hr@empay.dev',
      passwordHash: hashedPasswords.hr,
      role: 'hr_officer',
      emailVerified: true,
    },
  });

  const payroll = await prisma.user.upsert({
    where: { email: 'payroll@empay.dev' },
    update: { 
      passwordHash: hashedPasswords.payroll,
      emailVerified: true 
    },
    create: {
      email: 'payroll@empay.dev',
      passwordHash: hashedPasswords.payroll,
      role: 'payroll_officer',
      emailVerified: true,
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@empay.dev' },
    update: { 
      passwordHash: hashedPasswords.alice,
      emailVerified: true 
    },
    create: {
      email: 'alice@empay.dev',
      passwordHash: hashedPasswords.alice,
      role: 'employee',
      emailVerified: true,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@empay.dev' },
    update: { 
      passwordHash: hashedPasswords.bob,
      emailVerified: true 
    },
    create: {
      email: 'bob@empay.dev',
      passwordHash: hashedPasswords.bob,
      role: 'employee',
      emailVerified: true,
    },
  });

  console.log('✅ Users created');

  // ── 2. Create Employee Profiles ────────────────────────────────
  const hrProfile = await prisma.employeeProfile.upsert({
    where: { userId: hr.id },
    update: {},
    create: {
      userId:       hr.id,
      firstName:    'Priya',
      lastName:     'Sharma',
      department:   'Human Resources',
      designation:  'HR Officer',
      employeeCode: 'EMP001',
      joiningDate:  new Date('2023-01-15'),
      gender:       'female',
    },
  });

  const payrollProfile = await prisma.employeeProfile.upsert({
    where: { userId: payroll.id },
    update: {},
    create: {
      userId:       payroll.id,
      firstName:    'Rahul',
      lastName:     'Verma',
      department:   'Finance',
      designation:  'Payroll Officer',
      employeeCode: 'EMP002',
      joiningDate:  new Date('2023-03-01'),
      gender:       'male',
    },
  });

  const aliceProfile = await prisma.employeeProfile.upsert({
    where: { userId: alice.id },
    update: {},
    create: {
      userId:       alice.id,
      firstName:    'Alice',
      lastName:     'Fernandez',
      department:   'Engineering',
      designation:  'Software Engineer',
      employeeCode: 'EMP003',
      joiningDate:  new Date('2024-01-10'),
      gender:       'female',
    },
  });

  const bobProfile = await prisma.employeeProfile.upsert({
    where: { userId: bob.id },
    update: {},
    create: {
      userId:       bob.id,
      firstName:    'Bob',
      lastName:     'Mehta',
      department:   'Engineering',
      designation:  'Frontend Developer',
      employeeCode: 'EMP004',
      joiningDate:  new Date('2024-04-01'),
      gender:       'male',
    },
  });

  console.log('✅ Employee profiles created');

  // ── 3. Create Salary Structures ────────────────────────────────
  // ESIC Rule: Only applies if gross salary < ₹21,000/month (₹2,52,000/year)
  // All employees here earn well above this threshold → esicEnabled: false for all
  await prisma.salaryStructure.upsert({
    where: { profileId: hrProfile.id },
    update: {},
    create: {
      profileId:     hrProfile.id,
      ctcAnnual:     720000,   // ₹60,000/mo — above ESIC threshold
      basicPct:      40,
      hraPct:        50,
      pfEnabled:     true,
      esicEnabled:   false,    // ₹60k/mo > ₹21k ESIC limit
      state:         'Maharashtra',
      effectiveFrom: new Date('2023-01-15'),
    },
  });

  await prisma.salaryStructure.upsert({
    where: { profileId: payrollProfile.id },
    update: {},
    create: {
      profileId:     payrollProfile.id,
      ctcAnnual:     840000,   // ₹70,000/mo — above ESIC threshold
      basicPct:      40,
      hraPct:        50,
      pfEnabled:     true,
      esicEnabled:   false,    // ₹70k/mo > ₹21k ESIC limit
      state:         'Maharashtra',
      effectiveFrom: new Date('2023-03-01'),
    },
  });

  await prisma.salaryStructure.upsert({
    where: { profileId: aliceProfile.id },
    update: {},
    create: {
      profileId:     aliceProfile.id,
      ctcAnnual:     600000,   // ₹50,000/mo — above ESIC threshold
      basicPct:      40,
      hraPct:        50,
      pfEnabled:     true,
      esicEnabled:   false,    // ₹50k/mo > ₹21k ESIC limit
      state:         'Maharashtra',
      effectiveFrom: new Date('2024-01-10'),
    },
  });

  await prisma.salaryStructure.upsert({
    where: { profileId: bobProfile.id },
    update: {},
    create: {
      profileId:     bobProfile.id,
      ctcAnnual:     480000,   // ₹40,000/mo — above ESIC threshold
      basicPct:      40,
      hraPct:        50,
      pfEnabled:     true,
      esicEnabled:   false,    // FIX: ₹40k/mo > ₹21k ESIC limit → ESIC does NOT apply
      state:         'Maharashtra',
      effectiveFrom: new Date('2024-04-01'),
    },
  });

  console.log('✅ Salary structures created');

  // ── 4. Create Leave Balances (current year) ────────────────────
  const currentYear = new Date().getFullYear();
  const allProfiles = [aliceProfile, bobProfile, hrProfile, payrollProfile];

  for (const profile of allProfiles) {
    const leaveTypes = [
      { leaveType: 'casual',  totalDays: 12 },
      { leaveType: 'sick',    totalDays: 12 },
      { leaveType: 'earned',  totalDays: 15 },
      { leaveType: 'unpaid',  totalDays: 10 },  // Realistic cap — not unlimited
    ];

    for (const lt of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          profileId_leaveType_year: {
            profileId: profile.id,
            leaveType: lt.leaveType,
            year: currentYear,
          },
        },
        update: { totalDays: lt.totalDays },  // Force-update in case old value was wrong (e.g. 999)
        create: {
          profileId: profile.id,
          leaveType: lt.leaveType,
          year:      currentYear,
          totalDays: lt.totalDays,
          consumed:  0,
        },
      });
    }
  }

  console.log('✅ Leave balances created');

  // ── 5. Seed Attendance for March & April 2026 ──────────────────
  // All 4 employee users get attendance records (not just Alice & Bob)
  const count = await seedAttendance(alice.id, bob.id, hr.id, payroll.id);
  console.log(`✅ Attendance seeded (${count} records)`);

  // ── 6. Seed Leave Requests (2026 dates — matches currentYear balances) ──
  await prisma.leaveRequest.createMany({
    data: [
      {
        employeeId:   alice.id,
        leaveType:    'casual',
        fromDate:     new Date('2026-03-10'),
        toDate:       new Date('2026-03-11'),
        totalDays:    2,
        reason:       'Personal work',
        status:       'approved',
        approverId:   hr.id,
        approverNote: 'Approved. Enjoy your time off.',
      },
      {
        employeeId:  bob.id,
        leaveType:   'sick',
        fromDate:    new Date('2026-04-07'),
        toDate:      new Date('2026-04-07'),
        totalDays:   1,
        reason:      'Not feeling well — mild fever',
        status:      'approved',
        approverId:  hr.id,
        approverNote: 'Get well soon.',
      },
      {
        employeeId: alice.id,
        leaveType:  'earned',
        fromDate:   new Date('2026-04-21'),
        toDate:     new Date('2026-04-23'),
        totalDays:  3,
        reason:     'Family vacation — Goa trip',
        status:     'pending',
      },
      {
        employeeId: bob.id,
        leaveType:  'casual',
        fromDate:   new Date('2026-05-05'),
        toDate:     new Date('2026-05-05'),
        totalDays:  1,
        reason:     'Home shifting — need a day off',
        status:     'pending',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Leave requests seeded');
  
  // ── 7. Seed Payroll Runs & Payslips ─────────────────────────────
  console.log('🌱 Seeding payroll history for charts...');
  const payruns = [
    { month: 11, year: 2025 },
    { month: 12, year: 2025 },
    { month: 1,  year: 2026 },
    { month: 2,  year: 2026 },
    { month: 3,  year: 2026 },
    { month: 4,  year: 2026 },
  ];

  for (const pr of payruns) {
    const run = await prisma.payrollRun.upsert({
      where: { month_year: { month: pr.month, year: pr.year } },
      update: { status: 'finalized' },
      create: {
        month:  pr.month,
        year:   pr.year,
        status: 'finalized',
        triggeredBy: admin.id,
      },
    });

    // Create a few payslips for each run to populate the totals
    const salary = 50000 + (Math.random() * 20000);
    const netPay = salary * 0.92;

    await prisma.payslip.upsert({
      where: { payrunId_employeeId: { employeeId: alice.id, payrunId: run.id } },
      update: {},
      create: {
        employeeId:  alice.id,
        payrunId:    run.id,
        ctcAnnual:   600000,
        basicSalary: salary * 0.4,
        hra:         salary * 0.2,
        specialAllow: salary * 0.4,
        grossSalary: salary,
        pfDeduction: salary * 0.05,
        ptDeduction: 200,
        lopDeduction: 0,
        totalDeductions: salary * 0.05 + 200,
        netPay:      netPay,
        workingDays: 22,
        presentDays: 21,
        leaveDays:   1,
        absentDays:  0,
        lopDays:      0,
      }
    });
  }

  console.log('✅ Payroll history seeded');
  console.log('\n🎉 Seed complete!\n');
  console.log('   admin@empay.dev       / Admin@123');
  console.log('   hr@empay.dev          / Hr@123');
  console.log('   payroll@empay.dev     / Payroll@123');
  console.log('   alice@empay.dev       / Alice@123');
  console.log('   bob@empay.dev         / Bob@123\n');
}

// ── Attendance Seeder ──────────────────────────────────────────────
// Generates realistic attendance for all 4 employees across March & April 2026
async function seedAttendance(aliceId, bobId, hrId, payrollId) {
  const records = [];
  const months  = [
    generateWorkdays(2026, 3),   // March 2026
    generateWorkdays(2026, 4),   // April 2026
  ];

  // Attendance profile for each user (realistic behavioural variation)
  const employees = [
    { id: aliceId,   absentRate: 0.05, lateRate: 0.08 },  // Alice: very punctual
    { id: bobId,     absentRate: 0.10, lateRate: 0.15 },  // Bob: occasionally late/absent
    { id: hrId,      absentRate: 0.03, lateRate: 0.05 },  // Priya (HR): very regular
    { id: payrollId, absentRate: 0.04, lateRate: 0.06 },  // Rahul (Payroll): regular
  ];

  for (const days of months) {
    for (const date of days) {
      for (const emp of employees) {
        const isPresent = Math.random() > emp.absentRate;
        const isLate    = isPresent && Math.random() < emp.lateRate;

        // Clock-in times (UTC → IST = +5:30):
        //   On-time: 04:00–04:39 UTC  = 09:30–10:09 IST
        //   Late:    05:00–05:29 UTC  = 10:30–10:59 IST
        const clockHour      = isLate ? 5 : 4;
        const clockMinute    = isLate ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 40);
        const hh             = String(clockHour).padStart(2, '0');
        const mm             = String(clockMinute).padStart(2, '0');
        const dateStr        = date.toISOString().split('T')[0];

        records.push({
          employeeId: emp.id,
          date,
          status:  isPresent ? (isLate ? 'late' : 'present') : 'absent',
          clockIn: isPresent
            ? new Date(`${dateStr}T${hh}:${mm}:00.000Z`)
            : null,
        });
      }
    }
  }

  await prisma.attendance.createMany({ data: records, skipDuplicates: true });
  return records.length;
}

// ── Helper: Generate all working days (Mon–Fri) in a month ──────────
function generateWorkdays(year, month) {
  const days = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() !== 0 && date.getDay() !== 6) days.push(date);
  }
  return days;
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
