const prisma = require('../src/prismaClient');
const bcrypt = require('bcryptjs');
const { sha256 } = require('js-sha256');

async function main() {
  console.log('🛡️ Synchronizing 300 Employee Passwords with SHA-256 Security...');

  // The frontend sends sha256(password), so the backend stores bcrypt(sha256(password))
  const rawPassword = 'Pass@123';
  const shaHashed = sha256(rawPassword);
  const passwordHash = await bcrypt.hash(shaHashed, 10);

  // 1. Update Admin
  await prisma.user.upsert({
    where: { email: 'admin@empay.dev' },
    update: { passwordHash },
    create: {
      email: 'admin@empay.dev',
      passwordHash,
      role: 'admin',
      emailVerified: true,
      profile: {
        create: {
          firstName: 'EmPay',
          lastName: 'Admin',
          employeeCode: 'EMP001',
          department: 'Management',
          designation: 'System Administrator',
          joiningDate: new Date('2024-01-01'),
        }
      }
    }
  });

  const users = await prisma.user.findMany({ 
    where: { email: { startsWith: 'user' } }
  });

  console.log(`🚀 Updating passwords for ${users.length} employees...`);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });
  }

  console.log('✨ LOGIN SYNC COMPLETE! All users can now log in with: Pass@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
