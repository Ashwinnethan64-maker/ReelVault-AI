"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    const reqId = req.reqId || 'UNKNOWN_REQ';
    const status = err.status || 500;
    logger_1.logger.error(`[REQ ${reqId}] ERROR ${status}: ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    if (err.stack) {
        logger_1.logger.error(`[REQ ${reqId}] STACK: ${err.stack}`);
    }
    if (err.cause) {
        logger_1.logger.error(`[REQ ${reqId}] CAUSE: ${err.cause}`);
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
exports.errorHandler = errorHandler;
class AppError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
