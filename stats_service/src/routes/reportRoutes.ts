// reportRoutes.ts file is used to define the routes for the report generation endpoints. It uses the reportController to handle the requests and generate the reports.
import express from "express";
import {
  generateUsageReport,
  generateSalesReport,
  generateZoneReport,
  generateMonthlyActiveUsersReport,
} from "../controllers/reportController";

const router = express.Router();

// Only allow Decider role to access these routes
router.get("/usage", /* authMiddleware, */ generateUsageReport);
router.get("/sales", /* authMiddleware, */ generateSalesReport);
router.get("/zones", /* authMiddleware, */ generateZoneReport);
router.get(
  "/active-users",
  /* authMiddleware, */ generateMonthlyActiveUsersReport
);

export default router;
