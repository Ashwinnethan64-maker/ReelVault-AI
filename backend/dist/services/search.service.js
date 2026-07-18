"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendations = exports.semanticSearch = void 0;
const semanticSearch = async (userId, query, limit = 10) => {
    console.log("Semantic search skipped. Embeddings are pending Gemini integration.");
    return [];
};
exports.semanticSearch = semanticSearch;
const getRecommendations = async (reelId, limit = 5) => {
    console.log("Recommendations skipped. Embeddings are pending Gemini integration.");
    return [];
};
exports.getRecommendations = getRecommendations;
