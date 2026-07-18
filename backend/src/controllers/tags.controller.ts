import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../lib/prisma';

export const getTags = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const tags = await prisma.tag.findMany({
      where: {
        reels: {
          some: {
            reel: { userId, deletedAt: null }
          }
        }
      },
      include: {
        reels: {
          where: { reel: { userId, deletedAt: null } }
        }
      }
    });

    const formattedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color || '#6366f1',
      count: tag.reels.length
    })).sort((a, b) => b.count - a.count);

    res.json(formattedTags);
  } catch (error) {
    next(error);
  }
};

export const createTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Tag name is required' });

    const tag = await prisma.tag.upsert({
      where: { name: name.trim().toLowerCase() },
      create: { name: name.trim().toLowerCase(), color: color || '#6366f1' },
      update: { ...(color && { color }) }
    });

    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
};

export const updateTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, color } = req.body;
    const userId = req.user?.id as string;

    // Verify the tag belongs to this user (via a reel)
    const exists = await prisma.tag.findFirst({
      where: { id: id, reels: { some: { reel: { userId } } } }
    });
    if (!exists) return res.status(404).json({ message: 'Tag not found' });

    const updated = await prisma.tag.update({
      where: { id: id },
      data: {
        ...(name && { name: name.trim().toLowerCase() }),
        ...(color && { color })
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id as string;

    const exists = await prisma.tag.findFirst({
      where: { id: id, reels: { some: { reel: { userId } } } }
    });
    if (!exists) return res.status(404).json({ message: 'Tag not found' });

    // Remove the tag from all of this user's reels first
    await prisma.reelTag.deleteMany({
      where: { tagId: id, reel: { userId } }
    });

    // Only delete the global tag if it has no more reels linked
    const remaining = await prisma.reelTag.count({ where: { tagId: id } });
    if (remaining === 0) {
      await prisma.tag.delete({ where: { id: id } });
    }

    res.json({ message: 'Tag removed' });
  } catch (error) {
    next(error);
  }
};

export const mergeTags = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sourceTagId, targetTagId } = req.body;
    const userId = req.user?.id;

    if (!sourceTagId || !targetTagId) {
      return res.status(400).json({ message: 'sourceTagId and targetTagId are required' });
    }
    if (sourceTagId === targetTagId) {
      return res.status(400).json({ message: 'Cannot merge a tag into itself' });
    }

    // Get all reel IDs for source tag owned by user
    const sourceLinks = await prisma.reelTag.findMany({
      where: { tagId: sourceTagId, reel: { userId } }
    });

    for (const link of sourceLinks) {
      // Upsert to target tag (avoid duplicate composite key)
      await prisma.reelTag.upsert({
        where: { reelId_tagId: { reelId: link.reelId, tagId: targetTagId } },
        create: { reelId: link.reelId, tagId: targetTagId },
        update: {}
      });
    }

    // Remove source links
    await prisma.reelTag.deleteMany({
      where: { tagId: sourceTagId, reel: { userId } }
    });

    // If source tag has no more reels, delete it
    const remaining = await prisma.reelTag.count({ where: { tagId: sourceTagId } });
    if (remaining === 0) {
      await prisma.tag.delete({ where: { id: sourceTagId } });
    }

    res.json({ message: 'Tags merged successfully' });
  } catch (error) {
    next(error);
  }
};
