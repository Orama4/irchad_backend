import prisma from "../lib/prisma";


export const getZones = async (page = 1,query="",pageSize = 10) => {
    const skip = (page - 1) * pageSize; 
    const zones =  await  prisma.zone.findMany({
      where:{
        name:{
          contains:query
        }
      },
      skip: skip,
      take: pageSize,
    });
    const total = zones.length
    return {zones,total}
  };

export const getZonesCount = async () => {
    const total = await prisma.zone.count();
    return { total };
};


export const getEZonesKPIs=async()=>{
    try {
      const totalZones = await prisma.zone.count();
      const zonesByMonth = await prisma.zone.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      const groupedByMonth = zonesByMonth.reduce<Record<string, number>>((acc, zone) => {
          const month = new Date(zone.createdAt).toLocaleString('default', { month: 'short' });
          acc[month] = (acc[month] || 0) + zone._count.id; // Accumulate the count for each month
          return acc;
            }, {});
const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const sortedProgressData = monthOrder.map((month) => ({
  name: month,
  value: groupedByMonth[month] || 0,
}));
      return {
        totalZones,
      progress: sortedProgressData,
      };
    } catch (error) {
      console.error('Error fetching zone progress:', error);
      //res.status(500).json({ error: 'Internal Server Error' });
      return null
    }
}


export const getZoneCountByDate = async (year: number): Promise<{ month: number; total: number }[]> => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const zones = await prisma.zone.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const result = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
    }));

    zones.forEach((zone) => {
      const month = new Date(zone.createdAt).getMonth();
      result[month].total += 1;
    });

    return result;
};
