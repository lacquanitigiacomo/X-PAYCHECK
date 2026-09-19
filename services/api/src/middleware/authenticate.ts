import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config';
import { prototypeStore } from '../store/prototypeStore';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; tier: 'free' | 'pro' };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId?: string };
    const user = decoded.userId ? prototypeStore.getUser(decoded.userId) : undefined;
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = { userId: user.id, email: user.email, tier: user.tier };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requirePro = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.tier !== 'pro') {
    return res.status(403).json({ error: 'Pro plan required' });
  }

  next();
};
