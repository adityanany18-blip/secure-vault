import { User } from './User';
import { GranularPermission } from '../interfaces/IPermission';

export class Viewer extends User {
  constructor(
    id: string,
    name: string,
    email: string,
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING' = 'ACTIVE',
    createdAt: Date = new Date(),
    avatarUrl?: string | null
  ) {
    super(id, name, email, 'VIEWER', status, createdAt, avatarUrl);
  }

  public getRoleCapabilities(): GranularPermission[] {
    // Viewer base capabilities are read-only; download requires explicit canDownload grant
    return ['READ', 'DOWNLOAD'];
  }

  public canPerformRoleAction(action: GranularPermission): boolean {
    if (!this.isActive()) return false;
    // Viewer is strictly forbidden from write/mutation actions
    if (
      action === 'UPLOAD' ||
      action === 'UPDATE' ||
      action === 'DELETE' ||
      action === 'SHARE' ||
      action === 'MANAGE_PERMISSIONS' ||
      action === 'MANAGE_USERS'
    ) {
      return false;
    }
    return action === 'READ' || action === 'DOWNLOAD';
  }

  public canManageUsers(): boolean {
    return false;
  }

  public canUploadFiles(): boolean {
    return false;
  }

  public canModifyFile(_isOwner: boolean): boolean {
    return false;
  }

  public canDeleteFile(_isOwner: boolean): boolean {
    return false;
  }
}

