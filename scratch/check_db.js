const prisma = require('../src/prismaClient');

async function main() {
  const count = await prisma.user.count();
  console.log(`Current User Count: ${count}`);
}

main().finally(() => prisma.$disconnect());
