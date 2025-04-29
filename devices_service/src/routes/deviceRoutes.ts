import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { controlDevice , requestDeviceStatus, subscribeDeviceHeartbeat } from "../controllers/deviceController";


const router = express.Router();
router.post('/control', controlDevice);
router.get("/",/*authMiddleware,*/);
router.get('/status/:deviceId', requestDeviceStatus);
// Route to subscribe to a device's heartbeat updates (optional)
router.post('/subscribe/:deviceId', subscribeDeviceHeartbeat);

router.post("/");
router.delete("/");
router.put("/");

     
                                                                    
export default router;