export type RoleType = 'ADMIN' | 'EDITOR' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export type GranularPermission =
  | 'READ'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'UPDATE'
  | 'DELETE'
  | 'SHARE'
  | 'MANAGE_PERMISSIONS'
  | 'MANAGE_USERS';

export interface IPermission {
  id: string;
  userId: string;
  fileId: string;
  canRead: boolean;
  canDownload: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManagePermissions: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermissionGrantRequest {
  userId: string;
  fileId: string;
  canRead?: boolean;
  canDownload?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  canManagePermissions?: boolean;
}

export interface IFileAccessEvaluation {
  allowed: boolean;
  reason?: string;
  effectivePermissions: {
    canRead: boolean;
    canDownload: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canShare: boolean;
    canManagePermissions: boolean;
  };
}

