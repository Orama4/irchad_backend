import { Request, Response } from "express";
import { PrismaClient,DeviceStatus  } from "@prisma/client";
import { messaging } from '../../firebaseConfig';
const testDeviceToken = 'your-test-device-token'; 
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

  export const getDeviceStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const devices = await prisma.device.findMany({
        select: {
          id: true,
          type: true,
          version: true,
          status: true,
          battery: true,
          createdAt: true,
        },
      });
      res.status(200).json(devices);
    } catch (error) {
      res.status(500).json({ error: "Error fetching device status", details: error });
    }
  };
  
  export const getDevicesEnPanne = async (req: Request, res: Response): Promise<void> => {
    try {
      const devices = await prisma.device.findMany({
        where: { status: DeviceStatus.en_panne },
        select: {
          id: true,
          type: true,
          version: true,
          status: true,
          battery: true,
          createdAt: true,
        },
      });
      res.status(200).json(devices);
    } catch (error) {
      res.status(500).json({ error: "Error fetching devices en panne", details: error });
    }
  };
  
export const sendTestNotification = async () => {
  const message = {
    notification: {
      title: 'Test Notification',
      body: 'This is a test notification from the backend.',
    },
    token: testDeviceToken,
  };

  try {
    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};