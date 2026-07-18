import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addReelToCollection,
  removeReelFromCollection
} from '../controllers/collections.controller';

const router = Router();

router.use(protect);

router.route('/')
  .get(getCollections)
  .post(createCollection);

router.route('/:id')
  .patch(updateCollection)
  .delete(deleteCollection);

router.route('/:id/reels')
  .post(addReelToCollection);

router.route('/:id/reels/:reelId')
  .delete(removeReelFromCollection);

export default router;
