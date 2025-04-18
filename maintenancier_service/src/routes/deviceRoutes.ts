import express from "express";

import { getDeviceHistory,getDeviceDiagnostic,changeDeviceStatus} from "../controllers/deviceController";

const router = express.Router();

// Route to get device history
router.get("/history/:deviceId", getDeviceHistory);
router.get("/diagnostic/:id", getDeviceDiagnostic);
router.put("/status/:id", changeDeviceStatus);

export default router;
