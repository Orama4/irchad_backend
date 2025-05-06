import { Request, Response } from "express";
import { PrismaClient,DeviceStatus} from "@prisma/client";

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
  