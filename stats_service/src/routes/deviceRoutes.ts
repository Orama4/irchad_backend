import express from "express";
import { getAllDevices,getDeviceStatistics,getDevicesMonth,getDevicesByFilters} from "../controllers/deviceController";
import { authMiddleware } from "../middlewares/authMiddleware";


const router = express.Router();

router.get("/",/*authMiddleware, */ getAllDevices);
router.get("/stats",/* authMiddleware,*/ getDeviceStatistics);
router.get("/monthly-stats",/* authMiddleware, */getDevicesMonth);
router.get("/search", /*authMiddleware,*/ getDevicesByFilters); 
//http://localhost:5001/api/devices/search?status=connected for status or 
//http://localhost:5001/api/devices/search?type=ceinture for type   
//This will be used both in recherche (search by advice type) and filtering (filter by status)            
                                                                    
export default router;