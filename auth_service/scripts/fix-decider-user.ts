import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function fixDeciderUser() {
  try {
    // 1. Delete the existing decider@app.com user
    console.log("Finding user with email decider@app.com...");
    const existingUser = await prisma.user.findUnique({
      where: { email: "decider@app.com" },
    });

    if (existingUser) {
      console.log(`Found user with ID: ${existingUser.id}. Deleting...`);
      
      // Delete the user - this will cascade delete the Decider record due to our relationship
      const deleteResult = await prisma.user.delete({
        where: { id: existingUser.id },
      });
      
      console.log(`User deleted: ${deleteResult.email}`);
    } else {
      console.log("No existing user with email decider@app.com found.");
    }

    // 2. Create the decider user with proper hashed password and role
    // Hash the password
    const hashedPassword = await bcrypt.hash("decider", 10);
    
    // Create new user with profile and proper role
    console.log("Creating new decider user...");
    const newUser = await prisma.user.create({
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
        Decider: {
          create: {} // Create the Decider role entry
        }
      },
      include: {
        Profile: true,
        Decider: true
      },
    });

    console.log(`New user created with ID: ${newUser.id}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`Profile: ${newUser.Profile.firstname} ${newUser.Profile.lastname}`);
    console.log(`Decider ID: ${newUser.Decider.id}`);
    
  } catch (error) {
    console.error("Error fixing decider user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
fixDeciderUser();