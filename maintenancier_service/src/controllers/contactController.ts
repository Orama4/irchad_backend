import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUrgenceContactsByEndUserId = async (req: Request, res: Response): Promise<void> => {
  const endUserId = parseInt(req.params.id, 10);

  if (isNaN(endUserId)) {
    res.status(400).json({ error: 'Invalid endUserId' });
    return;
  }

  try {
    const endUser = await prisma.endUser.findUnique({
      where: { id: endUserId },
      select: {
        urgenceContacts: true,
      },
    });

    if (!endUser) {
      res.status(404).json({ error: 'EndUser not found' });
      return;
    }

    res.json(endUser.urgenceContacts);
  } catch (error) {
    console.error('Error fetching urgenceContacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const addUrgenceContactsByEndUserId = async (req: Request, res: Response): Promise<void> => {
  const endUserId = parseInt(req.params.id);
  const { nom, telephone } = req.body;

  // Validation
  if (!nom || !telephone) {
    res.status(400).json({ error: 'Nom and telephone are required' });
    return;
  }

  try {
    // Check if EndUser exists
    const endUser = await prisma.endUser.findUnique({
      where: { id: endUserId },
    });

    if (!endUser) {
      res.status(404).json({ error: 'EndUser not found' });
      return;
    }

    // Create contact
    const newContact = await prisma.contact.create({
      data: {
        nom,
        telephone,
        endUser: {
          connect: { id: endUserId },
        },
      },
    });

    res.status(201).json(newContact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};