import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../lib/prisma';

export const getReels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reels = await prisma.reel.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reels);
  } catch (error) {
    next(error);
  }
};

export const getReelById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reel = await prisma.reel.findFirst({
      where: { 
        id: req.params.id as string,
        userId: req.user?.id as string
      }
    });
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }
    res.json(reel);
  } catch (error) {
    next(error);
  }
};

export const createReel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { url, title, description } = req.body;
    
    // Mock AI Processing
    const aiSummary = "Automatically generated summary for this reel.";
    const aiKeywords = ["mock", "keyword", "ai"];

    const reel = await prisma.reel.create({
      data: {
        url,
        title,
        description,
        aiSummary,
        aiKeywords,
        user: { connect: { id: req.user?.id } }
      }
    });

    res.status(201).json(reel);
  } catch (error) {
    next(error);
  }
};

export const deleteReel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reel = await prisma.reel.findFirst({
      where: { id: req.params.id as string, userId: req.user?.id as string }
    });
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }
    
    await prisma.reel.delete({ where: { id: reel.id } });
    res.json({ message: 'Reel removed' });
  } catch (error) {
    next(error);
  }
};
