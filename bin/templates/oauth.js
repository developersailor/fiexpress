import { writeFileSafe } from "../utils.js";
import path from "path";

export function generateOAuthSupport(targetRoot, options = {}) {
  const { ts = false, providers = ['google', 'github', 'facebook'] } = options;
  
  // OAuth strategies
  generateOAuthStrategies(targetRoot, ts, providers);
  
  // Passport configuration
  const passportConfig = generatePassportConfig(ts, providers);
  writeFileSafe(path.join(targetRoot, "src", "auth", "passport.config.js"), passportConfig);
  
  // OAuth controller
  const oauthController = generateOAuthController(ts, providers);
  writeFileSafe(path.join(targetRoot, "src", "auth", "oauth.controller.js"), oauthController);
  
  // Auth middleware
  const authMiddleware = generateAuthMiddleware(ts);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "auth.middleware.js"), authMiddleware);
  
  // OAuth routes
  const oauthRoutes = generateOAuthRoutes(ts, providers);
  writeFileSafe(path.join(targetRoot, "src", "routes", "oauth.js"), oauthRoutes);
  
  // Environment variables
  const envExample = generateOAuthEnvExample(providers);
  writeFileSafe(path.join(targetRoot, ".env.example"), envExample);
  
  // Update package.json with OAuth dependencies
  updatePackageJsonWithOAuth(targetRoot, providers);
  
  console.log("🔐 OAuth2 authentication added successfully!");
}

function generateOAuthStrategies(targetRoot, ts, providers) {
  providers.forEach(provider => {
    const strategy = generateOAuthStrategy(ts, provider);
    writeFileSafe(path.join(targetRoot, "src", "auth", "oauth", `${provider}.strategy.js`), strategy);
  });
}

function generateOAuthStrategy(ts, provider) {
  const providerConfig = getProviderConfig(provider);
  
  if (ts) {
    return `import { Strategy as ${providerConfig.strategyName} } from '${providerConfig.package}';
import { PassportStatic } from 'passport';
import { User } from '../../models/User';

export function configure${providerConfig.className}Strategy(passport: PassportStatic) {
  passport.use(new ${providerConfig.strategyName}(
    {
      clientID: process.env.${providerConfig.envClientId} || '',
      clientSecret: process.env.${providerConfig.envClientSecret} || '',
      callbackURL: process.env.${providerConfig.envCallbackUrl} || '/auth/${provider}/callback',
      ${providerConfig.scope ? `scope: ${providerConfig.scope},` : ''}
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Find or create user
        let user = await User.findOne({ 
          where: { 
            ${providerConfig.profileField}: profile.id 
          } 
        });

        if (!user) {
          // Create new user
          user = await User.create({
            ${providerConfig.profileField}: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || profile.name?.givenName || '',
            avatar: profile.photos?.[0]?.value || '',
            provider: '${provider}',
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
}`;
  } else {
    return `const { Strategy: ${providerConfig.strategyName} } = require('${providerConfig.package}');
const { User } = require('../../models/User');

function configure${providerConfig.className}Strategy(passport) {
  passport.use(new ${providerConfig.strategyName}(
    {
      clientID: process.env.${providerConfig.envClientId} || '',
      clientSecret: process.env.${providerConfig.envClientSecret} || '',
      callbackURL: process.env.${providerConfig.envCallbackUrl} || '/auth/${provider}/callback',
      ${providerConfig.scope ? `scope: ${providerConfig.scope},` : ''}
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        let user = await User.findOne({ 
          where: { 
            ${providerConfig.profileField}: profile.id 
          } 
        });

        if (!user) {
          // Create new user
          user = await User.create({
            ${providerConfig.profileField}: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || profile.name?.givenName || '',
            avatar: profile.photos?.[0]?.value || '',
            provider: '${provider}',
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

module.exports = { configure${providerConfig.className}Strategy };
`;
  }
}

function getProviderConfig(provider) {
  const configs = {
    google: {
      package: 'passport-google-oauth20',
      strategyName: 'GoogleStrategy',
      className: 'Google',
      envClientId: 'GOOGLE_CLIENT_ID',
      envClientSecret: 'GOOGLE_CLIENT_SECRET',
      envCallbackUrl: 'GOOGLE_CALLBACK_URL',
      profileField: 'googleId',
      scope: "['profile', 'email']"
    },
    github: {
      package: 'passport-github2',
      strategyName: 'GitHubStrategy',
      className: 'GitHub',
      envClientId: 'GITHUB_CLIENT_ID',
      envClientSecret: 'GITHUB_CLIENT_SECRET',
      envCallbackUrl: 'GITHUB_CALLBACK_URL',
      profileField: 'githubId',
      scope: "['user:email']"
    },
    facebook: {
      package: 'passport-facebook',
      strategyName: 'FacebookStrategy',
      className: 'Facebook',
      envClientId: 'FACEBOOK_APP_ID',
      envClientSecret: 'FACEBOOK_APP_SECRET',
      envCallbackUrl: 'FACEBOOK_CALLBACK_URL',
      profileField: 'facebookId',
      scope: "['email']"
    }
  };
  
  return configs[provider] || configs.google;
}

