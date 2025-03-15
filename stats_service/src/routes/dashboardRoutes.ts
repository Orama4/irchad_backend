import express from "express";
import { getSalesKPIs,getTopProducts} from "../controllers/dashboardController";


const router = express.Router();

router.get("/get-sales", getSalesKPIs);
router.get("/bestsellers", getTopProducts);         
                                                                    
export default router;