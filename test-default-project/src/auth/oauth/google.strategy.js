import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PassportStatic } from 'passport';
import { User } from '../../models/User';

export function configureGoogleStrategy(passport: PassportStatic) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Find or create user
        let user = await User.findOne({ 
          where: { 
            googleId: profile.id 
          } 
        });

        if (!user) {
          // Create new user
          user = await User.create({
            googleId: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || profile.name?.givenName || '',
            avatar: profile.photos?.[0]?.value || '',
            provider: 'google',
            verified: true
          });
        } else {
          // Update existing user
          user.email = profile.emails?.[0]?.value || user.email;
          user.name = profile.displayName || profile.name?.givenName || user.name;
          user.avatar = profile.photos?.[0]?.value || user.avatar;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
}