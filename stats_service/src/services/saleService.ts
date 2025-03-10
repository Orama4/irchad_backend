import { prisma } from "./../lib/prisma"


export const getTotalSalesService = async (): Promise<number> => {
    return await prisma.sale.count();
};

export const getTotalRevenueService = async (): Promise<number> => {
    const sales = await prisma.sale.findMany({
        include: { device: true }, // Récupérer les informations des devices liés
    });

    // Calculer la somme des prix
    const totalRevenue = sales.reduce((sum : number , sale : number ) => sum + (sale.device.price || 0), 0);

    return totalRevenue;
    };

    export const getSalesStatisticsService = async (startDate: Date, endDate: Date, groupBy: string) => {
        const dateFormat =
            groupBy === "day" ? 'YYYY-MM-DD' :
            groupBy === "month" ? 'YYYY-MM' :
            'YYYY';
    
        const salesStats = await prisma.$queryRaw<
            { period: string; totalsales: BigInt }[]
        >`
            SELECT TO_CHAR("createdAt", ${dateFormat}) AS period, COUNT(*) AS totalSales
            FROM "Sale"
            WHERE "createdAt" BETWEEN ${startDate} AND ${endDate}
            GROUP BY period
            ORDER BY period ASC;
        `;
    
        // Convertir BigInt en Number
        return salesStats.map(stat => ({
            period: stat.period,
            totalSales: Number(stat.totalsales) // Convert BigInt en Number
        }));
    };
    
    

export const getSalesListService = async (page: number, pageSize: number, filter: string) => {
    const skip = (page - 1) * pageSize;

    const whereClause = filter !== "all" ? { device: { type: filter } } : {};

    const sales = await prisma.sale.findMany({
        where: whereClause, 
        select: {
            id: true,
            createdAt: true,
            device: { select: { type: true, price: true } },
            buyer: { select: { user: { select: { profile: { select: { lastname: true, firstname: true } } } } } }
        },
        skip,
        take: pageSize,
    });

    const total = await prisma.sale.count({ where: whereClause });

    return { sales, total };
};

