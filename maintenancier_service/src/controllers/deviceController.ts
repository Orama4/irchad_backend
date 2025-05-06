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
          UserDeviceHistory: {  
            include: {
              User: true,  
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
  



export const getDevicesByMaintainerId = async (req: Request, res: Response): Promise<void> => {
  const maintainerId = parseInt(req.params.maintainerId);

  try {
    const maintainerDevices = await prisma.maintainer.findUnique({
      where: { id: maintainerId },
      select: {
        Devices: {
          select: {
            id: true,
            nom: true,
            macAdresse: true,
            status: true,
            peripheriques: true,
            localisation: true,
            cpuUsage: true,
            ramUsage: true,
            price: true, 
            manufacturingCost: true,
            type: true, 
          },
        },
      },
    });

    if (!maintainerDevices) {
      res.status(404).json({ message: 'Maintainer not found' });
      return;
    }

    res.json(maintainerDevices.Devices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while retrieving the devices' });
  }
};


// Function to get device stats for a specific maintainer by their ID
export const getMaintainerDeviceStatsById = async (req: Request, res: Response): Promise<void> => {
  const maintainerId = parseInt(req.params.maintainerId);

  try {
    const maintainerDevices = await prisma.maintainer.findUnique({
      where: { id: maintainerId },
      select: {
        Devices: true,
      },
    });

    if (!maintainerDevices) {
      res.status(404).json({ message: 'Maintainer not found' });
      return;
    }

    const totalDevices = maintainerDevices.Devices.length;
    const connectedDevices = maintainerDevices.Devices.filter(device => device.status === 'connected').length;
    const disconnectedDevices = maintainerDevices.Devices.filter(device => device.status === 'disconnected' || device.status === 'out_of_service').length;
    const downDevices = maintainerDevices.Devices.filter(device => device.status === 'defective').length;
    const inMaintenanceDevices = maintainerDevices.Devices.filter(device => device.status === 'under_maintenance').length;

    res.json({
      totalDevices,
      connectedDevices,
      disconnectedDevices,
      downDevices,
      inMaintenanceDevices,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while retrieving device statistics' });
  }
};


export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
  const deviceId = parseInt(req.params.deviceId);
  if (isNaN(deviceId)) {
    res.status(400).json({ error: "Invalid device ID" });
    return;
  }

  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: {
        id: true,
        nom: true,
        macAdresse: true,
        status: true,
        peripheriques: true,
        localisation: true,
        cpuUsage: true,
        ramUsage: true,
        price: true, 
        manufacturingCost: true,
        type: true, 
      },
    });

    if (!device) {
      res.status(404).json({ error: "Device not found" });
      return;
    }

    res.status(200).json(device);
  } catch (error) {
    console.error("Error fetching device by ID:", error);
    res.status(500).json({ error: "Failed to fetch device", details: error });
  }
};

export const updateDeviceStatus = async (req: Request, res: Response): Promise<void> => {
  const deviceId = parseInt(req.params.deviceId);
  const { status } = req.body;

  if (isNaN(deviceId)) {
    res.status(400).json({ message: 'Invalid deviceId' });
    return;
  }

  if (!status || !Object.values(DeviceStatus).includes(status)) {
    res.status(400).json({
      message: `Invalid status. Must be one of: ${Object.values(DeviceStatus).join(', ')}`,
    });
    return;
  }

  try {
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      select: {
        id: true,
        nom: true,
        macAdresse: true,
        status: true,
        peripheriques: true,
        localisation: true,
        cpuUsage: true,
        ramUsage: true,
        price: true, 
        manufacturingCost: true,
        type: true, 
      },
      data: { status: status as DeviceStatus },
    });

    res.json(updatedDevice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update device status' });
  }
};






  