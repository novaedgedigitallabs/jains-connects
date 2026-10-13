import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { AppConfig } from './config/env.js';
import type { AdminStore } from './admin/store.js';
import type { AuthStore } from './auth/store.js';
import type { DatabaseHealth } from './db/database.js';
import type { PublicTempleDirectory } from './directories/temples.js';
import { errorHandler, notFound } from './http/errors.js';
import { requestId } from './http/request-id.js';
import { createHealthRouter } from './routes/health.js';
import { createAuthRouter } from './routes/auth.js';
import { createAdminRouter, createReportRouter } from './routes/admin.js';
import { createTempleRouter } from './routes/temples.js';

export interface AppDependencies {
  database: DatabaseHealth;
  authStore?: AuthStore;
  adminStore?: AdminStore;
  templeDirectory: PublicTempleDirectory;
}

export function createApp(config: AppConfig, dependencies: AppDependencies) {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use((_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Robots-Tag', 'noindex');
    next();
  });
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_request, response) => {
        response.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again shortly.',
            requestId: response.locals.requestId,
          },
        });
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  if (dependencies.authStore) {
    app.use('/api/v1/auth', createAuthRouter(config, dependencies.authStore));
    app.use('/api/v1/admin', createAdminRouter(dependencies.authStore, dependencies.adminStore));
    if (dependencies.adminStore) {
      app.use(
        '/api/v1/reports',
        createReportRouter(dependencies.authStore, dependencies.adminStore),
      );
    }
  }
  app.use('/api/v1/health', createHealthRouter(dependencies.database));
  app.use('/api/v1/temples', createTempleRouter(dependencies.templeDirectory));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
