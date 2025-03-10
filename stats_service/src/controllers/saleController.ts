import { Request, Response } from 'express';
import { getTotalSalesService, getTotalRevenueService ,getSalesListService } from '../services/saleService';

export const getTotalSales = async (req: Request, res: Response) => {
    try {
        const totalSales = await getTotalSalesService();
        res.status(200).json({ totalSales });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getTotalRevenue = async (req: Request, res: Response) => {
    try {
        const totalRevenue = await getTotalRevenueService();
        res.status(200).json({ totalRevenue });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};


export const getSalesList = async (req: Request, res: Response) => {
    try {
        // Récupérer les paramètres de pagination depuis la requête
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        const { sales, total } = await getSalesListService(page, pageSize);

        res.status(200).json({
            sales,
            total,
            totalPages: Math.ceil(total / pageSize), // Nombre total de pages
            currentPage: page,
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};