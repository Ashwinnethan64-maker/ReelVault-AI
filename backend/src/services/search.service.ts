import { gemini } from './gemini.service';
import prisma from '../lib/prisma';

export const semanticSearch = async (userId: string, query: string, limit = 10) => {
  console.log("Semantic search skipped. Embeddings are pending Gemini integration.");
  return [];
};

export const getRecommendations = async (reelId: string, limit = 5) => {
  console.log("Recommendations skipped. Embeddings are pending Gemini integration.");
  return [];
};
