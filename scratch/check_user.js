const prisma = require('../src/prismaClient');

async function check() {
  try {
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(user, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
