import express from "express";

import { 
    getDeviceHistory,
    changeDeviceStatus,
    getMaintainerDeviceStatsById,
    getDevicesByMaintainerId,
} 
from "../controllers/deviceController";

const router = express.Router();

// Route to get device history
router.get("/history/:deviceId", getDeviceHistory);
router.put("/status/:id", changeDeviceStatus);
router.get('/:maintainerId', getDevicesByMaintainerId);
router.get('/:maintainerId/device-stats', getMaintainerDeviceStatsById);


export default router;
