import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Delete all existing deciders first
  console.log("Deleting existing deciders...");
  const { count } = await prisma.decider.deleteMany({});
  console.log(`Deleted ${count} decider(s).`);

  // Check if there are any deciders
  const deciderCount = await prisma.decider.count();

  if (deciderCount === 0) {
    // Check if the decider user already exists
    let deciderUser = await prisma.user.findUnique({
      where: { email: "decider@app.com" },
      include: { Profile: true },
    });

    if (!deciderUser) {
      // Hash the password
      const hashedPassword = await bcrypt.hash("decider", 10);
      // Create the decider user with all required attributes
      deciderUser = await prisma.user.create({
        data: {
          email: "decider@app.com",
          password: hashedPassword,
          role: "decider",
          Profile: {
            create: {
              firstname: "Decider",
              lastname: "User",
              phonenumber: "+0000000000",
              address: "Default Address",
            },
          },
        },
        include: { Profile: true },
      });
      console.log("Created decider user: decider@app.com");
    }

    // Create the decider entry if not exists
    const existingDecider = await prisma.decider.findUnique({
      where: { userId: deciderUser.id },
    });
    if (!existingDecider) {
      await prisma.decider.create({
        data: {
          userId: deciderUser.id,
        },
      });
      console.log("Created decider entry for decider@app.com");
    }
  } else {
    console.log(
      `Decider table already has ${deciderCount} row(s). No action taken.`
    );
  }

  // Fetch all users
  /*
  const users = await prisma.user.findMany();

  if (users.length === 0) {
    console.error("No users found. Please seed users first.");
    return;
  }

  // Create random deciders
  for (let i = 0; i < 10; i++) {
    // Pick a random user
    const randomUser = faker.helpers.arrayElement(users);

    // Create a decider
    await prisma.decider.create({
      data: {
        User: {
          connect: { id: randomUser.id }, // Connect to a random user
        },
      },
    });

    console.log(`Created Decider ${i + 1} for User ID: ${randomUser.id}`);
  }

  console.log("Deciders seeding completed successfully!");
  */
}

main()
  .catch((e) => {
    console.error(e);
    // process.exit(1);s
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
