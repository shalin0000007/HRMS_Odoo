/**
 * EmPay HRMS — Advanced Database Seed Script
 * Seeds: 1 Admin, 2 HR Officers, 2 Payroll Officers, 15 Employees
 * Total: 20 Employees + 1 Admin
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
  console.log('🌱 Starting EmPay Professional Seed (20 Employees)...');

  // 1. Common Password for all seed users
  const defaultPassword = await bcrypt.hash(sha256('Pass@123'), 10);
  const currentYear = new Date().getFullYear();

  // 2. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@empay.dev' },
    update: { passwordHash: defaultPassword, emailVerified: true },
    create: {
      email: 'admin@empay.dev',
      passwordHash: defaultPassword,
      role: 'admin',
      emailVerified: true,
    },
  });
  console.log('✅ Admin account ready');

  // 3. Definition of Employee Data
  const employeeData = [
    // HR OFFICERS
    { email: 'hr1@empay.dev', role: 'hr_officer', first: 'Priya', last: 'Sharma', dept: 'Human Resources', desig: 'Senior HR Manager', sal: 950000, gender: 'female' },
    { email: 'hr2@empay.dev', role: 'hr_officer', first: 'Arjun', last: 'Kapoor', dept: 'Human Resources', desig: 'HR Specialist', sal: 650000, gender: 'male' },
    
    // PAYROLL OFFICERS
    { email: 'pay1@empay.dev', role: 'payroll_officer', first: 'Rahul', last: 'Verma', dept: 'Finance', desig: 'Payroll Lead', sal: 850000, gender: 'male' },
    { email: 'pay2@empay.dev', role: 'payroll_officer', first: 'Sneha', last: 'Reddy', dept: 'Finance', desig: 'Accounts Officer', sal: 550000, gender: 'female' },

    // EMPLOYEES - ENGINEERING
    { email: 'dev1@empay.dev', role: 'employee', first: 'Alice', last: 'Fernandez', dept: 'Engineering', desig: 'Full Stack Developer', sal: 1200000, gender: 'female' },
    { email: 'dev2@empay.dev', role: 'employee', first: 'Bob', last: 'Mehta', dept: 'Engineering', desig: 'Frontend Architect', sal: 1100000, gender: 'male' },
    { email: 'dev3@empay.dev', role: 'employee', first: 'Charlie', last: 'Singh', dept: 'Engineering', desig: 'Backend Developer', sal: 900000, gender: 'male' },
    { email: 'dev4@empay.dev', role: 'employee', first: 'Diana', last: 'Prince', dept: 'Engineering', desig: 'QA Engineer', sal: 750000, gender: 'female' },
    { email: 'dev5@empay.dev', role: 'employee', first: 'Ethan', last: 'Hunt', dept: 'Engineering', desig: 'DevOps Engineer', sal: 1300000, gender: 'male' },
    { email: 'dev6@empay.dev', role: 'employee', first: 'Fiona', last: 'Gallagher', dept: 'Engineering', desig: 'Mobile Developer', sal: 850000, gender: 'female' },

    // EMPLOYEES - SALES
    { email: 'sales1@empay.dev', role: 'employee', first: 'George', last: 'Clooney', dept: 'Sales', desig: 'Sales Director', sal: 1500000, gender: 'male' },
    { email: 'sales2@empay.dev', role: 'employee', first: 'Hannah', last: 'Baker', dept: 'Sales', desig: 'Account Executive', sal: 600000, gender: 'female' },
    { email: 'sales3@empay.dev', role: 'employee', first: 'Ian', last: 'Somerhalder', dept: 'Sales', desig: 'Business Development', sal: 500000, gender: 'male' },
    { email: 'sales4@empay.dev', role: 'employee', first: 'Jasmine', last: 'Sanders', dept: 'Sales', desig: 'Sales Coordinator', sal: 450000, gender: 'female' },
    { email: 'sales5@empay.dev', role: 'employee', first: 'Kevin', last: 'Hart', dept: 'Sales', desig: 'Regional Manager', sal: 1100000, gender: 'male' },

    // EMPLOYEES - OPERATIONS
    { email: 'ops1@empay.dev', role: 'employee', first: 'Laura', last: 'Croft', dept: 'Operations', desig: 'Operations Manager', sal: 1000000, gender: 'female' },
    { email: 'ops2@empay.dev', role: 'employee', first: 'Mike', last: 'Ross', dept: 'Operations', desig: 'Supply Chain Analyst', sal: 700000, gender: 'male' },
    { email: 'ops3@empay.dev', role: 'employee', first: 'Nina', last: 'Dobrev', dept: 'Operations', desig: 'Logistics Coordinator', sal: 550000, gender: 'female' },
    { email: 'ops4@empay.dev', role: 'employee', first: 'Oscar', last: 'Isaac', dept: 'Operations', desig: 'Facility Supervisor', sal: 480000, gender: 'male' },
    { email: 'ops5@empay.dev', role: 'employee', first: 'Paula', last: 'Patton', dept: 'Operations', desig: 'Customer Success', sal: 520000, gender: 'female' },
  ];

  console.log(`🚀 Seeding ${employeeData.length} employees...`);

  for (let i = 0; i < employeeData.length; i++) {
    const data = employeeData[i];
    const empCode = `EMP${String(i + 1).padStart(3, '0')}`;

    // Create User
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { passwordHash: defaultPassword, role: data.role, emailVerified: true },
      create: {
        email: data.email,
        passwordHash: defaultPassword,
        role: data.role,
        emailVerified: true,
      },
    });

    // Create Profile
    const profile = await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: {
        firstName: data.first,
        lastName: data.last,
        department: data.dept,
        designation: data.desig,
        employeeCode: empCode,
      },
      create: {
        userId: user.id,
        firstName: data.first,
        lastName: data.last,
        department: data.dept,
        designation: data.desig,
        employeeCode: empCode,
        joiningDate: new Date('2024-01-01'),
        gender: data.gender,
        phone: `9876543${String(i).padStart(3, '0')}`,
      },
    });

    // Create Salary Structure
    await prisma.salaryStructure.upsert({
      where: { profileId: profile.id },
      update: { ctcAnnual: data.sal },
      create: {
        profileId: profile.id,
        ctcAnnual: data.sal,
        basicPct: 40,
        hraPct: 50,
        pfEnabled: true,
        esicEnabled: data.sal < 252000, // ESIC only for low earners
        state: 'Maharashtra',
        effectiveFrom: new Date('2024-01-01'),
      },
    });

    // Create Leave Balances
    const leaveTypes = [
      { leaveType: 'casual', totalDays: 12 },
      { leaveType: 'sick', totalDays: 12 },
      { leaveType: 'earned', totalDays: 15 },
      { leaveType: 'unpaid', totalDays: 10 },
    ];

    for (const lt of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          profileId_leaveType_year: { profileId: profile.id, leaveType: lt.leaveType, year: currentYear }
        },
        update: { totalDays: lt.totalDays },
        create: {
          profileId: profile.id,
          leaveType: lt.leaveType,
          year: currentYear,
          totalDays: lt.totalDays,
          consumed: 0
        }
      });
    }
  }

  console.log('✅ All 20 Employees seeded successfully.');
  console.log('\n🔑 Login Credentials:');
  console.log('   Email: [any]@empay.dev (e.g. admin@empay.dev, hr1@empay.dev, dev1@empay.dev)');
  console.log('   Password: Pass@123\n');
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
