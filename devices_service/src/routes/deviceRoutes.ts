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
router.get('/status/:deviceId', requestDeviceStatus);  //sends a new request to the device for its status
router.post('/subscribe/:deviceId', subscribeDeviceUpdates); // Subscribe to device updates

// Heartbeat data routes
router.get('/heartbeat/:deviceId', getDeviceHeartbeat);  //first checks cached data, then requests new data if needed
router.get('/risky-devices', getRiskyDevices);      // Get all risky devices


router.post("/");
router.delete("/");
router.put("/");

     
                                                                    
export default router;