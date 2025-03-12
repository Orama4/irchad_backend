// auth/controllers/auth.controller.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role as any,
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
        await tx.admin.create({
          data: {
            userId: user.id,
            role: role as any,
          },
        });
      }

      return user;
    });

    // Generate token
    const tokenPayload: TokenPayload = {
      userId: result.id,
      email: result.email,
      role: result.role || undefined,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "An error occurred during registration" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
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
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role || undefined,
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
      },
    });
  } catch (error) {
    console.error("Login error:", error);
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

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Get profile error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching user profile" });
  }
};
