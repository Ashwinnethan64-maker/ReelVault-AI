"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithNode = exports.searchGraph = exports.syncGraph = exports.getKnowledgeGraph = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const gemini_service_1 = require("../services/gemini.service");
const getKnowledgeGraph = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const dbNodes = await prisma_1.default.graphNode.findMany({ where: { userId } });
        const dbEdges = await prisma_1.default.graphEdge.findMany({
            where: { source: { userId } }
        });
        const nodes = dbNodes.map((n) => ({
            id: n.id,
            name: n.name,
            type: n.type,
            val: n.size,
            summary: n.summary,
            url: n.type === 'reel' ? undefined : undefined // Optional
        }));
        const links = dbEdges.map((e) => ({
            source: e.sourceId,
            target: e.targetId,
            type: e.relationshipType
        }));
        res.json({ nodes, links });
    }
    catch (error) {
        next(error);
    }
};
exports.getKnowledgeGraph = getKnowledgeGraph;
const syncGraph = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // Wipe existing user graph
        await prisma_1.default.graphNode.deleteMany({ where: { userId } });
        const reels = await prisma_1.default.reel.findMany({
            where: { userId, deletedAt: null },
            include: {
                tags: { include: { tag: true } },
                collections: { include: { collection: true } }
            }
        });
        const nodeCache = new Map(); // key: type_name -> id
        for (const reel of reels) {
            // Create Reel Node
            const reelNode = await prisma_1.default.graphNode.create({
                data: {
                    userId,
                    type: 'reel',
                    name: reel.title || 'Untitled',
                    summary: reel.aiSummary,
                    size: 2.0,
                    reelId: reel.id
                }
            });
            nodeCache.set(`reel_${reel.id}`, reelNode.id);
            const upsertRelated = async (type, name, rel) => {
                const key = `${type}_${name.toLowerCase()}`;
                let targetId = nodeCache.get(key);
                if (!targetId) {
                    const targetNode = await prisma_1.default.graphNode.upsert({
                        where: { userId_type_name: { userId, type, name } },
                        create: { userId, type, name, size: 1.0 },
                        update: { size: { increment: 0.3 } }
                    });
                    targetId = targetNode.id;
                    nodeCache.set(key, targetId);
                }
                await prisma_1.default.graphEdge.upsert({
                    where: { sourceId_targetId_relationshipType: { sourceId: reelNode.id, targetId, relationshipType: rel } },
                    create: { sourceId: reelNode.id, targetId, relationshipType: rel },
                    update: {}
                });
            };
            if (reel.creator)
                await upsertRelated('creator', reel.creator, 'created_by');
            for (const t of reel.tags)
                await upsertRelated('tag', t.tag.name, 'has_tag');
            for (const c of reel.collections)
                await upsertRelated('collection', c.collection.name, 'in_collection');
            for (const t of reel.topics || [])
                await upsertRelated('topic', t, 'covers_topic');
            for (const t of reel.technologies || [])
                await upsertRelated('technology', t, 'uses_tech');
            for (const f of reel.frameworks || [])
                await upsertRelated('framework', f, 'uses_framework');
        }
        res.json({ message: 'Graph fully synced!' });
    }
    catch (error) {
        next(error);
    }
};
exports.syncGraph = syncGraph;
const searchGraph = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { q } = req.query;
        if (!q)
            return res.json([]);
        const nodes = await prisma_1.default.graphNode.findMany({
            where: {
                userId,
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { summary: { contains: q, mode: 'insensitive' } }
                ]
            },
            take: 10
        });
        res.json(nodes);
    }
    catch (error) {
        next(error);
    }
};
exports.searchGraph = searchGraph;
const chatWithNode = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const id = req.params.id;
        const { messages } = req.body;
        const node = await prisma_1.default.graphNode.findUnique({ where: { id } });
        if (!node || node.userId !== userId) {
            return res.status(404).json({ message: 'Node not found' });
        }
        let context = `Node Name: ${node.name}\nNode Type: ${node.type}\n`;
        if (node.summary)
            context += `Summary: ${node.summary}\n`;
        const relatedEdges = await prisma_1.default.graphEdge.findMany({
            where: { targetId: id },
            include: { source: true }
        });
        const relatedReels = relatedEdges.filter((e) => e.source.type === 'reel').slice(0, 5);
        if (relatedReels.length > 0) {
            context += `\nRelated Saved Reels in Vault:\n` + relatedReels.map((e) => `- ${e.source.name} (Summary: ${e.source.summary || 'None'})`).join('\n');
        }
        const systemPrompt = `You are a knowledgeable AI teaching the user about the topic "${node.name}".
Use this context from their knowledge graph:
${context}

Your goal is to explain this concept thoroughly based on their saved reels, and supplement with your own knowledge if necessary. Be helpful, educational, and conversational. Use markdown.`;
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
            res.write(`data: ${JSON.stringify({ content: '\n\n⚠️ Failed to connect to AI.' })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            return res.end();
        }
        next(error);
    }
};
exports.chatWithNode = chatWithNode;
