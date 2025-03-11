"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zoneController_1 = require("../controllers/zoneController");
const router = express_1.default.Router();
router.get("/zones", zoneController_1.getAllZones); //Récupérer la liste des zones . exemple de test : /api/zones?page=1&pageSize=10
router.get("/zones/count", zoneController_1.getTotalZones); //Récupérer les données pour le nombre total de zones.
exports.default = router;
