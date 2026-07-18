"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReelSummary = exports.gemini = void 0;
const genai_1 = require("@google/genai");
const env_1 = require("../config/env");
exports.gemini = new genai_1.GoogleGenAI({
    apiKey: env_1.env.GEMINI_API_KEY || 'mock-key-for-dev',
});
const generateReelSummary = async (content) => {
    // Mock implementation ready to be connected
    return "AI generated summary implementation goes here.";
};
exports.generateReelSummary = generateReelSummary;
