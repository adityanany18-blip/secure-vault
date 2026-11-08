import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticationService } from '../services/AuthenticationService';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { config } from '../config/environment';
import prisma from '../config/db';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);
    const user = await authenticationService.register(validated);

    // Automatically log in after registration
    const authResult = await authenticationService.login({
      email: validated.email,
      password: validated.password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('token', authResult.token, cookieOptions);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: authResult.user,
        token: authResult.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);
    const authResult = await authenticationService.login({
      ...validated,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('token', authResult.token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      data: {
        user: authResult.user,
        token: authResult.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.token || req.cookies?.token;
    if (token) {
      await authenticationService.logout(token);
    }
    res.clearCookie('token', cookieOptions);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.domainUser) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.domainUser.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    const token = await authenticationService.createPasswordResetToken(validated.email);

    res.status(200).json({
      success: true,
      message:
        'If an account with that email exists, password reset instructions have been generated.',
      // For development/demo convenience, return reset token in response
      resetToken: process.env.NODE_ENV !== 'production' ? token : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    await authenticationService.resetPassword(validated.token, validated.password);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You may now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const { name, currentPassword, newPassword } = req.body;
    const updateData: any = {};

    if (name) {
      updateData.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password is required to change password.',
        });
        return;
      }

      const isValid = await authenticationService.verifyPassword(
        req.user.passwordHash,
        currentPassword
      );
      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
        return;
      }

      updateData.passwordHash = await authenticationService.hashPassword(newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updated },
    });
  } catch (error) {
    next(error);
  }
};

