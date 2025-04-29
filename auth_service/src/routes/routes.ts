// auth/routes/auth.routes.ts
import express, { Request, Response } from "express";
import { login, register, getProfile, sendOTPEndpoint,verifyOTPEndpoint ,updateProfile,changePassword,
  sendForgotPasswordOTP, verifyForgotPasswordOTP, resetPassword ,deleteAccount} from "../controllers/auth.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOTPEndpoint);
router.post("/send-otp", sendOTPEndpoint);
router.post("/update-profile", authenticateToken, updateProfile); // New route
router.post("/change-password", authenticateToken, changePassword);
router.delete("/delete-account", authenticateToken, deleteAccount);
router.post("/send-forgot-password-otp", sendForgotPasswordOTP);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOTP);
router.post("/reset-password", resetPassword);
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