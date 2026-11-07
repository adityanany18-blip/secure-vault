import { User as PrismaUser } from '@prisma/client';
import { User } from './User';
import { Admin } from './Admin';
import { Editor } from './Editor';
import { Viewer } from './Viewer';
import { RoleType, UserStatus } from '../interfaces/IPermission';

export class UserFactory {
  public static fromPrisma(userRecord: PrismaUser): User {
    const role = userRecord.role.toUpperCase() as RoleType;
    const status = userRecord.status.toUpperCase() as UserStatus;

    switch (role) {
      case 'ADMIN':
        return new Admin(
          userRecord.id,
          userRecord.name,
          userRecord.email,
          status,
          userRecord.createdAt,
          userRecord.avatarUrl
        );
      case 'EDITOR':
        return new Editor(
          userRecord.id,
          userRecord.name,
          userRecord.email,
          status,
          userRecord.createdAt,
          userRecord.avatarUrl
        );
      case 'VIEWER':
      default:
        return new Viewer(
          userRecord.id,
          userRecord.name,
          userRecord.email,
          status,
          userRecord.createdAt,
          userRecord.avatarUrl
        );
    }
  }
}

