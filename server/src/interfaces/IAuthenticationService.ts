import { User } from '@prisma/client';

export interface IAuthResult {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

export interface IRegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface ILoginDTO {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuthenticationService {
  register(data: IRegisterDTO): Promise<Omit<User, 'passwordHash'>>;
  login(data: ILoginDTO): Promise<IAuthResult>;
  logout(token: string): Promise<boolean>;
  validateSession(token: string): Promise<User | null>;
  createPasswordResetToken(email: string): Promise<string>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(hash: string, plain: string): Promise<boolean>;
}

