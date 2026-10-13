import { Router } from 'express';
import type { DatabaseHealth } from '../db/database.js';

export function createHealthRouter(database: DatabaseHealth): Router {
  const router = Router();

  router.get('/live', (_request, response) => {
    response.status(200).json({
      data: {
        status: 'ok',
        service: 'jainconnect-api',
      },
    });
  });

  router.get('/ready', async (_request, response) => {
    try {
      await database.check();
      response.status(200).json({
        data: {
          status: 'ok',
          service: 'jainconnect-api',
          dependencies: {
            database: 'ok',
          },
        },
      });
    } catch {
      response.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'The service is not ready',
          requestId: response.locals.requestId,
        },
      });
    }
  });

  return router;
}
