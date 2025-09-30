import { Strategy as GitHubStrategy } from 'passport-github2';
import { PassportStatic } from 'passport';
import { User } from '../../models/User';

export function configureGitHubStrategy(passport: PassportStatic) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Find or create user
        let user = await User.findOne({ 
          where: { 
            githubId: profile.id 
          } 
        });

        if (!user) {
          // Create new user
          user = await User.create({
            githubId: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || profile.name?.givenName || '',
            avatar: profile.photos?.[0]?.value || '',
            provider: 'github',
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