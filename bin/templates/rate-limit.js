import { writeFileSafe } from "../utils.js";
import path from "path";

export function generateRateLimitSupport(targetRoot, options = {}) {
  const { ts = false, redis = false } = options;
  
  // Rate limit middleware
  const rateLimitMiddleware = generateRateLimitMiddleware(ts, redis);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "rate-limit.middleware.js"), rateLimitMiddleware);
  
  // Rate limit configuration
  const rateLimitConfig = generateRateLimitConfig(ts, redis);
  writeFileSafe(path.join(targetRoot, "src", "config", "rate-limit.config.js"), rateLimitConfig);
  
  // Throttle middleware
  const throttleMiddleware = generateThrottleMiddleware(ts);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "throttle.middleware.js"), throttleMiddleware);
  
  // Rate limit routes
  const rateLimitRoutes = generateRateLimitRoutes(ts);
  writeFileSafe(path.join(targetRoot, "src", "routes", "rate-limit.js"), rateLimitRoutes);
  
  // Update package.json with rate limiting dependencies
  updatePackageJsonWithRateLimit(targetRoot, redis);
  
  console.log("🚦 Rate limiting added successfully!");
}

function generateRateLimitMiddleware(ts, redis) {
  
  if (ts) {
    return `import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response, NextFunction } from 'express';
${redis ? `import { createClient } from 'redis';

// Redis client for distributed rate limiting
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.connect();` : ''}

// Basic rate limiting
export const basicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the \`RateLimit-*\` headers
  legacyHeaders: false, // Disable the \`X-RateLimit-*\` headers
  ${redis ? `store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
  }),` : ''}
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ${redis ? `store: new RedisStore({
    client: redisClient,
    prefix: 'auth:',
  }),` : ''}
});

// API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ${redis ? `store: new RedisStore({
    client: redisClient,
    prefix: 'api:',
  }),` : ''}
});

// Slow down middleware
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // add 500ms delay per request above delayAfter
  maxDelayMs: 20000, // max delay of 20 seconds
  ${redis ? `store: new RedisStore({
    client: redisClient,
    prefix: 'slow:',
  }),` : ''}
});

// Custom rate limiting by user
export const createUserRateLimit = (maxRequests: number, windowMs: number) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return (req as any).user?.id || req.ip;
    },
    message: {
      error: 'User rate limit exceeded, please try again later.',
      retryAfter: \`\${Math.ceil(windowMs / 1000)} seconds\`
    },
    standardHeaders: true,
    legacyHeaders: false,
    ${redis ? `store: new RedisStore({
      client: redisClient,
      prefix: 'user:',
    }),` : ''}
  });
};

// Rate limit bypass for trusted IPs
export const trustedIPs = [
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1'
];

export const bypassRateLimit = (req: Request, res: Response, next: NextFunction) => {
  if (trustedIPs.includes(req.ip)) {
    return next();
  }
  return basicRateLimit(req, res, next);
};`;
  } else {
    return `const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
${redis ? `const { createClient } = require('redis');

// Redis client for distributed rate limiting
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.connect();` : ''}

// Basic rate limiting
const basicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the \`RateLimit-*\` headers
  legacyHeaders: false, // Disable the \`X-RateLimit-*\` headers
  ${redis ? `store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
  }),` : ''}
});

// Strict rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ${redis ? `store: new RedisStore({
    client: redisClient,
    prefix: 'auth:',
  }),` : ''}
});

// API rate limiting
const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ${redis ? `store: new RedisStore({
    client: redisClient,
    prefix: 'api:',
  }),` : ''}
});

// Slow down middleware
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // add 500ms delay per request above delayAfter
  maxDelayMs: 20000, // max delay of 20 seconds
  ${redis ? `store: new RedisStore({
    client: redisClient,
    prefix: 'slow:',
  }),` : ''}
});

// Custom rate limiting by user
const createUserRateLimit = (maxRequests, windowMs) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.id || req.ip;
    },
    message: {
      error: 'User rate limit exceeded, please try again later.',
      retryAfter: \`\${Math.ceil(windowMs / 1000)} seconds\`
    },
    standardHeaders: true,
    legacyHeaders: false,
    ${redis ? `store: new RedisStore({
      client: redisClient,
      prefix: 'user:',
    }),` : ''}
  });
};

// Rate limit bypass for trusted IPs
const trustedIPs = [
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1'
];

const bypassRateLimit = (req, res, next) => {
  if (trustedIPs.includes(req.ip)) {
    return next();
  }
  return basicRateLimit(req, res, next);
};

module.exports = {
  basicRateLimit,
  authRateLimit,
  apiRateLimit,
  speedLimiter,
  createUserRateLimit,
  bypassRateLimit
};`;
  }
}

