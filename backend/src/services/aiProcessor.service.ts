import { gemini } from './gemini.service';
import prisma from '../lib/prisma'; // Force IDE refresh
import { getPrompt, logPrompt } from '../prompts';

import { Type } from '@google/genai';

export const processReelMetadata = async (reelId: string, content: string) => {
  const startTime = Date.now();
  const prompt = getPrompt('metadata', { content });
  
  try {
    const response = await gemini.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            estimatedTime: { type: Type.INTEGER },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
            frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
            tools: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            category: { type: Type.STRING },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } },
            learningPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            importantQuotes: { type: Type.ARRAY, items: { type: Type.STRING } },
            sentiment: { type: Type.STRING },
            searchKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidenceScore: { type: Type.NUMBER }
          }
        }
      }
    });

    const output = response.text || "{}";
    const parsed = JSON.parse(output);

    // Fetch the reel to get the userId for collections
    const reel = await prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel) throw new Error("Reel not found during processing");

    // Find or create category if returned
    let categoryId: string | undefined;
    if (parsed.category) {
      const categoryName = parsed.category.trim();
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        create: { name: categoryName },
        update: {},
      });
      categoryId = category.id;

      // AI Collections: Automatically place reel in a user collection matching the category
      let collection = await prisma.collection.findFirst({
        where: { userId: reel.userId, name: categoryName }
      });
      
      if (!collection) {
        collection = await prisma.collection.create({
          data: { name: categoryName, userId: reel.userId }
        });
      }
      
      await prisma.reelCollection.upsert({
        where: {
          reelId_collectionId: { reelId, collectionId: collection.id }
        },
        create: { reelId, collectionId: collection.id },
        update: {}
      });
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

    // AI AUTO GRAPH: Generate Knowledge Graph Nodes and Edges
    try {
      const userId = reel.userId;
      const db = prisma as any;
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

      const upsertRelated = async (type: string, name: string, rel: string) => {
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

      if (updatedReel.creator) await upsertRelated('creator', updatedReel.creator, 'created_by');
      for (const t of parsed.tags || []) await upsertRelated('tag', t, 'has_tag');
      if (parsed.category) await upsertRelated('collection', parsed.category.trim(), 'in_collection');
      for (const t of parsed.topics || []) await upsertRelated('topic', t, 'covers_topic');
      for (const t of parsed.technologies || []) await upsertRelated('technology', t, 'uses_tech');
      for (const f of parsed.frameworks || []) await upsertRelated('framework', f, 'uses_framework');
    } catch (graphErr) {
      console.error("Graph Node Auto-generation Error:", graphErr);
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
  try {
    const response = await gemini.models.embedContent({
      model: 'gemini-embedding-2',
      contents: textToEmbed,
      config: { outputDimensionality: 768 }
    });
    
    const embedding = response.embeddings?.[0]?.values;
    if (embedding && embedding.length === 768) {
      const vectorString = '[' + embedding.join(',') + ']';
      await prisma.$executeRawUnsafe(`UPDATE "Reel" SET embedding = $1::vector WHERE id = $2`, vectorString, reelId);
      console.log(`Successfully saved embedding for reel ${reelId}`);
    } else {
      console.error("Invalid embedding returned from Gemini");
    }
  } catch (error) {
    console.error("Embedding Error:", error);
    throw error;
  }
};
