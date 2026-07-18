import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const chatWithVault: (req: AuthRequest & {
    reqId?: string;
}, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getChatSessions: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getChatHistory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
