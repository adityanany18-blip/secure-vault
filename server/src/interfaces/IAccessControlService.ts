import { GranularPermission, IFileAccessEvaluation, RoleType } from './IPermission';

export interface IAccessControlService {
  canRolePerform(role: RoleType, permission: GranularPermission): boolean;

  evaluateFileAccess(
    userId: string,
    fileId: string,
    requestedPermission: GranularPermission
  ): Promise<IFileAccessEvaluation>;

  grantPermission(
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
  ): Promise<any>;

  revokePermission(actorId: string, targetUserId: string, fileId: string): Promise<boolean>;

  getFilePermissions(actorId: string, fileId: string): Promise<any[]>;
}

