import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../lib/prisma';

export const getReelNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reelId = req.params.reelId as string;
    
    // Ensure reel belongs to user
    const reel = await prisma.reel.findFirst({
      where: { id: reelId, userId: req.user!.id }
    });
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const notes = await prisma.note.findMany({
      where: { reelId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ notes });
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reelId = req.params.reelId as string;
    const { content } = req.body;
    
    const reel = await prisma.reel.findFirst({
      where: { id: reelId, userId: req.user!.id }
    });
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const existing = await prisma.note.findFirst({
      where: { reelId }
    });

    let note;
    if (existing) {
      note = await prisma.note.update({
        where: { id: existing.id },
        data: { content }
      });
    } else {
      note = await prisma.note.create({
        data: {
          content,
          reelId
        }
      });
    }

    res.status(201).json({ note });
  } catch (error) {
    next(error);
  }
};
