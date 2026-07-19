import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { getKnowledgeGraph, searchGraph, chatWithNode, syncGraph } from '../controllers/graph.controller';

const router = Router();

router.get('/', protect, getKnowledgeGraph);
router.post('/sync', protect, syncGraph);
router.get('/search', protect, searchGraph);
router.post('/node/:id/chat', protect, chatWithNode);

export default router;
