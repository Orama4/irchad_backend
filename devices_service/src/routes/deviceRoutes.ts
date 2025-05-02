import express from "express";
import {
  getAllDevices,
  getDevice,
  createDevice,
  updateDevice, 
  deleteDevice
} from "../controllers/deviceController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const deviceRouter = express.Router();

// Keeping the exact same route structure as before
deviceRouter.get("/", getAllDevices);        // http://localhost:5002/devices?page=1&pageSize=5
deviceRouter.get("/:id", getDevice);         // http://localhost:5002/devices/3
deviceRouter.post("/", createDevice);        // http://localhost:5002/devices
deviceRouter.put("/:id", updateDevice);      // http://localhost:5002/devices/3
deviceRouter.delete("/:id", deleteDevice);   // http://localhost:5002/devices/3