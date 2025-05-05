import { PrismaClient, DeviceStatus, InterventionType, InterventionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {


  // Create 2 users for maintainers
  const users = [];
  for (let i = 0; i < 2; i++) {
    const user = await prisma.user.create({
      data: {
        email: `maintainer${i+1}@example.com`,
        password: `password${i+1}`,
      },
    });
    users.push(user);
  }

  // Create 2 maintainers linked to users
  const maintainers = [];
  for (let i = 0; i < 2; i++) {
    const maintainer = await prisma.maintainer.create({
      data: {
        userId: users[i].id,
      },
    });
    maintainers.push(maintainer);
  }

  // Logical device names and pre-defined statuses
  const deviceConfigs = [
    // First maintainer's devices
    { name: 'Lunettes Connectées Pro', status: DeviceStatus.Actif },
    { name: 'Lunettes Connectées Lite', status: DeviceStatus.Banne },
    { name: 'Ceinture Vibrante Max', status: DeviceStatus.Defectueux },
    { name: 'Ceinture Vibrante Standard', status: DeviceStatus.Hors_service },
    { name: 'Canne Augmentée Ultra', status: DeviceStatus.En_maintenance },
    
    // Second maintainer's devices
    { name: 'Canne Augmentée Classic', status: DeviceStatus.Actif },
    { name: 'Bracelet Sensoriel V2', status: DeviceStatus.Banne },
    { name: 'Montre Haptique', status: DeviceStatus.Actif },
    { name: 'Semelles Intelligentes', status: DeviceStatus.Defectueux },
    { name: 'Collier d\'Orientation', status: DeviceStatus.En_maintenance }
  ];

  // Create 10 devices (5 per maintainer)
  const devices = [];
  for (let i = 0; i < 10; i++) {
    const maintainer = maintainers[i < 5 ? 0 : 1];
    
    // Generate a simple MAC address pattern
    const macAddress = `AA:BB:CC:${(i+10).toString(16).toUpperCase()}:${(i+20).toString(16).toUpperCase()}:${(i+30).toString(16).toUpperCase()}`;
    
    const device = await prisma.device.create({
      data: {
        nom: deviceConfigs[i].name,
        macAdresse: macAddress,
        status: deviceConfigs[i].status,
        peripheriques: { description: "Périphérique standard" },
        localisation: { lat: 48.8566 + (i * 0.001), lng: 2.3522 + (i * 0.001) },
        cpuUsage: 30 + (i * 5) % 70,
        ramUsage: 20 + (i * 7) % 80,
        maintainerId: maintainer.id,
      },
    });
    devices.push(device);
  }

  // Create 20 interventions based on device status
  let interventionCount = 0;
  
  for (const device of devices) {
    // Skip devices with status En_maintenance
    if (device.status === DeviceStatus.En_maintenance) {
      continue;
    }
    
    // Determine intervention type based on device status
    let interventionType;
    if (device.status === DeviceStatus.Actif) {
      interventionType = InterventionType.preventive;
    } else if ([DeviceStatus.Banne, DeviceStatus.Hors_service, DeviceStatus.Defectueux].includes(device.status)) {
      interventionType = InterventionType.curative;
    } else {
      continue; // Skip if status doesn't match criteria
    }
    
    // Create 2-3 interventions per eligible device
    const numInterventions = Math.min(3, 20 - interventionCount);
    for (let i = 0; i < numInterventions; i++) {
      await prisma.intervention.create({
        data: {
          deviceId: device.id,
          maintainerId: device.maintainerId!,
          type: interventionType,
          isRemote: null,
          planDate: null,
          Priority: null,
          description: null,
          status: InterventionStatus.en_panne
        },
      });
      
      interventionCount++;
      
      if (interventionCount >= 20) {
        break;
      }
    }
    
    if (interventionCount >= 20) {
      break;
    }
  }
  
  // If we still need more interventions to reach 20, add more to eligible devices
  if (interventionCount < 20) {
    const eligibleDevices = devices.filter(d => d.status !== DeviceStatus.En_maintenance);
    
    let deviceIndex = 0;
    while (interventionCount < 20) {
      const device = eligibleDevices[deviceIndex % eligibleDevices.length];
      
      // Determine intervention type based on device status
      const interventionType = device.status === DeviceStatus.Actif 
        ? InterventionType.preventive 
        : InterventionType.curative;
      
      await prisma.intervention.create({
        data: {
          deviceId: device.id,
          maintainerId: device.maintainerId!,
          type: interventionType,
          isRemote: null,
          planDate: null,
          Priority: null,
          description: null,
          status: InterventionStatus.en_panne
        },
      });
      
      interventionCount++;
      deviceIndex++;
    }
  }

  console.log(`✔ Seed completed: 2 maintainers, 10 devices, ${interventionCount} interventions`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });