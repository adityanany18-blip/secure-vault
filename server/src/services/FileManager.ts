import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db';
import { config } from '../config/environment';
import {
  IFileOperations,
  IFileWithDetails,
  IUploadedFilePayload,
} from '../interfaces/IFileOperations';
import { encryptionService } from './EncryptionService';
import { accessControlService } from './AccessControlService';
import { auditLogService } from './AuditLogService';
import { notificationService } from './NotificationService';
import { UserFactory } from '../classes/UserFactory';

export class FileManager implements IFileOperations {
  private static instance: FileManager;
  private readonly storageDirectory: string;

  constructor() {
    this.storageDirectory = config.storageDir;
  }

  public static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  private async ensureStorageDir() {
    try {
      await fs.mkdir(this.storageDirectory, { recursive: true });
    } catch {
      // directory already exists
    }
  }

  /**
   * Sanitizes original filename to prevent directory traversal or control characters.
   */
  private sanitizeFilename(filename: string): string {
    const basename = path.basename(filename);
    return basename.replace(/[^a-zA-Z0-9._\- ]/g, '_').substring(0, 200);
  }

  public async uploadFile(
    actorId: string,
    filePayload: IUploadedFilePayload,
    folder: string = 'General'
  ): Promise<IFileWithDetails> {
    await this.ensureStorageDir();

    // 1. Validate Actor
    const userRecord = await prisma.user.findUnique({ where: { id: actorId } });
    if (!userRecord || userRecord.status !== 'ACTIVE') {
      throw new Error('Unauthorized: User account is inactive or not found.');
    }

    const domainUser = UserFactory.fromPrisma(userRecord);
    if (!domainUser.canUploadFiles()) {
      await auditLogService.log({
        actorId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        result: 'DENIED',
        metadata: { attemptedAction: 'FILE_UPLOAD', role: userRecord.role },
      });
      throw new Error(`Role ${userRecord.role} is not permitted to upload files.`);
    }

    // 2. Validate File Size
    if (filePayload.size > config.maxFileSizeBytes) {
      throw new Error(
        `File size exceeds maximum allowed limit (${Math.round(config.maxFileSizeBytes / (1024 * 1024))}MB).`
      );
    }

    // 3. Encrypt File with AES-256-GCM
    const sanitizedName = this.sanitizeFilename(filePayload.originalname);
    const encryptionResult = await encryptionService.encrypt(filePayload.buffer);

    // 4. Save Encrypted Blob to Private Storage
    const storageKey = `${uuidv4()}.enc`;
    const storagePath = path.join(this.storageDirectory, storageKey);

    await fs.writeFile(storagePath, encryptionResult.encryptedBuffer);

    // 5. Store File Metadata in Database
    const file = await prisma.file.create({
      data: {
        originalName: sanitizedName,
        storageKey,
        mimeType: filePayload.mimetype || 'application/octet-stream',
        fileSize: filePayload.size,
        ownerId: actorId,
        encryptionVersion: encryptionResult.encryptionVersion,
        nonce: encryptionResult.nonce,
        authenticationTag: encryptionResult.authTag,
        folder: folder.trim() || 'General',
      },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        permissions: true,
        versions: true,
      },
    });

    // 6. Audit Log
    await auditLogService.log({
      actorId,
      action: 'FILE_UPLOAD',
      fileId: file.id,
      result: 'SUCCESS',
      metadata: {
        filename: sanitizedName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        folder: file.folder,
      },
    });

    await notificationService.notify(
      actorId,
      'Upload Completed',
      `File "${sanitizedName}" was encrypted and stored securely.`,
      'SUCCESS'
    );

