import { writeFileSafe } from "../utils.js";
import path from "path";
import fs from "fs";

export function generateE2ETestingSupport(targetRoot, options = {}) {
  const { ts = false, tools = ['playwright', 'cypress'] } = options;
  
  // E2E testing configuration
  const e2eConfig = generateE2EConfig(ts, tools);
  writeFileSafe(path.join(targetRoot, "src", "config", "e2e.config.js"), e2eConfig);
  
  // Test utilities
  const testUtils = generateTestUtils(ts);
  writeFileSafe(path.join(targetRoot, "tests", "utils", "test.utils.js"), testUtils);
  
  // Test fixtures
  generateTestFixtures(targetRoot, ts);
  
  // Test suites
  generateTestSuites(targetRoot, ts, tools);
  
  // Test data
  generateTestData(targetRoot);
  
  // Update package.json with E2E testing dependencies
  updatePackageJsonWithE2ETesting(targetRoot, tools);
  
  console.log(`🧪 E2E testing support added successfully!`);
}

function generateE2EConfig(ts, tools) {
  if (ts) {
    return `export const e2eConfig = {
  tools: ${JSON.stringify(tools)},
  
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

export default e2eConfig;`;
  } else {
    return `const e2eConfig = {
  tools: ${JSON.stringify(tools)},
  
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

module.exports = { e2eConfig };
module.exports.default = e2eConfig;
`;
  }
}

