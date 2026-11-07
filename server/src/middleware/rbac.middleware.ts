import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { GranularPermission, RoleType } from '../interfaces/IPermission';
import { accessControlService } from '../services/AccessControlService';
import { auditLogService } from '../services/AuditLogService';

/**
 * Ensures the authenticated user has at least one of the permitted organizational roles.
 */
export const requireRole = (...allowedRoles: RoleType[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.domainUser) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const currentRole = req.user.role.toUpperCase() as RoleType;
    if (!allowedRoles.includes(currentRole)) {
      auditLogService.log({
        actorId: req.user.id,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        result: 'DENIED',
        metadata: {
          path: req.originalUrl,
          userRole: currentRole,
          requiredRoles: allowedRoles,
        },
      });

      res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role authority.`,
      });
      return;
    }

    next();
  };
};

/**
 * Enforces granular, deny-by-default file permission check before controller execution.
 */
export const requireFilePermission = (action: GranularPermission) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated.' });
        return;
      }

      const fileId = req.params.id || req.body.fileId;
      if (!fileId) {
        res.status(400).json({ success: false, message: 'File identifier is required.' });
        return;
      }

      const evalResult = await accessControlService.evaluateFileAccess(
        req.user.id,
        fileId,
        action
      );

      if (!evalResult.allowed) {
        await auditLogService.log({
          actorId: req.user.id,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          fileId,
          result: 'DENIED',
          metadata: {
            attemptedAction: action,
            reason: evalResult.reason,
            path: req.originalUrl,
          },
        });

        res.status(403).json({
          success: false,
          message: evalResult.reason || 'Forbidden: Insufficient permissions for this file.',
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Authorization error.' });
    }
  };
};

