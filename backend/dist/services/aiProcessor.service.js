"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndSaveEmbedding = exports.processReelMetadata = void 0;
const gemini_service_1 = require("./gemini.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const prompts_1 = require("../prompts");
const processReelMetadata = async (reelId, content) => {
    const startTime = Date.now();
    const prompt = (0, prompts_1.getPrompt)('metadata', { content });
    try {
        const response = await gemini_service_1.gemini.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        const output = response.text || "{}";
        const parsed = JSON.parse(output);
        // Find or create category if returned
        let categoryId;
        if (parsed.category) {
            const category = await prisma_1.default.category.upsert({
                where: { name: parsed.category.trim() },
                create: { name: parsed.category.trim() },
                update: {},
            });
            categoryId = category.id;
        }
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
                topics: parsed.topics || [],
                learningPoints: parsed.learningPoints || [],
                importantQuotes: parsed.importantQuotes || [],
                sentiment: parsed.sentiment,
                aiKeywords: parsed.searchKeywords || [],
                confidenceScore: parsed.confidenceScore,
                ...(categoryId && { categoryId }),
            }
        });
        // Create and connect tags if returned
        if (parsed.tags && Array.isArray(parsed.tags)) {
            for (const tagName of parsed.tags) {
                const cleanedName = tagName.trim().toLowerCase();
                if (cleanedName) {
                    const tag = await prisma_1.default.tag.upsert({
                        where: { name: cleanedName },
                        create: { name: cleanedName, color: '#818cf8' },
                        update: {},
                    });
                    await prisma_1.default.reelTag.upsert({
                        where: {
                            reelId_tagId: {
                                reelId,
                                tagId: tag.id
                            }
                        },
                        create: {
                            reelId,
                            tagId: tag.id
                        },
                        update: {}
                    });
                }
            }
        }
        // Also generate and save the embedding for semantic search
        try {
            await (0, exports.generateAndSaveEmbedding)(reelId, (parsed.summary || "") + " " + (parsed.keyTakeaways || []).join(" "));
        }
        catch (embErr) {
            console.error("Embedding generation failed, skipping but continuing:", embErr);
        }
        await (0, prompts_1.logPrompt)(updatedReel.userId, 'REEL_METADATA_PROMPT', 'v1', content, output, 0, // tokens used
        Date.now() - startTime);
        return updatedReel;
    }
    catch (error) {
        console.error("AI Metadata Generation Error:", error);
        throw error;
    }
};
exports.processReelMetadata = processReelMetadata;
const generateAndSaveEmbedding = async (reelId, textToEmbed) => {
    console.log("Embedding generation is pending Gemini support. Skipping for now.");
};
exports.generateAndSaveEmbedding = generateAndSaveEmbedding;