function generateTestUtils(ts) {
  if (ts) {
    return `import { Page, BrowserContext } from 'playwright';
import { e2eConfig } from '../../src/config/e2e.config';

export class TestUtils {
  private page: Page;
  private context: BrowserContext;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  // Navigation utilities
  async navigateTo(path: string): Promise<void> {
    const url = \`\${e2eConfig.environment.baseUrl}\${path}\`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForUrl(url: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForURL(url, { timeout });
  }

  // Element utilities
  async clickElement(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector);
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async waitForElement(selector: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  // Form utilities
  async fillForm(formData: Record<string, string>): Promise<void> {
    for (const [selector, value] of Object.entries(formData)) {
      await this.fillInput(selector, value);
    }
  }

  async submitForm(formSelector: string): Promise<void> {
    await this.page.click(\`\${formSelector} button[type="submit"]\`);
  }

  // Authentication utilities
  async loginAs(userType: 'admin' | 'user'): Promise<void> {
    const user = e2eConfig.testData.users[userType];
    await this.navigateTo('/login');
    await this.fillForm({
      'input[name="email"]': user.email,
      'input[name="password"]': user.password
    });
    await this.submitForm('form');
    await this.waitForUrl('/dashboard');
  }

  async logout(): Promise<void> {
    await this.clickElement('[data-testid="logout-button"]');
    await this.waitForUrl('/login');
  }

  // API utilities
  async makeApiRequest(endpoint: string, options: any = {}): Promise<any> {
    const response = await this.page.request.get(\`\${e2eConfig.testData.api.baseUrl}\${endpoint}\`, options);
    return await response.json();
  }

  async makeApiPost(endpoint: string, data: any): Promise<any> {
    const response = await this.page.request.post(\`\${e2eConfig.testData.api.baseUrl}\${endpoint}\`, {
      data
    });
    return await response.json();
  }

  // Screenshot utilities
  async takeScreenshot(name: string): Promise<void> {
    if (e2eConfig.screenshots.enabled) {
      await this.page.screenshot({ 
        path: \`\${e2eConfig.screenshots.path}/\${name}.png\`,
        fullPage: true
      });
    }
  }

  // Wait utilities
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForResponse(url: string): Promise<void> {
    await this.page.waitForResponse(response => response.url().includes(url));
  }

  // Assertion utilities
  async assertElementExists(selector: string): Promise<void> {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(\`Element \${selector} not found\`);
    }
  }

  async assertElementText(selector: string, expectedText: string): Promise<void> {
    const actualText = await this.getText(selector);
    if (actualText !== expectedText) {
      throw new Error(\`Expected text "\${expectedText}" but got "\${actualText}"\`);
    }
  }

  async assertUrlContains(text: string): Promise<void> {
    const url = this.page.url();
    if (!url.includes(text)) {
      throw new Error(\`Expected URL to contain "\${text}" but got "\${url}"\`);
    }
  }

  // Cleanup utilities
  async cleanup(): Promise<void> {
    // Clear cookies and local storage
    await this.context.clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

export default TestUtils;`;
  } else {
    return `const { e2eConfig } = require('../../src/config/e2e.config');

class TestUtils {
  constructor(page, context) {
    this.page = page;
    this.context = context;
  }

  // Navigation utilities
  async navigateTo(path) {
    const url = \`\${e2eConfig.environment.baseUrl}\${path}\`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForUrl(url, timeout = 5000) {
    await this.page.waitForURL(url, { timeout });
  }

  // Element utilities
  async clickElement(selector) {
    await this.page.click(selector);
  }

  async fillInput(selector, value) {
    await this.page.fill(selector, value);
  }

  async getText(selector) {
    return await this.page.textContent(selector);
  }

  async isVisible(selector) {
    return await this.page.isVisible(selector);
  }

  async waitForElement(selector, timeout = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  // Form utilities
  async fillForm(formData) {
    for (const [selector, value] of Object.entries(formData)) {
      await this.fillInput(selector, value);
    }
  }

  async submitForm(formSelector) {
    await this.page.click(\`\${formSelector} button[type="submit"]\`);
  }

  // Authentication utilities
  async loginAs(userType) {
    const user = e2eConfig.testData.users[userType];
    await this.navigateTo('/login');
    await this.fillForm({
      'input[name="email"]': user.email,
      'input[name="password"]': user.password
    });
    await this.submitForm('form');
    await this.waitForUrl('/dashboard');
  }

  async logout() {
    await this.clickElement('[data-testid="logout-button"]');
    await this.waitForUrl('/login');
  }

  // API utilities
  async makeApiRequest(endpoint, options = {}) {
    const response = await this.page.request.get(\`\${e2eConfig.testData.api.baseUrl}\${endpoint}\`, options);
    return await response.json();
  }

  async makeApiPost(endpoint, data) {
    const response = await this.page.request.post(\`\${e2eConfig.testData.api.baseUrl}\${endpoint}\`, {
      data
    });
    return await response.json();
  }

  // Screenshot utilities
  async takeScreenshot(name) {
    if (e2eConfig.screenshots.enabled) {
      await this.page.screenshot({ 
        path: \`\${e2eConfig.screenshots.path}/\${name}.png\`,
        fullPage: true
      });
    }
  }

  // Wait utilities
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForResponse(url) {
    await this.page.waitForResponse(response => response.url().includes(url));
  }

  // Assertion utilities
  async assertElementExists(selector) {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(\`Element \${selector} not found\`);
    }
  }

  async assertElementText(selector, expectedText) {
    const actualText = await this.getText(selector);
    if (actualText !== expectedText) {
      throw new Error(\`Expected text "\${expectedText}" but got "\${actualText}"\`);
    }
  }

  async assertUrlContains(text) {
    const url = this.page.url();
    if (!url.includes(text)) {
      throw new Error(\`Expected URL to contain "\${text}" but got "\${url}"\`);
    }
  }

  // Cleanup utilities
  async cleanup() {
    // Clear cookies and local storage
    await this.context.clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

module.exports = { TestUtils };
module.exports.default = TestUtils;
`;
  }
}

function generateTestFixtures(targetRoot, ts) {
  // Create test fixtures directory
  const fixturesDir = path.join(targetRoot, "tests", "fixtures");
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  
  // User fixtures
  const userFixtures = generateUserFixtures(ts);
  writeFileSafe(path.join(targetRoot, "tests", "fixtures", "users.js"), userFixtures);
  
  // API fixtures
  const apiFixtures = generateAPIFixtures(ts);
  writeFileSafe(path.join(targetRoot, "tests", "fixtures", "api.js"), apiFixtures);
  
  // Database fixtures
  const dbFixtures = generateDatabaseFixtures(ts);
  writeFileSafe(path.join(targetRoot, "tests", "fixtures", "database.js"), dbFixtures);
}

