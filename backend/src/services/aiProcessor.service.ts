import { gemini } from './gemini.service';
import prisma from '../lib/prisma';
import { getPrompt, logPrompt } from '../prompts';

export const processReelMetadata = async (reelId: string, content: string) => {
  const startTime = Date.now();
  const prompt = getPrompt('metadata', { content });
  
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const output = response.text || "{}";
    const parsed = JSON.parse(output);

    // Find or create category if returned
    let categoryId: string | undefined;
    if (parsed.category) {
      const category = await prisma.category.upsert({
        where: { name: parsed.category.trim() },
        create: { name: parsed.category.trim() },
        update: {},
      });
      categoryId = category.id;
    }

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
          const tag = await prisma.tag.upsert({
            where: { name: cleanedName },
            create: { name: cleanedName, color: '#818cf8' },
            update: {},
          });

          await prisma.reelTag.upsert({
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
      await generateAndSaveEmbedding(reelId, (parsed.summary || "") + " " + (parsed.keyTakeaways || []).join(" "));
    } catch (embErr) {
      console.error("Embedding generation failed, skipping but continuing:", embErr);
    }

    await logPrompt(
      updatedReel.userId, 
      'REEL_METADATA_PROMPT', 
      'v1', 
      content, 
      output, 
      0, // tokens used
      Date.now() - startTime
    );

    return updatedReel;
  } catch (error: any) {
    console.error("AI Metadata Generation Error:", error);
    throw error;
  }
};

export const generateAndSaveEmbedding = async (reelId: string, textToEmbed: string) => {
  console.log("Embedding generation is pending Gemini support. Skipping for now.");
};

