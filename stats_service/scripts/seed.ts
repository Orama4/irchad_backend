// seed.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Créer des utilisateurs (User) et des EndUser associés
  const endUserIds: number[] = []; // Stocker les IDs des EndUser créés

  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: faker.internet.password(),
        profile: {
          create: {
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            phonenumber: faker.phone.number(),
            address: faker.location.streetAddress(),
          },
        },
        endUser: {
          create: {
            status:"active",
            lastPos: JSON.stringify({ lat: faker.location.latitude(), lng: faker.location.longitude() }),
          },
        },
      },
      include: {
        endUser: true, // Inclure l'EndUser créé
      },
    });

    if (user.endUser) {
      endUserIds.push(user.endUser.id); // Ajouter l'ID de l'EndUser à la liste
    }

    console.log(`Created User with EndUser: ${user.email}`);
  }

  // Créer des dispositifs
  for (let i = 0; i < 20; i++) {
    await prisma.device.create({
      data: {
        type: faker.helpers.arrayElement(['Ceinture', 'Canne Augmenté', 'Lunnettes Connectées']),
        version: faker.system.semver(),
        macAdr: faker.internet.mac(),
        status: faker.helpers.arrayElement(['connected', 'disconnected', 'under_maintenance', 'en_panne']),
        battery: faker.number.int({ min: 0, max: 100 }),
        price: faker.number.int({ min: 100, max: 1000 }),
      },
    });
  }

  // Créer des ventes
  for (let i = 0; i < 50; i++) {
    await prisma.sale.create({
      data: {
        device: {
          connect: { id: faker.number.int({ min: 1, max: 20 }) }, // Relier à un dispositif existant
        },
        buyer: {
          connect: { id: faker.helpers.arrayElement(endUserIds) }, // Relier à un EndUser existant
        },
        createdAt: faker.date.past(), // Date de vente aléatoire dans le passé
      },
    });
  }
  

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
   // process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });