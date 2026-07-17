import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getReels: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getReelById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createReel: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteReel: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