function generateUserFixtures(ts) {
  if (ts) {
    return `export const userFixtures = {
  admin: {
    id: 'admin-123',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  
  user: {
    id: 'user-123',
    email: 'user@test.com',
    password: 'user123',
    role: 'user',
    firstName: 'Regular',
    lastName: 'User',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  
  inactiveUser: {
    id: 'inactive-123',
    email: 'inactive@test.com',
    password: 'inactive123',
    role: 'user',
    firstName: 'Inactive',
    lastName: 'User',
    isActive: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  
  // Generate random user data
  generateRandomUser: () => ({
    id: \`user-\${Math.random().toString(36).substr(2, 9)}\`,
    email: \`test\${Math.random().toString(36).substr(2, 9)}@test.com\`,
    password: 'test123',
    role: 'user',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

export default userFixtures;`;
  } else {
    return `const userFixtures = {
  admin: {
    id: 'admin-123',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  
  user: {
    id: 'user-123',
    email: 'user@test.com',
    password: 'user123',
    role: 'user',
    firstName: 'Regular',
    lastName: 'User',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  
  inactiveUser: {
    id: 'inactive-123',
    email: 'inactive@test.com',
    password: 'inactive123',
    role: 'user',
    firstName: 'Inactive',
    lastName: 'User',
    isActive: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  
  // Generate random user data
  generateRandomUser: () => ({
    id: \`user-\${Math.random().toString(36).substr(2, 9)}\`,
    email: \`test\${Math.random().toString(36).substr(2, 9)}@test.com\`,
    password: 'test123',
    role: 'user',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

module.exports = { userFixtures };
module.exports.default = userFixtures;
`;
  }
}

function generateAPIFixtures(ts) {
  if (ts) {
    return `export const apiFixtures = {
  // API responses
  responses: {
    success: {
      status: 200,
      data: { message: 'Success' }
    },
    
    error: {
      status: 400,
      error: { message: 'Bad Request' }
    },
    
    unauthorized: {
      status: 401,
      error: { message: 'Unauthorized' }
    },
    
    forbidden: {
      status: 403,
      error: { message: 'Forbidden' }
    },
    
    notFound: {
      status: 404,
      error: { message: 'Not Found' }
    },
    
    serverError: {
      status: 500,
      error: { message: 'Internal Server Error' }
    }
  },
  
  // Mock data
  mockData: {
    users: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin'
      }
    ],
    
    products: [
      {
        id: '1',
        name: 'Product 1',
        price: 99.99,
        category: 'Electronics'
      },
      {
        id: '2',
        name: 'Product 2',
        price: 149.99,
        category: 'Clothing'
      }
    ]
  },
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      register: '/auth/register',
      refresh: '/auth/refresh'
    },
    
    users: {
      list: '/users',
      create: '/users',
      get: '/users/:id',
      update: '/users/:id',
      delete: '/users/:id'
    },
    
    products: {
      list: '/products',
      create: '/products',
      get: '/products/:id',
      update: '/products/:id',
      delete: '/products/:id'
    }
  }
};

export default apiFixtures;`;
  } else {
    return `const apiFixtures = {
  // API responses
  responses: {
    success: {
      status: 200,
      data: { message: 'Success' }
    },
    
    error: {
      status: 400,
      error: { message: 'Bad Request' }
    },
    
    unauthorized: {
      status: 401,
      error: { message: 'Unauthorized' }
    },
    
    forbidden: {
      status: 403,
      error: { message: 'Forbidden' }
    },
    
    notFound: {
      status: 404,
      error: { message: 'Not Found' }
    },
    
    serverError: {
      status: 500,
      error: { message: 'Internal Server Error' }
    }
  },
  
  // Mock data
  mockData: {
    users: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin'
      }
    ],
    
    products: [
      {
        id: '1',
        name: 'Product 1',
        price: 99.99,
        category: 'Electronics'
      },
      {
        id: '2',
        name: 'Product 2',
        price: 149.99,
        category: 'Clothing'
      }
    ]
  },
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      register: '/auth/register',
      refresh: '/auth/refresh'
    },
    
    users: {
      list: '/users',
      create: '/users',
      get: '/users/:id',
      update: '/users/:id',
      delete: '/users/:id'
    },
    
    products: {
      list: '/products',
      create: '/products',
      get: '/products/:id',
      update: '/products/:id',
      delete: '/products/:id'
    }
  }
};

module.exports = { apiFixtures };
module.exports.default = apiFixtures;
`;
  }
}

