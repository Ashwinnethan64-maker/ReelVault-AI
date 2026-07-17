import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

import authRoutes from './routes/auth.routes';
import reelRoutes from './routes/reels.routes';

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
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

// Logging Middleware
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Body Parsing
app.use(express.json({ limit: '1mb' })); // Prevent large payload attacks

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reels', reelRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
