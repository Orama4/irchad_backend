import express from 'express';
import { getTotalSales, getTotalRevenue , getSalesList } from '../controllers/saleController';

const router = express.Router();

router.get('/total-sales', getTotalSales);
router.get('/total-revenue', getTotalRevenue);
// router.get('/sales-progress', getSalesProgress);
 router.get('/all', getSalesList);  // Exemple d'uitlisation de cettte endPoint  http://localhost:5001/sales/all?page=2&pageSize=20

export default router;
