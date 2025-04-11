import express from "express";
import { } from "../controllers/deviceController";
import { authMiddleware } from "../middlewares/authMiddleware";


const router = express.Router();

router.get("/",/*authMiddleware,*/);

router.post("/");
router.delete("/");
router.put("/");

     
                                                                    
export default router;