import passport from 'passport';
import { PassportStatic } from 'passport';
import { User } from '../models/User';
import { configureGoogleStrategy } from './oauth/google.strategy';
import { configureGitHubStrategy } from './oauth/github.strategy';
import { configureFacebookStrategy } from './oauth/facebook.strategy';

export function configurePassport(passport: PassportStatic) {
  // Serialize user for session
  passport.serializeUser((user: any, done: any) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done: any) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Configure OAuth strategies
  configureGoogleStrategy(passport);
  configureGitHubStrategy(passport);
  configureFacebookStrategy(passport);
}