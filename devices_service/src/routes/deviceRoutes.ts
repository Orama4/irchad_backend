import express from 'express';
import {
  controlDevice,
  requestDeviceStatus,
  subscribeDeviceHeartbeat,
} from '../controllers/deviceController'; 

const router = express.Router();

// Control device (send command)
router.post('/control', controlDevice);

// Request current device status
router.get('/:deviceId/status', requestDeviceStatus);

// Subscribe to heartbeat updates
router.post('/subscribe/:deviceId', subscribeDeviceHeartbeat);

export default router; // Export the router to be used in your main app file
