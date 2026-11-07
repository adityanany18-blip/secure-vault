export type RoleType = 'ADMIN' | 'EDITOR' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  capabilities?: string[];
  _count?: {
    files?: number;
    permissions?: number;
  };
}

export interface FileItem {
  id: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  ownerId: string;
  encryptionVersion: string;
  nonce: string;
  authenticationTag: string;
  folder: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    role: RoleType;
  };
  permissions?: PermissionItem[];
  versions?: FileVersionItem[];
  userPermissions?: {
    canRead: boolean;
    canDownload: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canShare: boolean;
    canManagePermissions: boolean;
  };
}

export interface FileVersionItem {
  id: string;
  fileId: string;
  versionNumber: number;
  storageKey: string;
  fileSize: number;
  nonce: string;
  authenticationTag: string;
  encryptionVersion: string;
  uploadedById: string;
  createdAt: string;
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PermissionItem {
  id: string;
  userId: string;
  fileId: string;
  canRead: boolean;
  canDownload: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManagePermissions: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: RoleType;
    status: UserStatus;
  };
  file?: {
    id: string;
    originalName: string;
  };
}

export interface AuditLogItem {
  id: string;
  actorId?: string;
  action: string;
  fileId?: string;
  targetUserId?: string;
  timestamp: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: RoleType;
  };
  file?: {
    id: string;
    originalName: string;
    mimeType?: string;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalEditors: number;
  totalViewers: number;
  totalFiles: number;
  encryptedFiles: number;
  totalStorageBytes: number;
  recentActivities: AuditLogItem[];
  fileStats: Array<{
    mimeType: string;
    fileSize: number;
    createdAt: string;
  }>;
}

