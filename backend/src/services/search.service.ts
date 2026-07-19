import { gemini } from './gemini.service';
import prisma from '../lib/prisma';

export const semanticSearch = async (userId: string, query: string, limit = 10) => {
  try {
    const response = await gemini.models.embedContent({
      model: 'gemini-embedding-2',
      contents: query,
      config: { outputDimensionality: 768 }
    });
    
    const embedding = response.embeddings?.[0]?.values;
    if (!embedding || embedding.length !== 768) {
      throw new Error("Invalid embedding generation");
    }
    
    const vectorString = '[' + embedding.join(',') + ']';
    
    const results = await prisma.$queryRawUnsafe(`
      SELECT id, url, title, "aiSummary", 1 - (embedding <=> $1::vector) as similarity
      FROM "Reel"
      WHERE "userId" = $2 AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $3;
    `, vectorString, userId, limit);
    
    return results;
  } catch (error) {
    console.error("Semantic Search Error:", error);
    return [];
  }
};

export const getRecommendations = async (reelId: string, limit = 5) => {
  try {
    const target = await prisma.$queryRawUnsafe<Array<{ embedding_str: string }>>(`
      SELECT embedding::text as embedding_str
      FROM "Reel"
      WHERE id = $1 AND embedding IS NOT NULL
    `, reelId);

    if (!target || !target[0] || !target[0].embedding_str) {
      return [];
    }
    
    const vectorString = target[0].embedding_str;

    const results = await prisma.$queryRawUnsafe(`
      SELECT id, url, title, "aiSummary", thumbnail, 1 - (embedding <=> $1::vector) as similarity
      FROM "Reel"
      WHERE id != $2 AND "userId" = (SELECT "userId" FROM "Reel" WHERE id = $2) AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $3;
    `, vectorString, reelId, limit);
    
    return results;
  } catch (error) {
    console.error("Recommendation Error:", error);
    return [];
  }
};
