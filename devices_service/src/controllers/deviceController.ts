import { Request, Response } from "express";
import { sendDeviceCommand, subscribeToDeviceState } from '../services/deviceService';
import { 
  getDeviceService,
  getAllDevicesService, 
  createDeviceService,
  updateDeviceService,
  deleteDeviceService,

} from '../services/deviceService';

  export const getAllDevices = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      const { devices, total } = await getAllDevicesService(page,pageSize);
      
      res.status(200).json({
        devices,
        total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  };


  export const getDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = Number(req.params.id);
    if (isNaN(deviceId)) {
      res.status(400).json({ error: "Invalid device ID" });
      return;
    }

    const device = await getDeviceService(deviceId);
    res.json(device);
  } catch (error) {
    if (error instanceof Error && error.message === "Device not found") {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error in getDevice:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

  export const createDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const device = await createDeviceService(req.body);
      res.status(201).json(device);
    } catch (error) {
      console.error('Error in creating a device :', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to create device' 
      });
    }
  };

  export const updateDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      
      const deviceId = Number(req.params.id);
      if (isNaN(deviceId)) {
        res.status(400).json({ success: false, error: "Invalid device ID" });
        return;
      }
  
      const result = await updateDeviceService(deviceId, req.body);
  
      if (!result.success) {
        res.status(404).json(result);
        return;
      }
  
      res.status(200).json({
        success: true,
        data: result.device,
        message: "Device updated successfully"
      });

    } catch (error) {
      console.error("Update error", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to update device' 
      });
    }
  };

  export const deleteDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const deviceId = Number(req.params.id);
      if (isNaN(deviceId)) {
        res.status(400).json({ success: false, error: "Invalid device ID" });
        return;
      }
      const device = await deleteDeviceService(deviceId);
      res.status(201).json(device);
    } catch (error) {
      console.error('Error in deleting the device:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to delete device' 
      });
    }
  };



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
