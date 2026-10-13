import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export const requestId: RequestHandler = (request, response, next) => {
  const incomingRequestId = request.header('X-Request-Id');
  const trimmedRequestId = incomingRequestId?.trim();
  const id =
    trimmedRequestId && /^[A-Za-z0-9._:-]{1,128}$/.test(trimmedRequestId)
      ? trimmedRequestId
      : randomUUID();

  response.locals.requestId = id;
  response.setHeader('X-Request-Id', id);
  next();
};
