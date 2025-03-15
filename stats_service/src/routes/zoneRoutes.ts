import express from "express";
import { getAllZones, getTotalZones, getTotalZonesByDate } from '../controllers/zoneController';
import { authMiddleware } from "../middlewares/authMiddleware";

export const zoneRouter = express.Router();



zoneRouter.get("/",/*authMiddleware,*/ getAllZones); //Récupérer la liste des zones . exemple url : /api/zones?page=1&pageSize=10
zoneRouter.get("/kpi",/* authMiddleware,*/ getTotalZones);//Récupérer les données pour le nombre total de zones.
//zoneRouter.get("/count-by-date",/*authMiddleware,*/ getTotalZonesByDate);//Récupérer une liste du cumulé des zones par moi dans une anné exemple url : /api/zones/count-by-date?year=2025
