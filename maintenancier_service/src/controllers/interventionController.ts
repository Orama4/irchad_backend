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


export const getInterventionsByMaintainerId = async (req: Request, res: Response): Promise<void> => {
  const maintainerId = parseInt(req.params.maintainerId);

  try {
    const interventions = await prisma.intervention.findMany({
      where: {
        maintainerId: maintainerId,
        status: { in: ['en_panne', 'en_progres'] },
      },
    });

    res.json(interventions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while retrieving the interventions' });
  }
};


//Historique
export const getInterventionsByMaintainerIdAndDeviceId = async (req: Request, res: Response): Promise<void> => {
  const maintainerId = parseInt(req.params.maintainerId);
  const deviceId = parseInt(req.params.deviceId);

  try {
    const interventions = await prisma.intervention.findMany({
      where: {
        maintainerId: maintainerId,
        deviceId: deviceId,
        status: 'complete',
      },
    });

    res.json(interventions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while retrieving the interventions' });
  }
};