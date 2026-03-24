import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import empresasRoutes from './routes/empresas.js';
import setoresRoutes from './routes/setores.js';
import surveyRoutes from './routes/survey.js';
import analyticsRoutes from './routes/analytics.js';
import reportsRoutes from './routes/reports.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/empresas', empresasRoutes);
app.use('/setores', setoresRoutes);
app.use('/survey', surveyRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/reports', reportsRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global error handler (must be last)
app.use(errorHandler);

export default app;
