import { File, FileVersion, Permission, User } from '@prisma/client';
import { GranularPermission } from './IPermission';

export interface IUploadedFilePayload {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface IFileWithDetails extends File {
  owner: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  permissions?: Permission[];
  versions?: FileVersion[];
  userPermissions?: {
    canRead: boolean;
    canDownload: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canShare: boolean;
    canManagePermissions: boolean;
  };
}

export interface IFileOperations {
  uploadFile(
    actorId: string,
    filePayload: IUploadedFilePayload,
    folder?: string
  ): Promise<IFileWithDetails>;

  getFileById(actorId: string, fileId: string): Promise<IFileWithDetails>;

  getDecryptedFileStream(
    actorId: string,
    fileId: string,
    action: 'READ' | 'DOWNLOAD'
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
    fileSize: number;
  }>;

  updateFileMetadata(
    actorId: string,
    fileId: string,
    data: { originalName?: string; folder?: string }
  ): Promise<IFileWithDetails>;

  uploadNewVersion(
    actorId: string,
    fileId: string,
    filePayload: IUploadedFilePayload
  ): Promise<any>;

  deleteFile(actorId: string, fileId: string): Promise<boolean>;

  listFiles(
    actorId: string,
    options?: {
      folder?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ files: IFileWithDetails[]; total: number; page: number; totalPages: number }>;
}