function generateDatabaseFixtures(ts) {
  if (ts) {
    return `export const databaseFixtures = {
  // Database setup
  setup: async (db: any) => {
    // Create test database
    await db.query('CREATE DATABASE IF NOT EXISTS test_db');
    await db.query('USE test_db');
    
    // Create tables
    await db.query(\`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    \`);
    
    await db.query(\`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    \`);
  },
  
  // Cleanup
  cleanup: async (db: any) => {
    await db.query('DROP DATABASE IF EXISTS test_db');
  },
  
  // Seed data
  seed: async (db: any) => {
    // Insert test users
    await db.query(\`
      INSERT INTO users (id, email, password, role, first_name, last_name) VALUES
      ('admin-123', 'admin@test.com', 'admin123', 'admin', 'Admin', 'User'),
      ('user-123', 'user@test.com', 'user123', 'user', 'Regular', 'User')
    \`);
    
    // Insert test products
    await db.query(\`
      INSERT INTO products (id, name, price, category, description) VALUES
      ('prod-1', 'Test Product 1', 99.99, 'Electronics', 'A test product'),
      ('prod-2', 'Test Product 2', 149.99, 'Clothing', 'Another test product')
    \`);
  }
};

export default databaseFixtures;`;
  } else {
    return `const databaseFixtures = {
  // Database setup
  setup: async (db) => {
    // Create test database
    await db.query('CREATE DATABASE IF NOT EXISTS test_db');
    await db.query('USE test_db');
    
    // Create tables
    await db.query(\`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    \`);
    
    await db.query(\`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    \`);
  },
  
  // Cleanup
  cleanup: async (db) => {
    await db.query('DROP DATABASE IF EXISTS test_db');
  },
  
  // Seed data
  seed: async (db) => {
    // Insert test users
    await db.query(\`
      INSERT INTO users (id, email, password, role, first_name, last_name) VALUES
      ('admin-123', 'admin@test.com', 'admin123', 'admin', 'Admin', 'User'),
      ('user-123', 'user@test.com', 'user123', 'user', 'Regular', 'User')
    \`);
    
    // Insert test products
    await db.query(\`
      INSERT INTO products (id, name, price, category, description) VALUES
      ('prod-1', 'Test Product 1', 99.99, 'Electronics', 'A test product'),
      ('prod-2', 'Test Product 2', 149.99, 'Clothing', 'Another test product')
    \`);
  }
};

module.exports = { databaseFixtures };
module.exports.default = databaseFixtures;
`;
  }
}

function generateTestSuites(targetRoot, ts, tools) {
  // Create test suites directory
  const suitesDir = path.join(targetRoot, "tests", "suites");
  if (!fs.existsSync(suitesDir)) {
    fs.mkdirSync(suitesDir, { recursive: true });
  }
  
  // Generate test suites for each tool
  tools.forEach(tool => {
    if (tool === 'playwright') {
      generatePlaywrightTests(targetRoot, ts);
    } else if (tool === 'cypress') {
      generateCypressTests(targetRoot, ts);
    }
  });
}

