import express from "express";

import { getDeviceHistory } from "../controllers/deviceController";

const router = express.Router();

// Route to get device history
router.get("/history/:deviceId", getDeviceHistory);
export default router;
