const prisma = require('../src/prismaClient');

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: { contains: 'shalin' } },
      include: {
        profile: {
          include: {
            leaveBalances: true
          }
        }
      }
    });
    console.log(JSON.stringify(user, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
