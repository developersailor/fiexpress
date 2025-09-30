export const securityConfig = {
  // Helmet.js configuration
  helmet: {
  "contentSecurityPolicy": {
    "directives": {
      "defaultSrc": [
        "'self'"
      ],
      "styleSrc": [
        "'self'",
        "'unsafe-inline'"
      ],
      "scriptSrc": [
        "'self'"
      ],
      "imgSrc": [
        "'self'",
        "data:",
        "https:"
      ],
      "connectSrc": [
        "'self'"
      ],
      "fontSrc": [
        "'self'"
      ],
      "objectSrc": [
        "'none'"
      ],
      "mediaSrc": [
        "'self'"
      ],
      "frameSrc": [
        "'none'"
      ]
    }
  },
  "crossOriginEmbedderPolicy": false,
  "hsts": {
    "maxAge": 31536000,
    "includeSubDomains": true,
    "preload": true
  }
},
  
  // CSRF protection
  csrf: {
  "cookie": {
    "httpOnly": true,
    "secure": false,
    "sameSite": "strict"
  },
  "ignoreMethods": [
    "GET",
    "HEAD",
    "OPTIONS"
  ]
},
  
  // Rate limiting
  rateLimit: {
  "windowMs": 900000,
  "max": 100,
  "message": "Too many requests from this IP, please try again later.",
  "standardHeaders": true,
  "legacyHeaders": false
},
  
  // Input validation
  validation: {
  "sanitize": true,
  "escapeHtml": true,
  "trimWhitespace": true,
  "removeNullBytes": true
},
  
  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  },
  
  // OWASP compliance
  owasp: {
    enabled: true,
    rules: [
      'A01:2021 – Broken Access Control',
      'A02:2021 – Cryptographic Failures',
      'A03:2021 – Injection',
      'A04:2021 – Insecure Design',
      'A05:2021 – Security Misconfiguration',
      'A06:2021 – Vulnerable and Outdated Components',
      'A07:2021 – Identification and Authentication Failures',
      'A08:2021 – Software and Data Integrity Failures',
      'A09:2021 – Security Logging and Monitoring Failures',
      'A10:2021 – Server-Side Request Forgery'
    ]
  }
};

export default securityConfig;