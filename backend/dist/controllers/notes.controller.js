"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrUpdateNote = exports.getReelNotes = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getReelNotes = async (req, res, next) => {
    try {
        const reelId = req.params.reelId;
        // Ensure reel belongs to user
        const reel = await prisma_1.default.reel.findFirst({
            where: { id: reelId, userId: req.user.id }
        });
        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        const notes = await prisma_1.default.note.findMany({
            where: { reelId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ notes });
    }
    catch (error) {
        next(error);
    }
};
exports.getReelNotes = getReelNotes;
const createOrUpdateNote = async (req, res, next) => {
    try {
        const reelId = req.params.reelId;
        const { content } = req.body;
        const reel = await prisma_1.default.reel.findFirst({
            where: { id: reelId, userId: req.user.id }
        });
        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        const existing = await prisma_1.default.note.findFirst({
            where: { reelId }
        });
        let note;
        if (existing) {
            note = await prisma_1.default.note.update({
                where: { id: existing.id },
                data: { content }
            });
        }
        else {
            note = await prisma_1.default.note.create({
                data: {
                    content,
                    reelId
                }
            });
        }
        res.status(201).json({ note });
    }
    catch (error) {
        next(error);
    }
};
exports.createOrUpdateNote = createOrUpdateNote;
