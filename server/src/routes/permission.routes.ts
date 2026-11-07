import { Router } from 'express';
import {
  getFilePermissions,
  grantPermission,
  revokePermission,
} from '../controllers/permission.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/:fileId', authenticate, getFilePermissions);
router.post('/', authenticate, grantPermission);
router.delete('/:fileId/:userId', authenticate, revokePermission);

export default router;

