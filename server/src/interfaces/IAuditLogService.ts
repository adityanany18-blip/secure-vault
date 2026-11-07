import { AuditLog } from '@prisma/client';

export interface ICreateAuditLogDTO {
  actorId?: string;
  action: string;
  fileId?: string;
  targetUserId?: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuditFilterOptions {
  actorId?: string;
  action?: string;
  fileId?: string;
  result?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface IAuditLogService {
  log(dto: ICreateAuditLogDTO): Promise<AuditLog>;
  getLogs(options?: IAuditFilterOptions): Promise<{ logs: any[]; total: number; page: number; totalPages: number }>;
  getStats(): Promise<{
    totalLogs: number;
    successCount: number;
    failureCount: number;
    deniedCount: number;
    recentActions: any[];
  }>;
}

