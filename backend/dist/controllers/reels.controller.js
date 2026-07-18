"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreReel = exports.deleteReel = exports.updateReel = exports.createReel = exports.getReelById = exports.getReels = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const queue_service_1 = require("../services/queue.service");
const activity_1 = require("../utils/activity");
const getReels = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { search, collectionId, tag, favorites, watchLater, sort = 'newest', page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;
        // Build Prisma query conditions
        const where = { userId, deletedAt: null };
        if (favorites === 'true') {
            where.isFavorite = true;
        }
        if (watchLater === 'true') {
            where.isWatchLater = true;
        }
        if (collectionId) {
            where.collections = {
                some: {
                    collectionId: collectionId
                }
            };
        }
        if (tag) {
            where.tags = {
                some: {
                    tag: {
                        name: tag.trim().toLowerCase()
                    }
                }
            };
        }
        if (search) {
            const searchStr = search;
            where.OR = [
                { title: { contains: searchStr, mode: 'insensitive' } },
                { description: { contains: searchStr, mode: 'insensitive' } },
                { creator: { contains: searchStr, mode: 'insensitive' } },
                { aiSummary: { contains: searchStr, mode: 'insensitive' } },
                { url: { contains: searchStr, mode: 'insensitive' } },
                { keyTakeaways: { hasSome: [searchStr] } },
                { topics: { hasSome: [searchStr] } },
                { learningPoints: { hasSome: [searchStr] } }
            ];
        }
        // Sorting
        let orderBy = { createdAt: 'desc' };
        if (sort === 'oldest') {
            orderBy = { createdAt: 'asc' };
        }
        else if (sort === 'estimatedTime') {
            orderBy = { estimatedTime: 'asc' };
        }
        else if (sort === 'priority') {
            orderBy = { priority: 'desc' };
        }
        const reels = await prisma_1.default.reel.findMany({
            where,
            orderBy,
            skip,
            take: limitNum,
            include: {
                category: true,
                collections: {
                    include: {
                        collection: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });
        const total = await prisma_1.default.reel.count({ where });
        res.json({
            reels,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReels = getReels;
const getReelById = async (req, res, next) => {
    try {
        const reel = await prisma_1.default.reel.findFirst({
            where: {
                id: req.params.id,
                userId: req.user?.id,
                deletedAt: null
            },
            include: {
                category: true,
                collections: {
                    include: {
                        collection: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });
        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        res.json(reel);
    }
    catch (error) {
        next(error);
    }
};
exports.getReelById = getReelById;
const createReel = async (req, res, next) => {
    try {
        const { url, title, description } = req.body;
        const userId = req.user?.id;
        const reqId = req.reqId || 'UNKNOWN_REQ';
        if (!url) {
            console.warn(`[REQ ${reqId}] createReel validation failed: Missing URL`);
            return res.status(400).json({ message: 'Instagram URL is required' });
        }
        // Extract basic information from URL or mock it realistically
        const urlPattern = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i;
        const match = url.match(urlPattern);
        if (!match) {
            console.warn(`[REQ ${reqId}] createReel validation failed: Invalid URL ${url}`);
            return res.status(422).json({ message: 'Invalid Instagram URL format. Must be an Instagram Reel or Post.' });
        }
        const reelCode = match[1];
        // Normalize URL to remove tracking parameters
        const normalizedUrl = `https://www.instagram.com/reel/${reelCode}/`;
        // Mock initial metadata scraping before AI background worker extracts richer insights
        const mockCreator = `creator_${reelCode.substring(0, 4).toLowerCase()}`;
        const mockTitle = title || `Instagram Reel by @${mockCreator}`;
        const mockDescription = description || `Interesting educational reel containing details on code development, architectural patterns, and engineering. Reel ID: ${reelCode}`;
        const mockThumbnail = `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60`;
        const reel = await prisma_1.default.reel.create({
            data: {
                url: normalizedUrl,
                title: mockTitle,
                description: mockDescription,
                creator: mockCreator,
                thumbnail: mockThumbnail,
                user: { connect: { id: userId } }
            }
        });
        // Enqueue the AI metadata extraction job to process in the background
        // wrapped in try-catch so AI failure does NOT prevent saving the reel
        try {
            await (0, queue_service_1.enqueueJob)('generate_metadata', {
                reelId: reel.id,
                content: `${mockTitle}\n\n${mockDescription}`
            });
            console.info(`[REQ ${reqId}] AI metadata job enqueued for Reel ${reel.id}`);
        }
        catch (aiError) {
            console.error(`[REQ ${reqId}] AI generation enqueue failed, but Reel was saved:`, aiError);
        }
        try {
            await (0, activity_1.logActivity)(userId, 'ADDED_REEL', `Added Reel: ${mockTitle}`, reel.id);
        }
        catch (logErr) {
            console.error(`[REQ ${reqId}] Activity logging failed:`, logErr);
        }
        res.status(201).json(reel);
    }
    catch (error) {
        const reqId = req.reqId || 'UNKNOWN_REQ';
        console.error(`[REQ ${reqId}] Database Insert Failed in createReel:`, error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'A reel with this URL already exists in your vault.' });
        }
        // Pass to global error handler
        error.status = 500;
        error.message = 'Database Insert Failed';
        next(error);
    }
};
exports.createReel = createReel;
const updateReel = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const id = req.params.id;
        const { title, description, isFavorite, isWatchLater, priority, tagNames } = req.body;
        const reel = await prisma_1.default.reel.findFirst({
            where: { id, userId }
        });
        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        // Handle tag updates if provided
        if (tagNames && Array.isArray(tagNames)) {
            // Clear existing tags
            await prisma_1.default.reelTag.deleteMany({
                where: { reelId: id }
            });
            // Create & connect new tags
            for (const name of tagNames) {
                const cleaned = name.trim().toLowerCase();
                if (cleaned) {
                    const tag = await prisma_1.default.tag.upsert({
                        where: { name: cleaned },
                        create: { name: cleaned, color: '#818cf8' },
                        update: {}
                    });
                    await prisma_1.default.reelTag.create({
                        data: {
                            reelId: id,
                            tagId: tag.id
                        }
                    });
                }
            }
        }
        const updated = await prisma_1.default.reel.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(isFavorite !== undefined && { isFavorite }),
                ...(isWatchLater !== undefined && { isWatchLater }),
                ...(priority !== undefined && { priority }),
            },
            include: {
                category: true,
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
};
exports.updateReel = updateReel;
const deleteReel = async (req, res, next) => {
    try {
        const reel = await prisma_1.default.reel.findFirst({
            where: { id: req.params.id, userId: req.user?.id }
        });
        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        // Soft delete instead of hard delete
        await prisma_1.default.reel.update({
            where: { id: reel.id },
            data: { deletedAt: new Date() }
        });
        await (0, activity_1.logActivity)(req.user?.id, 'DELETED_REEL', `Deleted Reel: ${reel.title}`);
        res.json({ message: 'Reel removed' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteReel = deleteReel;
const restoreReel = async (req, res, next) => {
    try {
        const reel = await prisma_1.default.reel.findFirst({
            where: { id: req.params.id, userId: req.user?.id }
        });
        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        await prisma_1.default.reel.update({
            where: { id: reel.id },
            data: { deletedAt: null }
        });
        await (0, activity_1.logActivity)(req.user?.id, 'RESTORED_REEL', `Restored Reel: ${reel.title}`);
        res.json({ message: 'Reel restored' });
    }
    catch (error) {
        next(error);
    }
};
exports.restoreReel = restoreReel;
