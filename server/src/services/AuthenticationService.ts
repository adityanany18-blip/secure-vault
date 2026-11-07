import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { hash, verify } from '@node-rs/argon2';
import prisma from '../config/db';
import { config } from '../config/environment';
import {
  IAuthResult,
  IAuthenticationService,
  ILoginDTO,
  IRegisterDTO,
} from '../interfaces/IAuthenticationService';
import { auditLogService } from './AuditLogService';
import { User } from '@prisma/client';

export class AuthenticationService implements IAuthenticationService {
  private static instance: AuthenticationService;

  public static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  public async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters in length.');
    }
    // Argon2id with recommended parameters
    return await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
  }

  public async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    try {
      return await verify(hashedPassword, plainPassword);
    } catch {
      return false;
    }
  }

  public generateToken(user: { id: string; email: string; role: string }): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  public async register(data: IRegisterDTO): Promise<Omit<User, 'passwordHash'>> {
    const emailNormalized = data.email.trim().toLowerCase();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await this.hashPassword(data.password);

    // Strict rule: Public registration NEVER grants Admin role. Defaults to VIEWER.
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: emailNormalized,
        passwordHash,
        role: 'VIEWER', // Restrictive default
        status: 'ACTIVE',
      },
    });

    await auditLogService.log({
      actorId: user.id,
      action: 'USER_REGISTERED',
      result: 'SUCCESS',
      metadata: { role: user.role },
    });

    const { passwordHash: _, ...userSafe } = user;
    return userSafe;
  }

  public async login(data: ILoginDTO): Promise<IAuthResult> {
    const emailNormalized = data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      await auditLogService.log({
        action: 'AUTH_LOGIN_FAILURE',
        result: 'FAILURE',
        metadata: { attemptedEmail: emailNormalized, reason: 'User not found' },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
      throw new Error('Invalid email or password.');
    }

    if (user.status === 'INACTIVE') {
      await auditLogService.log({
        actorId: user.id,
        action: 'AUTH_LOGIN_FAILURE',
        result: 'DENIED',
        metadata: { reason: 'Account inactive' },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
      throw new Error('Your account is deactivated. Please contact an administrator.');
    }

    if (user.status === 'PENDING') {
      await auditLogService.log({
        actorId: user.id,
        action: 'AUTH_LOGIN_FAILURE',
        result: 'DENIED',
        metadata: { reason: 'Account pending approval' },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
      throw new Error('Your account is awaiting administrator approval.');
    }

    const isValid = await this.verifyPassword(user.passwordHash, data.password);
    if (!isValid) {
      await auditLogService.log({
        actorId: user.id,
        action: 'AUTH_LOGIN_FAILURE',
        result: 'FAILURE',
        metadata: { reason: 'Incorrect password' },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
      throw new Error('Invalid email or password.');
    }

    const token = this.generateToken(user);

    // Save session in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await auditLogService.log({
      actorId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      result: 'SUCCESS',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public async logout(token: string): Promise<boolean> {
    try {
      const decoded: any = jwt.verify(token, config.jwtSecret);
      await prisma.session.deleteMany({ where: { token } });

      if (decoded && decoded.sub) {
        await auditLogService.log({
          actorId: decoded.sub,
          action: 'AUTH_LOGOUT',
          result: 'SUCCESS',
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  public async validateSession(token: string): Promise<User | null> {
    try {
      const decoded: any = jwt.verify(token, config.jwtSecret);
      if (!decoded || !decoded.sub) return null;

      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      if (session.user.status !== 'ACTIVE') {
        return null;
      }

      return session.user;
    } catch {
      return null;
    }
  }

  public async createPasswordResetToken(email: string): Promise<string> {
    const emailNormalized = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailNormalized } });

    if (!user) {
      // Return a dummy token or simulate timing to prevent user enumeration
      return 'sent';
    }

    // Invalidate existing unused tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Generate 64-char cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await auditLogService.log({
      actorId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      result: 'SUCCESS',
    });

    return token;
  }

  public async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new Error('Password reset token is invalid or has expired.');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Terminate all existing sessions on password change
      prisma.session.deleteMany({
        where: { userId: record.userId },
      }),
    ]);

    await auditLogService.log({
      actorId: record.userId,
      action: 'PASSWORD_RESET_SUCCESS',
      result: 'SUCCESS',
    });

    return true;
  }
}

export const authenticationService = AuthenticationService.getInstance();

