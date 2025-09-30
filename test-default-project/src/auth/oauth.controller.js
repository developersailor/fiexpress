import { Request, Response } from 'express';
import passport from 'passport';

export class OAuthController {
  // OAuth login
  async login(req: Request, res: Response, provider: string) {
    passport.authenticate(provider, {
      scope: provider === 'google' ? ['profile', 'email'] : 
             provider === 'github' ? ['user:email'] : 
             ['email']
    })(req, res);
  }

  // OAuth callback
  async callback(req: Request, res: Response, provider: string) {
    passport.authenticate(provider, (err: any, user: any) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Authentication failed',
          error: err.message
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }

      // Create session
      req.logIn(user, (err: any) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Session creation failed',
            error: err.message
          });
        }

        return res.json({
          success: true,
          message: 'Authentication successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            provider: user.provider
          }
        });
      });
    })(req, res);
  }

  // Logout
  async logout(req: Request, res: Response) {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Logout failed',
          error: err.message
        });
      }

      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Session destruction failed',
            error: err.message
          });
        }

        res.clearCookie('connect.sid');
        return res.json({
          success: true,
          message: 'Logout successful'
        });
      });
    });
  }

  // Get current user
  async getCurrentUser(req: Request, res: Response) {
    if (req.isAuthenticated()) {
      return res.json({
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          avatar: req.user.avatar,
          provider: req.user.provider
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
}