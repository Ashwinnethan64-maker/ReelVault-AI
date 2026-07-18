import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const syncUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { id, email } = req.user;

    // Upsert the user into our Prisma database
    // This ensures that even if they just signed up via Google OAuth on the frontend,
    // they will now exist in our relational database for foreign key constraints.
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        // Only update fields that might change and we trust from the JWT, 
        // or just keep it simple and update nothing if they exist.
        // If we want to sync email changes from Supabase, we can do it here.
        ...(email && { email }),
      },
      create: {
        id,
        email: email || '', // Supabase might not guarantee email depending on provider, but usually does
        name: email ? email.split('@')[0] : 'User', // Fallback name
        password: '', // We don't store passwords anymore, Supabase handles it
      },
      select: { id: true, name: true, email: true, avatar: true }
    });

    res.json(user);
  } catch (error) {
    console.error("Sync User Error:", error);
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
      },
      select: { id: true, name: true, email: true, avatar: true }
    });

    res.json(user);
  } catch (error) {
    console.error("Update Profile Error:", error);
    next(error);
  }
};
