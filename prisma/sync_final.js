const prisma = require('../src/prismaClient');
const bcrypt = require('bcryptjs');
const { sha256 } = require('js-sha256');

async function main() {
  console.log('🏁 Force-Syncing Login Credentials...');

  const rawPassword = 'Pass@123';
  const shaHashed = sha256(rawPassword);
  const passwordHash = await bcrypt.hash(shaHashed, 10);

  const emails = ['admin@empay.dev', 'hr@empay.dev', 'payroll@empay.dev', 'alice@empay.dev'];

  for (const email of emails) {
    await prisma.user.updateMany({
      where: { email },
      data: { passwordHash, isActive: true }
    });
    console.log(`   ✅ Synced: ${email}`);
  }

  console.log('✨ DONE. All demo accounts are active.');
}

main().finally(() => prisma.$disconnect());
