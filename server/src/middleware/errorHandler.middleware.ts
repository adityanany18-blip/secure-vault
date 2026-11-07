import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      message: 'File size exceeds maximum permitted limit.',
    });
    return;
  }

  const statusCode = err.statusCode || (err.message?.includes('Unauthorized') || err.message?.includes('Access denied') ? 403 : 400);

  // Return clean error message without internal stack traces in production
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal error occurred.',
  });
};

