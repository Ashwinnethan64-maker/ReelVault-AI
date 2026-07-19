"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getAnalytics = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const totalReels = await prisma_1.default.reel.count({ where: { userId, deletedAt: null } });
        const favorites = await prisma_1.default.reel.count({ where: { userId, isFavorite: true, deletedAt: null } });
        const watchLater = await prisma_1.default.reel.count({ where: { userId, isWatchLater: true, deletedAt: null } });
        // Sum estimated time
        const reels = await prisma_1.default.reel.findMany({
            where: { userId, deletedAt: null },
            select: { estimatedTime: true, difficulty: true, topics: true, createdAt: true }
        });
        let totalWatchTime = 0;
        const difficultyDistribution = { beginner: 0, intermediate: 0, advanced: 0 };
        const topicFrequency = {};
        reels.forEach(r => {
            totalWatchTime += r.estimatedTime || 0;
            const diff = r.difficulty?.toLowerCase();
            if (diff === 'beginner')
                difficultyDistribution.beginner++;
            else if (diff === 'intermediate')
                difficultyDistribution.intermediate++;
            else if (diff === 'advanced')
                difficultyDistribution.advanced++;
            r.topics.forEach(t => {
                topicFrequency[t] = (topicFrequency[t] || 0) + 1;
            });
        });
        const sortedTopics = Object.entries(topicFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        // AI Confidence avg
        const aiReels = await prisma_1.default.reel.aggregate({
            where: { userId, deletedAt: null, confidenceScore: { not: null } },
            _avg: { confidenceScore: true }
        });
        res.json({
            totalReels,
            totalWatchTime,
            favorites,
            watchLater,
            difficultyDistribution,
            topTopics: sortedTopics,
            averageAiConfidence: aiReels._avg.confidenceScore || 0,
            knowledgeScore: Math.floor(totalWatchTime * 1.5 + totalReels * 10) // Mock score
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAnalytics = getAnalytics;
