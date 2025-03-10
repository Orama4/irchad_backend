import { PrismaClient, DeviceStatus  } from "@prisma/client";

const prisma = new PrismaClient();

export const getDevices = async (page = 1,pageSize = 10) => {
    const skip = (page - 1) * pageSize; 
    const devices = await prisma.device.findMany({
        skip: skip,
        take: pageSize,
    })
    const total = await prisma.device.count();
    return {devices,total}
};




export const getDeviceStats = async () => {
    const totalDevices = await prisma.device.count();
    const calculatePercentage = (count: number) => 
        totalDevices > 0 ? parseFloat((count / totalDevices * 100).toFixed(2)) : 0;
    const maintenanceDevices = await prisma.device.count({
        where: { status: DeviceStatus.under_maintenance }
    });
    const enpanneDevices = await prisma.device.count({
        where: { status: DeviceStatus.en_panne }
    });
    const connectedDevices = await prisma.device.count({
        where: { status: DeviceStatus.connected }
    });
    const disconnectedDevices = await prisma.device.count({
        where: { status: DeviceStatus.disconnected }
    });

    return {
        total: totalDevices,
        maintenance: {
            count: maintenanceDevices,
            percentage: calculatePercentage(maintenanceDevices)
        },
        enpanne: {
            count: enpanneDevices,
            percentage: calculatePercentage(enpanneDevices)
        },
        connected: {
            count: connectedDevices,
            percentage: calculatePercentage(connectedDevices)
        },
        disconnected: {
            count: disconnectedDevices,
            percentage: calculatePercentage(disconnectedDevices)
        },
    };
};


export const getDevicesByMonth = async () => {
    const currentYear = new Date().getFullYear(); 
  
    const devicesByMonth = await prisma.device.groupBy({
      by: ["createdAt"],
      _count: { id: true }, // Compter le nombre de dispositifs
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`), 
          lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
        },
      },
    });
  
    const monthlyCounts: { [key: string]: number } = {};
  
    devicesByMonth.forEach((entry) => {
      const month = new Date(entry.createdAt).getMonth() + 1; // Obtenir le mois (1-12)
      monthlyCounts[month] = (monthlyCounts[month] || 0) + entry._count.id;
    });
  
    return monthlyCounts;
  };

export const filterDevices = async (type?: string, status?: DeviceStatus) => {
    return await prisma.device.findMany({
        where: {
            type: type ? { equals: type, mode: "insensitive" } : undefined,
            status: status ? status : undefined
        }
    });
};

