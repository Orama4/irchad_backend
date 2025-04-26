import { PrismaClient, DeviceStatus, InterventionType, InterventionStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.intervention.deleteMany();
  await prisma.device.deleteMany();
  await prisma.maintainer.deleteMany();
  await prisma.user.deleteMany(); // Also clean up related users

  // Create 2 users for maintainers
  const users = await Promise.all(
    Array.from({ length: 2 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: faker.internet.password(),
        },
      })
    )
  );

  // Create 2 maintainers linked to users
  const maintainers = await Promise.all(
    users.map(user =>
      prisma.maintainer.create({
        data: {
          userId: user.id,
        },
      })
    )
  );

  // Create 10 devices (5 per maintainer)
  const devices: any[] = [];

  for (let i = 0; i < 10; i++) {
    const maintainer = maintainers[i < 5 ? 0 : 1];
    const device = await prisma.device.create({
      data: {
        nom: faker.commerce.productName(),
        macAdresse: faker.internet.mac(),
        status: faker.helpers.arrayElement(Object.values(DeviceStatus)),
        peripheriques: { description: faker.commerce.productAdjective() },
        localisation: { lat: faker.location.latitude(), lng: faker.location.longitude() },
        cpuUsage: faker.number.float({ min: 0, max: 100 }),
        ramUsage: faker.number.float({ min: 0, max: 100 }),
        maintainerId: maintainer.id,
      },
    });
    devices.push(device);
  }

  // Create 20 interventions (2 per device, equally distributed)
  await Promise.all(
    devices.flatMap(device =>
      Array.from({ length: 2 }).map(() =>
        prisma.intervention.create({
          data: {
            deviceId: device.id,
            maintainerId: device.maintainerId!,
            type: faker.helpers.arrayElement(Object.values(InterventionType)),
            isRemote: faker.datatype.boolean(),
            planDate: faker.date.future(),
            Priority: faker.helpers.arrayElement(['Haute', 'Moyenne', 'Basse']),
            description: faker.lorem.sentence(),
            status: faker.helpers.arrayElement(Object.values(InterventionStatus)),
          },
        })
      )
    )
  );

  console.log('✔ Seed completed: 2 maintainers, 10 devices, 20 interventions');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
