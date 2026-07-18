"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeReelFromCollection = exports.addReelToCollection = exports.deleteCollection = exports.updateCollection = exports.createCollection = exports.getCollections = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getCollections = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const collections = await prisma_1.default.collection.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getCollections = getCollections;
const createCollection = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Collection name is required' });
        }
        const collection = await prisma_1.default.collection.create({
            data: {
                name,
                userId: userId
            }
        });
        res.status(201).json(collection);
    }
    catch (error) {
        next(error);
    }
};
exports.createCollection = createCollection;
const updateCollection = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const id = req.params.id;
        const { name } = req.body;
        const collection = await prisma_1.default.collection.findFirst({
            where: { id, userId }
        });
        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }
        const updated = await prisma_1.default.collection.update({
            where: { id },
            data: { name }
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
};
exports.updateCollection = updateCollection;
const deleteCollection = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const id = req.params.id;
        const collection = await prisma_1.default.collection.findFirst({
            where: { id, userId }
        });
        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }
        // First delete relations
        await prisma_1.default.reelCollection.deleteMany({
            where: { collectionId: id }
        });
        await prisma_1.default.collection.delete({
            where: { id }
        });
        res.json({ message: 'Collection deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCollection = deleteCollection;
const addReelToCollection = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const collectionId = req.params.id;
        const reelId = req.body.reelId;
        const collection = await prisma_1.default.collection.findFirst({
            where: { id: collectionId, userId }
        });
        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }
        const reel = await prisma_1.default.reel.findFirst({
            where: { id: reelId, userId }
        });
        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        const relation = await prisma_1.default.reelCollection.upsert({
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
    }
    catch (error) {
        next(error);
    }
};
exports.addReelToCollection = addReelToCollection;
const removeReelFromCollection = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const collectionId = req.params.id;
        const reelId = req.params.reelId;
        const collection = await prisma_1.default.collection.findFirst({
            where: { id: collectionId, userId }
        });
        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }
        await prisma_1.default.reelCollection.delete({
            where: {
                reelId_collectionId: {
                    reelId,
                    collectionId
                }
            }
        });
        res.json({ message: 'Reel removed from collection' });
    }
    catch (error) {
        next(error);
    }
};
exports.removeReelFromCollection = removeReelFromCollection;
