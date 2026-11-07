import prisma from '../config/db';
import {
  GranularPermission,
  IFileAccessEvaluation,
  RoleType,
} from '../interfaces/IPermission';
import { IAccessControlService } from '../interfaces/IAccessControlService';
import { UserFactory } from '../classes/UserFactory';
import { auditLogService } from './AuditLogService';
import { notificationService } from './NotificationService';

export class AccessControlService implements IAccessControlService {
  private static instance: AccessControlService;

  public static getInstance(): AccessControlService {
    if (!AccessControlService.instance) {
      AccessControlService.instance = new AccessControlService();
    }
    return AccessControlService.instance;
  }

  public canRolePerform(role: RoleType, permission: GranularPermission): boolean {
    switch (role) {
      case 'ADMIN':
        return true;
      case 'EDITOR':
        return ['READ', 'DOWNLOAD', 'UPLOAD', 'UPDATE', 'DELETE', 'SHARE'].includes(permission);
      case 'VIEWER':
        return ['READ', 'DOWNLOAD'].includes(permission);
      default:
        return false;
    }
  }

  public async evaluateFileAccess(
    userId: string,
    fileId: string,
    requestedPermission: GranularPermission
  ): Promise<IFileAccessEvaluation> {
    const denyResult: IFileAccessEvaluation = {
      allowed: false,
      effectivePermissions: {
        canRead: false,
        canDownload: false,
        canUpdate: false,
        canDelete: false,
        canShare: false,
        canManagePermissions: false,
      },
    };

    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    if (!userRecord || userRecord.status !== 'ACTIVE') {
      denyResult.reason = 'User account is inactive, pending, or does not exist.';
      return denyResult;
    }

    const domainUser = UserFactory.fromPrisma(userRecord);

    // Verify role level baseline
    if (!domainUser.canPerformRoleAction(requestedPermission)) {
      denyResult.reason = `Role ${userRecord.role} is inherently prohibited from performing action ${requestedPermission}.`;
      return denyResult;
    }

    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        permissions: { where: { userId } },
      },
    });

    if (!fileRecord || fileRecord.isDeleted) {
      denyResult.reason = 'File does not exist or has been deleted.';
      return denyResult;
    }

    const isOwner = fileRecord.ownerId === userId;
    const isAdmin = domainUser.role === 'ADMIN';

    // Base permissions for Admin or Owner
    if (isAdmin) {
      return {
        allowed: true,
        reason: 'Authorized via Administrator organizational authority.',
        effectivePermissions: {
          canRead: true,
          canDownload: true,
          canUpdate: true,
          canDelete: true,
          canShare: true,
          canManagePermissions: true,
        },
      };
    }

    if (isOwner) {
      const canMod = domainUser.canModifyFile(true);
      const canDel = domainUser.canDeleteFile(true);
      return {
        allowed: true,
        reason: 'Authorized as file owner.',
        effectivePermissions: {
          canRead: true,
          canDownload: true,
          canUpdate: canMod,
          canDelete: canDel,
          canShare: true,
          canManagePermissions: true,
        },
      };
    }

    // Explicit ACL lookup
    const explicitPerm = fileRecord.permissions[0];
    if (!explicitPerm) {
      denyResult.reason = 'Access denied: No explicit file permissions granted to this user.';
      return denyResult;
    }

    const effectivePermissions = {
      canRead: explicitPerm.canRead,
      canDownload: explicitPerm.canDownload,
      canUpdate: domainUser.role !== 'VIEWER' && explicitPerm.canUpdate,
      canDelete: domainUser.role !== 'VIEWER' && explicitPerm.canDelete,
      canShare: domainUser.role !== 'VIEWER' && explicitPerm.canShare,
      canManagePermissions: domainUser.role !== 'VIEWER' && explicitPerm.canManagePermissions,
    };

    let isAllowed = false;
    switch (requestedPermission) {
      case 'READ':
        isAllowed = effectivePermissions.canRead;
        break;
      case 'DOWNLOAD':
        isAllowed = effectivePermissions.canDownload;
        break;
      case 'UPDATE':
        isAllowed = effectivePermissions.canUpdate;
        break;
      case 'DELETE':
        isAllowed = effectivePermissions.canDelete;
        break;
      case 'SHARE':
        isAllowed = effectivePermissions.canShare;
        break;
      case 'MANAGE_PERMISSIONS':
        isAllowed = effectivePermissions.canManagePermissions;
        break;
      default:
        isAllowed = false;
    }

    if (!isAllowed) {
      denyResult.reason = `Access denied: Insufficient explicit permission for action ${requestedPermission}.`;
      return denyResult;
    }

    return {
      allowed: true,
      reason: 'Authorized via explicit permission grant.',
      effectivePermissions,
    };
  }

  public async grantPermission(
    actorId: string,
    targetUserId: string,
    fileId: string,
    permissions: {
      canRead?: boolean;
      canDownload?: boolean;
      canUpdate?: boolean;
      canDelete?: boolean;
      canShare?: boolean;
      canManagePermissions?: boolean;
    }
  ) {
    // Check if actor has MANAGE_PERMISSIONS
    const evalResult = await this.evaluateFileAccess(actorId, fileId, 'MANAGE_PERMISSIONS');
    if (!evalResult.allowed) {
      await auditLogService.log({
        actorId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        fileId,
        targetUserId,
        result: 'DENIED',
        metadata: { attemptedAction: 'GRANT_PERMISSIONS', reason: evalResult.reason },
      });
      throw new Error(`Unauthorized: ${evalResult.reason}`);
    }

    // Check target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new Error('Target user does not exist.');
    }

    // Viewers cannot be granted write permissions
    const isTargetViewer = targetUser.role === 'VIEWER';
    const cleanPermissions = {
      canRead: permissions.canRead ?? true,
      canDownload: permissions.canDownload ?? false,
      canUpdate: isTargetViewer ? false : (permissions.canUpdate ?? false),
      canDelete: isTargetViewer ? false : (permissions.canDelete ?? false),
      canShare: isTargetViewer ? false : (permissions.canShare ?? false),
      canManagePermissions: isTargetViewer ? false : (permissions.canManagePermissions ?? false),
    };

    const permission = await prisma.permission.upsert({
      where: {
        userId_fileId: {
          userId: targetUserId,
          fileId,
        },
      },
      update: cleanPermissions,
      create: {
        userId: targetUserId,
        fileId,
        ...cleanPermissions,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        file: { select: { id: true, originalName: true } },
      },
    });

    await auditLogService.log({
      actorId,
      action: 'PERMISSION_GRANTED',
      fileId,
      targetUserId,
      result: 'SUCCESS',
      metadata: { permissions: cleanPermissions },
    });

    // Send notification
    await notificationService.notify(
      targetUserId,
      'File Permissions Updated',
      `You have been granted access to "${permission.file.originalName}".`,
      'INFO',
      `/dashboard/files`
    );

    return permission;
  }

  public async revokePermission(actorId: string, targetUserId: string, fileId: string) {
    const evalResult = await this.evaluateFileAccess(actorId, fileId, 'MANAGE_PERMISSIONS');
    if (!evalResult.allowed) {
      await auditLogService.log({
        actorId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        fileId,
        targetUserId,
        result: 'DENIED',
        metadata: { attemptedAction: 'REVOKE_PERMISSIONS', reason: evalResult.reason },
      });
      throw new Error(`Unauthorized: ${evalResult.reason}`);
    }

    await prisma.permission.deleteMany({
      where: {
        userId: targetUserId,
        fileId,
      },
    });

    await auditLogService.log({
      actorId,
      action: 'PERMISSION_REVOKED',
      fileId,
      targetUserId,
      result: 'SUCCESS',
    });

    await notificationService.notify(
      targetUserId,
      'Permission Revoked',
      `Your access to the file has been revoked.`,
      'WARNING'
    );

    return true;
  }

  public async getFilePermissions(actorId: string, fileId: string) {
    const evalResult = await this.evaluateFileAccess(actorId, fileId, 'READ');
    if (!evalResult.allowed) {
      throw new Error('Unauthorized to view file permissions.');
    }

    return prisma.permission.findMany({
      where: { fileId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const accessControlService = AccessControlService.getInstance();
