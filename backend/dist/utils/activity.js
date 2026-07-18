"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const prisma_1 = __importDefault(require("../lib/prisma")); // Prisma client
const logActivity = async (userId, type, details, reelId) => {
    try {
        // Using type cast to avoid false IDE errors when Prisma types haven't refreshed
        const db = prisma_1.default;
        await db.activity.create({
            data: {
                userId,
                type,
                details,
                reelId
            }
        });
    }
    catch (error) {
        console.error('Failed to log activity:', error);
    }
};
exports.logActivity = logActivity;
