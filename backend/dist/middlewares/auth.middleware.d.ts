import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
    };
}
export declare const protect: (req: AuthRequest & {
    reqId?: string;
}, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
