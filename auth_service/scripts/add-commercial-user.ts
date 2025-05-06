import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting commercial user management...");

    // Step 1: Delete existing commercial users in a separate transaction
    await deleteExistingCommercialUsers();
    
    // Step 2: Create new commercial user in a separate transaction
    await createNewCommercialUser();

    console.log("Commercial user setup completed successfully!");
  } catch (error) {
    console.error("Error during commercial user setup:", error);
    throw error;
  }
}

async function deleteExistingCommercialUsers() {
  try {
    // Find existing users with commercial role
    const existingCommercialUsers = await prisma.user.findMany({
      where: { role: Role.commercial },
      include: { 
        Commercial: true, 
        Profile: true,
        securityIncidents: true,
        Notification: true,
        Log: true,
        EnvUser: true,
        UserDeviceHistory: true
      }
    });

    if (existingCommercialUsers.length === 0) {
      console.log("No existing commercial users found.");
      return;
    }

    console.log(`Found ${existingCommercialUsers.length} existing commercial user(s). Removing them...`);
    
    const commercialUserIds = existingCommercialUsers.map(user => user.id);
    
    // Delete related records in order based on dependency
    
    // Commercial table entries
    const userIdsWithCommercial = existingCommercialUsers
      .filter(user => user.Commercial)
      .map(user => user.id);
    
    if (userIdsWithCommercial.length > 0) {
      await prisma.commercial.deleteMany({
        where: { userId: { in: userIdsWithCommercial } }
      });
      console.log(`Deleted ${userIdsWithCommercial.length} Commercial table entries.`);
    }
    
    // Security incidents
    const securityIncidentIds = existingCommercialUsers.flatMap(
      user => user.securityIncidents.map(incident => incident.id)
    );
    
    if (securityIncidentIds.length > 0) {
      await prisma.securityIncident.deleteMany({
        where: { id: { in: securityIncidentIds } }
      });
      console.log(`Deleted ${securityIncidentIds.length} SecurityIncident entries.`);
    }
    
    // Notifications
    const notificationIds = existingCommercialUsers.flatMap(
      user => user.Notification.map(notification => notification.id)
    );
    
    if (notificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: notificationIds } }
      });
      console.log(`Deleted ${notificationIds.length} Notification entries.`);
    }
    
    // Logs
    const logIds = existingCommercialUsers.flatMap(
      user => user.Log.map(log => log.id)
    );
    
    if (logIds.length > 0) {
      await prisma.log.deleteMany({
        where: { id: { in: logIds } }
      });
      console.log(`Deleted ${logIds.length} Log entries.`);
    }
    
    // EnvUser entries
    const envUserIds = existingCommercialUsers.flatMap(
      user => user.EnvUser.map(envUser => envUser.id)
    );
    
    if (envUserIds.length > 0) {
      await prisma.envUser.deleteMany({
        where: { id: { in: envUserIds } }
      });
      console.log(`Deleted ${envUserIds.length} EnvUser entries.`);
    }
    
    // UserDeviceHistory entries
    const userDeviceHistoryIds = existingCommercialUsers.flatMap(
      user => user.UserDeviceHistory.map(history => history.id)
    );
    
    if (userDeviceHistoryIds.length > 0) {
      await prisma.userDeviceHistory.deleteMany({
        where: { id: { in: userDeviceHistoryIds } }
      });
      console.log(`Deleted ${userDeviceHistoryIds.length} UserDeviceHistory entries.`);
    }
    
    // Profile entries
    const userIdsWithProfile = existingCommercialUsers
      .filter(user => user.Profile)
      .map(user => user.id);
      
    if (userIdsWithProfile.length > 0) {
      await prisma.profile.deleteMany({
        where: { userId: { in: userIdsWithProfile } }
      });
      console.log(`Deleted ${userIdsWithProfile.length} Profile entries.`);
    }

    // Now safe to delete the users
    await prisma.user.deleteMany({
      where: { id: { in: commercialUserIds } }
    });
    
    console.log(`Deleted ${existingCommercialUsers.length} commercial user(s).`);
  } catch (error) {
    console.error("Error deleting existing commercial users:", error);
    throw error;
  }
}

async function createNewCommercialUser() {
  try {
    // Validate email format
    const email = "commerciale@app.com";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format!");
    }

    // Hash the password
    const password = "commerciale";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with commercial role
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        role: Role.commercial,
        lastLogin: new Date(),
        Profile: {
          create: {
            firstname: "Commercial",
            lastname: "User",
            phonenumber: "+0000000000",
            address: "Default Commercial Address",
          },
        },
      },
      include: { Profile: true },
    });
    console.log(`Created commercial user with email: ${email}`);

    // Create the commercial entry
    const commercial = await prisma.commercial.create({
      data: {
        userId: newUser.id,
      },
    });
    console.log(`Created Commercial record with ID: ${commercial.id} for user ID: ${newUser.id}`);
    
    return newUser;
  } catch (error) {
    console.error("Error creating new commercial user:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Operation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });