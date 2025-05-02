import { PrismaClient, DeviceStatus  } from "@prisma/client";

const prisma = new PrismaClient();

export const getDevices = async (page = 1,query:string,pageSize = 10) => {
    const skip = (page - 1) * pageSize; 
    const devices = await prisma.device.findMany({
        where:{
            type:{
                contains:query
            }
        },
        skip: skip,
        take: pageSize,
    })
    const total = await prisma.device.count();
    return {devices,total}
};

// changes here 
export const getDeviceStats = async () => {
    const totalDevices = await prisma.device.count();
    const calculatePercentage = (count: number) => 
        totalDevices > 0 ? parseFloat((count / totalDevices * 100).toFixed(2)) : 0;
    const maintenanceDevices = await prisma.device.count({
        where: { status: DeviceStatus.under_maintenance }
    });
    // count the devices that are in maintenance
    const enpanneDevices = await prisma.device.count({
        where: { status: DeviceStatus.broken_down }
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
        "en panne": {
            count: enpanneDevices,
            percentage: calculatePercentage(enpanneDevices)
        },
        "connecté": {
            count: connectedDevices,
            percentage: calculatePercentage(connectedDevices)
        },
        "déconnecté": {
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
      const month = new Date(entry.createdAt).toLocaleString("default",{month:"short"})
      monthlyCounts[month] = (monthlyCounts[month] || 0) + entry._count.id;
    });
  
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const storedDeviceProgress = monthOrder.map((month) => ({
  name: month,
  value: monthlyCounts[month] || 0,
}));
    return storedDeviceProgress;
  };


export const filterDevices = async (type?: string, status?: DeviceStatus) => {
    return await prisma.device.findMany({
        where: {
            type: type ? { equals: type, mode: "insensitive" } : undefined,
            status: status ? status : undefined
        }
    });
};

