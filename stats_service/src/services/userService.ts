import prisma from "../lib/prisma";


export const countActiveUsers = async () => {
  return prisma.user.count({ where: { EndUser: { status: "active" } } }); // update this line
};

export const countInactiveUsers = async () => {
  return prisma.user.count({ where: { EndUser : { status: "inactive" } } });  // update this line
};


export const getUserProgress = async (interval: string) => {
  // Fetch all EndUser records with createdAt timestamps
  const allUsers = await prisma.endUser.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group records by the specified interval (day, week, or month)
  const groupedUsers = allUsers.reduce((acc, user) => {
    const date = new Date(user.createdAt);
    let period = "";

    if (interval === "day") {
      // Group by day (YYYY-MM-DD)
      period = date.toISOString().split("T")[0];
    } else if (interval === "week") {
      // Group by ISO week (YYYY-WW)
      const year = date.getFullYear();
      const week = getISOWeek(date); // Helper function to get ISO week number
      period = `${year}-${week.toString().padStart(2, "0")}`;
    } else {
      // Group by month (YYYY-MM)
      const month = new Date(user.createdAt).toLocaleString('default', { month: 'short' });
      period=month
    }
    if (!acc[period]) {
      acc[period] = 0;
    }
    acc[period]++;
    return acc;
  }, {} as Record<string, number>);

  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const userProgress = monthOrder.map((month) => ({
    name: month,
    value: groupedUsers[month] || 0,
  }));
  return userProgress;
};


function getISOWeek(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}


export const getBlindUsers = async (page: number,query?:string, pageSize: number = 10) => {
  // Calculate the offset (number of records to skip)
  const skip = (page - 1) * pageSize;

  // Fetch the paginated users
  const users = await prisma.endUser.findMany({
    where:{
      User:{
        Profile:{
          OR:[
          {firstname:{
            contains:query
          }},{
            lastname:{
              contains:query
            }
          }]
        }
      }
    },
    skip, // Skip records for previous pages
    take: pageSize, // Limit the number of records per page
    select: {
      id: true,
      status: true,
      User: {
        select: {
          Profile: {
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

  // Get the total number of records
  const totalCount = await prisma.endUser.count();

  // Calculate the total number of pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Return the paginated result
  return {
    users,
    totalPages,
    currentPage: page,
  };
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