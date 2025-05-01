import express from 'express';
import {
  controlDevice,
  requestDeviceStatus,
  subscribeDeviceHeartbeat,
} from '../controllers/deviceController'; 
import {getAllDevices,getDevice,createDevice,updateDevice, deleteDevice} from "../controllers/deviceController";

const router = express.Router();

// Control device (send command)
router.post('/control', controlDevice);

// Request current device status
router.get('/:deviceId/status', requestDeviceStatus);

// Subscribe to heartbeat updates
router.post('/subscribe/:deviceId', subscribeDeviceHeartbeat);


router.get("/",getAllDevices);//http://localhost:5002/devices?page=1&pageSize=5
router.get("/:id",getDevice);//http://localhost:5002/devices/3
router.post("/", createDevice);//http://localhost:5002/devices
router.put("/:id", updateDevice);//http://localhost:5002/devices/3
router.delete("/:id",deleteDevice);//http://localhost:5002/devices/3


export default router; // Export the router to be used in your main app file


