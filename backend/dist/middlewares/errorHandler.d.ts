import { Request, Response, NextFunction } from 'express';
export declare const errorHandler: (err: any, req: Request & {
    reqId?: string;
}, res: Response, next: NextFunction) => void;
export declare class AppError extends Error {
    status: number;
    constructor(message: string, status: number);
}
