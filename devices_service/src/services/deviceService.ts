import mqttClient from '../utils/mqtt_client';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Interface for heartbeat data
interface HeartbeatData {
  status: string;
  metrics: {
    cpu_percent: number;
    ram_used: number;
    ram_total: number;
    ram_percent: number;
    temperature: number;
  };
  timestamp: number;
  device_id: string;
  online: boolean;
}

// Interface for device heartbeat tracking
interface DeviceHeartbeatStore {
  [deviceId: string]: HeartbeatData;
}

// Interface for risky devices tracking
interface RiskyDevices {
  [deviceId: string]: {
    timestamp: number;
    reason: string;
  }
}

// Store of latest heartbeat data per device
const deviceHeartbeatStore: DeviceHeartbeatStore = {};

// Tracking risky devices
const riskyDevices: RiskyDevices = {};

// Thresholds for metrics
const THRESHOLDS = {
  temperature: 50, // °C
  cpu_percent: 6, // %
  ram_percent: 40, // %
};

// Time settings (in milliseconds)
const HEARTBEAT_TIMEOUT = 1 * 60 * 1000; // 2 minutes
const MONITOR_INTERVAL = 60 * 100;      // 1 minute

// Function to handle heartbeat messages
const handleHeartbeatMessage = (deviceId: string, heartbeatData: HeartbeatData) => {
  // Store the complete heartbeat data
  deviceHeartbeatStore[deviceId] = heartbeatData;
  
  console.log(`📡 Received heartbeat from ${deviceId} at ${new Date(heartbeatData.timestamp * 1000).toLocaleString()}`);
  
  // Analyze metrics for risk factors
  analyzeMetrics(deviceId, heartbeatData);
};

// Function to analyze device metrics for risk factors
const analyzeMetrics = (deviceId: string, heartbeatData: HeartbeatData) => {
  const { metrics, status } = heartbeatData;
  
  // Skip analysis if device is already marked as defective
  if (status === 'Defectueux') {
    return;
  }
  
  // Check metrics against thresholds
  let isRisky = false;
  let riskReason = '';
  
  if (metrics.temperature >= THRESHOLDS.temperature) {
    console.warn(`⚠️ ${deviceId} high temperature: ${metrics.temperature}°C`);
    isRisky = true;
    riskReason = `High temperature: ${metrics.temperature}°C`;
  }
  if (metrics.cpu_percent >= THRESHOLDS.cpu_percent) {
    console.warn(`⚠️ ${deviceId} high CPU usage: ${metrics.cpu_percent}%`);
    isRisky = true;
    riskReason = riskReason || `High CPU usage: ${metrics.cpu_percent}%`;
  }
  if (metrics.ram_percent >= THRESHOLDS.ram_percent) {
    console.warn(`⚠️ ${deviceId} high RAM usage: ${metrics.ram_percent}%`);
    isRisky = true;
    riskReason = riskReason || `High RAM usage: ${metrics.ram_percent}%`;
  }

  // Update risky devices tracking
  if (isRisky) {
    riskyDevices[deviceId] = { 
      timestamp: Date.now(),
      reason: riskReason
    };
  } else {
    // Remove from risky devices if metrics are now normal
    if (riskyDevices[deviceId]) {
      delete riskyDevices[deviceId];
      console.log(`✅ ${deviceId} metrics returned to normal range`);
    }
  }
};

// Function to send device command
export const sendDeviceCommand = (deviceId: number, command: 'activer' | 'desactiver' | 'set_defective' | 'set_maintenance' | 'status' | 'get_heartbeat_data') => {
  const topic = `devices/${deviceId}/commands`;
  const payload = JSON.stringify({ command });

  mqttClient.publish(topic, payload, (err) => {
    if (err) {
      console.error(`❌ Failed to send command to ${deviceId}`, err);
    } else {
      console.log(`📤 Command sent to ${deviceId}: ${command}`);
    }
  });
};

// Function to request device status
export const sendStatusRequest = (deviceId: number) => {
  sendDeviceCommand(deviceId, 'status');
};

// Function to request heartbeat data
export const requestHeartbeatData = (deviceId: number) => {
  sendDeviceCommand(deviceId, 'get_heartbeat_data');
};