function generatePlaywrightTests(targetRoot) {
  // Playwright configuration
  const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/suites/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'tests/reports/playwright-results.json' }],
    ['junit', { outputFile: 'tests/reports/playwright-results.xml' }]
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});`;
  
  writeFileSafe(path.join(targetRoot, "playwright.config.js"), playwrightConfig);
  
  // Sample Playwright test
  const sampleTest = `import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils/test.utils';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    const testUtils = new TestUtils(page, context);
    await testUtils.cleanup();
  });

  test('should login successfully', async ({ page, context }) => {
    const testUtils = new TestUtils(page, context);
    
    await testUtils.navigateTo('/login');
    await testUtils.fillForm({
      'input[name="email"]': 'admin@test.com',
      'input[name="password"]': 'admin123'
    });
    await testUtils.submitForm('form');
    
    await testUtils.waitForUrl('/dashboard');
    await testUtils.assertElementExists('[data-testid="dashboard"]');
  });

  test('should logout successfully', async ({ page, context }) => {
    const testUtils = new TestUtils(page, context);
    
    await testUtils.loginAs('admin');
    await testUtils.logout();
    await testUtils.assertUrlContains('/login');
  });
});

test.describe('User Management', () => {
  test('should create new user', async ({ page, context }) => {
    const testUtils = new TestUtils(page, context);
    
    await testUtils.loginAs('admin');
    await testUtils.navigateTo('/users/create');
    
    await testUtils.fillForm({
      'input[name="firstName"]': 'John',
      'input[name="lastName"]': 'Doe',
      'input[name="email"]': 'john@example.com',
      'input[name="password"]': 'password123'
    });
    
    await testUtils.submitForm('form');
    await testUtils.assertElementText('.alert-success', 'User created successfully');
  });
});`;
  
  writeFileSafe(path.join(targetRoot, "tests", "suites", "playwright", "auth.spec.js"), sampleTest);
}

function generateCypressTests(targetRoot) {
  // Cypress configuration
  const cypressConfig = `const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
    supportFile: 'tests/support/e2e.js',
    specPattern: 'tests/suites/cypress/**/*.cy.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    }
  }
});`;
  
  writeFileSafe(path.join(targetRoot, "cypress.config.js"), cypressConfig);
  
  // Sample Cypress test
  const sampleTest = `describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@test.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('form').submit();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="dashboard"]').should('be.visible');
  });

  it('should logout successfully', () => {
    cy.loginAs('admin');
    cy.get('[data-testid="logout-button"]').click();
    cy.url().should('include', '/login');
  });
});

describe('User Management', () => {
  it('should create new user', () => {
    cy.loginAs('admin');
    cy.visit('/users/create');
    
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="lastName"]').type('Doe');
    cy.get('input[name="email"]').type('john@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('form').submit();
    
    cy.get('.alert-success').should('contain', 'User created successfully');
  });
});`;
  
  writeFileSafe(path.join(targetRoot, "tests", "suites", "cypress", "auth.cy.js"), sampleTest);
}

function generateTestData(targetRoot) {
  // Create test data directory
  const dataDir = path.join(targetRoot, "tests", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Test data files
  const testData = {
    users: [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin' }
    ],
    products: [
      { id: '1', name: 'Product 1', price: 99.99, category: 'Electronics' },
      { id: '2', name: 'Product 2', price: 149.99, category: 'Clothing' }
    ]
  };
  
  writeFileSafe(path.join(targetRoot, "tests", "data", "test-data.json"), JSON.stringify(testData, null, 2));
}

function updatePackageJsonWithE2ETesting(targetRoot, tools) {
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.devDependencies = pkg.devDependencies || {};
    pkg.scripts = pkg.scripts || {};
    
    // Add E2E testing dependencies
    const e2eDependencies = {
      playwright: {
        '@playwright/test': '^1.40.0',
        'playwright': '^1.40.0'
      },
      cypress: {
        'cypress': '^13.0.0'
      }
    };
    
    tools.forEach(tool => {
      if (e2eDependencies[tool]) {
        Object.assign(pkg.devDependencies, e2eDependencies[tool]);
      }
    });
    
    // Add E2E testing scripts
    pkg.scripts['test:e2e'] = 'playwright test';
    pkg.scripts['test:e2e:ui'] = 'playwright test --ui';
    pkg.scripts['test:e2e:headed'] = 'playwright test --headed';
    pkg.scripts['test:e2e:debug'] = 'playwright test --debug';
    pkg.scripts['test:e2e:cypress'] = 'cypress run';
    pkg.scripts['test:e2e:cypress:open'] = 'cypress open';
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with E2E testing dependencies:", error);
  }
}
