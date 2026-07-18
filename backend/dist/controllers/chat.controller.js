"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatHistory = exports.getChatSessions = exports.chatWithVault = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const gemini_service_1 = require("../services/gemini.service");
const prompts_1 = require("../prompts");
// Get or create a session, then chat with RAG
const chatWithVault = async (req, res, next) => {
    const reqId = req.reqId || 'UNKNOWN_REQ';
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { messages, sessionId } = req.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: 'Messages array is required' });
        }
        const lastMessage = messages[messages.length - 1].content;
        // 1. Get or create session
        let session;
        if (sessionId) {
            session = await prisma_1.default.chatSession.findFirst({ where: { id: sessionId, userId } });
        }
        if (!session) {
            session = await prisma_1.default.chatSession.create({
                data: { userId, title: lastMessage.slice(0, 60) }
            });
        }
        // 2. Persist the user message
        await prisma_1.default.chatMessage.create({
            data: { sessionId: session.id, role: 'user', content: lastMessage, sources: [] }
        });
        // 3 & 4. Embeddings and pgvector search are pending Gemini integration
        // Skip and fallback to text search only for now.
        // 5. Text-based fallback search for reels
        const textSearchResults = await prisma_1.default.reel.findMany({
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
        // 6. Merge results, deduplicate by id
        const allResults = textSearchResults;
        const sourceReelIds = allResults.map(r => r.id);
        let contextStr = '';
        if (allResults.length > 0) {
            contextStr = allResults.map(r => `Reel Title: ${r.title || 'Untitled'}\nURL: ${r.url}\nSummary: ${r.aiSummary || 'No summary yet'}\nKey Takeaways: ${(r.keyTakeaways || []).join(', ')}`).join('\n\n---\n\n');
        }
        else {
            contextStr = "No relevant reels found in the user's vault.";
        }
        const systemPrompt = (0, prompts_1.getPrompt)('chat', { context: contextStr });
        // 7. Stream from Gemini
        const startTime = Date.now();
        // Map messages array to Gemini format
        const geminiMessages = messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));
        const responseStream = await gemini_service_1.gemini.models.generateContentStream({
            model: 'gemini-3.5-flash',
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
        prisma_1.default.chatMessage.create({
            data: {
                sessionId: session.id,
                role: 'assistant',
                content: fullAssistantContent,
                sources: sourceReelIds
            }
        }).catch(err => console.error('Failed to persist assistant message:', err));
        // 9. Log prompt usage
        (0, prompts_1.logPrompt)(userId, 'AI_CHAT', 'v1', lastMessage, fullAssistantContent, 0, Date.now() - startTime)
            .catch(() => { });
    }
    catch (error) {
        console.error(`[REQ ${reqId}] Chat RAG Error:`, error);
        // If it's a streaming error after headers sent, we just end the stream
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ content: '\n\n⚠️ Connection to AI failed mid-stream.' })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            return res.end();
        }
        // Otherwise pass it to the global error handler
        error.status = error.status || 500;
        error.message = error.message || 'Failed to connect to AI service';
        next(error);
    }
};
exports.chatWithVault = chatWithVault;
// Get chat history for a session
const getChatSessions = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const sessions = await prisma_1.default.chatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: 20,
            select: { id: true, title: true, updatedAt: true }
        });
        res.json(sessions);
    }
    catch (error) {
        next(error);
    }
};
exports.getChatSessions = getChatSessions;
const getChatHistory = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const sessionId = req.params.sessionId;
        const session = await prisma_1.default.chatSession.findFirst({ where: { id: sessionId, userId } });
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        const messages = await prisma_1.default.chatMessage.findMany({
            where: { sessionId: sessionId },
            orderBy: { createdAt: 'asc' }
        });
        res.json({ session, messages });
    }
    catch (error) {
        next(error);
    }
};
exports.getChatHistory = getChatHistory;
