import { Strategy as FacebookStrategy } from 'passport-facebook';
import { PassportStatic } from 'passport';
import { User } from '../../models/User';

export function configureFacebookStrategy(passport: PassportStatic) {
  passport.use(new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/auth/facebook/callback',
      scope: ['email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Find or create user
        let user = await User.findOne({ 
          where: { 
            facebookId: profile.id 
          } 
        });

        if (!user) {
          // Create new user
          user = await User.create({
            facebookId: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || profile.name?.givenName || '',
            avatar: profile.photos?.[0]?.value || '',
            provider: 'facebook',
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