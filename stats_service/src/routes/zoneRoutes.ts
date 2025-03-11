import express from "express";
import { getAllZones, getTotalZones, getTotalZonesByDate } from '../controllers/zoneController';

const router = express.Router();



router.get("/", getAllZones); //Récupérer la liste des zones . exemple url : /api/zones?page=1&pageSize=10
router.get("/kpi", getTotalZones);//Récupérer les données pour le nombre total de zones.
router.get("/count-by-date", getTotalZonesByDate);//Récupérer une liste du cumulé des zones par moi dans une anné exemple url : /api/zones/count-by-date?year=2025



export default router;