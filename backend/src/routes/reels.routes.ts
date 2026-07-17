import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { getReels, createReel, getReelById, deleteReel } from '../controllers/reels.controller';

const router = Router();

router.route('/')
  .get(protect, getReels)
  .post(protect, createReel);

router.route('/:id')
  .get(protect, getReelById)
  .delete(protect, deleteReel);

export default router;
