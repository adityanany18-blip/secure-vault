import { Router } from 'express';
import { getAuditLogs, getAuditStats } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), getAuditLogs);
router.get('/stats', authenticate, requireRole('ADMIN'), getAuditStats);

export default router;

