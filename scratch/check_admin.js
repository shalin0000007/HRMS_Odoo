const prisma = require('../src/prismaClient');

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@empay.dev' }
  });
  console.log('User found:', JSON.stringify(user, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
