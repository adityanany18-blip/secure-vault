import { User } from './User';
import { GranularPermission } from '../interfaces/IPermission';

export class Admin extends User {
  constructor(
    id: string,
    name: string,
    email: string,
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING' = 'ACTIVE',
    createdAt: Date = new Date(),
    avatarUrl?: string | null
  ) {
    super(id, name, email, 'ADMIN', status, createdAt, avatarUrl);
  }

  public getRoleCapabilities(): GranularPermission[] {
    return [
      'READ',
      'DOWNLOAD',
      'UPLOAD',
      'UPDATE',
      'DELETE',
      'SHARE',
      'MANAGE_PERMISSIONS',
      'MANAGE_USERS',
    ];
  }

  public canPerformRoleAction(action: GranularPermission): boolean {
    // Admin has systemic authorization for role capabilities
    return this.isActive();
  }

  public canManageUsers(): boolean {
    return this.isActive();
  }

  public canUploadFiles(): boolean {
    return this.isActive();
  }

  public canModifyFile(_isOwner: boolean): boolean {
    // Admin can manage files across the organization
    return this.isActive();
  }

  public canDeleteFile(_isOwner: boolean): boolean {
    return this.isActive();
  }
}

