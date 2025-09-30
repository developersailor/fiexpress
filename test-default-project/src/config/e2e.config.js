export const e2eConfig = {
  tools: ["playwright","cypress"],
  
  // Test environment configuration
  environment: {
    baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.E2E_TIMEOUT || '30000'),
    retries: parseInt(process.env.E2E_RETRIES || '2'),
    headless: process.env.E2E_HEADLESS === 'true',
    slowMo: parseInt(process.env.E2E_SLOW_MO || '0')
  },
  
  // Browser configuration
  browsers: {
    chromium: process.env.E2E_BROWSER_CHROMIUM !== 'false',
    firefox: process.env.E2E_BROWSER_FIREFOX === 'true',
    webkit: process.env.E2E_BROWSER_WEBKIT === 'true'
  },
  
  // Test data configuration
  testData: {
    users: {
      admin: {
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      },
      user: {
        email: 'user@test.com',
        password: 'user123',
        role: 'user'
      }
    },
    api: {
      baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
      timeout: 10000
    }
  },
  
  // Screenshot configuration
  screenshots: {
    enabled: process.env.E2E_SCREENSHOTS === 'true',
    path: 'tests/screenshots',
    onFailure: true,
    onSuccess: false
  },
  
  // Video configuration
  video: {
    enabled: process.env.E2E_VIDEO === 'true',
    path: 'tests/videos',
    onFailure: true,
    onSuccess: false
  },
  
  // Report configuration
  reports: {
    html: {
      enabled: true,
      path: 'tests/reports/html'
    },
    json: {
      enabled: true,
      path: 'tests/reports/json'
    },
    junit: {
      enabled: true,
      path: 'tests/reports/junit'
    }
  }
};

export default e2eConfig;