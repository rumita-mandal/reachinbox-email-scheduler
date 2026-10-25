import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { config } from '../config';

const router = Router();
const googleConfigured =
  config.google.clientId && config.google.clientId !== 'your-google-client-id';

// Guard for routes that require Google OAuth to be configured
function requireGoogleConfig(req: Request, res: Response, next: NextFunction) {
  if (!googleConfigured) {
    res.status(501).json({ error: 'Google OAuth is not configured on this server.' });
    return;
  }
  next();
}

// GET /api/auth/google — start OAuth flow
router.get('/google', requireGoogleConfig, passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback — OAuth callback
router.get(
  '/google/callback',
  requireGoogleConfig,
  passport.authenticate('google', { failureRedirect: `${config.frontendUrl}?auth_error=true` }),
  (_req: Request, res: Response) => {
    res.redirect(`${config.frontendUrl}/dashboard`);
  }
);

// GET /api/auth/me — returns current user or mock dev user
router.get('/me', (req: Request, res: Response) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const user = req.user as User;
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      slackConnected: !!user.slackAccessToken,
    });
    return;
  }

  res.status(401).json({ error: 'Not authenticated' });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
});

// GET /api/auth/dev-login — creates a mock session without Google OAuth (dev only)
router.get('/dev-login', async (req: Request, res: Response) => {
  if (config.nodeEnv !== 'development') {
    res.status(404).json({ error: 'Not available in production' });
    return;
  }

  try {
    const userRepo = AppDataSource.getRepository(User);
    let devUser = await userRepo.findOne({ where: { googleId: 'dev-google-id' } });

    if (!devUser) {
      devUser = userRepo.create({
        googleId: 'dev-google-id',
        email: 'dev@reachinbox.ai',
        name: 'Dev User',
        avatarUrl: 'https://ui-avatars.com/api/?name=Dev+User&background=6366f1&color=fff',
      });
      await userRepo.save(devUser);
    }

    req.login(devUser, (err) => {
      if (err) {
        res.status(500).json({ error: 'Login failed' });
        return;
      }
      res.redirect(`${config.frontendUrl}/dashboard`);
    });
  } catch (err) {
    console.error('[Auth] Dev login error:', err);
    res.status(500).json({ error: 'Dev login failed' });
  }
});

export default router;
