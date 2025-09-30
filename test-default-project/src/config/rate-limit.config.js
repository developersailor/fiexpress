export const rateLimitConfig = {
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