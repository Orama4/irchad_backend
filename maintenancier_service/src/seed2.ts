import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed end users...');
  
  // Create unique timestamp for this run to ensure unique emails
  const timestamp = new Date().getTime();
  
  // Create 10 users for end users
  const endUserData = [
    { firstName: 'Sophie', lastName: 'Martin', email: `sophie.martin.${timestamp}@example.com` },
    { firstName: 'Thomas', lastName: 'Bernard', email: `thomas.bernard.${timestamp}@example.com` },
    { firstName: 'Emma', lastName: 'Dubois', email: `emma.dubois.${timestamp}@example.com` },
    { firstName: 'Lucas', lastName: 'Petit', email: `lucas.petit.${timestamp}@example.com` },
    { firstName: 'Chloé', lastName: 'Leroy', email: `chloe.leroy.${timestamp}@example.com` },
    { firstName: 'Hugo', lastName: 'Moreau', email: `hugo.moreau.${timestamp}@example.com` },
    { firstName: 'Léa', lastName: 'Richard', email: `lea.richard.${timestamp}@example.com` },
    { firstName: 'Nathan', lastName: 'Simon', email: `nathan.simon.${timestamp}@example.com` },
    { firstName: 'Camille', lastName: 'Robert', email: `camille.robert.${timestamp}@example.com` },
    { firstName: 'Jules', lastName: 'Durand', email: `jules.durand.${timestamp}@example.com` }
  ];

  const createdEndUsers = [];

  for (let i = 0; i < endUserData.length; i++) {
    const { firstName, lastName, email } = endUserData[i];
    
    try {
      // Create user with user role
      const user = await prisma.user.create({
        data: {
          email: email,
          password: `password${i+1}`,
          role: 'normal',
          // Create profile with the user
          Profile: {
            create: {
              firstname: firstName,
              lastname: lastName,
              phonenumber: `+33612345${(i+10).toString().padStart(2, '0')}`,
              address: `${i+10} Rue de Paris, 75000 Paris`
            }
          }
        }
      });

      // Random Paris coordinates with slight variations
      const randomLat = 48.8566 + (Math.random() * 0.02 - 0.01);
      const randomLng = 2.3522 + (Math.random() * 0.02 - 0.01);
      
      // Create end user linked to user
      const endUser = await prisma.endUser.create({
        data: {
          userId: user.id,
          status: 'active',
          lastPos: { lat: randomLat, lng: randomLng }
        }
      });

      createdEndUsers.push(endUser);
      console.log(`Created end user: ${firstName} ${lastName}`);
      
      // Associate the end user with a device (assuming device IDs 31-40)
      try {
        const deviceId = 31 + i; // Device IDs range from 31 to 40
        
        const updatedDevice = await prisma.device.update({
          where: { id: deviceId },
          data: { userId: endUser.id },
        });
        
        console.log(`Associated device ${deviceId} (${updatedDevice.nom}) with end user ${firstName} ${lastName}`);
      } catch (error) {
      }
    } catch (error) {
    }
  }

  // Create helpers from the last two users
  const helperUsers = [];
  
  for (let i = 8; i < 10; i++) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: endUserData[i].email },
        include: { EndUser: true }
      });
      
      if (user) {
        const helper = await prisma.helper.create({
          data: { userId: user.id }
        });
        
        helperUsers.push(helper);
        console.log(`Created helper: ${endUserData[i].firstName} ${endUserData[i].lastName}`);
      }
    } catch (error) {
    }
  }
  
  // Assign helpers to end users using the actual end user IDs
  if (helperUsers.length >= 2) {
    // First helper helps users 0-3
    for (let j = 0; j < 4 && j < createdEndUsers.length; j++) {
      try {
        await prisma.endUser.update({
          where: { id: createdEndUsers[j].id },
          data: { helperId: helperUsers[0].id }
        });
        console.log(`Assigned helper 1 to end user ${j+1}`);
      } catch (error) {
      }
    }
    
    // Second helper helps users 4-7
    for (let j = 4; j < 8 && j < createdEndUsers.length; j++) {
      try {
        await prisma.endUser.update({
          where: { id: createdEndUsers[j].id },
          data: { helperId: helperUsers[1].id }
        });
        console.log(`Assigned helper 2 to end user ${j+1}`);
      } catch (error) {
      }
    }
  }

  console.log('✅ End user seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding end users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });