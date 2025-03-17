// stats_service/src/routes/reportRoutes.ts
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
