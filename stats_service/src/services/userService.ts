import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const countActiveUsers = async () => {
  return prisma.user.count({ where: { endUser: { status: "active" } } });
};

export const countInactiveUsers = async () => {
  return prisma.user.count({ where: { endUser: { status: "inactive" } } });
};

export const getUserProgress = async (interval: string) => {
  let query = "";
  if (interval === "day") {
    query = `
      SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as period, COUNT("id") as count
      FROM "EndUser"
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY period ASC;
    `;
  } else if (interval === "week") {
    query = `
      SELECT TO_CHAR("createdAt", 'IYYY-IW') as period, COUNT("id") as count
      FROM "EndUser"
      GROUP BY TO_CHAR("createdAt", 'IYYY-IW')
      ORDER BY period ASC;
    `;
  } else {
    query = `
      SELECT TO_CHAR("createdAt", 'YYYY-MM') as period, COUNT("id") as count
      FROM "EndUser"
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY period ASC;
    `;
  }

  const userStats = await prisma.$queryRawUnsafe<{ period: string; count: bigint }[]>(query);

  return userStats.map((entry) => ({
    period: entry.period,
    count: Number(entry.count),
  }));
};

export const getBlindUsers = async () => {
  return prisma.endUser.findMany({
    select: {
      id: true,
      status: true,
      user: {
        select: {
          profile: {
            select: {
              firstname: true,
              lastname: true,
              phonenumber: true,
              address: true,
            },
          },
        },
      },
    },
  });
};

export const addEndUser = async (userId: number, status: string, helperId?: number, lastPos?: object) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) throw new Error("Utilisateur introuvable");

  const existingEndUser = await prisma.endUser.findFirst({ where: { userId } });
  if (existingEndUser) throw new Error("Cet utilisateur est déjà un EndUser");

  return prisma.endUser.create({
    data: {
      userId,
      status,
      helperId: helperId || null,
      lastPos: lastPos || {},
    },
  });
};