import { Router } from 'express';
import {
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);

export default router;

