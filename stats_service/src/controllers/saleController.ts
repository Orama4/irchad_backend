import { Request, Response ,NextFunction } from 'express';
import {
  getTotalSalesService,
  getTotalRevenueService,
  getSalesListService,
  getSalesStatisticsService,
  getSales
} from "../services/saleService";

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
// interface SalesStatisticsRequest {
//     startDate: string;
//     groupBy: "day" | "month" | "year";
// }
export const getSalesStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, groupBy } = req.body;
        
        /*if (!startDate) {
            res.status(400).json({ error: "La date de début est requise." });
            return; 
        }*/
        
        /*if (!["day", "month", "year"].includes(groupBy)) {
            res.status(400).json({ error: "Le groupBy doit être 'day', 'month' ou 'year'." });
            return; 
        }*/
        
        const endDate = new Date();
        
        const salesStats = await getSalesStatisticsService(/*new Date(startDate), endDate, */groupBy);
        
        res.status(200).json(salesStats);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getSalesList = async (req: Request, res: Response) => {
  try {
        console.log("getSalesList controller called", req.path, req.query);
    const page = parseInt(req.query.page as string) || 1;
    const query = (req.query?.query as string) || "";
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const { sales, total } = await getSales(page, query, pageSize);

    res.status(200).json({
      sales,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in getSalesList:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};