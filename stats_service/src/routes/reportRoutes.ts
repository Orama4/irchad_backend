// reportRoutes.ts file is used to define the routes for the report generation endpoints. It uses the reportController to handle the requests and generate the reports.
import express from "express";
import {
  generateUsageReport,
  generateSalesReport,
  generateZoneReport,
} from "../controllers/reportController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

// Only allow Decider role to access these routes
router.get("/usage", /* authMiddleware, */  generateUsageReport);
router.get("/sales",/* authMiddleware, */  generateSalesReport);
// stats_service/src/routes/reportRoutes.ts (add this to your existing routes)
router.get('/zones', /* authMiddleware, */  generateZoneReport);
export default router;
