import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
    return;
  }

  res.status(401).json({
    error: 'Unauthorized — please login via /api/auth/dev-login (dev) or Google OAuth',
  });
}
