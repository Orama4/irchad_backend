import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listUsers() {
  try {
    // Query all users from the database
    const users = await prisma.user.findMany({
      include: {
        Profile: true,
        Decider: true,
        Admin: true,
        Commercial: true,
        Helper: true,
        Maintainer: true,
        EndUser: true,
      },
    });

    // Print the total number of users
    console.log(`Total users: ${users.length}`);

    // Print each user's info
    users.forEach((user) => {
      console.log("--------------------------------------");
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`Last Login: ${user.lastLogin}`);

      if (user.Profile) {
        console.log(`Name: ${user.Profile.firstname} ${user.Profile.lastname}`);
        console.log(`Phone: ${user.Profile.phonenumber}`);
      }

      // Show role-specific info
      if (user.Admin) console.log("Role Type: Admin");
      if (user.Decider) console.log("Role Type: Decider");
      if (user.Commercial) console.log("Role Type: Commercial");
      if (user.Helper) console.log("Role Type: Helper");
      if (user.Maintainer) console.log("Role Type: Maintainer");
      if (user.EndUser) console.log("Role Type: EndUser");
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
listUsers();
