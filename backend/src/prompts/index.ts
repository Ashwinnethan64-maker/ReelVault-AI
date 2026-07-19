import { REEL_METADATA_PROMPT, AI_CHAT_SYSTEM_PROMPT, FLASHCARD_PROMPT, QUIZ_PROMPT } from './templates';
import prisma from '../lib/prisma';

export const getPrompt = (templateName: 'metadata' | 'chat' | 'flashcard' | 'quiz', variables: Record<string, string>) => {
  let template = REEL_METADATA_PROMPT;
  if (templateName === 'chat') template = AI_CHAT_SYSTEM_PROMPT;
  if (templateName === 'flashcard') template = FLASHCARD_PROMPT;
  if (templateName === 'quiz') template = QUIZ_PROMPT;
  
  for (const [key, value] of Object.entries(variables)) {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return template;
};

export const logPrompt = async (
  userId: string | undefined, 
  promptName: string, 
  version: string, 
  input: string, 
  output: string, 
  tokensUsed: number, 
  durationMs: number
) => {
  try {
    await prisma.promptLog.create({
      data: {
        userId,
        promptName,
        version,
        input,
        output,
        tokensUsed,
        durationMs,
        success: true
      }
    });
  } catch (error) {
    console.error("Failed to log prompt:", error);
  }
};
