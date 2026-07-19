import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { getAnalytics } from '../controllers/analytics.controller';

const router = Router();

router.get('/', protect, getAnalytics);

export default router;
