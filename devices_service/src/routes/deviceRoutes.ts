import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { 
  controlDevice, 
  requestDeviceStatus, 
  subscribeDeviceUpdates, 
  getDeviceHeartbeat, 
  refreshDeviceHeartbeat,
  getRiskyDevices
} from "../controllers/deviceController";


const router = express.Router();
router.post('/control', controlDevice);
router.get("/",/*authMiddleware,*/);
// Device control routes
router.get('/status/:deviceId', requestDeviceStatus);  // Get device status
router.post('/subscribe/:deviceId', subscribeDeviceUpdates); // Subscribe to device updates

// Heartbeat data routes
router.get('/heartbeat/:deviceId', getDeviceHeartbeat);     // Get last known heartbeat for a device
router.get('/risky-devices', getRiskyDevices);      // Get all risky devices
router.post('/refresh-heartbeat/:deviceId', refreshDeviceHeartbeat);  // Force refresh of device heartbeat


router.post("/");
router.delete("/");
router.put("/");

     
                                                                    
export default router;