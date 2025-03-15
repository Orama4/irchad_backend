import express from "express";
import { getSalesKPIs,getTopProducts} from "../controllers/dashboardController";
import { authMiddleware } from "../middlewares/authMiddleware";


const router = express.Router();

router.get("/sales", authMiddleware, getSalesKPIs);
router.get("/bestsellers", authMiddleware ,getTopProducts);         
                                                                    
export default router;