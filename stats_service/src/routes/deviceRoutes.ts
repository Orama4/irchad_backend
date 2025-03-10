import express from "express";
import { getAllDevices,getDeviceStatistics,getDevicesMonth,getDevicesByFilters} from "../controllers/deviceController";


const router = express.Router();

router.get("/devices", getAllDevices);
router.get("/devices/stats", getDeviceStatistics);
router.get("/devices/monthly-stats", getDevicesMonth);
router.get("/devices/search", getDevicesByFilters); 
//http://localhost:5001/api/devices/search?status=connected for status or 
//http://localhost:5001/api/devices/search?type=ceinture for type   
//This will be used both in recherche (search by advice type) and filtering (filter by status)            
                                                                    
export default router;