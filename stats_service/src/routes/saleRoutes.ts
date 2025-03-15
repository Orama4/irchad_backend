import express from 'express';
import { getTotalSales, getTotalRevenue , getSalesList ,getSalesStatistics } from '../controllers/saleController';

const router = express.Router();
router.get('/', getSalesList); 
router.get('/total-sales', getTotalSales);
router.get('/total-revenue', getTotalRevenue);
router.get('/progress-stats', getSalesStatistics);
export default router;