import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../lib/prisma';

export const getDashboardData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [totalReels, favorites, watchLater] = await Promise.all([
      prisma.reel.count({ where: { userId } }),
      prisma.reel.count({ where: { userId, isFavorite: true } }),
      prisma.reel.count({ where: { userId, isWatchLater: true } }),
    ]);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeek = await prisma.reel.count({
      where: {
        userId,
        createdAt: { gte: oneWeekAgo }
      }
    });

    // Recent reels
    const recentReels = await prisma.reel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        tags: { include: { tag: true } }
      }
    });

    // Generate weekly data for the chart (last 7 days counts)
    const weeklyData = [0, 0, 0, 0, 0, 0, 0];
    const recentWeekReels = await prisma.reel.findMany({
      where: { userId, createdAt: { gte: oneWeekAgo } },
      select: { createdAt: true }
    });

    recentWeekReels.forEach(reel => {
      const diffTime = Math.abs(new Date().getTime() - new Date(reel.createdAt).getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        // day 6 is today, day 0 is 6 days ago
        weeklyData[6 - diffDays]++;
      }
    });

    res.json({
      stats: {
        total: totalReels,
        favorites,
        watchLater,
        thisWeek,
      },
      weeklyData,
      recentReels
    });
  } catch (error) {
    next(error);
  }
};
