import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import reelRoutes from './routes/reels.routes';

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reels', reelRoutes);

// Error Handling
app.use(errorHandler);

export default app;
