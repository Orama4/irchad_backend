// auth/routes/auth.routes.ts
import express, { Request, Response } from "express";
import {getFirstAndLastNameById} from "../controllers/usersController";

const router = express.Router();

router.get("/:userId/names", getFirstAndLastNameById);

export default router;