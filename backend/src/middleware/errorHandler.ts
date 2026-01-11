import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse } from '../types';

/**
 * HTTP status code mapping for error types.
 */
const ERROR_STATUS_CODES: Record<string, number> = {
  VALIDATION_ERROR: 400,
  PARSE_ERROR: 400,
  NOT_FOUND: 404,
  DATABASE_ERROR: 500,
  DATABASE_CONNECTION_ERROR: 503,
  INTERNAL_ERROR: 500,
};

/**
 * User-friendly error messages for common error codes.
 */
const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'The request contains invalid data',
  PARSE_ERROR: 'Unable to parse request body',
  NOT_FOUND: 'The requested resource was not found',
  DATABASE_ERROR: 'A database error occurred',
  DATABASE_CONNECTION_ERROR: 'Unable to connect to the database',
  INTERNAL_ERROR: 'An unexpected error occurred',
};

/**
 * Determines if an error is an operational error (expected) vs programming error.
 */
function isOperationalError(error: unknown): error is AppError {
  return error instanceof AppError && error.isOperational;
}

/**
 * Creates a standardized error response.
 */
function createErrorResponse(
  message: string,
  code: string,
  details?: Record<string, string>
): ErrorResponse {
  return {
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handles JSON parsing errors from express.json() middleware.
 */
function handleSyntaxError(err: SyntaxError & { status?: number }): ErrorResponse {
  return createErrorResponse(
    'Invalid JSON in request body',
    'PARSE_ERROR',
    { body: 'Request body must be valid JSON' }
  );
}

/**
 * Centralized error handler middleware.
 * Catches all errors and returns appropriate HTTP responses.
 * Never crashes on malformed input.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging (but not in production for security)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    const response = handleSyntaxError(err as SyntaxError & { status: number });
    res.status(400).json(response);
    return;
  }

  // Handle operational errors (AppError)
  if (isOperationalError(err)) {
    const response = createErrorResponse(
      err.message,
      err.code,
      undefined
    );
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unknown errors - don't expose internal details
  const response = createErrorResponse(
    ERROR_MESSAGES.INTERNAL_ERROR,
    'INTERNAL_ERROR',
    process.env.NODE_ENV !== 'production' 
      ? { message: err.message } 
      : undefined
  );
  res.status(500).json(response);
}

/**
 * Middleware to handle 404 Not Found for unmatched routes.
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const response = createErrorResponse(
    `Route not found: ${req.method} ${req.path}`,
    'NOT_FOUND',
    { path: req.path, method: req.method }
  );
  res.status(404).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers.
 * Prevents unhandled promise rejections from crashing the server.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
