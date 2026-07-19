import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getKnowledgeGraph: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const syncGraph: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const searchGraph: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const chatWithNode: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
