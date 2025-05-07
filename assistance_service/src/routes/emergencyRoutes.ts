// auth/routes/auth.routes.ts
import express, { Request, Response } from "express";
import { addUrgenceContactsByEndUserId,getUrgenceContactsByEndUserId} from "../controllers/emergency.controller";

const router = express.Router();

// Public routes
router.get('/urgence/:id', getUrgenceContactsByEndUserId);
router.post('/urgence/:id', addUrgenceContactsByEndUserId);


export default router;

