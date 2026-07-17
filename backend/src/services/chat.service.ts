import { openai } from './openai.service';
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
    role: m.role as "user" | "assistant",
    content: m.content
  }));

  // 4. Generate AI response
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: message }
      ],
    });

    const output = response.choices[0].message.content || "";
    
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
      response.usage?.total_tokens || 0, 
      Date.now() - startTime
    );

    return { reply: output, sources: searchResults };
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw new Error("Failed to generate response.");
  }
};