// Subscribe to device state and listen for heartbeats
export const subscribeToDeviceCommunication = (deviceId: number) => {
  // Subscribe to status responses
  const statusTopic = `devices/${deviceId}/status`;
  mqttClient.subscribe(statusTopic, (err) => {
    if (err) {
      console.error(`❌ Failed to subscribe to ${deviceId}'s status`, err);
    } else {
      console.log(`📢 Subscribed to ${deviceId}'s status`);
    }
  });
  
  // Subscribe to heartbeats
  const heartbeatTopic = `devices/${deviceId}/heartbeat`;
  mqttClient.subscribe(heartbeatTopic, (err) => {
    if (err) {
      console.error(`❌ Failed to subscribe to ${deviceId}'s heartbeat`, err);
    } else {
      console.log(`📢 Subscribed to ${deviceId}'s heartbeat`);
    }
  });

  // Listen for messages on both topics
  mqttClient.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (topic === statusTopic) {
        console.log(`📥 Received status from ${deviceId}:`, data);
        handleStatusMessage(deviceId.toString(), data);
      } 
      else if (topic === heartbeatTopic) {
        handleHeartbeatMessage(deviceId.toString(), data);
        console.log(`📡 Heartbeat data:`, data);
      }
    } catch (error) {
      console.error(`❌ Error handling message from ${topic}:`, error);
    }
  });
};

// Handle status update
const handleStatusMessage = (deviceId: string, status: any) => {
  // Update heartbeat data if it contains metrics
  if (status.metrics) {
    const heartbeatData: HeartbeatData = {
      status: status.status,
      metrics: status.metrics,
      timestamp: status.timestamp || Math.floor(Date.now() / 1000),
      device_id: deviceId,
      online: status.online
    };
    
    handleHeartbeatMessage(deviceId, heartbeatData);
  }
};

// Regularly monitor heartbeats for missing devices
export const monitorDeviceHeartbeats = () => {
  const now = Date.now();

  for (const deviceId in deviceHeartbeatStore) {
    const heartbeatData = deviceHeartbeatStore[deviceId];
    const lastHeartbeatTime = heartbeatData.timestamp * 1000; // Convert to milliseconds
    const timeSinceLastHeartbeat = now - lastHeartbeatTime;

    if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
      console.warn(`⚠️ Device ${deviceId} has missed heartbeats for ${Math.round(timeSinceLastHeartbeat/1000/60)} minutes`);
      
      if (riskyDevices[deviceId]) {
        // Device was already showing risk factors before going offline
        setDeviceDefective(Number(deviceId), riskyDevices[deviceId].reason);
      } else {
        // Device just went offline without prior risk factors
        setDeviceOutOfService(Number(deviceId));
      }
      
      // Clean up after marking
      delete deviceHeartbeatStore[deviceId];
      delete riskyDevices[deviceId];
    }
  }
};

// Get the last heartbeat data for a device
export const getLastHeartbeatData = (deviceId: number): HeartbeatData | null => {
  return deviceHeartbeatStore[deviceId.toString()] || null;
};

// Update device status in database
export async function updateDeviceStatusInDB(deviceId: number, status: 'connected' | 'disconnected' | 'under_maintenance' | 'out_of_service' | 'defective' | 'broken_down') {
  try {
    console.log('Attempting to set status:', status);
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: { status },
    });
    return updatedDevice;
  } catch (error) {
    console.error('❌ Failed to update device status:', error);
    throw new Error('Error updating device status');
  }
}

// Create a new intervention
export async function createIntervention(
  type: 'preventive' | 'curative',
  deviceId: number,
  maintainerId: number,
  priority: number,
  description: string = ''
) {
  try {
    const intervention = await prisma.intervention.create({
      data: {
        type,
        device: { connect: { id: deviceId } },
        maintainer: { connect: { id: maintainerId } },
        priority: priority,
        description
      },
    });
    return intervention;
  } catch (error) {
    console.error('❌ Failed to create intervention:', error);
    throw new Error('Error creating intervention');
  }
}

// --- Device State Setters ---

const setDeviceDefective = async (deviceId: number, reason: string = '') => {
  console.error(`🚨 Device ${deviceId} is now marked as Défectueux (defective). Reason: ${reason}`);
  sendDeviceCommand(deviceId, 'set_defective');
  await updateDeviceStatusInDB(deviceId, "defective");
  await createIntervention(
    "curative", 
    deviceId, 
    1, // Maintainer ID
    1, // Priority (high)
    `Device marked as defective: ${reason}`
  );
};

const setDeviceOutOfService = async (deviceId: number) => {
  console.warn(`⚠️ Device ${deviceId} is now marked as Hors service (offline).`);
  await updateDeviceStatusInDB(deviceId, "broken_down");
  await createIntervention(
    "curative", 
    deviceId, 
    1, // Maintainer ID
    2, // Priority (medium)
    "Device is unreachable or offline"
  );
};

// --- Start the Heartbeat Monitor ---
setInterval(monitorDeviceHeartbeats, MONITOR_INTERVAL);

// Export functions for API endpoints
export {
  deviceHeartbeatStore,
  riskyDevices
};