const { PrismaClient, DeviceStatus } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function seedData() {
  // Create Users + Devices
  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: faker.internet.password(),
        role: 'normal',
        Profile: {
          create: {
            firstname: faker.name.firstName(),
            lastname: faker.name.lastName(),
            phonenumber: faker.phone.number(),
            address: faker.address.streetAddress(),
          },
        },
        EndUser: {
          create: {
            status: 'active',
          },
        },
      },
      include: { EndUser: true },
    });

    await prisma.device.create({
      data: {
        type: 'Type A',
        version: '1.0',
        status: faker.helpers.arrayElement([
          DeviceStatus.connected,
          DeviceStatus.disconnected,
          DeviceStatus.en_panne,
          DeviceStatus.under_maintenance,
        ]),
        battery: faker.number.int({ min: 0, max: 100 }),
        userId: user.EndUser.id,
      },
    });
  }

  console.log('✅ Dummy data seeded successfully.');
}

seedData()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
