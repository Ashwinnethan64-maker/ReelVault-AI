import prisma from '../lib/prisma'; // Prisma client

export const logActivity = async (userId: string, type: string, details?: string, reelId?: string) => {
  try {
    // Using type cast to avoid false IDE errors when Prisma types haven't refreshed
    const db = prisma as any;
    await db.activity.create({
      data: {
        userId,
        type,
        details,
        reelId
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