function generateRateLimitConfig(ts, redis) {
  
  if (ts) {
    return `export const rateLimitConfig = {
  // Basic rate limiting
  basic: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    }
  },
  
  // Authentication rate limiting
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // requests per window
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    }
  },
  
  // API rate limiting
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // requests per window
    message: {
      error: 'API rate limit exceeded, please try again later.',
      retryAfter: '1 minute'
    }
  },
  
  // Upload rate limiting
  upload: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // requests per window
    message: {
      error: 'Too many upload attempts, please try again later.',
      retryAfter: '5 minutes'
    }
  },
  
  // Search rate limiting
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // requests per window
    message: {
      error: 'Search rate limit exceeded, please try again later.',
      retryAfter: '1 minute'
    }
  },
  
  // Redis configuration (if enabled)
  ${redis ? `redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: 'rate-limit:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },` : ''}
  
  // Trusted IPs (bypass rate limiting)
  trustedIPs: [
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1'
  ],
  
  // Rate limit headers
  headers: {
    standardHeaders: true,
    legacyHeaders: false
  }
};`;
  } else {
    return `const rateLimitConfig = {
  // Basic rate limiting
  basic: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    }
  },
  
  // Authentication rate limiting
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // requests per window
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    }
  },
  
  // API rate limiting
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // requests per window
    message: {
      error: 'API rate limit exceeded, please try again later.',
      retryAfter: '1 minute'
    }
  },
  
  // Upload rate limiting
  upload: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // requests per window
    message: {
      error: 'Too many upload attempts, please try again later.',
      retryAfter: '5 minutes'
    }
  },
  
  // Search rate limiting
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // requests per window
    message: {
      error: 'Search rate limit exceeded, please try again later.',
      retryAfter: '1 minute'
    }
  },
  
  // Redis configuration (if enabled)
  ${redis ? `redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: 'rate-limit:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },` : ''}
  
  // Trusted IPs (bypass rate limiting)
  trustedIPs: [
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1'
  ],
  
  // Rate limit headers
  headers: {
    standardHeaders: true,
    legacyHeaders: false
  }
};

module.exports = { rateLimitConfig };
`;
  }
}

function generateThrottleMiddleware(ts) {
  
  if (ts) {
    return `import slowDown from 'express-slow-down';
import { Request, Response, NextFunction } from 'express';

// General throttling
export const generalThrottle = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // add 500ms delay per request above delayAfter
  maxDelayMs: 20000, // max delay of 20 seconds
});

// API throttling
export const apiThrottle = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 30, // allow 30 requests per minute, then...
  delayMs: 200, // add 200ms delay per request above delayAfter
  maxDelayMs: 10000, // max delay of 10 seconds
});

// Search throttling
export const searchThrottle = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 10, // allow 10 requests per minute, then...
  delayMs: 1000, // add 1s delay per request above delayAfter
  maxDelayMs: 5000, // max delay of 5 seconds
});

// Custom throttling by user
export const createUserThrottle = (delayAfter: number, delayMs: number, maxDelayMs: number) => {
  return slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter,
    delayMs,
    maxDelayMs,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return (req as any).user?.id || req.ip;
    }
  });
};`;
  } else {
    return `const slowDown = require('express-slow-down');

// General throttling
const generalThrottle = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // add 500ms delay per request above delayAfter
  maxDelayMs: 20000, // max delay of 20 seconds
});

// API throttling
const apiThrottle = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 30, // allow 30 requests per minute, then...
  delayMs: 200, // add 200ms delay per request above delayAfter
  maxDelayMs: 10000, // max delay of 10 seconds
});

// Search throttling
const searchThrottle = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 10, // allow 10 requests per minute, then...
  delayMs: 1000, // add 1s delay per request above delayAfter
  maxDelayMs: 5000, // max delay of 5 seconds
});

// Custom throttling by user
const createUserThrottle = (delayAfter, delayMs, maxDelayMs) => {
  return slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter,
    delayMs,
    maxDelayMs,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.id || req.ip;
    }
  });
};

module.exports = {
  generalThrottle,
  apiThrottle,
  searchThrottle,
  createUserThrottle
};
`;
  }
}

function generateRateLimitRoutes(ts) {
  
  if (ts) {
    return `import express from 'express';
import { basicRateLimit, authRateLimit, apiRateLimit } from '../middleware/rate-limit.middleware';

const router = express.Router();

/**
 * @swagger
 * /rate-limit/status:
 *   get:
 *     summary: Get rate limit status
 *     tags: [Rate Limit]
 *     responses:
 *       200:
 *         description: Rate limit status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: active
 *                 limits:
 *                   type: object
 *                   properties:
 *                     basic:
 *                       type: object
 *                     auth:
 *                       type: object
 *                     api:
 *                       type: object
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    limits: {
      basic: {
        windowMs: 15 * 60 * 1000,
        max: 100
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5
      },
      api: {
        windowMs: 1 * 60 * 1000,
        max: 60
      }
    }
  });
});

// Apply rate limiting to all routes
router.use(basicRateLimit);

export default router;`;
  } else {
    return `const express = require('express');
const { basicRateLimit, authRateLimit, apiRateLimit } = require('../middleware/rate-limit.middleware');

const router = express.Router();

/**
 * @swagger
 * /rate-limit/status:
 *   get:
 *     summary: Get rate limit status
 *     tags: [Rate Limit]
 *     responses:
 *       200:
 *         description: Rate limit status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: active
 *                 limits:
 *                   type: object
 *                   properties:
 *                     basic:
 *                       type: object
 *                     auth:
 *                       type: object
 *                     api:
 *                       type: object
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    limits: {
      basic: {
        windowMs: 15 * 60 * 1000,
        max: 100
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5
      },
      api: {
        windowMs: 1 * 60 * 1000,
        max: 60
      }
    }
  });
});

// Apply rate limiting to all routes
router.use(basicRateLimit);

module.exports = router;
`;
  }
}

function updatePackageJsonWithRateLimit(targetRoot, redis) {
  const fs = require('fs');
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["express-rate-limit"] = "^7.1.0";
    pkg.dependencies["express-slow-down"] = "^2.0.1";
    
    if (redis) {
      pkg.dependencies["redis"] = "^4.6.0";
    }
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with rate limiting dependencies:", error);
  }
}
