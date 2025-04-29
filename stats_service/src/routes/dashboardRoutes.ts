import express from "express";
import {
  getSalesKPIs,
  getTopProducts,
  getRevenueGrowth,
  getProfitMargins,
  getActiveUserMetrics,
  getSecurityMetrics,
  getPeriodProjections,
} from "../controllers/dashboardController";

const router = express.Router();

// Basic KPIs
router.get("/get-sales", getSalesKPIs);
router.get("/bestsellers", getTopProducts);

// Advanced Financial KPIs
router.get("/revenue-growth", getRevenueGrowth);
router.get("/profit-margins", getProfitMargins);
router.get("/period-projections", getPeriodProjections);

// User & Security KPIs
router.get("/active-users", getActiveUserMetrics);
router.get("/security-incidents", getSecurityMetrics);

export default router;