    return file as IFileWithDetails;
  }

  public async getFileById(actorId: string, fileId: string): Promise<IFileWithDetails> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        permissions: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            uploadedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!file || file.isDeleted) {
      throw new Error('File not found or has been deleted.');
    }

    const accessEval = await accessControlService.evaluateFileAccess(actorId, fileId, 'READ');
    if (!accessEval.allowed) {
      await auditLogService.log({
        actorId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        fileId,
        result: 'DENIED',
        metadata: { attemptedAction: 'GET_FILE_INFO', reason: accessEval.reason },
      });
      throw new Error(accessEval.reason || 'Access denied.');
    }

    return {
      ...file,
      userPermissions: accessEval.effectivePermissions,
    } as IFileWithDetails;
  }

  public async getDecryptedFileStream(
    actorId: string,
    fileId: string,
    action: 'READ' | 'DOWNLOAD'
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }> {
    const accessEval = await accessControlService.evaluateFileAccess(actorId, fileId, action);
    if (!accessEval.allowed) {
      await auditLogService.log({
        actorId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        fileId,
        result: 'DENIED',
        metadata: { attemptedAction: action, reason: accessEval.reason },
      });
      throw new Error(accessEval.reason || 'Access denied.');
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.isDeleted) {
      throw new Error('File does not exist or has been deleted.');
    }

    const storagePath = path.join(this.storageDirectory, file.storageKey);
    let encryptedBuffer: Buffer;
    try {
      encryptedBuffer = await fs.readFile(storagePath);
    } catch {
      throw new Error('Encrypted file storage asset is missing from the vault repository.');
    }

    // Authenticate and Decrypt with AES-256-GCM
    const decryptedBuffer = await encryptionService.decrypt({
      encryptedBuffer,
      nonce: file.nonce,
      authTag: file.authenticationTag,
      encryptionVersion: file.encryptionVersion,
    });

    await auditLogService.log({
      actorId,
      action: action === 'DOWNLOAD' ? 'FILE_DOWNLOAD' : 'FILE_PREVIEW',
      fileId,
      result: 'SUCCESS',
      metadata: { filename: file.originalName, fileSize: file.fileSize },
    });

    return {
      buffer: decryptedBuffer,
      filename: file.originalName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
    };
  }

  public async updateFileMetadata(
    actorId: string,
    fileId: string,
    data: { originalName?: string; folder?: string }
  ): Promise<IFileWithDetails> {
    const accessEval = await accessControlService.evaluateFileAccess(actorId, fileId, 'UPDATE');
    if (!accessEval.allowed) {
      await auditLogService.log({
        actorId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        fileId,
        result: 'DENIED',
        metadata: { attemptedAction: 'UPDATE_FILE', reason: accessEval.reason },
      });
      throw new Error(accessEval.reason || 'Access denied.');
    }

    const updatePayload: any = {};
    if (data.originalName) {
      updatePayload.originalName = this.sanitizeFilename(data.originalName);
    }
    if (data.folder) {
      updatePayload.folder = data.folder.trim();
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: updatePayload,
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        permissions: true,
        versions: true,
      },
    });

    await auditLogService.log({
      actorId,
      action: 'FILE_UPDATED',
      fileId,
      result: 'SUCCESS',
      metadata: updatePayload,
    });

    return updated as IFileWithDetails;
  }

  public async uploadNewVersion(
    actorId: string,
    fileId: string,
    filePayload: IUploadedFilePayload
  ) {
    const accessEval = await accessControlService.evaluateFileAccess(actorId, fileId, 'UPDATE');
    if (!accessEval.allowed) {
      throw new Error(accessEval.reason || 'Access denied.');
    }

    const currentFile = await prisma.file.findUnique({
      where: { id: fileId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!currentFile || currentFile.isDeleted) {
      throw new Error('File not found.');
    }

    const nextVersionNum = (currentFile.versions[0]?.versionNumber || 1) + 1;

    // Archive current file version into FileVersion table
    await prisma.fileVersion.create({
      data: {
        fileId: currentFile.id,
        versionNumber: currentFile.versions[0]?.versionNumber || 1,
        storageKey: currentFile.storageKey,
        fileSize: currentFile.fileSize,
        nonce: currentFile.nonce,
        authenticationTag: currentFile.authenticationTag,
        encryptionVersion: currentFile.encryptionVersion,
        uploadedById: currentFile.ownerId,
      },
    });

    // Encrypt new version
    const encResult = await encryptionService.encrypt(filePayload.buffer);
    const newStorageKey = `${uuidv4()}.enc`;
    const newStoragePath = path.join(this.storageDirectory, newStorageKey);
    await fs.writeFile(newStoragePath, encResult.encryptedBuffer);

    // Update active file
    await prisma.file.update({
      where: { id: fileId },
      data: {
        storageKey: newStorageKey,
        fileSize: filePayload.size,
        mimeType: filePayload.mimetype,
        nonce: encResult.nonce,
        authenticationTag: encResult.authTag,
        encryptionVersion: encResult.encryptionVersion,
      },
    });

    await auditLogService.log({
      actorId,
      action: 'FILE_VERSION_UPLOADED',
      fileId,
      result: 'SUCCESS',
      metadata: { newVersionNumber: nextVersionNum, fileSize: filePayload.size },
    });

    return true;
  }

  public async deleteFile(actorId: string, fileId: string): Promise<boolean> {
    const accessEval = await accessControlService.evaluateFileAccess(actorId, fileId, 'DELETE');
    if (!accessEval.allowed) {
      await auditLogService.log({
        actorId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        fileId,
        result: 'DENIED',
        metadata: { attemptedAction: 'DELETE_FILE', reason: accessEval.reason },
      });
      throw new Error(accessEval.reason || 'Access denied.');
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return false;

    // Soft delete for audit continuity, with storage cleanup if configured
    await prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: true },
    });

    // Clean up physical file securely
    try {
      const storagePath = path.join(this.storageDirectory, file.storageKey);
      await fs.unlink(storagePath);
    } catch {
      // file might have been cleaned up
    }

    await auditLogService.log({
      actorId,
      action: 'FILE_DELETED',
      fileId,
      result: 'SUCCESS',
      metadata: { originalName: file.originalName },
    });

    return true;
  }

  public async listFiles(
    actorId: string,
    options?: {
      folder?: string;
      search?: string;
      filter?: 'my-files' | 'shared-with-me' | 'all';
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ files: IFileWithDetails[]; total: number; page: number; totalPages: number }> {
    const userRecord = await prisma.user.findUnique({ where: { id: actorId } });
    if (!userRecord || userRecord.status !== 'ACTIVE') {
      throw new Error('Unauthorized.');
    }

    const isAdmin = userRecord.role === 'ADMIN';
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (options?.folder && options.folder !== 'All') {
      where.folder = options.folder;
    }

    if (options?.search) {
      where.originalName = { contains: options.search };
    }

    // Role-based visibility and filters
    if (isAdmin && options?.filter === 'all') {
      // Admin viewing all files
    } else if (options?.filter === 'my-files') {
      where.ownerId = actorId;
    } else if (options?.filter === 'shared-with-me') {
      where.ownerId = { not: actorId };
      where.permissions = {
        some: {
          userId: actorId,
          canRead: true,
        },
      };
    } else {
      // General view
      if (!isAdmin) {
        where.OR = [
          { ownerId: actorId },
          {
            permissions: {
              some: {
                userId: actorId,
                canRead: true,
              },
            },
          },
        ];
      }
    }

    const [total, files] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [options?.sortBy || 'createdAt']: options?.sortOrder || 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true, role: true } },
          permissions: {
            where: { userId: actorId },
          },
          versions: {
            take: 1,
            orderBy: { versionNumber: 'desc' },
          },
        },
      }),
    ]);

    const enrichedFiles = files.map((f) => {
      const isOwner = f.ownerId === actorId;
      const perm = f.permissions[0];

      const userPermissions = {
        canRead: isAdmin || isOwner || !!perm?.canRead,
        canDownload: isAdmin || isOwner || !!perm?.canDownload,
        canUpdate: (isAdmin || isOwner || !!perm?.canUpdate) && userRecord.role !== 'VIEWER',
        canDelete: (isAdmin || isOwner || !!perm?.canDelete) && userRecord.role !== 'VIEWER',
        canShare: (isAdmin || isOwner || !!perm?.canShare) && userRecord.role !== 'VIEWER',
        canManagePermissions:
          (isAdmin || isOwner || !!perm?.canManagePermissions) && userRecord.role !== 'VIEWER',
      };

      return {
        ...f,
        userPermissions,
      };
    });

    return {
      files: enrichedFiles as IFileWithDetails[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const fileManager = FileManager.getInstance();

