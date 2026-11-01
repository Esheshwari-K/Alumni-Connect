import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import { User } from '../types/index.ts';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.alumni_connect_token;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return next();
    }

    const session = await db.getSession(token);
    if (!session) {
      res.clearCookie('alumni_connect_token');
      return next();
    }

    const user = await db.getUserById(session.user_id);
    if (!user || user.account_status === 'suspended') {
      res.clearCookie('alumni_connect_token');
      return next();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `Forbidden: requires one of [${allowedRoles.join(', ')}] role` });
      return;
    }
    next();
  };
}
