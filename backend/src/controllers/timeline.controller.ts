import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../lib/prisma';
import { subDays, subWeeks, subMonths, startOfDay } from 'date-fns';

export const getTimeline = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = subDays(today, 1);
    const lastWeek = subWeeks(today, 1);
    const lastMonth = subMonths(today, 1);
    
    // Grouping by time
    const reels = await prisma.reel.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    const timeline = {
      today: reels.filter(r => r.createdAt >= today),
      yesterday: reels.filter(r => r.createdAt >= yesterday && r.createdAt < today),
      lastWeek: reels.filter(r => r.createdAt >= lastWeek && r.createdAt < yesterday),
      lastMonth: reels.filter(r => r.createdAt >= lastMonth && r.createdAt < lastWeek),
      older: reels.filter(r => r.createdAt < lastMonth),
    };

    res.json({ timeline });
  } catch (error) {
    next(error);
  }
};
