"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithTutor = exports.submitQuiz = exports.generateQuiz = exports.reviewFlashcard = exports.getDueFlashcards = exports.saveFlashcards = exports.generateFlashcards = exports.getDashboardAnalytics = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const gemini_service_1 = require("../services/gemini.service");
const genai_1 = require("@google/genai");
const getDashboardAnalytics = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const totalFlashcards = await prisma_1.default.flashcard.count({ where: { userId } });
        const dueFlashcards = await prisma_1.default.flashcard.count({ where: { userId, nextReviewDate: { lte: new Date() } } });
        const quizzesTaken = await prisma_1.default.quiz.count({ where: { userId } });
        const totalStudySessions = await prisma_1.default.studySession.count({ where: { userId } });
        // Calculate knowledge score (arbitrary metric based on spaced repetition ease factors and quiz scores)
        const cards = await prisma_1.default.flashcard.findMany({ where: { userId }, select: { easeFactor: true, repetitions: true } });
        let knowledgeScore = 0;
        cards.forEach(c => {
            knowledgeScore += c.easeFactor * c.repetitions;
        });
        knowledgeScore = Math.min(Math.round(knowledgeScore), 1000); // max 1000 for display
        res.json({
            knowledgeScore,
            totalFlashcards,
            dueFlashcards,
            quizzesTaken,
            totalStudySessions,
            streak: quizzesTaken + totalStudySessions > 0 ? 3 : 0 // Placeholder logic for streak
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardAnalytics = getDashboardAnalytics;
const generateFlashcards = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { topic } = req.body;
        let reels = [];
        if (topic) {
            reels = await prisma_1.default.reel.findMany({
                where: {
                    userId,
                    deletedAt: null,
                    OR: [
                        { title: { contains: topic, mode: 'insensitive' } },
                        { aiSummary: { contains: topic, mode: 'insensitive' } },
                        { topics: { hasSome: [topic] } }
                    ]
                },
                take: 10
            });
        }
        else {
            reels = await prisma_1.default.$queryRawUnsafe(`
        SELECT id, title, "aiSummary", "keyTakeaways", url 
        FROM "Reel" 
        WHERE "userId" = $1 AND "deletedAt" IS NULL
        ORDER BY RANDOM()
        LIMIT 5;
      `, userId);
        }
        if (!reels || reels.length === 0) {
            return res.status(400).json({ message: "No reels found to generate study materials." });
        }
        const context = reels.map((r) => `Reel ID: ${r.id}\nTitle: ${r.title}\nURL: ${r.url}\nSummary: ${r.aiSummary}\nTakeaways: ${r.keyTakeaways ? r.keyTakeaways.join(', ') : ''}`).join('\n\n');
        const prompt = `You are an expert educator. Based on the following knowledge from the user's saved reels, generate 5 highly effective flashcards for learning. 
For each flashcard, provide the question (front), the concise answer (back), a detailed explanation, the specific topic, a difficulty rating (Easy, Medium, Hard), and the exact Reel URL if applicable.

Knowledge Context:
${context}
`;
        const response = await gemini_service_1.gemini.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        flashcards: {
                            type: genai_1.Type.ARRAY,
                            items: {
                                type: genai_1.Type.OBJECT,
                                properties: {
                                    front: { type: genai_1.Type.STRING },
                                    back: { type: genai_1.Type.STRING },
                                    explanation: { type: genai_1.Type.STRING },
                                    topic: { type: genai_1.Type.STRING },
                                    difficulty: { type: genai_1.Type.STRING },
                                    sourceUrl: { type: genai_1.Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.json(JSON.parse(response.text || "{}"));
    }
    catch (error) {
        next(error);
    }
};
exports.generateFlashcards = generateFlashcards;
const saveFlashcards = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { flashcards } = req.body;
        if (!flashcards || !Array.isArray(flashcards)) {
            return res.status(400).json({ message: "Flashcards array is required" });
        }
        const created = await prisma_1.default.flashcard.createMany({
            data: flashcards.map((f) => ({
                userId,
                front: f.front,
                back: f.back,
                explanation: f.explanation,
                topic: f.topic,
                difficulty: f.difficulty,
                sourceUrl: f.sourceUrl,
                nextReviewDate: new Date(),
                interval: 0,
                easeFactor: 2.5,
                repetitions: 0
            }))
        });
        res.json({ message: `Saved ${created.count} flashcards`, count: created.count });
    }
    catch (error) {
        next(error);
    }
};
exports.saveFlashcards = saveFlashcards;
const getDueFlashcards = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const cards = await prisma_1.default.flashcard.findMany({
            where: {
                userId,
                nextReviewDate: { lte: new Date() }
            },
            take: 30
        });
        res.json(cards);
    }
    catch (error) {
        next(error);
    }
};
exports.getDueFlashcards = getDueFlashcards;
const reviewFlashcard = async (req, res, next) => {
    try {
        const { id, quality } = req.body; // quality: 0-5 (0=Again, 3=Hard, 4=Good, 5=Easy)
        const card = await prisma_1.default.flashcard.findUnique({ where: { id } });
        if (!card || card.userId !== req.user?.id) {
            return res.status(404).json({ message: "Flashcard not found" });
        }
        let { interval, repetitions, easeFactor } = card;
        if (quality >= 3) {
            if (repetitions === 0) {
                interval = 1;
            }
            else if (repetitions === 1) {
                interval = 6;
            }
            else {
                interval = Math.round(interval * easeFactor);
            }
            repetitions += 1;
        }
        else {
            repetitions = 0;
            interval = 1;
        }
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3)
            easeFactor = 1.3;
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);
        const updated = await prisma_1.default.flashcard.update({
            where: { id },
            data: { interval, repetitions, easeFactor, nextReviewDate }
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
};
exports.reviewFlashcard = reviewFlashcard;
const generateQuiz = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { topic } = req.body;
        let reels = [];
        if (topic) {
            reels = await prisma_1.default.reel.findMany({
                where: {
                    userId,
                    deletedAt: null,
                    OR: [{ topics: { hasSome: [topic] } }]
                },
                take: 5
            });
        }
        else {
            reels = await prisma_1.default.$queryRawUnsafe(`
        SELECT id, title, "aiSummary", "keyTakeaways" 
        FROM "Reel" 
        WHERE "userId" = $1 AND "deletedAt" IS NULL
        ORDER BY RANDOM()
        LIMIT 5;
      `, userId);
        }
        const context = reels.map((r) => `Title: ${r.title}\nSummary: ${r.aiSummary}\nTakeaways: ${r.keyTakeaways ? r.keyTakeaways.join(', ') : ''}`).join('\n\n');
        const prompt = `You are an expert educator. Based on the following knowledge from the user's saved reels, generate a 5-question multiple choice quiz. 
For each question, provide the question text, an array of 4 string options, the integer index (0-3) of the correctAnswer, and a detailed explanation of why it is correct.

Knowledge Context:
${context}
`;
        const response = await gemini_service_1.gemini.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        questions: {
                            type: genai_1.Type.ARRAY,
                            items: {
                                type: genai_1.Type.OBJECT,
                                properties: {
                                    question: { type: genai_1.Type.STRING },
                                    options: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                                    correctAnswer: { type: genai_1.Type.INTEGER },
                                    explanation: { type: genai_1.Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.json(JSON.parse(response.text || "{}"));
    }
    catch (error) {
        next(error);
    }
};
exports.generateQuiz = generateQuiz;
const submitQuiz = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { topic, score, total, questions } = req.body;
        const quiz = await prisma_1.default.quiz.create({
            data: {
                userId,
                topic,
                score,
                total,
                questions
            }
        });
        res.json(quiz);
    }
    catch (error) {
        next(error);
    }
};
exports.submitQuiz = submitQuiz;
const chatWithTutor = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { messages } = req.body;
        const systemPrompt = `You are the ReelVault AI Tutor. Unlike a normal assistant, your job is to TEACH.
Do not just give the user the answer. Instead:
- Teach concepts using Socratic questioning.
- Give hints.
- Explain mistakes gracefully.
- Create learning plans.
- Generate examples or interview questions if asked.
- Base your teaching primarily on the concepts the user is asking about.
Be encouraging, educational, and professional. Use markdown for code and formatting.`;
        const geminiMessages = messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));
        const responseStream = await gemini_service_1.gemini.models.generateContentStream({
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
            contents: geminiMessages,
            config: { systemInstruction: systemPrompt }
        });
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        for await (const chunk of responseStream) {
            if (chunk.text)
                res.write(`data: ${JSON.stringify({ content: chunk.text })}\n\n`);
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
    }
    catch (error) {
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ content: '\n\n⚠️ Connection failed.' })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            return res.end();
        }
        next(error);
    }
};
exports.chatWithTutor = chatWithTutor;
