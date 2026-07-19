import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { 
  generateFlashcards, 
  saveFlashcards, 
  reviewFlashcard, 
  getDueFlashcards,
  generateQuiz,
  submitQuiz,
  getDashboardAnalytics,
  chatWithTutor
} from '../controllers/study.controller';

const router = Router();

router.get('/dashboard', protect, getDashboardAnalytics);
router.post('/flashcards/generate', protect, generateFlashcards);
router.post('/flashcards/save', protect, saveFlashcards);
router.get('/flashcards/due', protect, getDueFlashcards);
router.post('/flashcards/review', protect, reviewFlashcard);

router.post('/quiz/generate', protect, generateQuiz);
router.post('/quiz/submit', protect, submitQuiz);

router.post('/tutor/chat', protect, chatWithTutor);

export default router;
