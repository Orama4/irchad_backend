import { Request, Response } from "express";
import { PrismaClient,DeviceStatus} from "@prisma/client";
import bcrypt from  "bcryptjs";
const prisma = new PrismaClient();


export const getFirstAndLastNameById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
  
      const profile = await prisma.profile.findUnique({
        where: { userId: parseInt(userId) },
        select: {
          firstname: true,
          lastname: true,
        },
      });
  
      if (!profile) {
        res.status(404).json({ message: "User not found" });
        return;
      }
  
      res.status(200).json({
        firstname: profile.firstname,
        lastname: profile.lastname,
      });
    } catch (error) {
      console.error("Error fetching user names:", error);
      res.status(500).json({ message: "An error occurred while fetching names" });
    }
  };
  
  export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: {
            in: ['super', 'normal']
          }
        },
        include: {
          Profile: true,
          Admin: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
  
      const safeAdminUsers = adminUsers.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      console.log("Admin users fetched successfully:");
      
      res.status(200).json(safeAdminUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to retrieve admin users" });
    }
  };
  
  export const createAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstname, lastname, phonenumber, address, role = "normal" } = req.body;
      
      // Validate role
      if (role !== "normal" && role !== "super") {
        res.status(400).json({ message: "Invalid role. Must be 'normal' or 'super'." });
        return;
      }
  
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({ message: "User with this email already exists" });
        return;
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create user and admin in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role: role,
            Profile: {
              create: {
                firstname,
                lastname,
                phonenumber,
                address,
              },
            },
          },
          include: {
            Profile: true,
          },
        });
  
        // Create admin record
        const admin = await tx.admin.create({
          data: {
            userId: user.id,
            role: role,
          },
        });
  
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, admin };
      });
  
      res.status(201).json({ 
        message: "Admin created successfully", 
        data: result 
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "An error occurred while creating admin" });
    }
  };

  export const updateAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { firstname, lastname, phonenumber, address, role } = req.body;
  
      // Verify user exists and is an admin
      const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
        include: { Admin: true }
      });
  
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
  
      if (!user.Admin) {
        res.status(400).json({ message: "User is not an admin" });
        return;
      }
  
      // If role is being updated, verify it's valid
      if (role && role !== "normal" && role !== "super") {
        res.status(400).json({ message: "Invalid role. Must be 'normal' or 'super'." });
        return;
      }
  
      // Update user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update profile if profile data is provided
        if (firstname || lastname || phonenumber || address) {
          await tx.profile.update({
            where: { userId: Number(userId) },
            data: {
              ...(firstname && { firstname }),
              ...(lastname && { lastname }),
              ...(phonenumber && { phonenumber }),
              ...(address && { address }),
            },
          });
        }
  
        // Update user role if provided
        let updatedUser = user;
        if (role) {
          updatedUser = await tx.user.update({
            where: { id: Number(userId) },
            data: { role },
            include: { Admin: true }
          });
  
          // Update admin role if provided
          await tx.admin.update({
            where: { userId: Number(userId) },
            data: { role },
          });
        }
  
        // Get updated user with profile
        return tx.user.findUnique({
          where: { id: Number(userId) },
          include: {
            Profile: true,
            Admin: true,
          },
        });
      });
  
      if (!result) {
        res.status(404).json({ message: "Failed to update admin" });
        return;
      }
  
      // Remove password from response
      const { password, ...userWithoutPassword } = result;
  
      res.status(200).json({ 
        message: "Admin updated successfully", 
        data: userWithoutPassword 
      });
    } catch (error) {
      console.error("Error updating admin:", error);
      res.status(500).json({ message: "An error occurred while updating admin" });
    }
  };


  export const deleteAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      // Verify user exists and is an admin
      const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
        include: { Admin: true }
      });
  
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
  
      if (!user.Admin) {
        res.status(400).json({ message: "User is not an admin" });
        return;
      }
  
      // Delete user and related records in a transaction
      await prisma.$transaction(async (tx) => {
        // First delete admin record
        await tx.admin.delete({
          where: { userId: Number(userId) },
        });
  
        // Delete profile
        await tx.profile.delete({
          where: { userId: Number(userId) },
        });
  
        // Finally delete user
        await tx.user.delete({
          where: { id: Number(userId) },
        });
      });
  
      res.status(200).json({ message: "Admin deleted successfully" });
    } catch (error) {
      console.error("Error deleting admin:", error);
      res.status(500).json({ message: "An error occurred while deleting admin" });
    }
  };