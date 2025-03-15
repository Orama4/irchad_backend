import express from 'express';
import { getTotalSales, getTotalRevenue , getSalesList ,getSalesStatistics } from '../controllers/saleController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();
router.get('/', authMiddleware, getSalesList); 
router.get('/total-sales',authMiddleware, getTotalSales);
router.get('/total-revenue',authMiddleware, getTotalRevenue);
router.get('/progress-stats', authMiddleware, getSalesStatistics);
export default router;
