import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../lib/prisma';

export const getCollections = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        reels: {
          include: {
            reel: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(collections);
  } catch (error) {
    next(error);
  }
};

export const createCollection = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Collection name is required' });
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        userId: userId as string
      }
    });

    res.status(201).json(collection);
  } catch (error) {
    next(error);
  }
};

export const updateCollection = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;
    const { name } = req.body;

    const collection = await prisma.collection.findFirst({
      where: { id, userId }
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: { name }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCollection = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;

    const collection = await prisma.collection.findFirst({
      where: { id, userId }
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // First delete relations
    await prisma.reelCollection.deleteMany({
      where: { collectionId: id }
    });

    await prisma.collection.delete({
      where: { id }
    });

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addReelToCollection = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const collectionId = req.params.id as string;
    const reelId = req.body.reelId as string;

    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId }
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const reel = await prisma.reel.findFirst({
      where: { id: reelId, userId }
    });

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const relation = await prisma.reelCollection.upsert({
      where: {
        reelId_collectionId: {
          reelId,
          collectionId
        }
      },
      create: {
        reelId,
        collectionId
      },
      update: {}
    });

    res.json(relation);
  } catch (error) {
    next(error);
  }
};

export const removeReelFromCollection = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const collectionId = req.params.id as string;
    const reelId = req.params.reelId as string;

    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId }
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    await prisma.reelCollection.delete({
      where: {
        reelId_collectionId: {
          reelId,
          collectionId
        }
      }
    });

    res.json({ message: 'Reel removed from collection' });
  } catch (error) {
    next(error);
  }
};
