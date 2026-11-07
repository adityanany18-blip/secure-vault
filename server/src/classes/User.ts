import { GranularPermission, RoleType, UserStatus } from '../interfaces/IPermission';

export abstract class User {
  protected readonly _id: string;
  protected _name: string;
  protected readonly _email: string;
  protected readonly _role: RoleType;
  protected _status: UserStatus;
  protected readonly _createdAt: Date;
  protected _avatarUrl?: string | null;

  constructor(
    id: string,
    name: string,
    email: string,
    role: RoleType,
    status: UserStatus = 'ACTIVE',
    createdAt: Date = new Date(),
    avatarUrl?: string | null
  ) {
    this._id = id;
    this._name = name;
    this._email = email;
    this._role = role;
    this._status = status;
    this._createdAt = createdAt;
    this._avatarUrl = avatarUrl;
  }

  // Getters - Encapsulation
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get role(): RoleType {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get avatarUrl(): string | null | undefined {
    return this._avatarUrl;
  }

  set name(newName: string) {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Name cannot be empty.');
    }
    this._name = newName.trim();
  }

  set status(newStatus: UserStatus) {
    this._status = newStatus;
  }

  public isActive(): boolean {
    return this._status === 'ACTIVE';
  }

  public isPending(): boolean {
    return this._status === 'PENDING';
  }

  // Polymorphic abstract methods
  public abstract getRoleCapabilities(): GranularPermission[];
  public abstract canPerformRoleAction(action: GranularPermission): boolean;
  public abstract canManageUsers(): boolean;
  public abstract canUploadFiles(): boolean;
  public abstract canModifyFile(isOwner: boolean): boolean;
  public abstract canDeleteFile(isOwner: boolean): boolean;

  public toJSON() {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      role: this._role,
      status: this._status,
      createdAt: this._createdAt,
      avatarUrl: this._avatarUrl,
      capabilities: this.getRoleCapabilities(),
    };
  }
}

