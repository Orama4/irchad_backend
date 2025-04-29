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

// Function to send device command
export const sendDeviceCommand = (deviceId: number, command: 'activer' | 'desactiver' | 'set_defective' | 'set_maintenance') => {
  const topic = `devices/${deviceId}/commands`;
  const payload = JSON.stringify({ command });

  mqttClient.publish(topic, payload, (err) => {
    if (err) {
      console.error(`Failed to send command to ${deviceId}`, err);
    } else {
      console.log(`Command sent to ${deviceId}:`, payload);
    }
  });
};

// Function to request device status
export const sendStatusRequest = (deviceId: number) => {
  const topic = `devices/${deviceId}/commands`;
  const payload = JSON.stringify({ command: "status" });

  mqttClient.publish(topic, payload, (err) => {
    if (err) {
      console.error(`❌ Failed to request status from ${deviceId}`, err);
    } else {
      console.log(`📡 Status request sent to ${deviceId}`);
    }
  });
};

// Subscribe to device state and listen for heartbeats
export const subscribeToDeviceState = (deviceId: number) => {
  const topic = `devices/${deviceId}/state`;

  mqttClient.subscribe(topic, (err) => {
    if (err) {
      console.error(`? Failed to subscribe to ${deviceId}'s state`, err);
    } else {
      console.log(`?? Subscribed to ${deviceId}'s state`);
    }
  });

  mqttClient.on('message', (topic, message) => {
    if (topic === `devices/${deviceId}/state`) {
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
        //covert deviceId to number
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


// Update device status
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



// --- Device State Setters ---

const setDeviceDefective = async (deviceId: number) => {
  console.error(`🚨 Device ${deviceId} is now marked as Défectueux (defective).`);
  sendDeviceCommand(deviceId, 'set_defective');
  await updateDeviceStatusInDB(deviceId, "defective");
  await createIntervention("curative",deviceId, 1, 1); // Assuming maintainerId is 1 and priority is 1 for simplicity
};

const setDeviceOutOfService = async (deviceId: number) => {
  console.warn(`⚠️ Device ${deviceId} is now marked as Hors service (offline).`);
  await updateDeviceStatusInDB(deviceId, "broken_down");
  await createIntervention("curative",deviceId, 1, 1); // Assuming maintainerId is 1 and priority is 1 for simplicity
};

// --- Start the Heartbeat Monitor ---
setInterval(monitorDeviceHeartbeats, MONITOR_INTERVAL);

