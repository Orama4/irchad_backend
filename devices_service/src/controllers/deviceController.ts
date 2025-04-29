import { Request, Response } from "express";
import { sendDeviceCommand, sendStatusRequest, subscribeToDeviceState } from '../services/deviceService';

// Handle device control command
export const controlDevice = (req: Request, res: Response) => {
  const { deviceId, action } = req.body;

  if (!['activer', 'desactiver', 'set_defective', 'set_maintenance'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  sendDeviceCommand(deviceId, action);
  res.json({ message: `Command ${action} sent to device ${deviceId}` });
};

// Handle device status request
export const requestDeviceStatus = (req: Request, res: Response) => {
  const { deviceId } = req.params;
  sendStatusRequest(deviceId);
  res.json({ message: `Status request sent to ${deviceId}` });
};

// Subscribe to device heartbeat and state updates
export const subscribeDeviceHeartbeat = (req: Request, res: Response) => {
  const { deviceId } = req.params;
  subscribeToDeviceState(deviceId);
  res.json({ message: `Subscribed to ${deviceId}'s heartbeat` });
};
