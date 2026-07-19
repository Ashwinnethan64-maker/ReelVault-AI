"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env");
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorHandler_1 = require("./middlewares/errorHandler");
const logger_1 = require("./utils/logger");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const reels_routes_1 = __importDefault(require("./routes/reels.routes"));
const collections_routes_1 = __importDefault(require("./routes/collections.routes"));
const tags_routes_1 = __importDefault(require("./routes/tags.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const notes_routes_1 = __importDefault(require("./routes/notes.routes"));
const study_routes_1 = __importDefault(require("./routes/study.routes"));
const timeline_routes_1 = __importDefault(require("./routes/timeline.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const export_routes_1 = __importDefault(require("./routes/export.routes"));
const graph_routes_1 = __importDefault(require("./routes/graph.routes"));
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { message: 'Too many requests, please try again later.' } }
});
app.use('/api', limiter);
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : [/^http:\/\/localhost:\d+$/], // Allow all local ports for dev
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
// Request ID Middleware
app.use((req, res, next) => {
    req.reqId = (0, crypto_1.randomUUID)();
    res.setHeader('X-Request-Id', req.reqId);
    next();
});
// Advanced Logging Middleware
app.use((req, res, next) => {
    logger_1.logger.info(`[REQ ${req.reqId}] ${req.method} ${req.url} - IP: ${req.ip}`);
    if (Object.keys(req.body || {}).length > 0) {
        // Clone and sanitize body for logging (don't log raw passwords)
        const logBody = { ...req.body };
        if (logBody.password)
            logBody.password = '***';
        logger_1.logger.debug(`[REQ ${req.reqId}] Body: ${JSON.stringify(logBody)}`);
    }
    next();
});
// Body Parsing
app.use(express_1.default.json({ limit: '1mb' })); // Prevent large payload attacks
// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/reels', reels_routes_1.default);
app.use('/api/collections', collections_routes_1.default);
app.use('/api/tags', tags_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/notes', notes_routes_1.default);
app.use('/api/study', study_routes_1.default);
app.use('/api/timeline', timeline_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/export', export_routes_1.default);
app.use('/api/graph', graph_routes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
