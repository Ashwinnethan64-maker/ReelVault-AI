import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { exportVault } from '../controllers/export.controller';

const router = Router();

router.get('/', protect, exportVault);

export default router;
