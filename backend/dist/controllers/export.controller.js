"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportVault = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const exportVault = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { format } = req.query; // json, markdown, csv
        const reels = await prisma_1.default.reel.findMany({
            where: { userId, deletedAt: null },
            include: {
                category: true,
                tags: { include: { tag: true } },
                notes: true,
            }
        });
        if (format === 'markdown') {
            let md = `# ReelVault Export\n\n`;
            reels.forEach(r => {
                md += `## [${r.title || 'Untitled Reel'}](${r.url})\n`;
                md += `**Category:** ${r.category?.name || 'Uncategorized'} | **Difficulty:** ${r.difficulty}\n\n`;
                md += `> ${r.aiSummary}\n\n`;
                md += `### Key Takeaways\n`;
                r.keyTakeaways.forEach(k => { md += `- ${k}\n`; });
                if (r.notes.length > 0) {
                    md += `\n### My Notes\n`;
                    r.notes.forEach(n => { md += `${n.content}\n\n`; });
                }
                md += `---\n\n`;
            });
            res.setHeader('Content-Type', 'text/markdown');
            res.attachment('vault-export.md');
            return res.send(md);
        }
        if (format === 'csv') {
            let csv = `ID,Title,URL,Summary,Difficulty,Topics\n`;
            reels.forEach(r => {
                const safeTitle = (r.title || '').replace(/"/g, '""');
                const safeSummary = (r.aiSummary || '').replace(/"/g, '""');
                const topics = r.topics.join(';');
                csv += `"${r.id}","${safeTitle}","${r.url}","${safeSummary}","${r.difficulty}","${topics}"\n`;
            });
            res.setHeader('Content-Type', 'text/csv');
            res.attachment('vault-export.csv');
            return res.send(csv);
        }
        // Default JSON
        res.setHeader('Content-Type', 'application/json');
        res.attachment('vault-export.json');
        res.json({ reels });
    }
    catch (error) {
        next(error);
    }
};
exports.exportVault = exportVault;
