import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { fileManager } from '../services/FileManager';

export const uploadFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file provided for upload.' });
      return;
    }

    const folder = req.body.folder || 'General';

    const uploaded = await fileManager.uploadFile(
      req.user!.id,
      {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        buffer: req.file.buffer,
        size: req.file.size,
      },
      folder
    );

    res.status(201).json({
      success: true,
      message: 'File encrypted with AES-256-GCM and stored securely in vault.',
      data: { file: uploaded },
    });
  } catch (error) {
    next(error);
  }
};

export const getFiles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { folder, search, filter, page, limit, sortBy, sortOrder } = req.query;

    const result = await fileManager.listFiles(req.user!.id, {
      folder: folder as string,
      search: search as string,
      filter: filter as any,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as any,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fileId = req.params.id as string;
    const file = await fileManager.getFileById(req.user!.id, fileId);

    res.status(200).json({
      success: true,
      data: { file },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fileId = req.params.id as string;
    const decrypted = await fileManager.getDecryptedFileStream(req.user!.id, fileId, 'DOWNLOAD');

    res.setHeader('Content-Type', decrypted.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(decrypted.filename)}"`
    );
    res.setHeader('Content-Length', decrypted.buffer.length);

    res.send(decrypted.buffer);
  } catch (error) {
    next(error);
  }
};

export const previewFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fileId = req.params.id as string;
    const decrypted = await fileManager.getDecryptedFileStream(req.user!.id, fileId, 'READ');

    res.setHeader('Content-Type', decrypted.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(decrypted.filename)}"`
    );
    res.setHeader('Content-Length', decrypted.buffer.length);

    res.send(decrypted.buffer);
  } catch (error) {
    next(error);
  }
};

export const updateFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fileId = req.params.id as string;
    const { originalName, folder } = req.body;

    const updated = await fileManager.updateFileMetadata(req.user!.id, fileId, {
      originalName,
      folder,
    });

    res.status(200).json({
      success: true,
      message: 'File metadata updated successfully.',
      data: { file: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadNewVersion = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fileId = req.params.id as string;
    if (!req.file) {
      res.status(400).json({ success: false, message: 'New file content required.' });
      return;
    }

    await fileManager.uploadNewVersion(req.user!.id, fileId, {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      buffer: req.file.buffer,
      size: req.file.size,
    });

    res.status(200).json({
      success: true,
      message: 'New encrypted file version uploaded and active.',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fileId = req.params.id as string;
    await fileManager.deleteFile(req.user!.id, fileId);

    res.status(200).json({
      success: true,
      message: 'File securely removed from vault.',
    });
  } catch (error) {
    next(error);
  }
};
