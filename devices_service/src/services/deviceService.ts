import { prisma } from "./../lib/prisma";
import { DeviceStatus } from "@prisma/client";

interface CreateDeviceData {
  type: string;
  version: string;
  macAdr: string;
  status: DeviceStatus;
  battery: number;
  lastPos?: any;  // Only make truly optional fields optional
  price?: number;
  userId?: number | null;
}

interface UpdateDeviceData {
  type?: string;
  version?: string;
  macAdr?: string;
  status?: DeviceStatus;
  battery?: number;
  lastPos?: any;
  price?: number;
  userId?: number | null;
}
  
  export const getAllDevicesService = async (page = 1, pageSize = 10) => {
    try {
      const skip = (page - 1) * pageSize;
      
      const devices = await prisma.device.findMany({
        skip: skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      const total = await prisma.device.count();
      
      return { devices, total };
    } catch (error) {
      console.error("Error fetching devices:", error);
      throw error;
    }
  };

  export const getDeviceService = async (deviceId :number) =>{
    try{
      const device = await prisma.device.findUnique({
        where:{
          id: deviceId
        },
      })
      if (!device) {
        throw new Error("Device not found");
      }
      return device;
    }catch(error){
      console.error("Error fetching device:", error);
      throw error;
    }
  };

  export const createDeviceService = async (data: CreateDeviceData) => {
    try {  
      const newDevice = await prisma.device.create({
        data: {  
          type: data.type,
          version: data.version,
          macAdr: data.macAdr,
          status: data.status,
          battery: data.battery,
          lastPos: data.lastPos,
          price: data.price,
          userId: data.userId
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
