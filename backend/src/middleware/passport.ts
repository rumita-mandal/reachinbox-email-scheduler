import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { config } from '../config';

export function configurePassport(): void {
  // Always register serialize/deserialize — needed for dev login sessions too
  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id } });
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  if (!config.google.clientId || config.google.clientId === 'your-google-client-id') {
    console.warn('[Auth] Google OAuth not configured — using dev login for development');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const userRepo = AppDataSource.getRepository(User);

          let user = await userRepo.findOne({ where: { googleId: profile.id } });

          if (!user) {
            user = userRepo.create({
              googleId: profile.id,
              email: profile.emails?.[0]?.value || '',
              name: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value || null,
            });
            await userRepo.save(user);
            console.log('[Auth] New user created:', user.email);
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}
