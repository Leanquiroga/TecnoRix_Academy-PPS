import { Request, Response, NextFunction } from 'express';

// Generic error handler that doesn't depend on a specific AppError type
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log full error for server-side debugging
  console.error(err);

  // If the error has a statusCode or status property, use it.
  const statusCode = err && (err.statusCode || err.status) ? (err.statusCode || err.status) : 500;

  // If the error follows a common shape (message + optional errors object), return it
  if (err && (err.message || err.errors)) {
    // Special-case common messages
    const message = typeof err.message === 'string' ? err.message : 'Error interno del servidor';

    if (message.includes('JWT expired') || message.includes('token expired')) {
      return res.status(401).json({ message: 'Token expirado' });
    }

    if (message.includes('Invalid login credentials')) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    return res.status(statusCode).json({
      message,
      errors: err.errors || undefined
    });
  }

  // Fallback
  return res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' && err ? (err.message || err.toString()) : undefined
  });
};