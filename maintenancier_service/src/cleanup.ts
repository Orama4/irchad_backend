import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
  console.log('Starting cleanup...');
  
  // First delete all interventions (they reference devices and maintainers)
  await prisma.intervention.deleteMany({});
  console.log('All interventions deleted');
  
  // Then delete all devices (they may reference maintainers)
  await prisma.device.deleteMany({});
  console.log('All devices deleted');
  
  // Get all maintainer IDs and their associated user IDs
  const maintainers = await prisma.maintainer.findMany({
    select: {
      id: true,
      userId: true
    }
  });
  
  // Delete all maintainers
  await prisma.maintainer.deleteMany({});
  console.log('All maintainers deleted');
  
  // Delete the associated user profiles
  for (const maintainer of maintainers) {
    await prisma.profile.deleteMany({
      where: { userId: maintainer.userId }
    });
  }
  console.log('Associated profiles deleted');
  
  // Delete the associated users
  for (const maintainer of maintainers) {
    await prisma.user.delete({
      where: { id: maintainer.userId }
    });
  }
  console.log('Associated users deleted');
  
  console.log('Cleanup complete!');
}

cleanup()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });