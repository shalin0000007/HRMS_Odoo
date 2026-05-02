/**
 * EmPay HRMS — Database Seed Script
 * Seeds: 1 Admin, 1 HR Officer, 1 Payroll Officer, 2 Employees
 * with salary structures, leave balances, and 2 months of attendance history
 *
 * Run: npm run db:seed
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg }     = require('@prisma/adapter-pg');
const { Pool }         = require('pg');
const bcrypt           = require('bcryptjs');

// Prisma 7: must pass adapter explicitly (no url in schema.prisma)
const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting EmPay seed...');

  // ── 1. Create Users ────────────────────────────────────────────
  const hashedPasswords = {
    admin:   await bcrypt.hash('Admin@123', 10),
    hr:      await bcrypt.hash('Hr@123', 10),
    payroll: await bcrypt.hash('Payroll@123', 10),
    alice:   await bcrypt.hash('Alice@123', 10),
    bob:     await bcrypt.hash('Bob@123', 10),
  };

  const admin = await prisma.user.upsert({
    where: { email: 'admin@empay.dev' },
    update: {},
    create: {
      email: 'admin@empay.dev',
      passwordHash: hashedPasswords.admin,
      role: 'admin',
    },
  });

  const hr = await prisma.user.upsert({
    where: { email: 'hr@empay.dev' },
    update: {},
    create: {
      email: 'hr@empay.dev',
      passwordHash: hashedPasswords.hr,
      role: 'hr_officer',
    },
  });

  const payroll = await prisma.user.upsert({
    where: { email: 'payroll@empay.dev' },
    update: {},
    create: {
      email: 'payroll@empay.dev',
      passwordHash: hashedPasswords.payroll,
      role: 'payroll_officer',
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@empay.dev' },
    update: {},
    create: {
      email: 'alice@empay.dev',
      passwordHash: hashedPasswords.alice,
      role: 'employee',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@empay.dev' },
    update: {},
    create: {
      email: 'bob@empay.dev',
      passwordHash: hashedPasswords.bob,
      role: 'employee',
    },
  });

  console.log('✅ Users created');

  // ── 2. Create Employee Profiles ────────────────────────────────
  const hrProfile = await prisma.employeeProfile.upsert({
    where: { userId: hr.id },
    update: {},
    create: {
      userId: hr.id,
      firstName: 'Priya',
      lastName: 'Sharma',
      department: 'Human Resources',
      designation: 'HR Officer',
      employeeCode: 'EMP001',
      joiningDate: new Date('2023-01-15'),
      gender: 'female',
    },
  });

  const payrollProfile = await prisma.employeeProfile.upsert({
    where: { userId: payroll.id },
    update: {},
    create: {
      userId: payroll.id,
      firstName: 'Rahul',
      lastName: 'Verma',
      department: 'Finance',
      designation: 'Payroll Officer',
      employeeCode: 'EMP002',
      joiningDate: new Date('2023-03-01'),
      gender: 'male',
    },
  });

  const aliceProfile = await prisma.employeeProfile.upsert({
    where: { userId: alice.id },
    update: {},
    create: {
      userId: alice.id,
      firstName: 'Alice',
      lastName: 'Fernandez',
      department: 'Engineering',
      designation: 'Software Engineer',
      employeeCode: 'EMP003',
      joiningDate: new Date('2024-01-10'),
      gender: 'female',
    },
  });

  const bobProfile = await prisma.employeeProfile.upsert({
    where: { userId: bob.id },
    update: {},
    create: {
      userId: bob.id,
      firstName: 'Bob',
      lastName: 'Mehta',
      department: 'Engineering',
      designation: 'Frontend Developer',
      employeeCode: 'EMP004',
      joiningDate: new Date('2024-04-01'),
      gender: 'male',
    },
  });

  console.log('✅ Employee profiles created');

  // ── 3. Create Salary Structures ────────────────────────────────
  await prisma.salaryStructure.upsert({
    where: { profileId: hrProfile.id },
    update: {},
    create: {
      profileId: hrProfile.id,
      ctcAnnual: 720000,
      basicPct: 40,
      hraPct: 50,
      pfEnabled: true,
      esicEnabled: false,
      state: 'Maharashtra',
      effectiveFrom: new Date('2023-01-15'),
    },
  });

  await prisma.salaryStructure.upsert({
    where: { profileId: payrollProfile.id },
    update: {},
    create: {
      profileId: payrollProfile.id,
      ctcAnnual: 840000,
      basicPct: 40,
      hraPct: 50,
      pfEnabled: true,
      esicEnabled: false,
      state: 'Maharashtra',
      effectiveFrom: new Date('2023-03-01'),
    },
  });

  await prisma.salaryStructure.upsert({
    where: { profileId: aliceProfile.id },
    update: {},
    create: {
      profileId: aliceProfile.id,
      ctcAnnual: 600000,
      basicPct: 40,
      hraPct: 50,
      pfEnabled: true,
      esicEnabled: false,
      state: 'Maharashtra',
      effectiveFrom: new Date('2024-01-10'),
    },
  });

  await prisma.salaryStructure.upsert({
    where: { profileId: bobProfile.id },
    update: {},
    create: {
      profileId: bobProfile.id,
      ctcAnnual: 480000,
      basicPct: 40,
      hraPct: 50,
      pfEnabled: true,
      esicEnabled: true,   // Bob qualifies for ESIC
      state: 'Maharashtra',
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
      { leaveType: 'unpaid',  totalDays: 999 },
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
        update: {},
        create: {
          profileId: profile.id,
          leaveType: lt.leaveType,
          year: currentYear,
          totalDays: lt.totalDays,
          consumed: 0,
        },
      });
    }
  }

  console.log('✅ Leave balances created');

  // ── 5. Seed Attendance for March & April 2025 ──────────────────
  const count = await seedAttendance(alice.id, bob.id);
  console.log(`✅ Attendance seeded (${count} records)`);

  // ── 6. Seed Leave Requests ─────────────────────────────────────
  await prisma.leaveRequest.createMany({
    data: [
      {
        employeeId: alice.id,
        leaveType: 'casual',
        fromDate: new Date('2025-03-10'),
        toDate:   new Date('2025-03-11'),
        totalDays: 2,
        reason: 'Personal work',
        status: 'approved',
        approverId: payroll.id,
        approverNote: 'Approved. Enjoy your time off.',
      },
      {
        employeeId: bob.id,
        leaveType: 'sick',
        fromDate: new Date('2025-04-07'),
        toDate:   new Date('2025-04-07'),
        totalDays: 1,
        reason: 'Not feeling well',
        status: 'approved',
        approverId: payroll.id,
      },
      {
        employeeId: alice.id,
        leaveType: 'earned',
        fromDate: new Date('2025-04-21'),
        toDate:   new Date('2025-04-23'),
        totalDays: 3,
        reason: 'Family vacation',
        status: 'pending',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Leave requests seeded');
  console.log('\n🎉 Seed complete!\n');
  console.log('   admin@empay.dev       / Admin@123');
  console.log('   hr@empay.dev          / Hr@123');
  console.log('   payroll@empay.dev     / Payroll@123');
  console.log('   alice@empay.dev       / Alice@123');
  console.log('   bob@empay.dev         / Bob@123\n');
}

async function seedAttendance(aliceId, bobId) {
  const records = [];
  const months  = [
    generateWorkdays(2025, 3),
    generateWorkdays(2025, 4),
  ];

  for (const days of months) {
    for (const date of days) {
      const alicePresent = Math.random() > 0.05;
      records.push({
        employeeId: aliceId,
        date,
        status: alicePresent ? (Math.random() > 0.9 ? 'late' : 'present') : 'absent',
        clockIn: alicePresent
          ? new Date(`${date.toISOString().split('T')[0]}T04:${String(Math.floor(Math.random() * 30)).padStart(2,'0')}:00.000Z`)
          : null,
      });

      const bobPresent = Math.random() > 0.12;
      records.push({
        employeeId: bobId,
        date,
        status: bobPresent ? (Math.random() > 0.85 ? 'late' : 'present') : 'absent',
        clockIn: bobPresent
          ? new Date(`${date.toISOString().split('T')[0]}T04:${String(Math.floor(Math.random() * 45)).padStart(2,'0')}:00.000Z`)
          : null,
      });
    }
  }

  await prisma.attendance.createMany({ data: records, skipDuplicates: true });
  return records.length;
}

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
