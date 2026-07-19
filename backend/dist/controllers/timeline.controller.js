"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeline = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const date_fns_1 = require("date-fns");
const getTimeline = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const now = new Date();
        const today = (0, date_fns_1.startOfDay)(now);
        const yesterday = (0, date_fns_1.subDays)(today, 1);
        const lastWeek = (0, date_fns_1.subWeeks)(today, 1);
        const lastMonth = (0, date_fns_1.subMonths)(today, 1);
        // Grouping by time
        const reels = await prisma_1.default.reel.findMany({
            where: { userId, deletedAt: null },
            orderBy: { createdAt: 'desc' }
        });
        const timeline = {
            today: reels.filter(r => r.createdAt >= today),
            yesterday: reels.filter(r => r.createdAt >= yesterday && r.createdAt < today),
            lastWeek: reels.filter(r => r.createdAt >= lastWeek && r.createdAt < yesterday),
            lastMonth: reels.filter(r => r.createdAt >= lastMonth && r.createdAt < lastWeek),
            older: reels.filter(r => r.createdAt < lastMonth),
        };
        res.json({ timeline });
    }
    catch (error) {
        next(error);
    }
};
exports.getTimeline = getTimeline;
