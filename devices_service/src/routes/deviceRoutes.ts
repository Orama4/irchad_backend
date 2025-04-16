import express from "express";
import {getAllDevices,getDevice,createDevice,updateDevice, deleteDevice} from "../controllers/deviceController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { create } from "domain";
export const deviceRouter = express.Router();


deviceRouter.get("/",getAllDevices);//http://localhost:5002/devices?page=1&pageSize=5
deviceRouter.get("/:id",getDevice);//http://localhost:5002/devices/3
deviceRouter.post("/", createDevice);//http://localhost:5002/devices
deviceRouter.put("/:id", updateDevice);//http://localhost:5002/devices/3
deviceRouter.delete("/:id",deleteDevice);//http://localhost:5002/devices/3
