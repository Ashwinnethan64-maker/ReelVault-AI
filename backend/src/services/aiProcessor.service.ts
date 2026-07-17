import { openai } from './openai.service';
import prisma from '../lib/prisma';
import { getPrompt, logPrompt } from '../prompts';

export const processReelMetadata = async (reelId: string, content: string) => {
  const startTime = Date.now();
  const prompt = getPrompt('metadata', { content });
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const output = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(output);

    // Save extracted metadata back to the reel
    const updatedReel = await prisma.reel.update({
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
    await generateAndSaveEmbedding(reelId, parsed.summary + " " + parsed.keyTakeaways.join(" "));

    await logPrompt(
      updatedReel.userId, 
      'REEL_METADATA_PROMPT', 
      'v1', 
      content, 
      output, 
      response.usage?.total_tokens || 0, 
      Date.now() - startTime
    );

    return updatedReel;
  } catch (error: any) {
    console.error("AI Metadata Generation Error:", error);
    throw error;
  }
};

export const generateAndSaveEmbedding = async (reelId: string, textToEmbed: string) => {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: textToEmbed,
  });
  
  const vector = embeddingResponse.data[0].embedding;
  
  // Use a raw query to update the pgvector field since Prisma raw fields require special casting
  await prisma.$executeRawUnsafe(
    `UPDATE "Reel" SET "embedding" = $1::vector WHERE "id" = $2`,
    JSON.stringify(vector),
    reelId
  );
};

