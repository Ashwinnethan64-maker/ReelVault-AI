import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { getTags, createTag, updateTag, deleteTag, mergeTags } from '../controllers/tags.controller';

const router = Router();

router.use(protect);

router.route('/').get(getTags).post(createTag);
router.post('/merge', mergeTags);
router.route('/:id').put(updateTag).delete(deleteTag);

export default router;
