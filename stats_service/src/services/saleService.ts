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

export const getSalesListService = async (page: number = 1, pageSize: number = 10) => {
    const skip = (page - 1) * pageSize; // saute de page
    const sales = await prisma.sale.findMany({
        skip: skip,
        take: pageSize,
        select: {
            id: true,
            createdAt: true,
            device: { select: { type: true, price: true } },
            buyer: { 
                select: { 
                    user: { 
                        select: { 
                            profile: { 
                                select: {  
                                    lastname: true, 
                                    firstname: true 
                                } 
                            } 
                        } 
                    } 
                } 
            }
        }
    });
    const total = await prisma.sale.count();

    return { sales, total };
};
