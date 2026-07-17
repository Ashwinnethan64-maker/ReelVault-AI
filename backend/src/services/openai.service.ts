import OpenAI from 'openai';
import { env } from '../config/env';

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY || 'mock-key-for-dev',
});

export const generateReelSummary = async (content: string) => {
  // Mock implementation ready to be connected
  return "AI generated summary implementation goes here.";
};
