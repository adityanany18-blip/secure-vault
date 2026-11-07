import { Request, Response, NextFunction } from 'express';
import { authenticationService } from '../services/AuthenticationService';
import { UserFactory } from '../classes/UserFactory';
import { User as DomainUser } from '../classes/User';
import { User as PrismaUser } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: PrismaUser;
  domainUser?: DomainUser;
  token?: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check HTTP-only cookie first, then Bearer header
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No session token provided.',
      });
      return;
    }

    const user = await authenticationService.validateSession(token);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid, revoked, or expired session. Please log in again.',
      });
      return;
    }

    req.user = user;
    req.domainUser = UserFactory.fromPrisma(user);
    req.token = token;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Authentication failure.',
    });
  }
};

