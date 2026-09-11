import { Router } from 'express';
import { register, login, getMe, completeOnboarding } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * Public Authentication Routes
 */
router.post('/register', register);
router.post('/login', login);

/**
 * Protected Authentication Routes
 */
router.get('/me', authenticateToken, getMe);
router.post('/complete-onboarding', authenticateToken, completeOnboarding);

export default router;
