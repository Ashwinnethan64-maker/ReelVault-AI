"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReel = exports.createReel = exports.getReelById = exports.getReels = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getReels = async (req, res, next) => {
    try {
        const reels = await prisma_1.default.reel.findMany({
            where: { userId: req.user?.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reels);
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
                userId: req.user?.id
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
        // Mock AI Processing
        const aiSummary = "Automatically generated summary for this reel.";
        const aiKeywords = ["mock", "keyword", "ai"];
        const reel = await prisma_1.default.reel.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createReel = createReel;
const deleteReel = async (req, res, next) => {
    try {
        const reel = await prisma_1.default.reel.findFirst({
            where: { id: req.params.id, userId: req.user?.id }
        });
        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        await prisma_1.default.reel.delete({ where: { id: reel.id } });
        res.json({ message: 'Reel removed' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteReel = deleteReel;
