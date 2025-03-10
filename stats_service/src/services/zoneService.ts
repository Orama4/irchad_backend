import { PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();


export const getZones = async (page = 1,pageSize = 10) => {
    const skip = (page - 1) * pageSize; 
    const zones =  await prisma.zone.findMany({
      skip: skip,
      take: pageSize,
    });
    const total = await prisma.zone.count();
    return {zones,total}
  };

export const getZonesCount = async () => {
    const total = await prisma.zone.count();
    return { total };
};



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
