import { prisma } from "./../lib/prisma"


export const getTotalSalesService = async (): Promise<number> => {
    return await prisma.sale.count();
};

export const getTotalRevenueService = async (): Promise<number> => {
    const sales = await prisma.sale.findMany({
        include: { Device: true }, 
    });

    const totalRevenue = sales.reduce((sum : number , sale  ) => sum + (sale.Device.price || 0), 0);

    return totalRevenue;
  };

export const getSalesStatisticsService = async (/*startDate: Date, endDate: Date,*/ groupBy:string="month") => {
        const dateFormat =
            groupBy === "day" ? 'YYYY-MM-DD' :
            groupBy === "month" ? 'YYYY-MM' :
            'YYYY';
    
        const salesStats = await prisma.$queryRaw<
            { period: string; totalsales: BigInt }[]
        >`
            SELECT TO_CHAR("createdAt", ${dateFormat}) AS period, COUNT(*) AS totalSales
            FROM "Sale"
            GROUP BY period
            ORDER BY period ASC;
        `;

        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formattedStats = salesStats.map(stat => ({
        period: new Date(stat.period).toLocaleString("default", { month: "short" }),
        totalSales: Number(stat.totalsales) // Convert BigInt to Number
        }));

// Order the data based on the month
        const sortedStats = monthOrder.map(month => {
        const stat = formattedStats.find(stat => stat.period === month);
            return {
                name: month,
            value: stat ? stat.totalSales : 0
                };
});

return sortedStats;
    
     
  };
    
    
export const getSalesListService = async (page: number, query:string,pageSize: number) => {
    const skip = (page - 1) * pageSize;

    const whereClause :any = {};
    query !== "all" ?whereClause.device={ type: query } : {}

    const sales = await prisma.sale.findMany({
        where: whereClause, 
        select: {
            id: true,
            createdAt: true,
            Device: { select: { type: true, price: true } },  // update this line
            EndUser: { select: { User: { select: { Profile: { select: { lastname: true, firstname: true } } } } } }  // update this line
        },
        skip,
        take: pageSize,
    });

    const total = await prisma.sale.count({ where: whereClause });

    return { sales, total };
};


export const getSales = async (
  page: number=1,
  query: string="",
  pageSize: number=10
) => {
  const skip = (page - 1) * pageSize;

  console.log("Building query with:", { skip, pageSize, query });

  // Only apply device type filter if query is provided and not "all"
  const whereClause :any = {};
    if (query && query !== "all") {
        whereClause.Device = { type: query };
    }

  try {
    const sales = await prisma.sale.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        Device: { select: { type: true, price: true } },
        EndUser : {
          select: {
            User: {
              select: {
                Profile: { select: { lastname: true, firstname: true } },
              },
            },
          },
        },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.sale.count({ where: whereClause });

    return { sales, total };
  } catch (error) {
    console.error("Error querying sales:", error);
    throw error;
  }
};