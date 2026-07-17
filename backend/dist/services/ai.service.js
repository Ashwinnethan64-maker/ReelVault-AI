"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndSaveEmbedding = exports.processReelMetadata = void 0;
const openai_service_1 = require("./openai.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const prompts_1 = require("../prompts");
const processReelMetadata = async (reelId, content) => {
    const startTime = Date.now();
    const prompt = (0, prompts_1.getPrompt)('metadata', { content });
    try {
        const response = await openai_service_1.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: prompt }
            ],
            response_format: { type: "json_object" }
        });
        const output = response.choices[0].message.content || "{}";
        const parsed = JSON.parse(output);
        // Save extracted metadata back to the reel
        const updatedReel = await prisma_1.default.reel.update({
            where: { id: reelId },
            data: {
                aiSummary: parsed.summary,
                difficulty: parsed.difficulty,
                estimatedTime: parsed.estimatedTime,
                keyTakeaways: parsed.keyTakeaways || [],
                actionItems: parsed.actionItems || [],
                technologies: parsed.technologies || [],
                frameworks: parsed.frameworks || [],
                tools: parsed.tools || [],
                confidenceScore: parsed.confidenceScore,
            }
        });
        // Also generate and save the embedding for semantic search
        await (0, exports.generateAndSaveEmbedding)(reelId, parsed.summary + " " + parsed.keyTakeaways.join(" "));
        await (0, prompts_1.logPrompt)(updatedReel.userId, 'REEL_METADATA_PROMPT', 'v1', content, output, response.usage?.total_tokens || 0, Date.now() - startTime);
        return updatedReel;
    }
    catch (error) {
        console.error("AI Metadata Generation Error:", error);
        throw error;
    }
};
exports.processReelMetadata = processReelMetadata;
const generateAndSaveEmbedding = async (reelId, textToEmbed) => {
    const embeddingResponse = await openai_service_1.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: textToEmbed,
    });
    const vector = embeddingResponse.data[0].embedding;
    // Use a raw query to update the pgvector field since Prisma raw fields require special casting
    await prisma_1.default.$executeRawUnsafe(`UPDATE "Reel" SET "embedding" = $1::vector WHERE "id" = $2`, JSON.stringify(vector), reelId);
};
exports.generateAndSaveEmbedding = generateAndSaveEmbedding;
