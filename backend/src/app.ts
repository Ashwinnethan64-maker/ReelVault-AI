import './config/env';
import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

import authRoutes from './routes/auth.routes';
import reelRoutes from './routes/reels.routes';
import collectionRoutes from './routes/collections.routes';
import tagRoutes from './routes/tags.routes';
import chatRoutes from './routes/chat.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

// Security Middlewares
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
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
app.use(cors(corsOptions));

// Request ID Middleware
app.use((req: Request & { reqId?: string }, res: Response, next: NextFunction) => {
  req.reqId = randomUUID();
  res.setHeader('X-Request-Id', req.reqId);
  next();
});

// Advanced Logging Middleware
app.use((req: Request & { reqId?: string }, res: Response, next: NextFunction) => {
  logger.info(`[REQ ${req.reqId}] ${req.method} ${req.url} - IP: ${req.ip}`);
  if (Object.keys(req.body || {}).length > 0) {
    // Clone and sanitize body for logging (don't log raw passwords)
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '***';
    logger.debug(`[REQ ${req.reqId}] Body: ${JSON.stringify(logBody)}`);
  }
  next();
});

// Body Parsing
app.use(express.json({ limit: '1mb' })); // Prevent large payload attacks

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
