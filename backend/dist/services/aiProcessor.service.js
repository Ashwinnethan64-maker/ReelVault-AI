"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndSaveEmbedding = exports.processReelMetadata = void 0;
const gemini_service_1 = require("./gemini.service");
const prisma_1 = __importDefault(require("../lib/prisma")); // Force IDE refresh
const prompts_1 = require("../prompts");
const genai_1 = require("@google/genai");
const processReelMetadata = async (reelId, content) => {
    const startTime = Date.now();
    const prompt = (0, prompts_1.getPrompt)('metadata', { content });
    try {
        const response = await gemini_service_1.gemini.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        summary: { type: genai_1.Type.STRING },
                        difficulty: { type: genai_1.Type.STRING },
                        estimatedTime: { type: genai_1.Type.INTEGER },
                        keyTakeaways: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        actionItems: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        technologies: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        frameworks: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        tools: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        tags: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        category: { type: genai_1.Type.STRING },
                        topics: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        learningPoints: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        importantQuotes: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        sentiment: { type: genai_1.Type.STRING },
                        searchKeywords: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        confidenceScore: { type: genai_1.Type.NUMBER }
                    }
                }
            }
        });
        const output = response.text || "{}";
        const parsed = JSON.parse(output);
        // Fetch the reel to get the userId for collections
        const reel = await prisma_1.default.reel.findUnique({ where: { id: reelId } });
        if (!reel)
            throw new Error("Reel not found during processing");
        // Find or create category if returned
        let categoryId;
        if (parsed.category) {
            const categoryName = parsed.category.trim();
            const category = await prisma_1.default.category.upsert({
                where: { name: categoryName },
                create: { name: categoryName },
                update: {},
            });
            categoryId = category.id;
            // AI Collections: Automatically place reel in a user collection matching the category
            let collection = await prisma_1.default.collection.findFirst({
                where: { userId: reel.userId, name: categoryName }
            });
            if (!collection) {
                collection = await prisma_1.default.collection.create({
                    data: { name: categoryName, userId: reel.userId }
                });
            }
            await prisma_1.default.reelCollection.upsert({
                where: {
                    reelId_collectionId: { reelId, collectionId: collection.id }
                },
                create: { reelId, collectionId: collection.id },
                update: {}
            });
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
        // AI AUTO GRAPH: Generate Knowledge Graph Nodes and Edges
        try {
            const userId = reel.userId;
            const db = prisma_1.default;
            const reelNode = await db.graphNode.create({
                data: {
                    userId,
                    type: 'reel',
                    name: updatedReel.title || 'Untitled',
                    summary: updatedReel.aiSummary,
                    size: 1.5,
                    reelId: updatedReel.id
                }
            });
            const upsertRelated = async (type, name, rel) => {
                const targetNode = await db.graphNode.upsert({
                    where: { userId_type_name: { userId, type, name } },
                    create: { userId, type, name, size: 1.0 },
                    update: { size: { increment: 0.2 } }
                });
                await db.graphEdge.upsert({
                    where: { sourceId_targetId_relationshipType: { sourceId: reelNode.id, targetId: targetNode.id, relationshipType: rel } },
                    create: { sourceId: reelNode.id, targetId: targetNode.id, relationshipType: rel },
                    update: {}
                });
            };
            if (updatedReel.creator)
                await upsertRelated('creator', updatedReel.creator, 'created_by');
            for (const t of parsed.tags || [])
                await upsertRelated('tag', t, 'has_tag');
            if (parsed.category)
                await upsertRelated('collection', parsed.category.trim(), 'in_collection');
            for (const t of parsed.topics || [])
                await upsertRelated('topic', t, 'covers_topic');
            for (const t of parsed.technologies || [])
                await upsertRelated('technology', t, 'uses_tech');
            for (const f of parsed.frameworks || [])
                await upsertRelated('framework', f, 'uses_framework');
        }
        catch (graphErr) {
            console.error("Graph Node Auto-generation Error:", graphErr);
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
    try {
        const response = await gemini_service_1.gemini.models.embedContent({
            model: 'gemini-embedding-2',
            contents: textToEmbed,
            config: { outputDimensionality: 768 }
        });
        const embedding = response.embeddings?.[0]?.values;
        if (embedding && embedding.length === 768) {
            const vectorString = '[' + embedding.join(',') + ']';
            await prisma_1.default.$executeRawUnsafe(`UPDATE "Reel" SET embedding = $1::vector WHERE id = $2`, vectorString, reelId);
            console.log(`Successfully saved embedding for reel ${reelId}`);
        }
        else {
            console.error("Invalid embedding returned from Gemini");
        }
    }
    catch (error) {
        console.error("Embedding Error:", error);
        throw error;
    }
};
exports.generateAndSaveEmbedding = generateAndSaveEmbedding;
