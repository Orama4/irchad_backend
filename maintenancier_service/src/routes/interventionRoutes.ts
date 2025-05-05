import express from "express";
import { 
    createIntervention,
    getInterventionsByMaintainerId,
    getInterventionsByMaintainerIdAndDeviceId, 
    getInterventionById,
    getInterventionsByDeviceId,
    updateInterventionStatus,
    updateInterventionPlanDate,
    updateInterventionDescription
} 
from "../controllers/interventionController";

const router = express.Router();

router.post("/", createIntervention);
router.get('/maintainer/:maintainerId', getInterventionsByMaintainerId);
router.get('/maintainer/:maintainerId/:deviceId', getInterventionsByMaintainerIdAndDeviceId);
router.get('/:taskId', getInterventionById);
router.get('/device/:deviceId', getInterventionsByDeviceId);
router.put('/:interventionId/status', updateInterventionStatus);
router.put('/:interventionId/plan-date', updateInterventionPlanDate);
router.put('/:interventionId/description', updateInterventionDescription);






export default router;
