"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPrompt = exports.getPrompt = void 0;
const templates_1 = require("./templates");
const prisma_1 = __importDefault(require("../lib/prisma"));
const getPrompt = (templateName, variables) => {
    let template = templateName === 'metadata' ? templates_1.REEL_METADATA_PROMPT : templates_1.AI_CHAT_SYSTEM_PROMPT;
    for (const [key, value] of Object.entries(variables)) {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return template;
};
exports.getPrompt = getPrompt;
const logPrompt = async (userId, promptName, version, input, output, tokensUsed, durationMs) => {
    try {
        await prisma_1.default.promptLog.create({
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
    }
    catch (error) {
        console.error("Failed to log prompt:", error);
    }
};
exports.logPrompt = logPrompt;
