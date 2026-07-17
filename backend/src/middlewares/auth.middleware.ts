import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Retrieve user from Supabase using the Bearer token
      // This cryptographically verifies the token signature on Supabase's end
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.error("Supabase JWT Verification Error:", error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }

      req.user = {
        id: user.id,
        email: user.email,
      };

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
