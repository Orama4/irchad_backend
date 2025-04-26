import express from "express";
import { 
    createIntervention,
    getInterventionsByMaintainerId,
    getInterventionsByMaintainerIdAndDeviceId 
} 
from "../controllers/interventionController";

const router = express.Router();

router.post("/", createIntervention);
router.get('/:maintainerId', getInterventionsByMaintainerId);
router.get('/:maintainerId/:deviceId', getInterventionsByMaintainerIdAndDeviceId);

export default router;
