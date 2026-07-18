"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const supabase_1 = require("../lib/supabase");
const protect = async (req, res, next) => {
    let token;
    const reqId = req.reqId || 'UNKNOWN_REQ';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // Retrieve user from Supabase using the Bearer token
            // This cryptographically verifies the token signature on Supabase's end
            const { data: { user }, error } = await supabase_1.supabase.auth.getUser(token);
            if (error || !user) {
                console.error(`[REQ ${reqId}] Supabase JWT Verification Error:`, error?.message || 'User null');
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }
            req.user = {
                id: user.id,
                email: user.email,
            };
            next();
        }
        catch (error) {
            console.error(`[REQ ${reqId}] Auth Middleware Exception:`, error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        console.error(`[REQ ${reqId}] Auth Middleware: No token provided in headers`);
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
exports.protect = protect;
