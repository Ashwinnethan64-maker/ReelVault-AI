import { Router } from 'express';
import { chatWithVault, getChatSessions, getChatHistory } from '../controllers/chat.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', chatWithVault);
router.get('/sessions', getChatSessions);
router.get('/sessions/:sessionId', getChatHistory);

export default router;
