// auth/routes/auth.routes.ts
import express, { Request, Response } from "express";
import { login, register, getProfile } from "../controllers/auth.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", authenticateToken, getProfile);

// Example of role-based protected route
router.get(
  "/admin",
  authenticateToken,
  authorizeRole(["super"]),
  (req: Request, res: Response) => {
    res.json({ message: "Admin access granted" });
  }
);

export default router;
