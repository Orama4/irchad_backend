import mqttClient from '../utils/mqtt_client';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface DeviceHeartbeat {
  [deviceId: string]: number;
}

interface RiskyDevices {
  [deviceId: string]: number;
}

// Heartbeat and risky devices tracking
let deviceLastHeartbeat: DeviceHeartbeat = {};
let riskyDevices: RiskyDevices = {};

// Thresholds for metrics
const THRESHOLDS = {
  temperature: 70, // °C
  cpu_percent: 85, // %
  ram_percent: 90, // %
};

// Time settings
const HEARTBEAT_TIMEOUT = 5 * 60 * 1000; // 5 minutes (ms)
const MONITOR_INTERVAL = 60 * 10; // Check every 1 minute (ms)

// Function to handle heartbeat messages
const handleHeartbeatMessage = (deviceId: number, timestamp: number) => {
  deviceLastHeartbeat[deviceId] = timestamp;
  console.log(`Received heartbeat from ${deviceId} at ${timestamp}`);
};

// Function to send a device command and handle response
export const sendDeviceCommand = (
  deviceId: number,
  command: string,
  payloadData: object = {}
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const requestTopic = `device${deviceId}/request`;
    const responseTopic = `device${deviceId}/response`;
    const payload = JSON.stringify({ command, ...payloadData });

    console.log(payload);

    // Subscribe to response topic
    mqttClient.subscribe(responseTopic, (err) => {
      if (err) {
        console.error(`❌ Failed to subscribe to ${responseTopic}`, err);
        return reject(err);
      }
      console.log(`✅ Subscribed to ${responseTopic}`);
    });

    // Send the command
    mqttClient.publish(requestTopic, payload, (err) => {
      if (err) {
        console.error(`❌ Failed to send command '${command}' to device ${deviceId}`, err);
        return reject(err);
      }
      console.log(`📡 Command '${command}' sent to device ${deviceId}`);
    });

    // Wait for the response and then unsubscribe
    const messageHandler = (topic: string, message: Buffer) => {
      if (topic === responseTopic) {
        const response = JSON.parse(message.toString());

        mqttClient.removeListener('message', messageHandler);
        mqttClient.unsubscribe(responseTopic, (err) => {
          if (err) {
            console.error(`❌ Failed to unsubscribe from ${responseTopic}`, err);
          } else {
            console.log(`✅ Unsubscribed from ${responseTopic}`);
          }
        });

        resolve(response);
      }
    };

    mqttClient.on('message', messageHandler);

    // Timeout if no response within 5 seconds
    setTimeout(() => {
      mqttClient.removeListener('message', messageHandler);
      mqttClient.unsubscribe(responseTopic, () => {});

      // Reject with a custom message
      reject(new Error('ODB is not activated or not responding'));
    }, 5000);  // Timeout after 5 seconds
  });
};



// --- Device State Setters ---
const setDeviceDefective = async (deviceId: number) => {
  console.error(`🚨 Device ${deviceId} is now marked as Défectueux (defective).`);
  sendDeviceCommand(deviceId, 'set_defective');
  await updateDeviceStatusInDB(deviceId, 'defective');
  await createIntervention('curative', deviceId, 1, 1); // Assuming maintainerId is 1 and priority is 1 for simplicity
};

const setDeviceOutOfService = async (deviceId: number) => {
  console.warn(`⚠️ Device ${deviceId} is now marked as Hors service (offline).`);
  await updateDeviceStatusInDB(deviceId, 'broken_down');
  await createIntervention('curative', deviceId, 1, 1); // Assuming maintainerId is 1 and priority is 1 for simplicity
};

// Subscribe to device state and listen for heartbeats
export const subscribeToDeviceState = (deviceId: number) => {
  const topic = `device${deviceId}/response`;

  mqttClient.subscribe(topic, (err) => {
    if (err) {
      console.error(`? Failed to subscribe to ${deviceId}'s state`, err);
    } else {
      console.log(`?? Subscribed to ${deviceId}'s state`);
    }
  });

  mqttClient.on('message', (topic, message) => {
    if (topic === `device${deviceId}/response`) {
      const state = JSON.parse(message.toString());
      console.log(`?? Received state from ${deviceId}:`, state);
      // Handle heartbeat
      if (state.status === 'heartbeat') {
        handleHeartbeatMessage(deviceId, Date.now());
      }
    }
  });
};

// Handle state update (with metrics verification)
const handleStateMessage = (deviceId: number, state: any) => {
  if (state.status === 'heartbeat') {
    handleHeartbeatMessage(deviceId, Date.now());
    return;
  }

  if (state.metrics) {
    const { temperature, cpu_percent, ram_percent } = state.metrics;

    let isRisky = false;
    if (temperature !== undefined && temperature >= THRESHOLDS.temperature) {
      console.warn(`⚠️ ${deviceId} high temperature: ${temperature}°C`);
      isRisky = true;
    }
    if (cpu_percent !== undefined && cpu_percent >= THRESHOLDS.cpu_percent) {
      console.warn(`⚠️ ${deviceId} high CPU usage: ${cpu_percent}%`);
      isRisky = true;
    }
    if (ram_percent !== undefined && ram_percent >= THRESHOLDS.ram_percent) {
      console.warn(`⚠️ ${deviceId} high RAM usage: ${ram_percent}%`);
      isRisky = true;
    }

    if (isRisky) {
      riskyDevices[deviceId] = Date.now();
    } else {
      delete riskyDevices[deviceId];
    }
  }

  // Update heartbeat timestamp after any valid state
  handleHeartbeatMessage(deviceId, Date.now());
};

// Regularly monitor heartbeats
export const monitorDeviceHeartbeats = () => {
  const now = Date.now();

  for (const deviceId in deviceLastHeartbeat) {
    const lastHeartbeat = deviceLastHeartbeat[deviceId];
    const timeSinceLastHeartbeat = now - lastHeartbeat;

    if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
      if (riskyDevices[deviceId]) {
        setDeviceDefective(Number(deviceId));
      } else {
        setDeviceOutOfService(Number(deviceId));
      }
      // Clean up after marking
      delete deviceLastHeartbeat[deviceId];
      delete riskyDevices[deviceId];
    }
  }
};

// Update device status in DB
export async function updateDeviceStatusInDB(deviceId: number, status: 'connected' | 'disconnected' | 'under_maintenance' | 'out_of_service' | 'defective' | 'broken_down') {
  try {
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: { status },
    });
    return updatedDevice;
  } catch (error) {
    console.error('Failed to update device status:', error);
    throw new Error('Error updating device status');
  }
}

// Create a new intervention
export async function createIntervention(
  type: 'preventive' | 'curative',
  deviceId: number,
  maintainerId: number,
  priority: number,
) {
  try {
    const intervention = await prisma.intervention.create({
      data: {
        type,
        device: { connect: { id: deviceId } },
        maintainer: { connect: { id: maintainerId } },
        priority: priority,
      },
    });
    return intervention;
  } catch (error) {
    console.error('Failed to create intervention:', error);
    throw new Error('Error creating intervention');
  }
}

// --- Start the Heartbeat Monitor ---
setInterval(monitorDeviceHeartbeats, MONITOR_INTERVAL);


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
