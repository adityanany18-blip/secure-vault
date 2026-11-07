import { Router } from 'express';
import multer from 'multer';
import {
  decryptData,
  encryptData,
  generateKey,
  getKeyManagementInfo,
} from '../controllers/crypto.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { config } from '../config/environment';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeBytes,
  },
});

// Admin-Only Authorization Barrier on all Crypto routes
router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/key-info', getKeyManagementInfo);
router.post('/generate-key', generateKey);
router.post('/encrypt', upload.single('file'), encryptData);
router.post('/decrypt', upload.single('file'), decryptData);

export default router;

