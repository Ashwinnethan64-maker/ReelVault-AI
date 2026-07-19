import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getTimeline: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
