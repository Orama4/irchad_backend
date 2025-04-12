import express from "express";
import { createIntervention } from "../controllers/interventionController";

const router = express.Router();

router.post("/", createIntervention);

export default router;
