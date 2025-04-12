import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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
