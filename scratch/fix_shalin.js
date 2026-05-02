const prisma = require('../src/prismaClient');

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: { contains: 'shalin' } },
      include: { profile: true }
    });

    if (user && user.profile) {
      await prisma.leaveBalance.updateMany({
        where: {
          profileId: user.profile.id,
          leaveType: 'unpaid'
        },
        data: { totalDays: 10 }
      });
      console.log('✅ Successfully fixed Shalin\'s leave balance!');
    } else {
      console.log('❌ Shalin profile not found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
