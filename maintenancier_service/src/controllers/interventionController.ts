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
      include: {
        Device: {
          select: {
            nom: true,
            status: true
          }
        }
      }
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

export const getInterventionById = async (req: Request, res: Response): Promise<void> => {
  const taskId = parseInt(req.params.taskId);

  if (isNaN(taskId)) {
    res.status(400).json({ message: 'Invalid taskId' });
    return;
  }

  try {
    const intervention = await prisma.intervention.findUnique({
      where: { id: taskId },
      include: {
        Device: {
          select: {
            nom: true,
            status: true,
            EndUser: {
              select: {
                User: {
                  select: {
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!intervention) {
      res.status(404).json({ message: 'Intervention not found' });
      return;
    }

    const email = intervention.Device.EndUser?.User?.email || null;

    // Build the custom response structure
    const response = {
      id: intervention.id,
      deviceId: intervention.deviceId,
      maintainerId: intervention.maintainerId,
      type: intervention.type,
      isRemote: intervention.isRemote,
      planDate: intervention.planDate,
      Priority: intervention.Priority,
      description: intervention.description,
      status: intervention.status,
      Device: {
        nom: intervention.Device.nom,
        status: intervention.Device.status,
        email: email
      }
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while retrieving the intervention' });
  }
};


export const getInterventionsByDeviceId = async (req: Request, res: Response): Promise<void> => {
  const deviceId = parseInt(req.params.deviceId);

  if (isNaN(deviceId)) {
    res.status(400).json({ message: 'Invalid deviceId' });
    return;
  }

  try {
    const interventions = await prisma.intervention.findMany({
      where: {
        deviceId: deviceId,
        status: 'complete' 
      },
      include: {
        Device: {
          select: {
            nom: true,
            status: true,
            EndUser: {
              select: {
                User: {
                  select: {
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const formattedInterventions = interventions.map(intervention => {
    const email = intervention.Device?.EndUser?.User?.email || null;

      return {
        id: intervention.id,
        deviceId: intervention.deviceId,
        maintainerId: intervention.maintainerId,
        type: intervention.type,
        isRemote: intervention.isRemote,
        planDate: intervention.planDate,
        Priority: intervention.Priority,
        description: intervention.description,
        status: intervention.status,
        Device: {
          nom: intervention.Device.nom,
          status: intervention.Device.status,
          email: email
        }
      };
    });

    res.json(formattedInterventions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while retrieving interventions for the device' });
  }
};


const validStatuses = ['en_panne', 'en_progres', 'complete'] as const;

export const updateInterventionStatus = async (req: Request, res: Response): Promise<void> => {
  const interventionId = parseInt(req.params.interventionId);
  const { status } = req.body;

  if (isNaN(interventionId)) {
    res.status(400).json({ message: 'Invalid interventionId' });
    return;
  }

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ message: 'Invalid or missing status. Allowed values: en_panne, en_progres, complete' });
    return;
  }

  try {
    const updatedIntervention = await prisma.intervention.update({
      where: { id: interventionId },
      data: { status },
    });

    res.json(updatedIntervention);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update intervention status', details: error });
  }
};


export const updateInterventionPlanDate = async (req: Request, res: Response): Promise<void> => {
  const interventionId = parseInt(req.params.interventionId);
  const { planDate } = req.body;

  if (isNaN(interventionId)) {
    res.status(400).json({ message: 'Invalid interventionId' });
    return;
  }

  if (!planDate || isNaN(Date.parse(planDate))) {
    res.status(400).json({ message: 'Invalid or missing planDate. Must be a valid date string (e.g., 2025-04-28)' });
    return;
  }

  try {
    const updatedIntervention = await prisma.intervention.update({
      where: { id: interventionId },
      data: {
        planDate: new Date(planDate),
      },
    });

    res.json(updatedIntervention);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update planDate', details: error });
  }
};


export const updateInterventionDescription = async (req: Request, res: Response): Promise<void> => {
  const interventionId = parseInt(req.params.interventionId);
  const { description } = req.body;

  if (isNaN(interventionId)) {
    res.status(400).json({ message: 'Invalid interventionId' });
    return;
  }

  if (!description) {
    res.status(400).json({ message: 'Invalid or missing description' });
    return;
  }

  try {
    const updatedIntervention = await prisma.intervention.update({
      where: { id: interventionId },
      data: { description },
    });

    res.json(updatedIntervention);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update description', details: error });
  }
};
