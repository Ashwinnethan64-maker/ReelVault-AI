"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getDashboardData = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const [totalReels, favorites, watchLater] = await Promise.all([
            prisma_1.default.reel.count({ where: { userId } }),
            prisma_1.default.reel.count({ where: { userId, isFavorite: true } }),
            prisma_1.default.reel.count({ where: { userId, isWatchLater: true } }),
        ]);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeek = await prisma_1.default.reel.count({
            where: {
                userId,
                createdAt: { gte: oneWeekAgo }
            }
        });
        // Recent reels
        const recentReels = await prisma_1.default.reel.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 6,
            include: {
                tags: { include: { tag: true } }
            }
        });
        // Generate weekly data for the chart (last 7 days counts)
        const weeklyData = [0, 0, 0, 0, 0, 0, 0];
        const recentWeekReels = await prisma_1.default.reel.findMany({
            where: { userId, createdAt: { gte: oneWeekAgo } },
            select: { createdAt: true }
        });
        recentWeekReels.forEach(reel => {
            const diffTime = Math.abs(new Date().getTime() - new Date(reel.createdAt).getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 7) {
                // day 6 is today, day 0 is 6 days ago
                weeklyData[6 - diffDays]++;
            }
        });
        res.json({
            stats: {
                total: totalReels,
                favorites,
                watchLater,
                thisWeek,
            },
            weeklyData,
            recentReels
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardData = getDashboardData;
