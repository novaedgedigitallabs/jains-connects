import type { ErrorRequestHandler, RequestHandler } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;

  public readonly code: string;

  public constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const notFound: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const requestId = response.locals.requestId;
  const isAppError = error instanceof AppError;
  const isMalformedJson = error instanceof SyntaxError && 'body' in error;
  const isPayloadTooLarge =
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large';
  const statusCode = isAppError
    ? error.statusCode
    : isMalformedJson
      ? 400
      : isPayloadTooLarge
        ? 413
        : 500;
  const code = isAppError
    ? error.code
    : isMalformedJson
      ? 'INVALID_JSON'
      : isPayloadTooLarge
        ? 'PAYLOAD_TOO_LARGE'
        : 'INTERNAL_ERROR';
  const message = isAppError
    ? error.message
    : isMalformedJson
      ? 'Request body must contain valid JSON'
      : isPayloadTooLarge
        ? 'Request body is too large'
        : 'An unexpected error occurred';

  if (statusCode >= 500) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'unhandled_request_error',
        requestId,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      }),
    );
  }

  response.status(statusCode).json({
    error: {
      code,
      message,
      requestId,
    },
  });
};
