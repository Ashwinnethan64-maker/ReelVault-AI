"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeTags = exports.deleteTag = exports.updateTag = exports.createTag = exports.getTags = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getTags = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const tags = await prisma_1.default.tag.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getTags = getTags;
const createTag = async (req, res, next) => {
    try {
        const { name, color } = req.body;
        if (!name)
            return res.status(400).json({ message: 'Tag name is required' });
        const tag = await prisma_1.default.tag.upsert({
            where: { name: name.trim().toLowerCase() },
            create: { name: name.trim().toLowerCase(), color: color || '#6366f1' },
            update: { ...(color && { color }) }
        });
        res.status(201).json(tag);
    }
    catch (error) {
        next(error);
    }
};
exports.createTag = createTag;
const updateTag = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, color } = req.body;
        const userId = req.user?.id;
        // Verify the tag belongs to this user (via a reel)
        const exists = await prisma_1.default.tag.findFirst({
            where: { id: id, reels: { some: { reel: { userId } } } }
        });
        if (!exists)
            return res.status(404).json({ message: 'Tag not found' });
        const updated = await prisma_1.default.tag.update({
            where: { id: id },
            data: {
                ...(name && { name: name.trim().toLowerCase() }),
                ...(color && { color })
            }
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
};
exports.updateTag = updateTag;
const deleteTag = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const exists = await prisma_1.default.tag.findFirst({
            where: { id: id, reels: { some: { reel: { userId } } } }
        });
        if (!exists)
            return res.status(404).json({ message: 'Tag not found' });
        // Remove the tag from all of this user's reels first
        await prisma_1.default.reelTag.deleteMany({
            where: { tagId: id, reel: { userId } }
        });
        // Only delete the global tag if it has no more reels linked
        const remaining = await prisma_1.default.reelTag.count({ where: { tagId: id } });
        if (remaining === 0) {
            await prisma_1.default.tag.delete({ where: { id: id } });
        }
        res.json({ message: 'Tag removed' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTag = deleteTag;
const mergeTags = async (req, res, next) => {
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
        const sourceLinks = await prisma_1.default.reelTag.findMany({
            where: { tagId: sourceTagId, reel: { userId } }
        });
        for (const link of sourceLinks) {
            // Upsert to target tag (avoid duplicate composite key)
            await prisma_1.default.reelTag.upsert({
                where: { reelId_tagId: { reelId: link.reelId, tagId: targetTagId } },
                create: { reelId: link.reelId, tagId: targetTagId },
                update: {}
            });
        }
        // Remove source links
        await prisma_1.default.reelTag.deleteMany({
            where: { tagId: sourceTagId, reel: { userId } }
        });
        // If source tag has no more reels, delete it
        const remaining = await prisma_1.default.reelTag.count({ where: { tagId: sourceTagId } });
        if (remaining === 0) {
            await prisma_1.default.tag.delete({ where: { id: sourceTagId } });
        }
        res.json({ message: 'Tags merged successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.mergeTags = mergeTags;
