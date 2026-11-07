import { Router } from 'express';
import {
  createUser,
  getDashboardStats,
  getUsers,
  updateUser,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.get('/dashboard-stats', authenticate, getDashboardStats);
router.get('/', authenticate, requireRole('ADMIN'), getUsers);
router.post('/', authenticate, requireRole('ADMIN'), createUser);
router.patch('/:id', authenticate, requireRole('ADMIN'), updateUser);

export default router;

