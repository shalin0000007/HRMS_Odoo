const prisma = require('../src/prismaClient');
const bcrypt = require('bcryptjs');
const { sha256 } = require('js-sha256');

async function fix() {
  // These EXACTLY match the DEMO_USERS array in Login.jsx
  const demoUsers = [
    { email: 'admin@empay.dev',   password: 'Admin@123',   role: 'admin',           firstName: 'System',  lastName: 'Admin',    code: 'ADM001', dept: 'Management',  desig: 'System Administrator' },
    { email: 'hr@empay.dev',      password: 'Hr@123',      role: 'hr_officer',      firstName: 'Priya',   lastName: 'Sharma',   code: 'HR001',  dept: 'Human Resources', desig: 'HR Manager' },
    { email: 'payroll@empay.dev', password: 'Payroll@123', role: 'payroll_officer', firstName: 'Rahul',   lastName: 'Verma',    code: 'PAY001', dept: 'Finance',     desig: 'Payroll Manager' },
    { email: 'alice@empay.dev',   password: 'Alice@123',   role: 'employee',        firstName: 'Alice',   lastName: 'Johnson',  code: 'EMP301', dept: 'Engineering', desig: 'Software Engineer' },
  ];

  for (const u of demoUsers) {
    const shaHash = sha256(u.password);
    const passwordHash = await bcrypt.hash(shaHash, 10);

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email: u.email } });

    if (existing) {
      // Update password, role, and flags
      await prisma.user.update({
        where: { email: u.email },
        data: { passwordHash, role: u.role, isActive: true, emailVerified: true, verificationToken: null }
      });
      console.log(`✅ UPDATED: ${u.email} (password=${u.password})`);
    } else {
      // Create user + profile from scratch
      await prisma.user.create({
        data: {
          email: u.email,
          passwordHash,
          role: u.role,
          isActive: true,
          emailVerified: true,
          profile: {
            create: {
              firstName: u.firstName,
              lastName: u.lastName,
              employeeCode: u.code,
              department: u.dept,
              designation: u.desig,
              joiningDate: new Date('2024-06-01'),
              gender: 'other',
            }
          }
        }
      });
      console.log(`✅ CREATED: ${u.email} (password=${u.password})`);
    }
  }

  // Verify all 4 can login
  console.log('\n--- VERIFICATION ---');
  for (const u of demoUsers) {
    const user = await prisma.user.findUnique({ where: { email: u.email } });
    const match = await bcrypt.compare(sha256(u.password), user.passwordHash);
    console.log(`${match ? '✅' : '❌'} ${u.email} → password "${u.password}" → ${match ? 'LOGIN WORKS' : 'STILL BROKEN'}`);
  }
}

fix().catch(console.error).finally(() => prisma.$disconnect());
