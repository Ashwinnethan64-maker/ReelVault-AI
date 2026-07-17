"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithVault = void 0;
const openai_service_1 = require("./openai.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const prompts_1 = require("../prompts");
const search_service_1 = require("./search.service");
const chatWithVault = async (userId, sessionId, message) => {
    const startTime = Date.now();
    // 1. Find relevant reels from the vault to use as RAG context
    const searchResults = await (0, search_service_1.semanticSearch)(userId, message, 5);
    const contextText = searchResults.map((r) => `Title: ${r.title}\nURL: ${r.url}\nSummary: ${r.aiSummary}`).join('\n\n');
    const systemPrompt = (0, prompts_1.getPrompt)('chat', { context: contextText });
    // 2. Load previous chat history
    let session = await prisma_1.default.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    if (!session) {
        session = await prisma_1.default.chatSession.create({
            data: { id: sessionId, userId, title: message.substring(0, 30) },
            include: { messages: true }
        });
    }
    // 3. Save user message
    await prisma_1.default.chatMessage.create({
        data: {
            sessionId,
            role: 'user',
            content: message,
        }
    });
    const chatHistory = session.messages.map(m => ({
        role: m.role,
        content: m.content
    }));
    // 4. Generate AI response
    try {
        const response = await openai_service_1.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                ...chatHistory,
                { role: "user", content: message }
            ],
        });
        const output = response.choices[0].message.content || "";
        // 5. Save assistant message
        const sourceIds = searchResults.map((r) => r.id);
        await prisma_1.default.chatMessage.create({
            data: {
                sessionId,
                role: 'assistant',
                content: output,
                sources: sourceIds,
            }
        });
        // Log prompt usage
        await (0, prompts_1.logPrompt)(userId, 'AI_CHAT_SYSTEM_PROMPT', 'v1', message, output, response.usage?.total_tokens || 0, Date.now() - startTime);
        return { reply: output, sources: searchResults };
    }
    catch (error) {
        console.error("AI Chat Error:", error);
        throw new Error("Failed to generate response.");
    }
};
exports.chatWithVault = chatWithVault;
