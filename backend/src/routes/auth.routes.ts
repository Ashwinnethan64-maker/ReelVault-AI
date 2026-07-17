import { Router } from 'express';
import { syncUser } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Supabase handles register/login natively.
// The frontend calls this route with the Supabase JWT to sync the user into the backend's database.
router.get('/sync', protect, syncUser);

export default router;
