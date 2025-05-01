import { Request, Response } from "express";
import { sendDeviceCommand, subscribeToDeviceState } from '../services/deviceService';

// Handle device control command using sendDeviceCommand
export const controlDevice = async (req: Request, res: Response) => {
  const { deviceId, action } = req.body;

  if (!['activer', 'desactiver', 'set_defective', 'set_maintenance'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    const response = await sendDeviceCommand(deviceId, action);
    return res.json({ message: `Command "${action}" sent to device ${deviceId}`, response });
  } catch (error: any) {
    console.error("Error sending control command:", error);
    
    // Check for timeout and return a custom message
    if (error.message.includes('Timeout')) {
      return res.status(504).json({ error: 'ODB is not activated or not responding' });
    }

    return res.status(500).json({ error: "Failed to send control command" });
  }
};

// Handle device status request
export const requestDeviceStatus = async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  try {
    const response = await sendDeviceCommand(Number(deviceId), 'status');
    return res.json({ message: `Received response from device ${deviceId}`, response });
  } catch (error: any) {
    console.error("Error sending status request:", error);

    // Check for timeout and return a custom message
    if (error.message.includes('Timeout')) {
      return res.status(504).json({ error: 'ODB is not activated or not responding' });
    }

    return res.status(500).json({ error: error.message });
  }
};

// Subscribe to device heartbeat and state updates
export const subscribeDeviceHeartbeat = (req: Request, res: Response) => {
  const { deviceId } = req.params;

  try {
    subscribeToDeviceState(Number(deviceId)); // Subscribing to device state
    return res.json({ message: `Subscribed to ${deviceId}'s heartbeat` });
  } catch (error: any) {
    console.error("Error subscribing to heartbeat:", error);
    return res.status(500).json({ error: "Failed to subscribe to heartbeat" });
  }
};

// POST /device/send-command
export const sendCustomCommand = async (req: Request, res: Response) => {
  const { deviceId, command, payload } = req.body;

  if (!deviceId || !command) {
    return res.status(400).json({ error: "Missing deviceId or command" });
  }

  try {
    const response = await sendDeviceCommand(deviceId, command, payload || {});
    return res.json({ message: `📤 Custom command '${command}' sent to device ${deviceId}`, response });
  } catch (error: any) {
    console.error("Error sending custom command:", error);

    // Check for timeout and return a custom message
    if (error.message.includes('Timeout')) {
      return res.status(504).json({ error: 'ODB is not activated or not responding' });
    }

    return res.status(500).json({ error: "Failed to send custom command" });
  }
};
