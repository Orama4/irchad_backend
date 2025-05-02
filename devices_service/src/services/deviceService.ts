import { prisma } from "./../lib/prisma";
import { DeviceStatus } from "../../prisma/node_modules/@prisma/client";

interface CreateDeviceData {
  nom: string;
  macAdresse: string;
  status: DeviceStatus;
  peripheriques?: any;
  localisation?: any;
  cpuUsage?: number;
  ramUsage?: number;
  userId?: number | null;
  maintainerId?: number | null;
  price?: number | null;
  manufacturingCost?: number | null;
  type?: string;
}

interface UpdateDeviceData {
  nom?: string;
  macAdresse?: string;
  status?: DeviceStatus;
  peripheriques?: any;
  localisation?: any;
  cpuUsage?: number;
  ramUsage?: number;
  userId?: number | null;
  maintainerId?: number | null;
  price?: number | null;
  manufacturingCost?: number | null;
  type?: string;
}
  
export const getAllDevicesService = async (page = 1, pageSize = 10) => {
  try {
    const skip = (page - 1) * pageSize;
    
    const devices = await prisma.device.findMany({
      skip: skip,
      take: pageSize,
      include: {
        EndUser: true,
        Maintainer: true
      }
    });
    
    const total = await prisma.device.count();
    
    return { devices, total };
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw error;
  }
};

export const getDeviceService = async (deviceId: number) => {
  try {
    const device = await prisma.device.findUnique({
      where: {
        id: deviceId
      },
      include: {
        EndUser: true,
        Maintainer: true
      }
    });
    
    if (!device) {
      throw new Error("Device not found");
    }
    
    return device;
  } catch (error) {
    console.error("Error fetching device:", error);
    throw error;
  }
};

export const createDeviceService = async (data: CreateDeviceData) => {
  try {  
    const newDevice = await prisma.device.create({
      data: {  
        nom: data.nom,
        macAdresse: data.macAdresse,
        status: data.status,
        peripheriques: data.peripheriques,
        localisation: data.localisation,
        cpuUsage: data.cpuUsage,
        ramUsage: data.ramUsage,
        userId: data.userId,
        maintainerId: data.maintainerId,
        price: data.price,
        manufacturingCost: data.manufacturingCost,
        type: data.type || 'default_type' // Provide a default type if not specified
      }
    });
    
    return { success: true, device: newDevice };
  } catch (error) {
    console.error("Error creating device:", error);
    throw error;
  }
};

export const updateDeviceService = async (id: number, data: UpdateDeviceData) => {
  try {
    const deviceExists = await prisma.device.findUnique({
      where: { id }
    });
    
    if (!deviceExists) {
      return { success: false, message: "Device not found" };
    }
    
    const updatedDevice = await prisma.device.update({
      where: { id },
      data: {
        ...data,
      }
    });
    
    return { success: true, device: updatedDevice };
  } catch (error) {
    console.error("Error updating device:", error);      
    throw error;
  }
};

export const deleteDeviceService = async (id: number) => {
  try {
    const deviceExists = await prisma.device.findUnique({
      where: { id }
    });
    
    if (!deviceExists) {
      return { success: false, message: "Device not found" };
    }
    
    await prisma.device.delete({
      where: { id }
    });
    
    return { success: true, message: "Device deleted successfully" };
  } catch (error) {
    console.error("Error deleting device:", error);
    throw error;
  }
};