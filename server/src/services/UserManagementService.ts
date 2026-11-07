import prisma from '../config/db';
import { auditLogService } from './AuditLogService';
import { authenticationService } from './AuthenticationService';
import { notificationService } from './NotificationService';
import { RoleType, UserStatus } from '../interfaces/IPermission';

export class UserManagementService {
  private static instance: UserManagementService;

  public static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService();
    }
    return UserManagementService.instance;
  }

  public async listUsers(options?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search } },
        { email: { contains: options.search } },
      ];
    }
    if (options?.role && options.role !== 'ALL') {
      where.role = options.role;
    }
    if (options?.status && options.status !== 'ALL') {
      where.status = options.status;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              files: { where: { isDeleted: false } },
              permissions: true,
            },
          },
        },
      }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async createUser(
    actorId: string,
    data: { name: string; email: string; password: string; role: RoleType; status?: UserStatus }
  ) {
    const emailNormalized = data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: emailNormalized } });
    if (existing) {
      throw new Error('User with this email already exists.');
    }

    const passwordHash = await authenticationService.hashPassword(data.password);

    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: emailNormalized,
        passwordHash,
        role: data.role,
        status: data.status || 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await auditLogService.log({
      actorId,
      action: 'USER_CREATED',
      targetUserId: newUser.id,
      result: 'SUCCESS',
      metadata: { createdRole: newUser.role, email: newUser.email },
    });

    return newUser;
  }

  public async updateUser(
    actorId: string,
    targetUserId: string,
    data: { name?: string; role?: RoleType; status?: UserStatus }
  ) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new Error('Target user does not exist.');
    }

    // Protection rule: DO NOT ALLOW DEMOTING OR DEACTIVATING THE LAST ACTIVE ADMINISTRATOR
    if (
      (data.role && data.role !== 'ADMIN' && targetUser.role === 'ADMIN') ||
      (data.status && data.status !== 'ACTIVE' && targetUser.role === 'ADMIN')
    ) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      if (activeAdminCount <= 1) {
        throw new Error(
          'Security Safeguard: Cannot demote or deactivate the last remaining active administrator.'
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        name: data.name?.trim(),
        role: data.role,
        status: data.status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    if (data.role && data.role !== targetUser.role) {
      await auditLogService.log({
        actorId,
        action: 'USER_ROLE_CHANGED',
        targetUserId,
        result: 'SUCCESS',
        metadata: { oldRole: targetUser.role, newRole: data.role },
      });

      await notificationService.notify(
        targetUserId,
        'Role Updated',
        `Your organization role has been updated to ${data.role}.`,
        'INFO'
      );
    }

    if (data.status && data.status !== targetUser.status) {
      await auditLogService.log({
        actorId,
        action: 'USER_STATUS_CHANGED',
        targetUserId,
        result: 'SUCCESS',
        metadata: { oldStatus: targetUser.status, newStatus: data.status },
      });

      await notificationService.notify(
        targetUserId,
        'Account Status Changed',
        `Your account status has been changed to ${data.status}.`,
        data.status === 'ACTIVE' ? 'SUCCESS' : 'WARNING'
      );
    }

    return updatedUser;
  }

  public async getDashboardStats() {
    const [
      totalUsers,
      totalAdmins,
      totalEditors,
      totalViewers,
      totalFiles,
      totalStorage,
      recentActivities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'EDITOR' } }),
      prisma.user.count({ where: { role: 'VIEWER' } }),
      prisma.file.count({ where: { isDeleted: false } }),
      prisma.file.aggregate({
        where: { isDeleted: false },
        _sum: { fileSize: true },
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { timestamp: 'desc' },
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
          file: { select: { id: true, originalName: true } },
        },
      }),
    ]);

    // Group files by mime type or folder
    const files = await prisma.file.findMany({
      where: { isDeleted: false },
      select: { mimeType: true, fileSize: true, createdAt: true },
    });

    return {
      totalUsers,
      totalAdmins,
      totalEditors,
      totalViewers,
      totalFiles,
      encryptedFiles: totalFiles, // 100% of files in SecureVault are encrypted
      totalStorageBytes: totalStorage._sum.fileSize || 0,
      recentActivities,
      fileStats: files,
    };
  }
}

export const userManagementService = UserManagementService.getInstance();