function generatePassportConfig(ts, providers) {
  if (ts) {
    return `import passport from 'passport';
import { PassportStatic } from 'passport';
import { User } from '../models/User';
${providers.map(provider => {
  const config = getProviderConfig(provider);
  return `import { configure${config.className}Strategy } from './oauth/${provider}.strategy';`;
}).join('\n')}

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
${providers.map(provider => {
  const config = getProviderConfig(provider);
  return `  configure${config.className}Strategy(passport);`;
}).join('\n')}
}`;
  } else {
    return `const passport = require('passport');
const { User } = require('../models/User');
${providers.map(provider => {
  const config = getProviderConfig(provider);
  return `const { configure${config.className}Strategy } = require('./oauth/${provider}.strategy');`;
}).join('\n')}

function configurePassport(passport) {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Configure OAuth strategies
${providers.map(provider => {
  const config = getProviderConfig(provider);
  return `  configure${config.className}Strategy(passport);`;
}).join('\n')}
}

module.exports = { configurePassport };
`;
  }
}

function generateOAuthController(ts) {
  if (ts) {
    return `import { Request, Response } from 'express';
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
}`;
  } else {
    return `const passport = require('passport');

class OAuthController {
  // OAuth login
  async login(req, res, provider) {
    passport.authenticate(provider, {
      scope: provider === 'google' ? ['profile', 'email'] : 
             provider === 'github' ? ['user:email'] : 
             ['email']
    })(req, res);
  }

  // OAuth callback
  async callback(req, res, provider) {
    passport.authenticate(provider, (err, user) => {
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
      req.logIn(user, (err) => {
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
  async logout(req, res) {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Logout failed',
          error: err.message
        });
      }

      req.session.destroy((err) => {
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
  async getCurrentUser(req, res) {
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

module.exports = { OAuthController };
`;
  }
}

function generateAuthMiddleware(ts) {
  if (ts) {
    return `import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
}

export function requireGuest(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Already authenticated'
  });
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // Always continue, but add user info if available
  if (req.isAuthenticated()) {
    req.user = req.user;
  }
  next();
}`;
  } else {
    return `function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
}

function requireGuest(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Already authenticated'
  });
}

function optionalAuth(req, res, next) {
  // Always continue, but add user info if available
  if (req.isAuthenticated()) {
    req.user = req.user;
  }
  next();
}

module.exports = {
  requireAuth,
  requireGuest,
  optionalAuth
};
`;
  }
}

function generateOAuthRoutes(ts, providers) {
  if (ts) {
    return `import express from 'express';
import passport from 'passport';
import { OAuthController } from '../auth/oauth.controller';
import { requireAuth, requireGuest } from '../middleware/auth.middleware';

const router = express.Router();
const oauthController = new OAuthController();

// OAuth login routes
${providers.map(provider => {
  return `router.get('/${provider}', requireGuest, (req, res) => {
  oauthController.login(req, res, '${provider}');
});

router.get('/${provider}/callback', requireGuest, (req, res) => {
  oauthController.callback(req, res, '${provider}');
});`;
}).join('\n\n')}

// Logout route
router.post('/logout', requireAuth, (req, res) => {
  oauthController.logout(req, res);
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
  oauthController.getCurrentUser(req, res);
});

export default router;`;
  } else {
    return `const express = require('express');
const passport = require('passport');
const { OAuthController } = require('../auth/oauth.controller');
const { requireAuth, requireGuest } = require('../middleware/auth.middleware');

const router = express.Router();
const oauthController = new OAuthController();

// OAuth login routes
${providers.map(provider => {
  return `router.get('/${provider}', requireGuest, (req, res) => {
  oauthController.login(req, res, '${provider}');
});

router.get('/${provider}/callback', requireGuest, (req, res) => {
  oauthController.callback(req, res, '${provider}');
});`;
}).join('\n\n')}

// Logout route
router.post('/logout', requireAuth, (req, res) => {
  oauthController.logout(req, res);
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
  oauthController.getCurrentUser(req, res);
});

module.exports = router;
`;
  }
}

function generateOAuthEnvExample(providers) {
  const envVars = providers.map(provider => {
    const config = getProviderConfig(provider);
    return `# ${provider.toUpperCase()} OAuth Configuration
${config.envClientId}=your_${provider}_client_id
${config.envClientSecret}=your_${provider}_client_secret
${config.envCallbackUrl}=http://localhost:3000/auth/${provider}/callback`;
  }).join('\n\n');

  return `# OAuth Configuration
${envVars}

# Session Configuration
SESSION_SECRET=your_session_secret_key
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_HTTP_ONLY=true
SESSION_COOKIE_MAX_AGE=86400000

# Database Configuration
DB_URL=postgresql://username:password@localhost:5432/database_name

# Server Configuration
PORT=3000
NODE_ENV=development`;
}

function updatePackageJsonWithOAuth(targetRoot, providers) {
  const fs = require('fs');
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["passport"] = "^0.7.0";
    pkg.dependencies["express-session"] = "^1.17.3";
    
    // Add provider-specific dependencies
    providers.forEach(provider => {
      const config = getProviderConfig(provider);
      pkg.dependencies[config.package] = getProviderVersion(provider);
    });
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with OAuth dependencies:", error);
  }
}

function getProviderVersion(provider) {
  const versions = {
    google: "^2.0.0",
    github: "^0.1.12",
    facebook: "^3.0.0"
  };
  
  return versions[provider] || "^2.0.0";
}
