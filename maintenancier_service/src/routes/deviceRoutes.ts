import express from "express";

import { 
    getDeviceHistory,
    changeDeviceStatus,
    getMaintainerDeviceStatsById,
    getDevicesByMaintainerId,
    getDeviceById,
    updateDeviceStatus
} 
from "../controllers/deviceController";

const router = express.Router();

// Route to get device history
router.get("/history/:deviceId", getDeviceHistory);
router.put("/status/:id", changeDeviceStatus);
router.get('/maintainer/:maintainerId', getDevicesByMaintainerId);
router.get('/:maintainerId/device-stats', getMaintainerDeviceStatsById);
router.get('/:deviceId', getDeviceById);
router.put('/:deviceId/status', updateDeviceStatus);




export default router;
