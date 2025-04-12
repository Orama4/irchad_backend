import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createIntervention = async (req: Request, res: Response) => {
  const { type, deviceId, maintainerId, isRemote, planDate } = req.body;

  try {
    const intervention = await prisma.intervention.create({
      data: {
        type,
        deviceId,
        maintainerId,
        isRemote,
        planDate: new Date(planDate),
      },
    });

    res.status(201).json(intervention);
  } catch (error) {
    res.status(500).json({ error: "Failed to create intervention", details: error });
  }
};
