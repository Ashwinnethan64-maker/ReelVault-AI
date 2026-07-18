"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBackgroundWorker = exports.processNextJob = exports.enqueueJob = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const aiProcessor_service_1 = require("./aiProcessor.service");
const enqueueJob = async (type, payload) => {
    return await prisma_1.default.jobQueue.create({
        data: {
            type,
            payload: JSON.stringify(payload),
        }
    });
};
exports.enqueueJob = enqueueJob;
const processNextJob = async () => {
    const job = await prisma_1.default.jobQueue.findFirst({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' }
    });
    if (!job)
        return null;
    await prisma_1.default.jobQueue.update({
        where: { id: job.id },
        data: { status: 'processing', attempts: job.attempts + 1 }
    });
    try {
        const payload = JSON.parse(job.payload);
        if (job.type === 'generate_metadata') {
            await (0, aiProcessor_service_1.processReelMetadata)(payload.reelId, payload.content);
        }
        await prisma_1.default.jobQueue.update({
            where: { id: job.id },
            data: { status: 'completed' }
        });
        return true;
    }
    catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        await prisma_1.default.jobQueue.update({
            where: { id: job.id },
            data: {
                status: job.attempts >= 3 ? 'failed' : 'pending',
                error: error.message
            }
        });
        return false;
    }
};
exports.processNextJob = processNextJob;
const startBackgroundWorker = () => {
    console.log("Starting background job worker...");
    setInterval(async () => {
        try {
            await (0, exports.processNextJob)();
        }
        catch (err) {
            console.error("Queue worker cycle failed:", err);
        }
    }, 5000);
};
exports.startBackgroundWorker = startBackgroundWorker;
