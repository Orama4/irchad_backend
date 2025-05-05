import { Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import {
  LoginRequest,
  RegisterRequest,
  TokenPayload,
} from "../types/auth.types";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "24h";
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      firstname,
      lastname,
      phonenumber,
      address,
      role = "normal",
    } = req.body as RegisterRequest;
   

    console.log("Register request:", req.body);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    console.log("Checking for existing user:", existingUser);
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    console.log("Available roles:", Object.values(Role));
console.log("Requested role:", role);

    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role as any, // Ensure the role is cast correctly
          Profile: {
            create: {
              firstname,
              lastname,
              phonenumber,
              address,
            },
          },
        },
      });
      // Based on role, create appropriate role-specific record
      if (role === "super" || role === "normal") {
        console.log("Creating Admin role for user:", user.id);
        await tx.admin.create({
          data: {
            userId: user.id,
            role: role as any,
          },
        });
      } else if (role === "commercial") {
        await tx.commercial.create({
          data: {
            userId: user.id,
          },
        });
      } else if (role === "decider") {
        await tx.decider.create({
          data: {
            userId: user.id,
          },
        });
      } else if (role === "endUser") {
        await tx.endUser.create({
          data: {
            userId: user.id,
            status: "active", // Assuming a default status
          },
        });
      } else if (role === "helper") {
        await tx.helper.create({
          data: {
            userId: user.id,
          },
        });
      } else if (role === "maintainer") {
        await tx.maintainer.create({
          data: {
            userId: user.id,
          },
        });
      }
      return user;
    });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "An error occurred during registration" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        Profile: true,
        Maintainer: true, // Include Maintainer relation
      },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate token
    const tokenPayload: any = {
      userId: user.id,
      email: user.email,
      first_name: user?.Profile?.firstname,
      last_name: user?.Profile?.lastname,
      role: user.role || undefined,
      maintainerId: user.Maintainer?.id, // Include maintainerId in the token payload
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        maintainerId: user.Maintainer?.id, // Include maintainerId in the response
      },
    });
  } catch (error: any) {
    console.error("Login error:", error?.message);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Profile: true,
        Admin: true,
        Commercial: true,
        Decider: true,
        EndUser: true,
        Helper: true,
        Maintainer: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { password, ...userWithoutPassword } = user;

    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Get profile error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching user profile" });
  }
};
function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role);
}






const sendOTP = async (email: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}`,
  };

  await transporter.sendMail(mailOptions);
};

export const sendOTPEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    // Store OTP in the database
    await prisma.otp.create({
      data: {
        email,
        otp,
        expiresAt: otpExpiration,
      },
    });

    // Send OTP via email
    await sendOTP(email, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "An error occurred while sending OTP" });
  }
};
export const verifyOTPEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    // Find the OTP record
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        otp,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    // Delete the OTP record after successful verification
    await prisma.otp.delete({
      where: {
        id: otpRecord.id,
      },
    });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "An error occurred while verifying OTP" });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, firstname, lastname, phonenumber, address } = req.body;

    // Find the user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: parseInt(userId) },
    });

    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    // Update the profile
    const updatedProfile = await prisma.profile.update({
      where: { userId: parseInt(userId) },
      data: {
        firstname,
        lastname,
        phonenumber,
        address,
      },
    });

    res.status(200).json({ message: "Profile updated successfully", profile: updatedProfile });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "An error occurred while updating the profile" });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Current password is incorrect" });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "An error occurred while updating the password" });
  }
};

export const sendForgotPasswordOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    // Store OTP in the database
    await prisma.otp.create({
      data: {
        email,
        otp,
        expiresAt: otpExpiration,
      },
    });

    // Send OTP via email
    await sendOTP(email, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "An error occurred while sending OTP" });
  }
};

export const verifyForgotPasswordOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    // Find the OTP record
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        otp,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    // Delete the OTP record after successful verification
    await prisma.otp.delete({
      where: {
        id: otpRecord.id,
      },
    });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "An error occurred while verifying OTP" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "An error occurred while resetting the password" });
  }
};


export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body; // Extract userId from req.body

    // Start a transaction to ensure atomicity
    await prisma.$transaction(async (prisma) => {
      // Delete related records
      await prisma.profile.deleteMany({ where: { userId } });
      await prisma.admin.deleteMany({ where: { userId } });
      await prisma.commercial.deleteMany({ where: { userId } });
      await prisma.decider.deleteMany({ where: { userId } });
      await prisma.endUser.deleteMany({ where: { userId } });
      await prisma.helper.deleteMany({ where: { userId } });
      await prisma.maintainer.deleteMany({ where: { userId } });
      await prisma.log.deleteMany({ where: { userId } });
      await prisma.notification.deleteMany({ where: { userId } });
      await prisma.userDeviceHistory.deleteMany({ where: { userId } });

      // Delete the user
      await prisma.user.delete({ where: { id: userId } });
    });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "An error occurred while deleting the account" });
  }
};