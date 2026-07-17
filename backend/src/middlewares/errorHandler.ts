import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  const status = err.status || 500;
  
  // Do not expose internal server errors to the client in production
  const message = process.env.NODE_ENV === 'production' && status === 500 
    ? 'Internal Server Error' 
    : err.message || 'Something went wrong';

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    }
  });
};

export class AppError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}
