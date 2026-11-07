import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { accessControlService } from '../services/AccessControlService';

const grantPermissionSchema = z.object({
  userId: z.string().min(1, 'Target user ID is required'),
  fileId: z.string().min(1, 'File ID is required'),
  canRead: z.boolean().optional(),
  canDownload: z.boolean().optional(),
  canUpdate: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canShare: z.boolean().optional(),
  canManagePermissions: z.boolean().optional(),
});

export const getFilePermissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fileId = req.params.fileId as string;
    const permissions = await accessControlService.getFilePermissions(req.user!.id, fileId);

    res.status(200).json({
      success: true,
      data: { permissions },
    });
  } catch (error) {
    next(error);
  }
};

export const grantPermission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = grantPermissionSchema.parse(req.body);

    const permission = await accessControlService.grantPermission(
      req.user!.id,
      validated.userId,
      validated.fileId,
      {
        canRead: validated.canRead,
        canDownload: validated.canDownload,
        canUpdate: validated.canUpdate,
        canDelete: validated.canDelete,
        canShare: validated.canShare,
        canManagePermissions: validated.canManagePermissions,
      }
    );

    res.status(200).json({
      success: true,
      message: 'File permissions updated successfully.',
      data: { permission },
    });
  } catch (error) {
    next(error);
  }
};

export const revokePermission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fileId = req.params.fileId as string;
    const userId = req.params.userId as string;

    await accessControlService.revokePermission(req.user!.id, userId, fileId);

    res.status(200).json({
      success: true,
      message: 'Permission revoked successfully.',
    });
  } catch (error) {
    next(error);
  }
};
