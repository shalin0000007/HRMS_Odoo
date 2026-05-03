const prisma = require('../src/prismaClient');
const bcrypt = require('bcryptjs');
const { sha256 } = require('js-sha256');

async function test() {
  const user = await prisma.user.findUnique({ where: { email: 'user2@empay.dev' } });
  if (!user) {
    console.log('User not found');
    return;
  }

  const rawPassword = 'Pass@123';
  const shaHashed = sha256(rawPassword);
  
  const isMatch = await bcrypt.compare(shaHashed, user.passwordHash);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`SHA-256 of Pass@123: ${shaHashed}`);
  console.log(`Bcrypt Match: ${isMatch}`);
}

test().finally(() => prisma.$disconnect());
