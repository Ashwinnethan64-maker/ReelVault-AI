import { gemini } from './gemini.service';
import prisma from '../lib/prisma';
import { getPrompt, logPrompt } from '../prompts';
import { semanticSearch } from './search.service';

export const chatWithVault = async (userId: string, sessionId: string, message: string) => {
  const startTime = Date.now();
  
  // 1. Find relevant reels from the vault to use as RAG context
  const searchResults: any = await semanticSearch(userId, message, 5);
  const contextText = searchResults.map((r: any) => 
    `Title: ${r.title}\nURL: ${r.url}\nSummary: ${r.aiSummary}`
  ).join('\n\n');
  
  const systemPrompt = getPrompt('chat', { context: contextText });

  // 2. Load previous chat history
  let session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: { id: sessionId, userId, title: message.substring(0, 30) },
      include: { messages: true }
    });
  }

  // 3. Save user message
  await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'user',
      content: message,
    }
  });

  const chatHistory = session.messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  // 4. Generate AI response
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemPrompt,
      }
    });

    const output = response.text || "";
    
    // 5. Save assistant message
    const sourceIds = searchResults.map((r: any) => r.id);
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: output,
        sources: sourceIds,
      }
    });

    // Log prompt usage
    await logPrompt(
      userId, 
      'AI_CHAT_SYSTEM_PROMPT', 
      'v1', 
      message, 
      output, 
      0, 
      Date.now() - startTime
    );

    return { reply: output, sources: searchResults };
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw new Error("Failed to generate response.");
  }
};

