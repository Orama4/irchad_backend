import { Request, Response } from "express";
import { PrismaClient,DeviceStatus} from "@prisma/client";

const prisma = new PrismaClient();

export const getDeviceHistory = async (req: Request, res: Response): Promise<void> => {
    const { deviceId } = req.params;
  
    try {
      const device = await prisma.device.findUnique({
        where: { id: Number(deviceId) },
        include: {
          Intervention: true,
          UserDeviceHistory: {  // Match the exact name from your schema
            include: {
              User: true,  // This should also be capitalized
            },
          },
        },
      });
  
      if (!device)  res.status(404).json({ error: "Device not found" });
  
      res.status(200).json(device);
    } catch (error) {
      res.status(500).json({ error: "Error fetching device history", details: error });
    }
  };

  export const getDeviceDiagnostic = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
  
    try {
      const device = await prisma.device.findUnique({
        where: { id: parseInt(id) },
      });
  
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return; // Fix: Prevent further execution
      }
  
      const diagnostic = {
        deviceId: device.id,
        status: device.status,
        battery: device.battery,
        macAddress: device.macAdr,
        lastKnownPosition: device.lastPos,
        createdAt: device.createdAt,
        simulatedErrors: simulateErrors(device),
      };
  
      res.status(200).json(diagnostic);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  // Helper function to simulate errors based on device data
  function simulateErrors(device: any): string[] {
    const errors: string[] = [];
    if (device.battery < 20) errors.push('battery_low');
    if (!device.macAdr) errors.push('mac_address_missing');
    if (!device.lastPos) errors.push('location_unknown');
    return errors;
  }


  export const changeDeviceStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
  
    // Validate ID
    const deviceId = parseInt(id);
    if (isNaN(deviceId)) {
      res.status(400).json({ error: "Invalid device ID" });
    }
  
    // Validate status
    if (!Object.values(DeviceStatus).includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${Object.values(DeviceStatus).join(", ")}` });
    }
  
    try {
      const updatedDevice = await prisma.device.update({
        where: { id: deviceId },
        data: { status: status as DeviceStatus },
      });
  
      res.status(200).json(updatedDevice);
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ error: "Failed to update device status" });
    }
  };
  