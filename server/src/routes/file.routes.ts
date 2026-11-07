import { Router } from 'express';
import multer from 'multer';
import {
  deleteFile,
  downloadFile,
  getFile,
  getFiles,
  previewFile,
  updateFile,
  uploadFile,
  uploadNewVersion,
} from '../controllers/file.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireFilePermission } from '../middleware/rbac.middleware';
import { config } from '../config/environment';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeBytes,
  },
});

router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.get('/', authenticate, getFiles);
router.get('/:id', authenticate, requireFilePermission('READ'), getFile);
router.get('/:id/download', authenticate, requireFilePermission('DOWNLOAD'), downloadFile);
router.get('/:id/preview', authenticate, requireFilePermission('READ'), previewFile);
router.patch('/:id', authenticate, requireFilePermission('UPDATE'), updateFile);
router.post(
  '/:id/versions',
  authenticate,
  requireFilePermission('UPDATE'),
  upload.single('file'),
  uploadNewVersion
);
router.delete('/:id', authenticate, requireFilePermission('DELETE'), deleteFile);

export default router;

