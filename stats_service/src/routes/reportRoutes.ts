// stats_service/src/routes/reportRoutes.ts
import express from "express";
import {
  generateUsageReport,
  generateSalesReport,
} from "../controllers/reportController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

// Only allow Decider role to access these routes
router.get("/usage", authMiddleware,  generateUsageReport);
router.get("/sales",authMiddleware,  generateSalesReport);

export default router;
