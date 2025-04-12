import { PrismaClient, DeviceStatus, InterventionType, Role } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  // Create Maintainers
  const maintainer = await prisma.user.create({
    data: {
      email: faker.internet.email(),
      password: faker.internet.password(),
      role: Role.normal,
      Maintainer: {
        create: {},
      },
    },
    include: { Maintainer: true },
  });

  // Create Users + Devices
  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: faker.internet.password(),
        role: Role.normal,
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
            status: "active",
          },
        },
      },
      include: { EndUser: true },
    });

    const device = await prisma.device.create({
      data: {
        type: "Type A",
        version: "1.0",
        status: faker.helpers.arrayElement([
          DeviceStatus.connected,
          DeviceStatus.disconnected,
          DeviceStatus.en_panne,
          DeviceStatus.under_maintenance,
        ]),
        battery: faker.number.int({ min: 0, max: 100 }),
        userId: user.EndUser!.id,
      },
    });

    // Create some interventions for the device
    for (let j = 0; j < 2; j++) {
      await prisma.intervention.create({
        data: {
          deviceId: device.id,
          maintainerId: maintainer.Maintainer!.id,
          isRemote: faker.datatype.boolean(),
          type: faker.helpers.arrayElement([
            InterventionType.curative,
            InterventionType.preventive,
          ]),
          planDate: faker.date.recent(),
        },
      });
    }
  }

  console.log("✅ Dummy data seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
