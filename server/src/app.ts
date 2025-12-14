import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { versesRouter } from './modules/verses/verses.routes.js';
import { evaluateRouter } from './modules/evaluate/evaluate.routes.js';
import { progressRouter } from './modules/progress/progress.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Body parsing
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/surahs', versesRouter);
app.use('/api/evaluate', evaluateRouter);
app.use('/api/progress', progressRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

export { app };
