import express from "express";

import { getDeviceHistory, getDevicesEnPanne, getDeviceStatus } from "../controllers/deviceController";

const router = express.Router();

// Route to get device history
router.get("/history/:deviceId", getDeviceHistory);
router.get("/status", getDeviceStatus);
router.get("/en_panne", getDevicesEnPanne);
export default router;
