const prisma = require('../src/prismaClient');
const bcrypt = require('bcryptjs');
const { sha256 } = require('js-sha256');

async function debug() {
  const emails = ['admin@empay.dev', 'hr@empay.dev', 'payroll@empay.dev', 'alice@empay.dev'];
  
  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`❌ ${email} — DOES NOT EXIST IN DATABASE`);
    } else {
      // Test with the ROLE-SPECIFIC passwords from Login.jsx demo buttons
      const passwords = {
        'admin@empay.dev': 'Admin@123',
        'hr@empay.dev': 'Hr@123',
        'payroll@empay.dev': 'Payroll@123',
        'alice@empay.dev': 'Alice@123',
      };
      const rolePass = passwords[email];
      const shaHash = sha256(rolePass);
      const match = await bcrypt.compare(shaHash, user.passwordHash);
      
      // Also test with Pass@123
      const genericMatch = await bcrypt.compare(sha256('Pass@123'), user.passwordHash);
      
      console.log(`📧 ${email}`);
      console.log(`   Role: ${user.role} | Active: ${user.isActive} | Verified: ${user.emailVerified}`);
      console.log(`   Match with "${rolePass}" (sha256→bcrypt): ${match}`);
      console.log(`   Match with "Pass@123" (sha256→bcrypt): ${genericMatch}`);
      console.log('');
    }
  }
}

debug().catch(console.error).finally(() => prisma.$disconnect());
