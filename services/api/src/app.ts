import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { loadServerConfig } from '@x-paycheck/shared';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes/api';
import { accountRouter } from './routes/account';
import { authRouter } from './routes/auth';
import { badgeRouter } from './routes/badge';
import { healthRouter } from './routes/health';
import { payslipRouter } from './routes/payslips';
import { setupLogger } from './utils/logger';

export function createApp(environment: NodeJS.ProcessEnv = process.env) {
  const config = loadServerConfig(environment);
  process.env.NODE_ENV = config.nodeEnv;
  process.env.JWT_SECRET = config.jwtSecret;

  const app = express();
  const logger = setupLogger();
  app.use(helmet());
  app.use(cors({ origin: environment.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true }));
  app.use(compression());
  if (config.nodeEnv !== 'test') {
    app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
  }
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/', rateLimit({
    windowMs: Number(environment.RATE_LIMIT_WINDOW_MS ?? 900_000),
    max: Number(environment.RATE_LIMIT_MAX ?? 100),
    standardHeaders: true,
    legacyHeaders: false,
  }));
  app.use('/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/account', accountRouter);
  app.use('/api/v1/badge', badgeRouter);
  app.use('/api/v1/payslips', payslipRouter);
  app.use('/api/v1', apiRouter);
  app.use(errorHandler);
  return app;
}
