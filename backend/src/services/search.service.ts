import { openai } from './openai.service';
import prisma from '../lib/prisma';

export const semanticSearch = async (userId: string, query: string, limit = 10) => {
  // 1. Generate embedding for the search query
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  
  const queryVector = embeddingResponse.data[0].embedding;
  
  // 2. Perform vector similarity search using pgvector cosine distance (<=>)
  const results = await prisma.$queryRawUnsafe(`
    SELECT "id", "title", "url", "thumbnail", "aiSummary", 1 - ("embedding" <=> $1::vector) as "similarity"
    FROM "Reel"
    WHERE "userId" = $2 AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> $1::vector
    LIMIT $3
  `, JSON.stringify(queryVector), userId, limit);
  
  return results;
};

export const getRecommendations = async (reelId: string, limit = 5) => {
  const sourceReel = await prisma.reel.findUnique({
    where: { id: reelId },
    select: { userId: true }
  });
  
  if (!sourceReel) return [];

  // Find similar reels using vector distance, excluding the source reel itself
  const results = await prisma.$queryRawUnsafe(`
    SELECT "id", "title", "url", "thumbnail", "aiSummary", 1 - ("embedding" <=> (SELECT "embedding" FROM "Reel" WHERE "id" = $1)) as "similarity"
    FROM "Reel"
    WHERE "userId" = $2 AND "id" != $1 AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> (SELECT "embedding" FROM "Reel" WHERE "id" = $1)
    LIMIT $3
  `, reelId, sourceReel.userId, limit);

  return results;
};
