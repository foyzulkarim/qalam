import { Request, Response, NextFunction } from 'express';
import type { ApiError, ApiErrorCode } from '@qalam/shared';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export class AppError extends Error {
  constructor(
    public code: ApiErrorCode,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiError>,
  _next: NextFunction
): void {
  logger.error('Error occurred', {
    name: err.name,
    message: err.message,
    stack: config.isDevelopment() ? err.stack : undefined,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Default to internal error for unknown errors
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isDevelopment() ? err.message : 'An unexpected error occurred',
    },
  });
}

// Helper functions to throw common errors
export function notFound(message = 'Resource not found'): never {
  throw new AppError('NOT_FOUND', 404, message);
}

export function unauthorized(message = 'Unauthorized'): never {
  throw new AppError('UNAUTHORIZED', 401, message);
}

export function forbidden(message = 'Forbidden'): never {
  throw new AppError('FORBIDDEN', 403, message);
}

export function badRequest(message: string, details?: Record<string, unknown>): never {
  throw new AppError('VALIDATION_ERROR', 400, message, details);
}

export function conflict(message: string): never {
  throw new AppError('CONFLICT', 409, message);
}

export function llmUnavailable(message = 'LLM service is unavailable'): never {
  throw new AppError('LLM_UNAVAILABLE', 503, message);
}
