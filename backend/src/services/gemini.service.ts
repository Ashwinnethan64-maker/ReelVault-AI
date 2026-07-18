import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

export const gemini = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY || 'mock-key-for-dev',
});

export const generateReelSummary = async (content: string) => {
  // Mock implementation ready to be connected
  return "AI generated summary implementation goes here.";
};
