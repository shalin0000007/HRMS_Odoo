const prisma = require('../src/prismaClient');
const bcrypt = require('bcryptjs');
const { sha256 } = require('js-sha256');

async function main() {
  console.log('🚀 Finalizing Demo Access (Verifying Emails & Activating Roles)...');

  const rawPassword = 'Pass@123';
  const shaHashed = sha256(rawPassword);
  const passwordHash = await bcrypt.hash(shaHashed, 10);

  const demoEmails = ['admin@empay.dev', 'hr@empay.dev', 'payroll@empay.dev', 'alice@empay.dev'];

  for (const email of demoEmails) {
    await prisma.user.updateMany({
      where: { email },
      data: { 
        passwordHash, 
        isActive: true, 
        emailVerified: true,
        verificationToken: null 
      }
    });
    console.log(`   ✅ FULLY ACTIVATED: ${email}`);
  }

  console.log('✨ LOGIN GATE OPEN! All roles are now 100% accessible.');
}

main().finally(() => prisma.$disconnect());
