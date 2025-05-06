// auth/routes/auth.routes.ts
import express, { Request, Response } from "express";
import {
  getFirstAndLastNameById,
  getAdminUsers,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../controllers/usersController";

const router = express.Router();

router.get("/:userId/names", getFirstAndLastNameById);
router.get("/admins", getAdminUsers);
router.post("/admins", createAdmin);
router.put("/admins/:userId", updateAdmin);
router.delete("/admins/:userId", deleteAdmin);

export default router;
