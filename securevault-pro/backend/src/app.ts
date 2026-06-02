import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import { corsOptions } from './config/cors';
import { globalRateLimiter } from './config/rateLimit';
import { errorHandler } from './middleware/errorHandler.middleware';
import { notFound } from './middleware/notFound.middleware';
import { requestLogger } from './middleware/requestLogger.middleware';

// Module routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import vaultRoutes from './modules/vault/vault.routes';
import expenseRoutes from './modules/expenses/expenses.routes';
import reportRoutes from './modules/reports/reports.routes';
import logRoutes from './modules/logs/logs.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import settingsRoutes from './modules/settings/settings.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';

export function createApp(): Application {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
      },
    },
  }));

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(cors(corsOptions));

  // ── Rate limiting ───────────────────────────────────────────────────────────
  app.use(globalRateLimiter);

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Compression ─────────────────────────────────────────────────────────────
  app.use(compression());

  // ── HTTP logging ────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // ── Request logger ──────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV,
    });
  });

  // ── API v1 routes ───────────────────────────────────────────────────────────
  const apiPrefix = `/api/${process.env.API_VERSION ?? 'v1'}`;

  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/vault`, vaultRoutes);
  app.use(`${apiPrefix}/expenses`, expenseRoutes);
  app.use(`${apiPrefix}/reports`, reportRoutes);
  app.use(`${apiPrefix}/logs`, logRoutes);
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
  app.use(`${apiPrefix}/settings`, settingsRoutes);
  app.use(`${apiPrefix}/notifications`, notificationsRoutes);

  // ── 404 & error handlers ────────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
