import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { getReelNotes, createOrUpdateNote } from '../controllers/notes.controller';

const router = Router();

router.route('/:reelId')
  .get(protect, getReelNotes)
  .post(protect, createOrUpdateNote);

export default router;
