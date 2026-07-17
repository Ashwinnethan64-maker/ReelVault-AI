"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendations = exports.semanticSearch = void 0;
const openai_service_1 = require("./openai.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const semanticSearch = async (userId, query, limit = 10) => {
    // 1. Generate embedding for the search query
    const embeddingResponse = await openai_service_1.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });
    const queryVector = embeddingResponse.data[0].embedding;
    // 2. Perform vector similarity search using pgvector cosine distance (<=>)
    const results = await prisma_1.default.$queryRawUnsafe(`
    SELECT "id", "title", "url", "thumbnail", "aiSummary", 1 - ("embedding" <=> $1::vector) as "similarity"
    FROM "Reel"
    WHERE "userId" = $2 AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> $1::vector
    LIMIT $3
  `, JSON.stringify(queryVector), userId, limit);
    return results;
};
exports.semanticSearch = semanticSearch;
const getRecommendations = async (reelId, limit = 5) => {
    const sourceReel = await prisma_1.default.reel.findUnique({
        where: { id: reelId },
        select: { userId: true }
    });
    if (!sourceReel)
        return [];
    // Find similar reels using vector distance, excluding the source reel itself
    const results = await prisma_1.default.$queryRawUnsafe(`
    SELECT "id", "title", "url", "thumbnail", "aiSummary", 1 - ("embedding" <=> (SELECT "embedding" FROM "Reel" WHERE "id" = $1)) as "similarity"
    FROM "Reel"
    WHERE "userId" = $2 AND "id" != $1 AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> (SELECT "embedding" FROM "Reel" WHERE "id" = $1)
    LIMIT $3
  `, reelId, sourceReel.userId, limit);
    return results;
};
exports.getRecommendations = getRecommendations;
