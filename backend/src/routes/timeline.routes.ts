import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { getTimeline } from '../controllers/timeline.controller';

const router = Router();

router.get('/', protect, getTimeline);

export default router;
