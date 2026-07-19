import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../lib/prisma';
import { gemini } from '../services/gemini.service';
import { semanticSearch } from '../services/search.service';
import { env } from '../config/env';
import { getPrompt, logPrompt } from '../prompts';

// Get or create a session, then chat with RAG
export const chatWithVault = async (req: AuthRequest & { reqId?: string }, res: Response, next: NextFunction) => {
  const reqId = req.reqId || 'UNKNOWN_REQ';
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { messages, sessionId } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const lastMessage = messages[messages.length - 1].content as string;

    // 1. Get or create session
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
    }
    if (!session) {
      session = await prisma.chatSession.create({
        data: { userId, title: lastMessage.slice(0, 60) }
      });
    }

    // 2. Persist the user message
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content: lastMessage, sources: [] }
    });

    // 3. Perform semantic search (RAG)
    const semanticResults = await semanticSearch(userId, lastMessage, 5) as Array<{ id: string, title: string | null, aiSummary: string | null, url: string, keyTakeaways?: string[] }>;
    
    // 4. Text-based fallback search for reels
    const textSearchResults = await prisma.reel.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { title: { contains: lastMessage.split(' ').slice(0, 3).join(' '), mode: 'insensitive' } },
          { aiSummary: { contains: lastMessage.split(' ')[0], mode: 'insensitive' } },
        ]
      },
      take: 3,
      select: { id: true, title: true, aiSummary: true, keyTakeaways: true, url: true }
    });

    // Merge results, deduplicate by id
    const allResults = [...semanticResults, ...textSearchResults].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i).slice(0, 5);
    const sourceReelIds = allResults.map(r => r.id);

    let contextStr = '';
    if (allResults.length > 0) {
      contextStr = allResults.map(r =>
        `Reel Title: ${r.title || 'Untitled'}\nURL: ${r.url}\nSummary: ${r.aiSummary || 'No summary yet'}\nKey Takeaways: ${(r.keyTakeaways || []).join(', ')}`
      ).join('\n\n---\n\n');
    } else {
      contextStr = "No relevant reels found in the user's vault.";
    }

    const systemPrompt = getPrompt('chat', { context: contextStr });

    // 7. Stream from Gemini
    const startTime = Date.now();
    
    // Map messages array to Gemini format
    const geminiMessages = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const responseStream = await gemini.models.generateContentStream({
      model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
      contents: geminiMessages,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Send session ID back to client immediately so it can persist it
    res.write(`data: ${JSON.stringify({ sessionId: session.id })}\n\n`);

    let fullAssistantContent = '';

    for await (const chunk of responseStream) {
      const content = chunk.text || '';
      if (content) {
        fullAssistantContent += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

    // 8. Persist assistant message asynchronously (non-blocking)
    prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: fullAssistantContent,
        sources: sourceReelIds
      }
    }).catch(err => console.error('Failed to persist assistant message:', err));

    // 9. Log prompt usage
    logPrompt(userId, 'AI_CHAT', 'v1', lastMessage, fullAssistantContent, 0, Date.now() - startTime)
      .catch(() => {});

  } catch (error: any) {
    console.error(`[REQ ${reqId}] Chat RAG Error:`, error);
    
    // If it's a streaming error after headers sent, we just end the stream
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ content: '\n\n⚠️ Looks like something went wrong while processing that request. Let\'s try again.' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }
    
    // Send friendly error message immediately if headers aren't sent
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ content: '⚠️ Looks like something went wrong while processing that request. Let\'s try again.' })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
};

// Get chat history for a session
export const getChatSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { id: true, title: true, updatedAt: true }
    });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const sessionId = req.params.sessionId as string;
    const session = await prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: sessionId },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ session, messages });
  } catch (error) {
    next(error);
  }
};
