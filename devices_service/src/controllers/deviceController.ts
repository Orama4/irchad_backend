import { Request, Response } from "express";
import { 
  sendDeviceCommand, 
  sendStatusRequest, 
  subscribeToDeviceCommunication, 
  deviceHeartbeatStore,
  riskyDevices,
  requestHeartbeatData,
  getLastHeartbeatData
} from '../services/deviceService';

// Handle device control command
export const controlDevice = (req: Request, res: Response) => {
  const { deviceId, action } = req.body;

  // Validate the action
  if (!['activer', 'desactiver', 'set_defective', 'set_maintenance'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  sendDeviceCommand(deviceId, action);
  res.json({ message: `Command ${action} sent to device ${deviceId}` });
};

// Handle device status request
export const requestDeviceStatus = (req: Request, res: Response) => {
  const { deviceId } = req.params;
  sendStatusRequest(Number(deviceId));
  res.json({ message: `Status request sent to ${deviceId}` });
};

// Subscribe to device heartbeat and status updates
export const subscribeDeviceUpdates = (req: Request, res: Response) => {
  const { deviceId } = req.params;
  subscribeToDeviceCommunication(Number(deviceId));
  res.json({ message: `Subscribed to ${deviceId}'s updates` });
};

// Get last known heartbeat for a device from memory
export const getDeviceHeartbeat = (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const numDeviceId = Number(deviceId);
  
  // First, check if we have the data in memory
  const heartbeatData = getLastHeartbeatData(numDeviceId);
  
  if (heartbeatData) {
    return res.json({
      deviceId: numDeviceId,
      heartbeat: heartbeatData,
      lastUpdated: new Date(heartbeatData.timestamp * 1000).toISOString()
    });
  }
  
  // If not in memory, request it from the device
  requestHeartbeatData(numDeviceId);
  return res.status(202).json({ 
    message: `No heartbeat data available. Request sent to device ${deviceId}. Try again shortly.` 
  });
};


// Get all risky devices
export const getRiskyDevices = (_req: Request, res: Response) => {
  return res.json({
    riskyDevices: riskyDevices,
    count: Object.keys(riskyDevices).length,
    timestamp: new Date().toISOString()
  });
  
};

// Force refresh of device heartbeat
export const refreshDeviceHeartbeat = (req: Request, res: Response) => {
  const { deviceId } = req.params;
  requestHeartbeatData(Number(deviceId));
  res.json({ message: `Heartbeat refresh request sent to ${deviceId}` });
};