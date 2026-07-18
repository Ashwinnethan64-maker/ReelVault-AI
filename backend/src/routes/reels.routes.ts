import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { getReels, createReel, getReelById, updateReel, deleteReel, restoreReel } from '../controllers/reels.controller';

const router = Router();

router.route('/')
  .get(protect, getReels)
  .post(protect, createReel);

router.route('/:id')
  .get(protect, getReelById)
  .patch(protect, updateReel)
  .delete(protect, deleteReel);

router.post('/:id/restore', protect, restoreReel);

export default router;
