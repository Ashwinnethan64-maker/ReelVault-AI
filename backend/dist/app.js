"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorHandler_1 = require("./middlewares/errorHandler");
const logger_1 = require("./utils/logger");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const reels_routes_1 = __importDefault(require("./routes/reels.routes"));
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
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
// Logging Middleware
app.use((0, morgan_1.default)('combined', {
    stream: { write: (message) => logger_1.logger.info(message.trim()) }
}));
// Body Parsing
app.use(express_1.default.json({ limit: '1mb' })); // Prevent large payload attacks
// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/reels', reels_routes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
