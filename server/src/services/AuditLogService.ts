import prisma from '../config/db';
import {
  IAuditFilterOptions,
  IAuditLogService,
  ICreateAuditLogDTO,
} from '../interfaces/IAuditLogService';
import { AuditLog } from '@prisma/client';

export class AuditLogService implements IAuditLogService {
  private static instance: AuditLogService;

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  /**
   * Sanitizes metadata to strictly remove any passwords, tokens, or encryption keys.
   */
  private sanitizeMetadata(metadata?: Record<string, any>): string | null {
    if (!metadata) return null;
    const sanitized = { ...metadata };
    const forbiddenKeys = ['password', 'token', 'key', 'secret', 'hash', 'passwordHash'];

    for (const key of Object.keys(sanitized)) {
      if (forbiddenKeys.some((fk) => key.toLowerCase().includes(fk))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return JSON.stringify(sanitized);
  }

  public async log(dto: ICreateAuditLogDTO): Promise<AuditLog> {
    try {
      const sanitizedMeta = this.sanitizeMetadata(dto.metadata);
      return await prisma.auditLog.create({
        data: {
          actorId: dto.actorId || null,
          action: dto.action,
          fileId: dto.fileId || null,
          targetUserId: dto.targetUserId || null,
          result: dto.result,
          metadata: sanitizedMeta,
          ipAddress: dto.ipAddress || null,
          userAgent: dto.userAgent || null,
        },
      });
    } catch (error) {
      // Never let an audit logging failure crash the primary operation, but log to stderr
      console.error('AuditLogService Error writing log:', error);
      throw error;
    }
  }

  public async getLogs(options?: IAuditFilterOptions): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options?.actorId) {
      where.actorId = options.actorId;
    }
    if (options?.action) {
      where.action = { contains: options.action };
    }
    if (options?.fileId) {
      where.fileId = options.fileId;
    }
    if (options?.result) {
      where.result = options.result;
    }
    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) {
        where.timestamp.gte = options.startDate;
      }
      if (options.endDate) {
        where.timestamp.lte = options.endDate;
      }
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
          file: {
            select: { id: true, originalName: true, mimeType: true },
          },
        },
      }),
    ]);

    const parsedLogs = logs.map((l) => ({
      ...l,
      metadata: l.metadata ? JSON.parse(l.metadata) : null,
    }));

    return {
      logs: parsedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async getStats(): Promise<{
    totalLogs: number;
    successCount: number;
    failureCount: number;
    deniedCount: number;
    recentActions: any[];
  }> {
    const [totalLogs, successCount, failureCount, deniedCount, recentActions] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { result: 'SUCCESS' } }),
      prisma.auditLog.count({ where: { result: 'FAILURE' } }),
      prisma.auditLog.count({ where: { result: 'DENIED' } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
          file: { select: { id: true, originalName: true } },
        },
      }),
    ]);

    return {
      totalLogs,
      successCount,
      failureCount,
      deniedCount,
      recentActions: recentActions.map((l) => ({
        ...l,
        metadata: l.metadata ? JSON.parse(l.metadata) : null,
      })),
    };
  }
}

export const auditLogService = AuditLogService.getInstance();

