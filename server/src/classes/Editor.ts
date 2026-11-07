import { User } from './User';
import { GranularPermission } from '../interfaces/IPermission';

export class Editor extends User {
  constructor(
    id: string,
    name: string,
    email: string,
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING' = 'ACTIVE',
    createdAt: Date = new Date(),
    avatarUrl?: string | null
  ) {
    super(id, name, email, 'EDITOR', status, createdAt, avatarUrl);
  }

  public getRoleCapabilities(): GranularPermission[] {
    return ['READ', 'DOWNLOAD', 'UPLOAD', 'UPDATE', 'DELETE', 'SHARE'];
  }

  public canPerformRoleAction(action: GranularPermission): boolean {
    if (!this.isActive()) return false;
    // Editors cannot manage users or unilaterally manage permissions without explicit grant
    if (action === 'MANAGE_USERS' || action === 'MANAGE_PERMISSIONS') {
      return false;
    }
    return this.getRoleCapabilities().includes(action);
  }

  public canManageUsers(): boolean {
    return false;
  }

  public canUploadFiles(): boolean {
    return this.isActive();
  }

  public canModifyFile(isOwner: boolean): boolean {
    // If owner, can modify; if not owner, requires explicit UPDATE permission via AccessControlService
    return this.isActive() && isOwner;
  }

  public canDeleteFile(isOwner: boolean): boolean {
    return this.isActive() && isOwner;
  }
}

