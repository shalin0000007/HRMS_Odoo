const prisma = require('../src/prismaClient');
const bcrypt = require('bcryptjs');
const { sha256 } = require('js-sha256');

async function main() {
  console.log('🏁 Finalizing Demo Accounts (Syncing with Login Buttons)...');

  const rawPassword = 'Pass@123';
  const shaHashed = sha256(rawPassword);
  const passwordHash = await bcrypt.hash(shaHashed, 10);

  const demoAccounts = [
    { email: 'admin@empay.dev',   role: 'admin',           code: 'EMP001', name: 'System Admin' },
    { email: 'hr@empay.dev',      role: 'hr_officer',      code: 'EMP002', name: 'HR Lead' },
    { email: 'payroll@empay.dev', role: 'payroll_officer', code: 'EMP003', name: 'Payroll Lead' },
    { email: 'alice@empay.dev',   role: 'employee',        code: 'EMP004', name: 'Alice Smith' },
  ];

  for (const acc of demoAccounts) {
    await prisma.user.upsert({
      where: { email: acc.email },
      update: { passwordHash, role: acc.role },
      create: {
        email: acc.email,
        passwordHash,
        role: acc.role,
        emailVerified: true,
        profile: {
          create: {
            firstName: acc.name.split(' ')[0],
            lastName: acc.name.split(' ')[1],
            employeeCode: acc.code,
            department: 'Management',
            designation: acc.role.toUpperCase(),
            joiningDate: new Date(),
          }
        }
      }
    });
    console.log(`   ✅ Synced: ${acc.email}`);
  }

  console.log('✨ ALL ROLES ARE NOW ACTIVE. You can use the Quick Access buttons!');
}

main().finally(() => prisma.$disconnect());
