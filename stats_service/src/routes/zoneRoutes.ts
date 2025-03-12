import express from "express";
import { getAllZones, getTotalZones, getTotalZonesByDate } from '../controllers/zoneController';

export const zoneRouter = express.Router();



zoneRouter.get("/", getAllZones); //Récupérer la liste des zones . exemple url : /api/zones?page=1&pageSize=10
zoneRouter.get("/kpi", getTotalZones);//Récupérer les données pour le nombre total de zones.
zoneRouter.get("/count-by-date", getTotalZonesByDate);//Récupérer une liste du cumulé des zones par moi dans une anné exemple url : /api/zones/count-by-date?year=2025
