import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request & { reqId?: string }, res: Response, next: NextFunction) => {
  const reqId = req.reqId || 'UNKNOWN_REQ';
  const status = err.status || 500;
  
  logger.error(`[REQ ${reqId}] ERROR ${status}: ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (err.stack) {
    logger.error(`[REQ ${reqId}] STACK: ${err.stack}`);
  }
  if (err.cause) {
    logger.error(`[REQ ${reqId}] CAUSE: ${err.cause}`);
  }

  // Do not expose internal server errors to the client in production
  const message = process.env.NODE_ENV === 'production' && status === 500 
    ? 'Internal Server Error' 
    : err.message || 'Something went wrong';

  res.status(status).json({
    success: false,
    error: message,
    reqId,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
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
