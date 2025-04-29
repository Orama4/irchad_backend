import { PrismaClient, DeviceStatus, SeverityLevel } from "@prisma/client";
import { randomInt } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting KPI data seeding...");

  // 1. Update devices with manufacturing costs
  console.log("Adding manufacturing costs to existing devices...");
  const devices = await prisma.device.findMany();

  for (const device of devices) {
    // Manufacturing cost is typically 40-70% of selling price
    const costPercentage = Math.random() * 0.3 + 0.4; // between 40% and 70%
    const manufacturingCost = device.price
      ? Math.round(device.price * costPercentage)
      : null;

    await prisma.device.update({
      where: { id: device.id },
      data: { manufacturingCost: manufacturingCost },
    });
  }
  console.log(`Updated ${devices.length} devices with manufacturing costs.`);

  // 2. Update users with last login times
  console.log("Adding last login timestamps to users...");
  const users = await prisma.user.findMany();

  const now = new Date();
  for (const user of users) {
    // Random login in the last 30 days
    const daysAgo = randomInt(0, 30);
    const hoursAgo = randomInt(0, 24);
    const lastLogin = new Date(now);
    lastLogin.setDate(lastLogin.getDate() - daysAgo);
    lastLogin.setHours(lastLogin.getHours() - hoursAgo);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin },
    });
  }
  console.log(`Updated ${users.length} users with last login timestamps.`);

  // 3. Create security incidents
  console.log("Creating security incidents...");

  // Create sample security incidents
  const severityLevels: SeverityLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const incidentTitles = [
    "Unauthorized access attempt",
    "Suspicious login activity",
    "Failed login threshold exceeded",
    "Password reset requested",
    "API rate limit exceeded",
    "Database connection error",
    "Configuration change detected",
    "System resource exhaustion",
    "Permission escalation attempt",
    "Data export over threshold",
  ];

  const incidentDescriptions = [
    "Multiple failed login attempts from unknown IP address",
    "User account accessed from new location",
    "System detected brute force attempt on login form",
    "Password reset requested from unrecognized device",
    "API endpoints called at unusually high frequency",
    "Database connection dropped unexpectedly during operation",
    "Critical system configuration changed outside maintenance window",
    "System CPU/memory usage reached critical threshold",
    "User attempted to access unauthorized resource",
    "Large data export initiated outside business hours",
  ];

  // Create 20-40 incidents spread over the last 90 days
  const numIncidents = randomInt(20, 41);
  const activeUserIds = users.map((user) => user.id);

  for (let i = 0; i < numIncidents; i++) {
    const severity = severityLevels[randomInt(0, severityLevels.length)];
    const titleIndex = randomInt(0, incidentTitles.length);
    const daysAgo = randomInt(0, 90);

    const reportedAt = new Date();
    reportedAt.setDate(reportedAt.getDate() - daysAgo);

    // 70% chance of being resolved
    const isResolved = Math.random() < 0.7;
    let resolvedAt = null;

    if (isResolved) {
      // Resolved between 1 hour and 5 days after report
      const hoursToResolve = randomInt(1, 120);
      resolvedAt = new Date(reportedAt);
      resolvedAt.setHours(resolvedAt.getHours() + hoursToResolve);
    }

    const reportedBy = activeUserIds[randomInt(0, activeUserIds.length)];

    await prisma.securityIncident.create({
      data: {
        title: incidentTitles[titleIndex],
        description: incidentDescriptions[titleIndex],
        severity,
        reportedAt,
        resolvedAt,
        reportedBy,
        isResolved,
      },
    });
  }
  console.log(`Created ${numIncidents} security incidents.`);

  // 4. Create additional sales data for the past year to have richer revenue data
  console.log("Creating additional historical sales data...");

  // Get existing devices and end users for creating sales
  const availableDevices = await prisma.device.findMany({
    where: { status: "disconnected" }, // Assuming disconnected devices can be sold
  });

  // Get end users with their user IDs
  const endUsers = await prisma.endUser.findMany({
    include: { user: true },
  });

  if (availableDevices.length > 0 && endUsers.length > 0) {
    // Create 100-200 sales distributed over the past 12 months
    const numSales = randomInt(100, 201);
    const now = new Date();

    let successCount = 0;

    for (let i = 0; i < numSales; i++) {
      try {
        const daysAgo = randomInt(0, 365);
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - daysAgo);

        // Pick a random device and buyer
        const device = availableDevices[randomInt(0, availableDevices.length)];
        const endUser = endUsers[randomInt(0, endUsers.length)];

        // Check if we have valid relationships
        if (device && endUser && endUser.userId) {
          await prisma.sale.create({
            data: {
              deviceId: device.id,
              buyerId: endUser.userId, // Use the userId from the endUser
              createdAt: saleDate,
            },
          });
          successCount++;
        }
      } catch (e) {
        // Skip failed records
        console.log(`Skipping a sale record due to: ${e.message}`);
      }
    }
    console.log(`Created ${successCount} historical sales records.`);
  } else {
    console.log("Not enough devices or end users to create sales records.");
  }

  console.log("KPI data seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during KPI data seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
