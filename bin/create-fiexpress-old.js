#!/usr/bin/env node
import { spawn } from "child_process";
import readline from "readline";
import process from "process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(q) {
  return new Promise((res) => rl.question(q, (a) => res((a || "").trim())));
}

function writeFileSafe(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function addDepsToPackageJson(targetRoot, deps = {}, devDeps = {}) {
  const pkgPath = path.join(targetRoot, "package.json");
  let pkg = { name: path.basename(targetRoot), version: "1.0.0" };
  try {
    const raw = fs.readFileSync(pkgPath, "utf8");
    pkg = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};
  for (const [k, v] of Object.entries(deps)) pkg.dependencies[k] = v;
  for (const [k, v] of Object.entries(devDeps)) pkg.devDependencies[k] = v;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

function sanitizeGeneratedPackageJson(targetRoot) {
  const pkgPath = path.join(targetRoot, "package.json");
  try {
    const raw = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    pkg.name =
      pkg.name && pkg.name !== "" ? pkg.name : path.basename(targetRoot);
    if (pkg.bin) delete pkg.bin;
    if (pkg.dependencies && pkg.dependencies.degit)
      delete pkg.dependencies.degit;
    if (pkg.devDependencies && pkg.devDependencies.degit)
      delete pkg.devDependencies.degit;
    if (pkg.publishConfig) delete pkg.publishConfig;
    if (pkg.files) delete pkg.files;
    if (pkg.repository) delete pkg.repository;
    if (pkg.homepage) delete pkg.homepage;
    if (pkg.bugs) delete pkg.bugs;
    if (
      pkg.scripts &&
      pkg.scripts.prepare &&
      pkg.scripts.prepare.includes("husky")
    )
      delete pkg.scripts.prepare;
    if (pkg.devDependencies && pkg.devDependencies.husky)
      delete pkg.devDependencies.husky;

    try {
      const binDir = path.join(targetRoot, "bin");
      if (fs.existsSync(binDir))
        fs.rmSync(binDir, { recursive: true, force: true });
      const cliFile = path.join(targetRoot, "create-fiexpress.js");
      if (fs.existsSync(cliFile)) fs.rmSync(cliFile, { force: true });
    } catch {
      /* ignore */
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    // Package.json sanitized
  } catch (e) {
    console.error("Failed to sanitize package.json", e);
  }
}

function copyLocalTemplateToDst(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
}

async function runPostClone(targetRoot) {
  // Running post-clone scaffolding
  const ext = process.env.FIEXPRESS_TS === "yes" ? "ts" : "js";

  if (process.env.FIEXPRESS_DOTENV === "yes") {
    const envExample = `PORT=3000\nDB_URL=\nJWT_SECRET=your_jwt_secret\n`;
    writeFileSafe(path.join(targetRoot, ".env.example"), envExample);
    // Added .env.example
  }

  const toInstall = { deps: {}, dev: {} };
  const selectedDb = (process.env.FIEXPRESS_DB || "postgres").toLowerCase();
  let selectedOrm = (process.env.FIEXPRESS_ORM || "").toLowerCase();
  if ((!selectedOrm || selectedOrm === "none") && selectedDb) {
    if (selectedDb === "mongo") selectedOrm = "mongoose";
    else if (selectedDb === "postgres" || selectedDb === "mysql")
      selectedOrm = "sequelize";
    else selectedOrm = "sequelize";
    // Auto-selected ORM
  }
  process.env.FIEXPRESS_ORM = selectedOrm;

  const orm = process.env.FIEXPRESS_ORM;
  const dbForDriver = selectedDb;

  if (orm && orm !== "none") {
    if (orm === "prisma") {
      toInstall.deps["@prisma/client"] = "^5.0.0";
      toInstall.dev["prisma"] = "^5.0.0";
      if (dbForDriver === "mysql") toInstall.deps["mysql2"] = "^3.5.0";
      else if (dbForDriver === "postgres") toInstall.deps["pg"] = "^8.11.0";
      writeFileSafe(
        path.join(targetRoot, "prisma", "schema.prisma"),
        `generator client {\n  provider = "prisma-client-js"\n}\n\nmodel User {\n  id String @id @default(cuid())\n  email String @unique\n  name String?\n}\n`,
      );
      // Added prisma schema stub
    } else if (orm === "sequelize") {
      toInstall.deps["sequelize"] = "^6.32.1";
      if (dbForDriver === "mysql") toInstall.deps["mysql2"] = "^3.5.0";
      else {
        toInstall.deps["pg"] = "^8.11.0";
        toInstall.deps["pg-hstore"] = "^2.3.4";
      }
      writeFileSafe(
        path.join(targetRoot, "src", "db", `sequelize.${ext}`),
        `import { Sequelize } from 'sequelize';\nexport const sequelize = new Sequelize(process.env.DB_URL || 'postgres://localhost/db');\n`,
      );
      writeFileSafe(
        path.join(targetRoot, "src", "models", `User.${ext}`),
        `import { DataTypes } from 'sequelize';\nimport { sequelize } from '../db/sequelize.${ext}';\nexport const User = sequelize.define('User', {\n  email: { type: DataTypes.STRING, unique: true },\n  name: DataTypes.STRING,\n});\n`,
      );
      // Added sequelize stubs
    } else if (orm === "drizzle") {
      toInstall.deps["drizzle-orm"] = "^1.0.0";
      if (dbForDriver === "mysql") toInstall.deps["mysql2"] = "^3.5.0";
      else toInstall.deps["pg"] = "^8.11.0";
      writeFileSafe(
        path.join(targetRoot, "src", "db", `drizzle.${ext}`),
        `// drizzle-orm connection stub\nimport { drizzle } from 'drizzle-orm/node-postgres';\n// configure with pg pool\n`,
      );
      // Added drizzle stubs
    } else if (orm === "mongoose" || orm === "mongo") {
      toInstall.deps["mongoose"] = "^7.6.0";
      writeFileSafe(
        path.join(targetRoot, "src", "db", `mongo.${ext}`),
        `import mongoose from 'mongoose';\nexport async function connect(url){\n  return mongoose.connect(url);\n}\n`,
      );
      // Added Mongoose stubs
    }
  }

  if (process.env.FIEXPRESS_JWT === "yes") {
    toInstall.deps["jsonwebtoken"] = "^9.0.0";
    toInstall.deps["bcryptjs"] = "^2.4.3";
    
    if (process.env.FIEXPRESS_TS === "yes") {
      toInstall.dev["@types/jsonwebtoken"] = "^9.0.0";
      toInstall.dev["@types/bcryptjs"] = "^2.4.0";
      
      writeFileSafe(
        path.join(targetRoot, "src", "auth", `jwt.${ext}`),
        `// JWT auth helper
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'change-me';

export function sign(payload: any): string {
  return jwt.sign(payload, secret);
}

export function verify(token: string): any {
  return jwt.verify(token, secret);
}
`,
      );
    } else {
      writeFileSafe(
        path.join(targetRoot, "src", "auth", `jwt.${ext}`),
        `// JWT auth helper
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'change-me';

export function sign(payload) {
  return jwt.sign(payload, secret);
}

export function verify(token) {
  return jwt.verify(token, secret);
}
`,
      );
    }
    // Added JWT auth helper
  }

  if (process.env.FIEXPRESS_CASL === "yes") {
    toInstall.deps["@casl/ability"] = "^6.4.0";
    
    if (process.env.FIEXPRESS_TS === "yes") {
      writeFileSafe(
        path.join(targetRoot, "src", "auth", `casl.${ext}`),
        `// CASL ability stub
import { Ability } from '@casl/ability';

export const defineAbility = (user: any) => new Ability([]);
`,
      );
    } else {
      writeFileSafe(
        path.join(targetRoot, "src", "auth", `casl.${ext}`),
        `// CASL ability stub
import { Ability } from '@casl/ability';

export const defineAbility = (user) => new Ability([]);
`,
      );
    }
    // Added CASL stub
  }

  if (process.env.FIEXPRESS_ROLES === "yes") {
    if (process.env.FIEXPRESS_TS === "yes") {
      writeFileSafe(
        path.join(targetRoot, "src", "middleware", `roles.${ext}`),
        `import { Request, Response, NextFunction } from 'express';

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user && (req.user as any).role === role) return next();
    res.status(403).end();
  };
}
`,
      );
    } else {
      writeFileSafe(
        path.join(targetRoot, "src", "middleware", `roles.${ext}`),
        `export function requireRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) return next();
    res.status(403).end();
  };
}
`,
      );
    }
    // Added role-based middleware stub
  }

  if (process.env.FIEXPRESS_USER === "yes") {
    writeFileSafe(
      path.join(targetRoot, "src", "routes", `user.${ext}`),
      `// user routes stub\nimport express from 'express';\nconst router = express.Router();\nrouter.get('/', (req,res)=>res.json({msg:'users'}));\nexport default router;\n`,
    );
    // Added user routes stub
  }

  if (process.env.FIEXPRESS_TS === "yes") {
    toInstall.dev["typescript"] = "^5.2.2";
    toInstall.dev["ts-node"] = "^10.9.1";
    toInstall.dev["@types/node"] = "^20.5.1";
    toInstall.dev["@types/express"] = "^4.17.21";
    toInstall.dev["@types/cors"] = "^2.8.12";
    toInstall.dev["@types/dotenv"] = "^8.2.0";
    if (orm === "sequelize") toInstall.dev["@types/sequelize"] = "^4.28.14";
    
    // Add tsyringe dependencies if enabled
    if (process.env.FIEXPRESS_TSYRINGE === "yes") {
      toInstall.deps["tsyringe"] = "^4.8.0";
      toInstall.deps["reflect-metadata"] = "^0.1.13";
      toInstall.dev["@types/reflect-metadata"] = "^0.1.0";
    }
  } else {
    // Add tsyringe dependencies for JavaScript projects too
    if (process.env.FIEXPRESS_TSYRINGE === "yes") {
      toInstall.deps["tsyringe"] = "^4.8.0";
      toInstall.deps["reflect-metadata"] = "^0.1.13";
    }
  }

  // Add Jest testing framework
  if (process.env.FIEXPRESS_JEST === "yes") {
    toInstall.dev["jest"] = "^29.7.0";
    toInstall.dev["supertest"] = "^6.3.3";
    
    if (process.env.FIEXPRESS_TS === "yes") {
      toInstall.dev["@types/jest"] = "^29.5.8";
      toInstall.dev["@types/supertest"] = "^2.0.16";
      toInstall.dev["ts-jest"] = "^29.1.1";
      
      // Jest configuration for TypeScript
      writeFileSafe(
        path.join(targetRoot, "jest.config.js"),
        `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};`
      );
      
      // Test setup file
      writeFileSafe(
        path.join(targetRoot, "tests", "setup.ts"),
        `// Test setup file
import 'reflect-metadata';

// Global test setup
beforeAll(() => {
  // Setup code here
});

afterAll(() => {
  // Cleanup code here
});
`
      );
      
      // Sample test file
      writeFileSafe(
        path.join(targetRoot, "tests", "app.test.ts"),
        `import request from 'supertest';
import express from 'express';

describe('App', () => {
  let app: express.Application;

  beforeAll(() => {
    // Import your app here
    // Import your app here
    app = express();
    app.use(express.json());
    app.get('/', (req, res) => {
      res.json({ message: 'test' });
    });
  });

  it('should respond to GET /', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body).toHaveProperty('message');
  });
});
`
      );
    } else {
      // Jest configuration for JavaScript
      writeFileSafe(
        path.join(targetRoot, "jest.config.js"),
        `module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};`
      );
      
      // Test setup file
      writeFileSafe(
        path.join(targetRoot, "tests", "setup.js"),
        `// Test setup file

// Global test setup
beforeAll(() => {
  // Setup code here
});

afterAll(() => {
  // Cleanup code here
});
`
      );
      
      // Sample test file
      writeFileSafe(
        path.join(targetRoot, "tests", "app.test.js"),
        `const request = require('supertest');
const express = require('express');

describe('App', () => {
  let app;

  beforeAll(() => {
    // Import your app here
    // app = require('../src/index');
    app = express();
    app.use(express.json());
    app.get('/', (req, res) => {
      res.json({ message: 'test' });
    });
  });

  it('should respond to GET /', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body).toHaveProperty('message');
  });
});
`
      );
    }
    
    // Added Jest testing framework
  }

  // Add ESLint and Prettier configuration
  if (process.env.FIEXPRESS_TS === "yes") {
    toInstall.dev["eslint"] = "^8.50.0";
    toInstall.dev["@typescript-eslint/eslint-plugin"] = "^6.7.0";
    toInstall.dev["@typescript-eslint/parser"] = "^6.7.0";
    toInstall.dev["prettier"] = "^3.0.3";
    
    // ESLint configuration
    writeFileSafe(
      path.join(targetRoot, ".eslintrc.js"),
      `module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/**/*'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};`
    );
    
    // Prettier configuration
    writeFileSafe(
      path.join(targetRoot, ".prettierrc"),
      `{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}`
    );
    
    // Added ESLint and Prettier configuration
  } else {
    toInstall.dev["eslint"] = "^8.50.0";
    toInstall.dev["prettier"] = "^3.0.3";
    
    // ESLint configuration for JavaScript
    writeFileSafe(
      path.join(targetRoot, ".eslintrc.js"),
      `module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'warn',
  },
};`
    );
    
    // Prettier configuration
    writeFileSafe(
      path.join(targetRoot, ".prettierrc"),
      `{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}`
    );
    
    // Added ESLint and Prettier configuration
  }

  // Add .gitignore file
  writeFileSafe(
    path.join(targetRoot, ".gitignore"),
    `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.production
.env.local

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Logs
logs
*.log

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Build outputs
dist/
build/
`
  );
  
  // Added .gitignore file

  // No external dependencies needed for weather demo - using mock data only

  // Generate demo app if requested
  if (process.env.FIEXPRESS_DEMO !== "none") {
    await generateDemoApp(targetRoot, process.env.FIEXPRESS_DEMO, ext);
  }

  addDepsToPackageJson(targetRoot, toInstall.deps, toInstall.dev);

  try {
    const pkgPath = path.join(targetRoot, "package.json");
    const raw = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    pkg.scripts = pkg.scripts || {};
    if (!pkg.scripts.start)
      pkg.scripts.start =
        process.env.FIEXPRESS_TS === "yes"
          ? "node dist/index.js"
          : "node src/index.js";
    if (!pkg.scripts.dev)
      pkg.scripts.dev =
        process.env.FIEXPRESS_TS === "yes"
          ? "ts-node src/index.ts"
          : "node src/index.js";
    
    // Add test scripts if Jest is enabled
    if (process.env.FIEXPRESS_JEST === "yes") {
      pkg.scripts.test = "jest";
      pkg.scripts["test:watch"] = "jest --watch";
      pkg.scripts["test:coverage"] = "jest --coverage";
    }
    
    // Add build scripts for TypeScript
    if (process.env.FIEXPRESS_TS === "yes") {
      pkg.scripts.build = "tsc";
      pkg.scripts["build:watch"] = "tsc --watch";
      pkg.scripts["build:clean"] = "rm -rf dist";
      pkg.scripts["build:prod"] = "npm run build:clean && npm run build";
    }
    
    // Add lint scripts
    pkg.scripts.lint = "eslint src --ext .ts,.js";
    pkg.scripts["lint:fix"] = "eslint src --ext .ts,.js --fix";
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log("Added start/dev scripts to generated package.json");
  } catch {
    /* ignore */
  }

  try {
    const entryExt = process.env.FIEXPRESS_TS === "yes" ? "ts" : "js";
    const entryPath = path.join(targetRoot, "src", `index.${entryExt}`);
    if (!fs.existsSync(entryPath)) {
      let content = "";
      
      if (process.env.FIEXPRESS_TS === "yes") {
        if (process.env.FIEXPRESS_TSYRINGE === "yes") {
          content = `import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { container } from 'tsyringe';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FiExpress Weather API (Mock Data)',
    version: '1.0.0',
    endpoints: {
      weather: '/api/weather/city/:city',
      weatherByCoords: '/api/weather/coordinates?lat=:lat&lon=:lon'
    },
    note: 'This demo uses mock weather data - no external API required'
  });
});

// Import and use demo routes
${process.env.FIEXPRESS_DEMO === "weather" ? `import weatherRoutes from './routes/weather';
app.use('/api/weather', weatherRoutes);` : ''}
${process.env.FIEXPRESS_DEMO === "todo" ? `import todoRoutes from './routes/todo';
app.use('/api/todos', todoRoutes);` : ''}
${process.env.FIEXPRESS_DEMO === "blog" ? `import blogRoutes from './routes/blog';
app.use('/api/blog', blogRoutes);` : ''}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📡 API available at http://localhost:\${PORT}\`);
  ${process.env.FIEXPRESS_DEMO === "weather" ? `console.log(\`🌤️  Weather API: http://localhost:\${PORT}/api/weather/city/Istanbul\`);` : ''}
});
`;
        } else {
          content = `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FiExpress API',
    version: '1.0.0'
  });
});

// Import and use demo routes
${process.env.FIEXPRESS_DEMO === "weather" ? `import weatherRoutes from './routes/weather';
app.use('/api/weather', weatherRoutes);` : ''}
${process.env.FIEXPRESS_DEMO === "todo" ? `import todoRoutes from './routes/todo';
app.use('/api/todos', todoRoutes);` : ''}
${process.env.FIEXPRESS_DEMO === "blog" ? `import blogRoutes from './routes/blog';
app.use('/api/blog', blogRoutes);` : ''}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📡 API available at http://localhost:\${PORT}\`);
  ${process.env.FIEXPRESS_DEMO === "weather" ? `console.log(\`🌤️  Weather API: http://localhost:\${PORT}/api/weather/city/Istanbul\`);` : ''}
});
`;
        }
      } else {
        if (process.env.FIEXPRESS_TSYRINGE === "yes") {
          content = `require('reflect-metadata');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { container } = require('tsyringe');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FiExpress Weather API (Mock Data)',
    version: '1.0.0',
    endpoints: {
      weather: '/api/weather/city/:city',
      weatherByCoords: '/api/weather/coordinates?lat=:lat&lon=:lon'
    },
    note: 'This demo uses mock weather data - no external API required'
  });
});

// Import and use demo routes
${process.env.FIEXPRESS_DEMO === "weather" ? `const weatherRoutes = require('./routes/weather');
app.use('/api/weather', weatherRoutes);` : ''}
${process.env.FIEXPRESS_DEMO === "todo" ? `const todoRoutes = require('./routes/todo');
app.use('/api/todos', todoRoutes);` : ''}
${process.env.FIEXPRESS_DEMO === "blog" ? `const blogRoutes = require('./routes/blog');
app.use('/api/blog', blogRoutes);` : ''}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📡 API available at http://localhost:\${PORT}\`);
  ${process.env.FIEXPRESS_DEMO === "weather" ? `console.log(\`🌤️  Weather API: http://localhost:\${PORT}/api/weather/city/Istanbul\`);` : ''}
});
`;
        } else {
          content = `const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FiExpress API',
    version: '1.0.0'
  });
});

// Import and use demo routes
${process.env.FIEXPRESS_DEMO === "weather" ? `const weatherRoutes = require('./routes/weather');
app.use('/api/weather', weatherRoutes);` : ''}
${process.env.FIEXPRESS_DEMO === "todo" ? `const todoRoutes = require('./routes/todo');
app.use('/api/todos', todoRoutes);` : ''}
${process.env.FIEXPRESS_DEMO === "blog" ? `const blogRoutes = require('./routes/blog');
app.use('/api/blog', blogRoutes);` : ''}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📡 API available at http://localhost:\${PORT}\`);
  ${process.env.FIEXPRESS_DEMO === "weather" ? `console.log(\`🌤️  Weather API: http://localhost:\${PORT}/api/weather/city/Istanbul\`);` : ''}
});
`;
        }
      }
      
      writeFileSafe(entryPath, content);
      // Added app entry
    }
  } catch {
    /* ignore */
  }

  sanitizeGeneratedPackageJson(targetRoot);

  console.log("Scaffolding complete. Next steps:");
  console.log("  cd", path.basename(targetRoot));
  console.log("  npm install");
  if (process.env.FIEXPRESS_TS === "yes")
    console.log("  npx tsc --noEmit (to check types)");
}

async function generateDemoApp(targetRoot, demoType, ext) {
  console.log(`🎯 Generating ${demoType} demo app...`);
  
  if (demoType === "weather") {
    await generateWeatherDemo(targetRoot, ext);
  } else if (demoType === "todo") {
    await generateTodoDemo(targetRoot, ext);
  } else if (demoType === "blog") {
    await generateBlogDemo(targetRoot, ext);
  }
}

async function generateWeatherDemo(targetRoot, ext) {
  const isTs = ext === "ts";
  const useTsyringe = process.env.FIEXPRESS_TSYRINGE === "yes";
  
  // Note: Dependencies will be added in the main runPostClone function
  
  // Weather service
  if (useTsyringe && isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "services", "WeatherService.ts"),
      `import { injectable } from 'tsyringe';

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

@injectable()
export class WeatherService {
  private readonly weatherDescriptions = [
    'sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'windy', 'stormy', 'clear'
  ];

  constructor() {
    // No external API needed - using mock data only
  }

  async getWeatherByCity(city: string): Promise<WeatherData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      location: city,
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
      description: this.weatherDescriptions[Math.floor(Math.random() * this.weatherDescriptions.length)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
    };
  }

  async getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      location: \`\${lat.toFixed(2)},\${lon.toFixed(2)}\`,
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
      description: this.weatherDescriptions[Math.floor(Math.random() * this.weatherDescriptions.length)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
    };
  }
}
`
    );
  } else if (isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "services", "WeatherService.ts"),
      `// Weather service with mock data only

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

export class WeatherService {
  private readonly weatherDescriptions = [
    'sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'windy', 'stormy', 'clear'
  ];

  constructor() {
    // No external API needed - using mock data only
  }

  async getWeatherByCity(city: string): Promise<WeatherData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      location: city,
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
      description: this.weatherDescriptions[Math.floor(Math.random() * this.weatherDescriptions.length)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
    };
  }

  async getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      location: \`\${lat.toFixed(2)},\${lon.toFixed(2)}\`,
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
      description: this.weatherDescriptions[Math.floor(Math.random() * this.weatherDescriptions.length)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
    };
  }
}
`
    );
  } else {
    if (useTsyringe) {
      writeFileSafe(
        path.join(targetRoot, "src", "services", "WeatherService.js"),
        `const { injectable } = require('tsyringe');

@injectable()
class WeatherService {
  constructor() {
    this.weatherDescriptions = [
      'sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'windy', 'stormy', 'clear'
    ];
  }

  async getWeatherByCity(city) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      location: city,
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
      description: this.weatherDescriptions[Math.floor(Math.random() * this.weatherDescriptions.length)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
    };
  }

  async getWeatherByCoordinates(lat, lon) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      location: \`\${lat.toFixed(2)},\${lon.toFixed(2)}\`,
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
      description: this.weatherDescriptions[Math.floor(Math.random() * this.weatherDescriptions.length)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
    };
  }
}

module.exports = { WeatherService };
`
      );
    } else {
      writeFileSafe(
        path.join(targetRoot, "src", "services", "WeatherService.js"),
        `// Weather service with mock data only

class WeatherService {
  constructor() {
    this.weatherDescriptions = [
      'sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'windy', 'stormy', 'clear'
    ];
  }

  async getWeatherByCity(city) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      location: city,
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
      description: this.weatherDescriptions[Math.floor(Math.random() * this.weatherDescriptions.length)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
    };
  }

  async getWeatherByCoordinates(lat, lon) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      location: \`\${lat.toFixed(2)},\${lon.toFixed(2)}\`,
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
      description: this.weatherDescriptions[Math.floor(Math.random() * this.weatherDescriptions.length)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
    };
  }
}

module.exports = { WeatherService };
`
      );
    }
  }

  // Weather controller
  if (useTsyringe && isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "controllers", "WeatherController.ts"),
      `import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { WeatherService } from '../services/WeatherService';

@injectable()
export class WeatherController {
  constructor(
    @inject(WeatherService) private weatherService: WeatherService
  ) {}

  async getWeatherByCity(req: Request, res: Response) {
    try {
      const { city } = req.params;
      const weather = await this.weatherService.getWeatherByCity(city);
      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  }

  async getWeatherByCoordinates(req: Request, res: Response) {
    try {
      const { lat, lon } = req.query;
      const weather = await this.weatherService.getWeatherByCoordinates(
        Number(lat),
        Number(lon)
      );
      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  }
}
`
    );
  } else if (isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "controllers", "WeatherController.ts"),
      `import { Request, Response } from 'express';
import { WeatherService } from '../services/WeatherService';

export class WeatherController {
  private weatherService: WeatherService;

  constructor() {
    this.weatherService = new WeatherService();
  }

  async getWeatherByCity(req: Request, res: Response) {
    try {
      const { city } = req.params;
      const weather = await this.weatherService.getWeatherByCity(city);
      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  }

  async getWeatherByCoordinates(req: Request, res: Response) {
    try {
      const { lat, lon } = req.query;
      const weather = await this.weatherService.getWeatherByCoordinates(
        Number(lat),
        Number(lon)
      );
      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  }
}
`
    );
  } else {
    if (useTsyringe) {
      writeFileSafe(
        path.join(targetRoot, "src", "controllers", "WeatherController.js"),
        `const { injectable, inject } = require('tsyringe');
const { WeatherService } = require('../services/WeatherService');

@injectable()
class WeatherController {
  constructor(@inject(WeatherService) weatherService) {
    this.weatherService = weatherService;
  }

  async getWeatherByCity(req, res) {
    try {
      const { city } = req.params;
      const weather = await this.weatherService.getWeatherByCity(city);
      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  }

  async getWeatherByCoordinates(req, res) {
    try {
      const { lat, lon } = req.query;
      const weather = await this.weatherService.getWeatherByCoordinates(
        Number(lat),
        Number(lon)
      );
      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  }
}

module.exports = { WeatherController };
`
      );
    } else {
      writeFileSafe(
        path.join(targetRoot, "src", "controllers", "WeatherController.js"),
        `const { WeatherService } = require('../services/WeatherService');

class WeatherController {
  constructor() {
    this.weatherService = new WeatherService();
  }

  async getWeatherByCity(req, res) {
    try {
      const { city } = req.params;
      const weather = await this.weatherService.getWeatherByCity(city);
      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  }

  async getWeatherByCoordinates(req, res) {
    try {
      const { lat, lon } = req.query;
      const weather = await this.weatherService.getWeatherByCoordinates(
        Number(lat),
        Number(lon)
      );
      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  }
}

module.exports = { WeatherController };
`
      );
    }
  }

  // Weather routes
  if (useTsyringe && isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "routes", "weather.ts"),
      `import { Router } from 'express';
import { container } from 'tsyringe';
import { WeatherController } from '../controllers/WeatherController';

const router = Router();
const weatherController = container.resolve(WeatherController);

router.get('/city/:city', (req, res) => weatherController.getWeatherByCity(req, res));
router.get('/coordinates', (req, res) => weatherController.getWeatherByCoordinates(req, res));

export default router;`
    );
  } else if (isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "routes", "weather.ts"),
      `import { Router } from 'express';
import { WeatherController } from '../controllers/WeatherController';

const router = Router();
const weatherController = new WeatherController();

router.get('/city/:city', (req, res) => weatherController.getWeatherByCity(req, res));
router.get('/coordinates', (req, res) => weatherController.getWeatherByCoordinates(req, res));

export default router;`
    );
  } else {
    if (useTsyringe) {
      writeFileSafe(
        path.join(targetRoot, "src", "routes", "weather.js"),
        `const express = require('express');
const { container } = require('tsyringe');
const { WeatherController } = require('../controllers/WeatherController');

const router = express.Router();
const weatherController = container.resolve(WeatherController);

router.get('/city/:city', (req, res) => weatherController.getWeatherByCity(req, res));
router.get('/coordinates', (req, res) => weatherController.getWeatherByCoordinates(req, res));

module.exports = router;`
      );
    } else {
      writeFileSafe(
        path.join(targetRoot, "src", "routes", "weather.js"),
        `const express = require('express');
const { WeatherController } = require('../controllers/WeatherController');

const router = express.Router();
const weatherController = new WeatherController();

router.get('/city/:city', (req, res) => weatherController.getWeatherByCity(req, res));
router.get('/coordinates', (req, res) => weatherController.getWeatherByCoordinates(req, res));

module.exports = router;`
      );
    }
  }

  console.log("✅ Weather demo app generated");
}

async function generateTodoDemo(targetRoot, ext) {
  const isTs = ext === "ts";
  const useTsyringe = process.env.FIEXPRESS_TSYRINGE === "yes";
  
  console.log("📝 Generating Todo demo app...");
  
  // Todo service with in-memory storage
  if (useTsyringe && isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "services", "TodoService.ts"),
      `import { injectable } from 'tsyringe';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class TodoService {
  private todos: Todo[] = [];
  private nextId = 1;

  constructor() {
    // Initialize with sample todos
    this.todos = [
      {
        id: '1',
        title: 'Learn FiExpress CLI',
        description: 'Understand how to use FiExpress for creating Express.js projects',
        completed: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        title: 'Build a Todo App',
        description: 'Create a simple todo application with CRUD operations',
        completed: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-03')
      }
    ];
  }

  async getAllTodos(): Promise<Todo[]> {
    return [...this.todos];
  }

  async getTodoById(id: string): Promise<Todo | null> {
    return this.todos.find(todo => todo.id === id) || null;
  }

  async createTodo(title: string, description?: string): Promise<Todo> {
    const newTodo: Todo = {
      id: this.nextId.toString(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.nextId++;
    this.todos.push(newTodo);
    return newTodo;
  }

  async updateTodo(id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Promise<Todo | null> {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return null;

    this.todos[todoIndex] = {
      ...this.todos[todoIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.todos[todoIndex];
  }

  async deleteTodo(id: string): Promise<boolean> {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return false;

    this.todos.splice(todoIndex, 1);
    return true;
  }

  async toggleTodo(id: string): Promise<Todo | null> {
    const todo = await this.getTodoById(id);
    if (!todo) return null;

    return this.updateTodo(id, { completed: !todo.completed });
  }
}
`
    );
  } else {
    // JavaScript version
    const serviceContent = useTsyringe ? 
      `const { injectable } = require('tsyringe');

@injectable()
class TodoService {
  constructor() {
    this.todos = [];
    this.nextId = 1;
    
    // Initialize with sample todos
    this.todos = [
      {
        id: '1',
        title: 'Learn FiExpress CLI',
        description: 'Understand how to use FiExpress for creating Express.js projects',
        completed: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        title: 'Build a Todo App',
        description: 'Create a simple todo application with CRUD operations',
        completed: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-03')
      }
    ];
  }

  async getAllTodos() {
    return [...this.todos];
  }

  async getTodoById(id) {
    return this.todos.find(todo => todo.id === id) || null;
  }

  async createTodo(title, description) {
    const newTodo = {
      id: this.nextId.toString(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.nextId++;
    this.todos.push(newTodo);
    return newTodo;
  }

  async updateTodo(id, updates) {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return null;

    this.todos[todoIndex] = {
      ...this.todos[todoIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.todos[todoIndex];
  }

  async deleteTodo(id) {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return false;

    this.todos.splice(todoIndex, 1);
    return true;
  }

  async toggleTodo(id) {
    const todo = await this.getTodoById(id);
    if (!todo) return null;

    return this.updateTodo(id, { completed: !todo.completed });
  }
}

module.exports = { TodoService };` :
      `class TodoService {
  constructor() {
    this.todos = [];
    this.nextId = 1;
    
    // Initialize with sample todos
    this.todos = [
      {
        id: '1',
        title: 'Learn FiExpress CLI',
        description: 'Understand how to use FiExpress for creating Express.js projects',
        completed: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        title: 'Build a Todo App',
        description: 'Create a simple todo application with CRUD operations',
        completed: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-03')
      }
    ];
  }

  async getAllTodos() {
    return [...this.todos];
  }

  async getTodoById(id) {
    return this.todos.find(todo => todo.id === id) || null;
  }

  async createTodo(title, description) {
    const newTodo = {
      id: this.nextId.toString(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.nextId++;
    this.todos.push(newTodo);
    return newTodo;
  }

  async updateTodo(id, updates) {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return null;

    this.todos[todoIndex] = {
      ...this.todos[todoIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.todos[todoIndex];
  }

  async deleteTodo(id) {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return false;

    this.todos.splice(todoIndex, 1);
    return true;
  }

  async toggleTodo(id) {
    const todo = await this.getTodoById(id);
    if (!todo) return null;

    return this.updateTodo(id, { completed: !todo.completed });
  }
}

module.exports = { TodoService };`;

    writeFileSafe(
      path.join(targetRoot, "src", "services", "TodoService.js"),
      serviceContent
    );
  }

  // Todo controller
  if (useTsyringe && isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "controllers", "TodoController.ts"),
      `import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { TodoService } from '../services/TodoService';

@injectable()
export class TodoController {
  constructor(
    @inject(TodoService) private todoService: TodoService
  ) {}

  async getAllTodos(req: Request, res: Response) {
    try {
      const todos = await this.todoService.getAllTodos();
      res.json({
        success: true,
        data: todos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todos'
      });
    }
  }

  async getTodoById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.getTodoById(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todo'
      });
    }
  }

  async createTodo(req: Request, res: Response) {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }
      const todo = await this.todoService.createTodo(title, description);
      res.status(201).json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create todo'
      });
    }
  }

  async updateTodo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const todo = await this.todoService.updateTodo(id, updates);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update todo'
      });
    }
  }

  async deleteTodo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.todoService.deleteTodo(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        message: 'Todo deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete todo'
      });
    }
  }

  async toggleTodo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.toggleTodo(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle todo'
      });
    }
  }
}
`
    );
  } else if (isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "controllers", "TodoController.ts"),
      `import { Request, Response } from 'express';
import { TodoService } from '../services/TodoService';

export class TodoController {
  private todoService: TodoService;

  constructor() {
    this.todoService = new TodoService();
  }

  async getAllTodos(req: Request, res: Response) {
    try {
      const todos = await this.todoService.getAllTodos();
      res.json({
        success: true,
        data: todos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todos'
      });
    }
  }

  async getTodoById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.getTodoById(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todo'
      });
    }
  }

  async createTodo(req: Request, res: Response) {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }
      const todo = await this.todoService.createTodo(title, description);
      res.status(201).json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create todo'
      });
    }
  }

  async updateTodo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const todo = await this.todoService.updateTodo(id, updates);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update todo'
      });
    }
  }

  async deleteTodo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.todoService.deleteTodo(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        message: 'Todo deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete todo'
      });
    }
  }

  async toggleTodo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.toggleTodo(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle todo'
      });
    }
  }
}
`
    );
  } else {
    // JavaScript version
    const controllerContent = useTsyringe ? 
      `const { injectable, inject } = require('tsyringe');
const { TodoService } = require('../services/TodoService');

@injectable()
class TodoController {
  constructor(@inject(TodoService) todoService) {
    this.todoService = todoService;
  }

  async getAllTodos(req, res) {
    try {
      const todos = await this.todoService.getAllTodos();
      res.json({
        success: true,
        data: todos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todos'
      });
    }
  }

  async getTodoById(req, res) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.getTodoById(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todo'
      });
    }
  }

  async createTodo(req, res) {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }
      const todo = await this.todoService.createTodo(title, description);
      res.status(201).json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create todo'
      });
    }
  }

  async updateTodo(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const todo = await this.todoService.updateTodo(id, updates);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update todo'
      });
    }
  }

  async deleteTodo(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.todoService.deleteTodo(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        message: 'Todo deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete todo'
      });
    }
  }

  async toggleTodo(req, res) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.toggleTodo(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle todo'
      });
    }
  }
}

module.exports = { TodoController };` :
      `const { TodoService } = require('../services/TodoService');

class TodoController {
  constructor() {
    this.todoService = new TodoService();
  }

  async getAllTodos(req, res) {
    try {
      const todos = await this.todoService.getAllTodos();
      res.json({
        success: true,
        data: todos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todos'
      });
    }
  }

  async getTodoById(req, res) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.getTodoById(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch todo'
      });
    }
  }

  async createTodo(req, res) {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }
      const todo = await this.todoService.createTodo(title, description);
      res.status(201).json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create todo'
      });
    }
  }

  async updateTodo(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const todo = await this.todoService.updateTodo(id, updates);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update todo'
      });
    }
  }

  async deleteTodo(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.todoService.deleteTodo(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        message: 'Todo deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete todo'
      });
    }
  }

  async toggleTodo(req, res) {
    try {
      const { id } = req.params;
      const todo = await this.todoService.toggleTodo(id);
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.json({
        success: true,
        data: todo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle todo'
      });
    }
  }
}

module.exports = { TodoController };`;

    writeFileSafe(
      path.join(targetRoot, "src", "controllers", "TodoController.js"),
      controllerContent
    );
  }

  // Todo routes
  if (useTsyringe && isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "routes", "todo.ts"),
      `import { Router } from 'express';
import { container } from 'tsyringe';
import { TodoController } from '../controllers/TodoController';

const router = Router();
const todoController = container.resolve(TodoController);

router.get('/', (req, res) => todoController.getAllTodos(req, res));
router.get('/:id', (req, res) => todoController.getTodoById(req, res));
router.post('/', (req, res) => todoController.createTodo(req, res));
router.put('/:id', (req, res) => todoController.updateTodo(req, res));
router.delete('/:id', (req, res) => todoController.deleteTodo(req, res));
router.patch('/:id/toggle', (req, res) => todoController.toggleTodo(req, res));

export default router;`
    );
  } else if (isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "routes", "todo.ts"),
      `import { Router } from 'express';
import { TodoController } from '../controllers/TodoController';

const router = Router();
const todoController = new TodoController();

router.get('/', (req, res) => todoController.getAllTodos(req, res));
router.get('/:id', (req, res) => todoController.getTodoById(req, res));
router.post('/', (req, res) => todoController.createTodo(req, res));
router.put('/:id', (req, res) => todoController.updateTodo(req, res));
router.delete('/:id', (req, res) => todoController.deleteTodo(req, res));
router.patch('/:id/toggle', (req, res) => todoController.toggleTodo(req, res));

export default router;`
    );
  } else {
    if (useTsyringe) {
      writeFileSafe(
        path.join(targetRoot, "src", "routes", "todo.js"),
        `const express = require('express');
const { container } = require('tsyringe');
const { TodoController } = require('../controllers/TodoController');

const router = express.Router();
const todoController = container.resolve(TodoController);

router.get('/', (req, res) => todoController.getAllTodos(req, res));
router.get('/:id', (req, res) => todoController.getTodoById(req, res));
router.post('/', (req, res) => todoController.createTodo(req, res));
router.put('/:id', (req, res) => todoController.updateTodo(req, res));
router.delete('/:id', (req, res) => todoController.deleteTodo(req, res));
router.patch('/:id/toggle', (req, res) => todoController.toggleTodo(req, res));

module.exports = router;`
      );
    } else {
      writeFileSafe(
        path.join(targetRoot, "src", "routes", "todo.js"),
        `const express = require('express');
const { TodoController } = require('../controllers/TodoController');

const router = express.Router();
const todoController = new TodoController();

router.get('/', (req, res) => todoController.getAllTodos(req, res));
router.get('/:id', (req, res) => todoController.getTodoById(req, res));
router.post('/', (req, res) => todoController.createTodo(req, res));
router.put('/:id', (req, res) => todoController.updateTodo(req, res));
router.delete('/:id', (req, res) => todoController.deleteTodo(req, res));
router.patch('/:id/toggle', (req, res) => todoController.toggleTodo(req, res));

module.exports = router;`
      );
    }
  }

  console.log("✅ Todo demo app generated");
}

async function generateBlogDemo(targetRoot, ext) {
  const isTs = ext === "ts";
  const useTsyringe = process.env.FIEXPRESS_TSYRINGE === "yes";
  
  console.log("📝 Generating Blog demo app...");
  
  // Blog service with in-memory storage
  if (useTsyringe && isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "services", "BlogService.ts"),
      `import { injectable } from 'tsyringe';

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: Date;
}

@injectable()
export class BlogService {
  private posts: Post[] = [];
  private comments: Comment[] = [];
  private nextPostId = 1;
  private nextCommentId = 1;

  constructor() {
    // Initialize with sample posts
    this.posts = [
      {
        id: '1',
        title: 'Welcome to FiExpress Blog',
        content: 'This is a sample blog post created with FiExpress CLI. Learn how to build amazing Express.js applications with modern tools and best practices.',
        author: 'FiExpress Team',
        published: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        title: 'Getting Started with TypeScript',
        content: 'TypeScript brings static typing to JavaScript, making your code more robust and maintainable. Learn the basics and start using it in your Express.js projects.',
        author: 'Developer',
        published: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];

    // Initialize with sample comments
    this.comments = [
      {
        id: '1',
        postId: '1',
        author: 'John Doe',
        content: 'Great post! Very helpful for beginners.',
        createdAt: new Date('2024-01-01T10:00:00')
      },
      {
        id: '2',
        postId: '1',
        author: 'Jane Smith',
        content: 'Thanks for sharing this tutorial.',
        createdAt: new Date('2024-01-01T14:30:00')
      }
    ];
  }

  // Post methods
  async getAllPosts(): Promise<Post[]> {
    return [...this.posts];
  }

  async getPostById(id: string): Promise<Post | null> {
    return this.posts.find(post => post.id === id) || null;
  }

  async createPost(title: string, content: string, author: string): Promise<Post> {
    const newPost: Post = {
      id: this.nextPostId.toString(),
      title,
      content,
      author,
      published: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.nextPostId++;
    this.posts.push(newPost);
    return newPost;
  }

  async updatePost(id: string, updates: Partial<Omit<Post, 'id' | 'createdAt'>>): Promise<Post | null> {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return null;

    this.posts[postIndex] = {
      ...this.posts[postIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.posts[postIndex];
  }

  async deletePost(id: string): Promise<boolean> {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return false;

    this.posts.splice(postIndex, 1);
    // Also delete related comments
    this.comments = this.comments.filter(comment => comment.postId !== id);
    return true;
  }

  async publishPost(id: string): Promise<Post | null> {
    return this.updatePost(id, { published: true });
  }

  // Comment methods
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return this.comments.filter(comment => comment.postId === postId);
  }

  async createComment(postId: string, author: string, content: string): Promise<Comment> {
    const newComment: Comment = {
      id: this.nextCommentId.toString(),
      postId,
      author,
      content,
      createdAt: new Date()
    };
    
    this.nextCommentId++;
    this.comments.push(newComment);
    return newComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    const commentIndex = this.comments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) return false;

    this.comments.splice(commentIndex, 1);
    return true;
  }
}
`
    );
  } else {
    // JavaScript version
    const serviceContent = useTsyringe ? 
      `const { injectable } = require('tsyringe');

@injectable()
class BlogService {
  constructor() {
    this.posts = [];
    this.comments = [];
    this.nextPostId = 1;
    this.nextCommentId = 1;
    
    // Initialize with sample posts
    this.posts = [
      {
        id: '1',
        title: 'Welcome to FiExpress Blog',
        content: 'This is a sample blog post created with FiExpress CLI. Learn how to build amazing Express.js applications with modern tools and best practices.',
        author: 'FiExpress Team',
        published: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        title: 'Getting Started with TypeScript',
        content: 'TypeScript brings static typing to JavaScript, making your code more robust and maintainable. Learn the basics and start using it in your Express.js projects.',
        author: 'Developer',
        published: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];

    // Initialize with sample comments
    this.comments = [
      {
        id: '1',
        postId: '1',
        author: 'John Doe',
        content: 'Great post! Very helpful for beginners.',
        createdAt: new Date('2024-01-01T10:00:00')
      },
      {
        id: '2',
        postId: '1',
        author: 'Jane Smith',
        content: 'Thanks for sharing this tutorial.',
        createdAt: new Date('2024-01-01T14:30:00')
      }
    ];
  }

  // Post methods
  async getAllPosts() {
    return [...this.posts];
  }

  async getPostById(id) {
    return this.posts.find(post => post.id === id) || null;
  }

  async createPost(title, content, author) {
    const newPost = {
      id: this.nextPostId.toString(),
      title,
      content,
      author,
      published: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.nextPostId++;
    this.posts.push(newPost);
    return newPost;
  }

  async updatePost(id, updates) {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return null;

    this.posts[postIndex] = {
      ...this.posts[postIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.posts[postIndex];
  }

  async deletePost(id) {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return false;

    this.posts.splice(postIndex, 1);
    // Also delete related comments
    this.comments = this.comments.filter(comment => comment.postId !== id);
    return true;
  }

  async publishPost(id) {
    return this.updatePost(id, { published: true });
  }

  // Comment methods
  async getCommentsByPostId(postId) {
    return this.comments.filter(comment => comment.postId === postId);
  }

  async createComment(postId, author, content) {
    const newComment = {
      id: this.nextCommentId.toString(),
      postId,
      author,
      content,
      createdAt: new Date()
    };
    
    this.nextCommentId++;
    this.comments.push(newComment);
    return newComment;
  }

  async deleteComment(id) {
    const commentIndex = this.comments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) return false;

    this.comments.splice(commentIndex, 1);
    return true;
  }
}

module.exports = { BlogService };` :
      `class BlogService {
  constructor() {
    this.posts = [];
    this.comments = [];
    this.nextPostId = 1;
    this.nextCommentId = 1;
    
    // Initialize with sample posts
    this.posts = [
      {
        id: '1',
        title: 'Welcome to FiExpress Blog',
        content: 'This is a sample blog post created with FiExpress CLI. Learn how to build amazing Express.js applications with modern tools and best practices.',
        author: 'FiExpress Team',
        published: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        title: 'Getting Started with TypeScript',
        content: 'TypeScript brings static typing to JavaScript, making your code more robust and maintainable. Learn the basics and start using it in your Express.js projects.',
        author: 'Developer',
        published: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];

    // Initialize with sample comments
    this.comments = [
      {
        id: '1',
        postId: '1',
        author: 'John Doe',
        content: 'Great post! Very helpful for beginners.',
        createdAt: new Date('2024-01-01T10:00:00')
      },
      {
        id: '2',
        postId: '1',
        author: 'Jane Smith',
        content: 'Thanks for sharing this tutorial.',
        createdAt: new Date('2024-01-01T14:30:00')
      }
    ];
  }

  // Post methods
  async getAllPosts() {
    return [...this.posts];
  }

  async getPostById(id) {
    return this.posts.find(post => post.id === id) || null;
  }

  async createPost(title, content, author) {
    const newPost = {
      id: this.nextPostId.toString(),
      title,
      content,
      author,
      published: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.nextPostId++;
    this.posts.push(newPost);
    return newPost;
  }

  async updatePost(id, updates) {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return null;

    this.posts[postIndex] = {
      ...this.posts[postIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.posts[postIndex];
  }

  async deletePost(id) {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return false;

    this.posts.splice(postIndex, 1);
    // Also delete related comments
    this.comments = this.comments.filter(comment => comment.postId !== id);
    return true;
  }

  async publishPost(id) {
    return this.updatePost(id, { published: true });
  }

  // Comment methods
  async getCommentsByPostId(postId) {
    return this.comments.filter(comment => comment.postId === postId);
  }

  async createComment(postId, author, content) {
    const newComment = {
      id: this.nextCommentId.toString(),
      postId,
      author,
      content,
      createdAt: new Date()
    };
    
    this.nextCommentId++;
    this.comments.push(newComment);
    return newComment;
  }

  async deleteComment(id) {
    const commentIndex = this.comments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) return false;

    this.comments.splice(commentIndex, 1);
    return true;
  }
}

module.exports = { BlogService };`;

    writeFileSafe(
      path.join(targetRoot, "src", "services", "BlogService.js"),
      serviceContent
    );
  }

  // Blog controller
  if (useTsyringe && isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "controllers", "BlogController.ts"),
      `import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { BlogService } from '../services/BlogService';

@injectable()
export class BlogController {
  constructor(
    @inject(BlogService) private blogService: BlogService
  ) {}

  async getAllPosts(req: Request, res: Response) {
    try {
      const posts = await this.blogService.getAllPosts();
      res.json({
        success: true,
        data: posts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posts'
      });
    }
  }

  async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await this.blogService.getPostById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch post'
      });
    }
  }

  async createPost(req: Request, res: Response) {
    try {
      const { title, content, author } = req.body;
      if (!title || !content || !author) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and author are required'
        });
      }
      const post = await this.blogService.createPost(title, content, author);
      res.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create post'
      });
    }
  }

  async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const post = await this.blogService.updatePost(id, updates);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update post'
      });
    }
  }

  async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.blogService.deletePost(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete post'
      });
    }
  }

  async publishPost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await this.blogService.publishPost(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish post'
      });
    }
  }

  async getCommentsByPostId(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const comments = await this.blogService.getCommentsByPostId(postId);
      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }
  }

  async createComment(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const { author, content } = req.body;
      if (!author || !content) {
        return res.status(400).json({
          success: false,
          message: 'Author and content are required'
        });
      }
      const comment = await this.blogService.createComment(postId, author, content);
      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create comment'
      });
    }
  }

  async deleteComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.blogService.deleteComment(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }
      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }
  }
}
`
    );
  } else if (isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "controllers", "BlogController.ts"),
      `import { Request, Response } from 'express';
import { BlogService } from '../services/BlogService';

export class BlogController {
  private blogService: BlogService;

  constructor() {
    this.blogService = new BlogService();
  }

  async getAllPosts(req: Request, res: Response) {
    try {
      const posts = await this.blogService.getAllPosts();
      res.json({
        success: true,
        data: posts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posts'
      });
    }
  }

  async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await this.blogService.getPostById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch post'
      });
    }
  }

  async createPost(req: Request, res: Response) {
    try {
      const { title, content, author } = req.body;
      if (!title || !content || !author) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and author are required'
        });
      }
      const post = await this.blogService.createPost(title, content, author);
      res.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create post'
      });
    }
  }

  async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const post = await this.blogService.updatePost(id, updates);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update post'
      });
    }
  }

  async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.blogService.deletePost(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete post'
      });
    }
  }

  async publishPost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await this.blogService.publishPost(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish post'
      });
    }
  }

  async getCommentsByPostId(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const comments = await this.blogService.getCommentsByPostId(postId);
      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }
  }

  async createComment(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const { author, content } = req.body;
      if (!author || !content) {
        return res.status(400).json({
          success: false,
          message: 'Author and content are required'
        });
      }
      const comment = await this.blogService.createComment(postId, author, content);
      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create comment'
      });
    }
  }

  async deleteComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.blogService.deleteComment(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }
      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }
  }
}
`
    );
  } else {
    // JavaScript version - BlogController
    const blogControllerContent = useTsyringe ? 
      `const { injectable, inject } = require('tsyringe');
const { BlogService } = require('../services/BlogService');

@injectable()
class BlogController {
  constructor(@inject(BlogService) blogService) {
    this.blogService = blogService;
  }

  async getAllPosts(req, res) {
    try {
      const posts = await this.blogService.getAllPosts();
      res.json({
        success: true,
        data: posts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posts'
      });
    }
  }

  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const post = await this.blogService.getPostById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch post'
      });
    }
  }

  async createPost(req, res) {
    try {
      const { title, content, author } = req.body;
      if (!title || !content || !author) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and author are required'
        });
      }
      const post = await this.blogService.createPost(title, content, author);
      res.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create post'
      });
    }
  }

  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const post = await this.blogService.updatePost(id, updates);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update post'
      });
    }
  }

  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.blogService.deletePost(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete post'
      });
    }
  }

  async publishPost(req, res) {
    try {
      const { id } = req.params;
      const post = await this.blogService.publishPost(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish post'
      });
    }
  }

  async getCommentsByPostId(req, res) {
    try {
      const { postId } = req.params;
      const comments = await this.blogService.getCommentsByPostId(postId);
      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }
  }

  async createComment(req, res) {
    try {
      const { postId } = req.params;
      const { author, content } = req.body;
      if (!author || !content) {
        return res.status(400).json({
          success: false,
          message: 'Author and content are required'
        });
      }
      const comment = await this.blogService.createComment(postId, author, content);
      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create comment'
      });
    }
  }

  async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.blogService.deleteComment(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }
      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }
  }
}

module.exports = { BlogController };` :
      `const { BlogService } = require('../services/BlogService');

class BlogController {
  constructor() {
    this.blogService = new BlogService();
  }

  async getAllPosts(req, res) {
    try {
      const posts = await this.blogService.getAllPosts();
      res.json({
        success: true,
        data: posts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posts'
      });
    }
  }

  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const post = await this.blogService.getPostById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch post'
      });
    }
  }

  async createPost(req, res) {
    try {
      const { title, content, author } = req.body;
      if (!title || !content || !author) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and author are required'
        });
      }
      const post = await this.blogService.createPost(title, content, author);
      res.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create post'
      });
    }
  }

  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const post = await this.blogService.updatePost(id, updates);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update post'
      });
    }
  }

  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.blogService.deletePost(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete post'
      });
    }
  }

  async publishPost(req, res) {
    try {
      const { id } = req.params;
      const post = await this.blogService.publishPost(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish post'
      });
    }
  }

  async getCommentsByPostId(req, res) {
    try {
      const { postId } = req.params;
      const comments = await this.blogService.getCommentsByPostId(postId);
      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }
  }

  async createComment(req, res) {
    try {
      const { postId } = req.params;
      const { author, content } = req.body;
      if (!author || !content) {
        return res.status(400).json({
          success: false,
          message: 'Author and content are required'
        });
      }
      const comment = await this.blogService.createComment(postId, author, content);
      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create comment'
      });
    }
  }

  async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.blogService.deleteComment(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }
      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }
  }
}

module.exports = { BlogController };`;

    writeFileSafe(
      path.join(targetRoot, "src", "controllers", "BlogController.js"),
      blogControllerContent
    );
  }

  // Blog routes
  if (useTsyringe && isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "routes", "blog.ts"),
      `import { Router } from 'express';
import { container } from 'tsyringe';
import { BlogController } from '../controllers/BlogController';

const router = Router();
const blogController = container.resolve(BlogController);

// Post routes
router.get('/posts', (req, res) => blogController.getAllPosts(req, res));
router.get('/posts/:id', (req, res) => blogController.getPostById(req, res));
router.post('/posts', (req, res) => blogController.createPost(req, res));
router.put('/posts/:id', (req, res) => blogController.updatePost(req, res));
router.delete('/posts/:id', (req, res) => blogController.deletePost(req, res));
router.patch('/posts/:id/publish', (req, res) => blogController.publishPost(req, res));

// Comment routes
router.get('/posts/:postId/comments', (req, res) => blogController.getCommentsByPostId(req, res));
router.post('/posts/:postId/comments', (req, res) => blogController.createComment(req, res));
router.delete('/comments/:id', (req, res) => blogController.deleteComment(req, res));

export default router;`
    );
  } else if (isTs) {
    writeFileSafe(
      path.join(targetRoot, "src", "routes", "blog.ts"),
      `import { Router } from 'express';
import { BlogController } from '../controllers/BlogController';

const router = Router();
const blogController = new BlogController();

// Post routes
router.get('/posts', (req, res) => blogController.getAllPosts(req, res));
router.get('/posts/:id', (req, res) => blogController.getPostById(req, res));
router.post('/posts', (req, res) => blogController.createPost(req, res));
router.put('/posts/:id', (req, res) => blogController.updatePost(req, res));
router.delete('/posts/:id', (req, res) => blogController.deletePost(req, res));
router.patch('/posts/:id/publish', (req, res) => blogController.publishPost(req, res));

// Comment routes
router.get('/posts/:postId/comments', (req, res) => blogController.getCommentsByPostId(req, res));
router.post('/posts/:postId/comments', (req, res) => blogController.createComment(req, res));
router.delete('/comments/:id', (req, res) => blogController.deleteComment(req, res));

export default router;`
    );
  } else {
    if (useTsyringe) {
      writeFileSafe(
        path.join(targetRoot, "src", "routes", "blog.js"),
        `const express = require('express');
const { container } = require('tsyringe');
const { BlogController } = require('../controllers/BlogController');

const router = express.Router();
const blogController = container.resolve(BlogController);

// Post routes
router.get('/posts', (req, res) => blogController.getAllPosts(req, res));
router.get('/posts/:id', (req, res) => blogController.getPostById(req, res));
router.post('/posts', (req, res) => blogController.createPost(req, res));
router.put('/posts/:id', (req, res) => blogController.updatePost(req, res));
router.delete('/posts/:id', (req, res) => blogController.deletePost(req, res));
router.patch('/posts/:id/publish', (req, res) => blogController.publishPost(req, res));

// Comment routes
router.get('/posts/:postId/comments', (req, res) => blogController.getCommentsByPostId(req, res));
router.post('/posts/:postId/comments', (req, res) => blogController.createComment(req, res));
router.delete('/comments/:id', (req, res) => blogController.deleteComment(req, res));

module.exports = router;`
      );
    } else {
      writeFileSafe(
        path.join(targetRoot, "src", "routes", "blog.js"),
        `const express = require('express');
const { BlogController } = require('../controllers/BlogController');

const router = express.Router();
const blogController = new BlogController();

// Post routes
router.get('/posts', (req, res) => blogController.getAllPosts(req, res));
router.get('/posts/:id', (req, res) => blogController.getPostById(req, res));
router.post('/posts', (req, res) => blogController.createPost(req, res));
router.put('/posts/:id', (req, res) => blogController.updatePost(req, res));
router.delete('/posts/:id', (req, res) => blogController.deletePost(req, res));
router.patch('/posts/:id/publish', (req, res) => blogController.publishPost(req, res));

// Comment routes
router.get('/posts/:postId/comments', (req, res) => blogController.getCommentsByPostId(req, res));
router.post('/posts/:postId/comments', (req, res) => blogController.createComment(req, res));
router.delete('/comments/:id', (req, res) => blogController.deleteComment(req, res));

module.exports = router;`
      );
    }
  }

  console.log("✅ Blog demo app generated");
}

async function generateComponent(schematic, name) {
  const currentDir = process.cwd();
  
  // Check if we're in a FiExpress project
  const packageJsonPath = path.join(currentDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error("❌ Not in a FiExpress project directory. Please run this command from your project root.");
    throw new Error("Not in a FiExpress project directory");
  }
  
  // Detect project type (TS/JS)
  const isTs = fs.existsSync(path.join(currentDir, 'tsconfig.json'));
  const ext = isTs ? 'ts' : 'js';
  
  // Check for tsyringe
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const useTsyringe = packageJson.dependencies && packageJson.dependencies.tsyringe;
  
  console.log(`🔧 Generating ${schematic}: ${name}`);
  
  switch (schematic.toLowerCase()) {
    case 'controller':
      await generateController(name, ext, useTsyringe, currentDir);
      break;
    case 'service':
      await generateService(name, ext, useTsyringe, currentDir);
      break;
    case 'middleware':
      await generateMiddleware(name, ext, currentDir);
      break;
    case 'route':
      await generateRoute(name, ext, useTsyringe, currentDir);
      break;
    case 'model':
      await generateModel(name, ext, currentDir);
      break;
    case 'interface':
      if (!isTs) {
        console.error("❌ Interfaces are only available for TypeScript projects.");
        throw new Error("Not in a FiExpress project directory");
      }
      await generateInterface(name, currentDir);
      break;
    case 'test':
      await generateTest(name, ext, currentDir);
      break;
    case 'resource':
      await generateResource(name, ext, useTsyringe, currentDir);
      break;
    default:
      console.error(`❌ Unknown schematic: ${schematic}`);
      console.log("Available schematics: controller, service, middleware, route, model, interface, test, resource");
      throw new Error("Not in a FiExpress project directory");
  }
}

async function generateController(name, ext, useTsyringe, targetDir) {
  const className = name.endsWith('Controller') ? name : `${name}Controller`;
  const fileName = className.replace(/([A-Z])/g, (match, p1, offset) => 
    offset > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase()
  );
  
  if (useTsyringe && ext === 'ts') {
    const content = `import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';

@injectable()
export class ${className} {
  constructor() {
    // Add injected dependencies here
  }

  async index(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message: '${className} index method',
        data: []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        message: '${className} show method',
        data: { id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      res.status(201).json({
        success: true,
        message: '${className} create method',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      res.json({
        success: true,
        message: '${className} update method',
        data: { id, ...data }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        message: '${className} delete method',
        data: { id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
`;
    writeFileSafe(path.join(targetDir, 'src', 'controllers', `${fileName}.${ext}`), content);
  } else if (ext === 'ts') {
    const content = `import { Request, Response } from 'express';

export class ${className} {
  async index(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message: '${className} index method',
        data: []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        message: '${className} show method',
        data: { id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      res.status(201).json({
        success: true,
        message: '${className} create method',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      res.json({
        success: true,
        message: '${className} update method',
        data: { id, ...data }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        message: '${className} delete method',
        data: { id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
`;
    writeFileSafe(path.join(targetDir, 'src', 'controllers', `${fileName}.${ext}`), content);
  } else {
    const content = useTsyringe ? 
      `const { injectable, inject } = require('tsyringe');

@injectable()
class ${className} {
  constructor() {
    // Add injected dependencies here
  }

  async index(req, res) {
    try {
      res.json({
        success: true,
        message: '${className} index method',
        data: []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        message: '${className} show method',
        data: { id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async create(req, res) {
    try {
      const data = req.body;
      res.status(201).json({
        success: true,
        message: '${className} create method',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      res.json({
        success: true,
        message: '${className} update method',
        data: { id, ...data }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        message: '${className} delete method',
        data: { id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = { ${className} };` :
      `class ${className} {
  async index(req, res) {
    try {
      res.json({
        success: true,
        message: '${className} index method',
        data: []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        message: '${className} show method',
        data: { id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async create(req, res) {
    try {
      const data = req.body;
      res.status(201).json({
        success: true,
        message: '${className} create method',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      res.json({
        success: true,
        message: '${className} update method',
        data: { id, ...data }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        message: '${className} delete method',
        data: { id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = { ${className} };`;
    writeFileSafe(path.join(targetDir, 'src', 'controllers', `${fileName}.${ext}`), content);
  }
  
  console.log(`✅ Generated controller: src/controllers/${fileName}.${ext}`);
}

async function generateService(name, ext, useTsyringe, targetDir) {
  const className = name.endsWith('Service') ? name : `${name}Service`;
  const fileName = className.replace(/([A-Z])/g, (match, p1, offset) => 
    offset > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase()
  );
  
  if (useTsyringe && ext === 'ts') {
    const content = `import { injectable } from 'tsyringe';

@injectable()
export class ${className} {
  constructor() {
    // Initialize service
  }

  async findAll(): Promise<any[]> {
    // Implement findAll logic
    return [];
  }

  async findOne(id: string): Promise<any | null> {
    // Implement findOne logic
    return null;
  }

  async create(data: any): Promise<any> {
    // Implement create logic
    return data;
  }

  async update(id: string, data: any): Promise<any | null> {
    // Implement update logic
    return { id, ...data };
  }

  async remove(id: string): Promise<boolean> {
    // Implement remove logic
    return true;
  }
}
`;
    writeFileSafe(path.join(targetDir, 'src', 'services', `${fileName}.${ext}`), content);
  } else if (ext === 'ts') {
    const content = `export class ${className} {
  constructor() {
    // Initialize service
  }

  async findAll(): Promise<any[]> {
    // Implement findAll logic
    return [];
  }

  async findOne(id: string): Promise<any | null> {
    // Implement findOne logic
    return null;
  }

  async create(data: any): Promise<any> {
    // Implement create logic
    return data;
  }

  async update(id: string, data: any): Promise<any | null> {
    // Implement update logic
    return { id, ...data };
  }

  async remove(id: string): Promise<boolean> {
    // Implement remove logic
    return true;
  }
}
`;
    writeFileSafe(path.join(targetDir, 'src', 'services', `${fileName}.${ext}`), content);
  } else {
    const content = useTsyringe ? 
      `const { injectable } = require('tsyringe');

@injectable()
class ${className} {
  constructor() {
    // Initialize service
  }

  async findAll() {
    // Implement findAll logic
    return [];
  }

  async findOne(id) {
    // Implement findOne logic
    return null;
  }

  async create(data) {
    // Implement create logic
    return data;
  }

  async update(id, data) {
    // Implement update logic
    return { id, ...data };
  }

  async remove(id) {
    // Implement remove logic
    return true;
  }
}

module.exports = { ${className} };` :
      `class ${className} {
  constructor() {
    // Initialize service
  }

  async findAll() {
    // Implement findAll logic
    return [];
  }

  async findOne(id) {
    // Implement findOne logic
    return null;
  }

  async create(data) {
    // Implement create logic
    return data;
  }

  async update(id, data) {
    // Implement update logic
    return { id, ...data };
  }

  async remove(id) {
    // Implement remove logic
    return true;
  }
}

module.exports = { ${className} };`;
    writeFileSafe(path.join(targetDir, 'src', 'services', `${fileName}.${ext}`), content);
  }
  
  console.log(`✅ Generated service: src/services/${fileName}.${ext}`);
}

async function generateMiddleware(name, ext, targetDir) {
  const className = name.endsWith('Middleware') ? name : `${name}Middleware`;
  const fileName = className.replace(/([A-Z])/g, (match, p1, offset) => 
    offset > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase()
  );
  
  if (ext === 'ts') {
    const content = `import { Request, Response, NextFunction } from 'express';

export class ${className} {
  static handle(req: Request, res: Response, next: NextFunction) {
    // Add middleware logic here
    console.log('${className} executed');
    next();
  }
}

export default ${className}.handle;
`;
    writeFileSafe(path.join(targetDir, 'src', 'middleware', `${fileName}.${ext}`), content);
  } else {
    const content = `const ${className} = (req, res, next) => {
  // Add middleware logic here
  console.log('${className} executed');
  next();
};

module.exports = ${className};
`;
    writeFileSafe(path.join(targetDir, 'src', 'middleware', `${fileName}.${ext}`), content);
  }
  
  console.log(`✅ Generated middleware: src/middleware/${fileName}.${ext}`);
}

async function generateRoute(name, ext, useTsyringe, targetDir) {
  const routeName = name.toLowerCase();
  const fileName = routeName;
  
  if (useTsyringe && ext === 'ts') {
    const content = `import { Router } from 'express';
import { container } from 'tsyringe';

const router = Router();

// Add your routes here
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '${routeName} routes',
    data: []
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: '${routeName} by id',
    data: { id }
  });
});

router.post('/', (req, res) => {
  const data = req.body;
  res.status(201).json({
    success: true,
    message: '${routeName} created',
    data
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  res.json({
    success: true,
    message: '${routeName} updated',
    data: { id, ...data }
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: '${routeName} deleted',
    data: { id }
  });
});

export default router;
`;
    writeFileSafe(path.join(targetDir, 'src', 'routes', `${fileName}.${ext}`), content);
  } else if (ext === 'ts') {
    const content = `import { Router } from 'express';

const router = Router();

// Add your routes here
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '${routeName} routes',
    data: []
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: '${routeName} by id',
    data: { id }
  });
});

router.post('/', (req, res) => {
  const data = req.body;
  res.status(201).json({
    success: true,
    message: '${routeName} created',
    data
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  res.json({
    success: true,
    message: '${routeName} updated',
    data: { id, ...data }
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: '${routeName} deleted',
    data: { id }
  });
});

export default router;
`;
    writeFileSafe(path.join(targetDir, 'src', 'routes', `${fileName}.${ext}`), content);
  } else {
    const content = `const express = require('express');
const router = express.Router();

// Add your routes here
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '${routeName} routes',
    data: []
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: '${routeName} by id',
    data: { id }
  });
});

router.post('/', (req, res) => {
  const data = req.body;
  res.status(201).json({
    success: true,
    message: '${routeName} created',
    data
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  res.json({
    success: true,
    message: '${routeName} updated',
    data: { id, ...data }
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: '${routeName} deleted',
    data: { id }
  });
});

module.exports = router;
`;
    writeFileSafe(path.join(targetDir, 'src', 'routes', `${fileName}.${ext}`), content);
  }
  
  console.log(`✅ Generated route: src/routes/${fileName}.${ext}`);
}

async function generateModel(name, ext, targetDir) {
  const className = name;
  const fileName = className.toLowerCase();
  
  if (ext === 'ts') {
    const content = `export interface ${className} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // Add your properties here
}

export class ${className}Model {
  private data: ${className}[] = [];

  async findAll(): Promise<${className}[]> {
    return [...this.data];
  }

  async findById(id: string): Promise<${className} | null> {
    return this.data.find(item => item.id === id) || null;
  }

  async create(data: Omit<${className}, 'id' | 'createdAt' | 'updatedAt'>): Promise<${className}> {
    const newItem: ${className} = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.data.push(newItem);
    return newItem;
  }

  async update(id: string, data: Partial<${className}>): Promise<${className} | null> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data[index] = {
      ...this.data[index],
      ...data,
      updatedAt: new Date()
    };

    return this.data[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.data.splice(index, 1);
    return true;
  }
}
`;
    writeFileSafe(path.join(targetDir, 'src', 'models', `${fileName}.${ext}`), content);
  } else {
    const content = `class ${className}Model {
  constructor() {
    this.data = [];
  }

  async findAll() {
    return [...this.data];
  }

  async findById(id) {
    return this.data.find(item => item.id === id) || null;
  }

  async create(data) {
    const newItem = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.data.push(newItem);
    return newItem;
  }

  async update(id, data) {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data[index] = {
      ...this.data[index],
      ...data,
      updatedAt: new Date()
    };

    return this.data[index];
  }

  async delete(id) {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.data.splice(index, 1);
    return true;
  }
}

module.exports = { ${className}Model };
`;
    writeFileSafe(path.join(targetDir, 'src', 'models', `${fileName}.${ext}`), content);
  }
  
  console.log(`✅ Generated model: src/models/${fileName}.${ext}`);
}

async function generateInterface(name, targetDir) {
  const interfaceName = name.endsWith('Interface') ? name : `${name}Interface`;
  const fileName = interfaceName.toLowerCase();
  
  const content = `export interface ${interfaceName} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // Add your properties here
}

export interface Create${name}Dto {
  // Add create properties here
}

export interface Update${name}Dto {
  // Add update properties here (all optional)
}
`;
  writeFileSafe(path.join(targetDir, 'src', 'interfaces', `${fileName}.ts`), content);
  
  console.log(`✅ Generated interface: src/interfaces/${fileName}.ts`);
}

async function generateTest(name, ext, targetDir) {
  const testName = name;
  const fileName = testName.toLowerCase();
  
  if (ext === 'ts') {
    const content = `import request from 'supertest';
import express from 'express';

describe('${testName}', () => {
  let app: express.Application;

  beforeAll(() => {
    // Setup your app here
    app = express();
    app.use(express.json());
    
    // Add your routes here
    app.get('/test', (req, res) => {
      res.json({ message: 'test' });
    });
  });

  describe('GET /test', () => {
    it('should return test message', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);
      
      expect(response.body).toHaveProperty('message', 'test');
    });
  });

  // Add more tests here
});
`;
    writeFileSafe(path.join(targetDir, 'tests', `${fileName}.test.${ext}`), content);
  } else {
    const content = `const request = require('supertest');
const express = require('express');

describe('${testName}', () => {
  let app;

  beforeAll(() => {
    // Setup your app here
    app = express();
    app.use(express.json());
    
    // Add your routes here
    app.get('/test', (req, res) => {
      res.json({ message: 'test' });
    });
  });

  describe('GET /test', () => {
    it('should return test message', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);
      
      expect(response.body).toHaveProperty('message', 'test');
    });
  });

  // Add more tests here
});
`;
    writeFileSafe(path.join(targetDir, 'tests', `${fileName}.test.${ext}`), content);
  }
  
  console.log(`✅ Generated test: tests/${fileName}.test.${ext}`);
}

async function generateResource(name, ext, useTsyringe, targetDir) {
  console.log(`🔧 Generating complete CRUD resource: ${name}`);
  
  // Generate controller
  await generateController(name, ext, useTsyringe, targetDir);
  
  // Generate service
  await generateService(name, ext, useTsyringe, targetDir);
  
  // Generate routes
  await generateRoute(name, ext, useTsyringe, targetDir);
  
  // Generate model
  await generateModel(name, ext, targetDir);
  
  // Generate interface if TypeScript
  if (ext === 'ts') {
    await generateInterface(name, targetDir);
  }
  
  // Generate test
  await generateTest(name, ext, targetDir);
  
  console.log(`✅ Generated complete CRUD resource: ${name}`);
  console.log(`📁 Files created:`);
  console.log(`   - src/controllers/${name.toLowerCase()}-controller.${ext}`);
  console.log(`   - src/services/${name.toLowerCase()}-service.${ext}`);
  console.log(`   - src/routes/${name.toLowerCase()}.${ext}`);
  console.log(`   - src/models/${name.toLowerCase()}.${ext}`);
  if (ext === 'ts') {
    console.log(`   - src/interfaces/${name.toLowerCase()}-interface.ts`);
  }
  console.log(`   - tests/${name.toLowerCase()}.test.${ext}`);
}

function showHelp() {
  console.log(`
FiExpress CLI - NestJS CLI-like tool for Express.js projects

Usage:
  npx fiexpress new <name> [options]     Create a new Express.js project
  npx fiexpress generate <schematic>     Generate components, services, etc.
  npx fiexpress --help                   Show this help message
  npx fiexpress --version                Show version information

Options for 'new' command:
  --db <database>        Database type (postgres|mysql|mongo) [default: postgres]
  --orm <orm>            ORM to use (prisma|sequelize|drizzle|mongoose|none) [default: auto]
  --ts                   Enable TypeScript support
  --tsyringe             Enable tsyringe dependency injection
  --jest                 Include Jest testing framework
  --demo <type>          Create demo app (weather|todo|blog) [default: none]
  --dotenv               Add .env.example file
  --jwt                  Include JWT authentication helpers
  --casl                 Include CASL authorization stubs
  --user                 Add example user routes and model
  --roles                Add role-based middleware helpers

Available schematics for 'generate' command:
  controller <name>      Generate a controller
  service <name>         Generate a service
  middleware <name>      Generate a middleware
  route <name>           Generate a route
  model <name>           Generate a model
  interface <name>       Generate an interface (TS only)
  test <name>            Generate a test file
  resource <name>        Generate a CRUD resource (controller + service + routes)

Examples:
  npx fiexpress new my-api
  npx fiexpress new my-api --ts --db postgres --orm prisma --jest
  npx fiexpress new my-api --jwt --casl --user --roles
  npx fiexpress new weather-api --ts --tsyringe --demo weather
  npx fiexpress new todo-api --ts --tsyringe --demo todo --jwt
  npx fiexpress generate controller UserController
  npx fiexpress generate service UserService
  npx fiexpress generate resource Product

For more information, visit: https://github.com/developersailor/fiexpress
`);
}

function showVersion() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(pkg.version);
  } catch {
    console.log('1.0.0');
  }
}

async function main() {
  try {
    const argv = process.argv.slice(2);
    
    // Handle help and version flags
    if (argv.includes('--help') || argv.includes('-h')) {
      showHelp();
      return;
    }
    
    if (argv.includes('--version') || argv.includes('-v')) {
      showVersion();
      return;
    }

    // Parse command
    const command = argv[0];
    
    if (!command || command === 'new') {
      // Default to 'new' command
      console.log("🚀 FiExpress CLI - Creating new Express.js project");
      
      const flags = {};
      const args = command === 'new' ? argv.slice(1) : argv;
      
      // First argument is the project name (if not a flag)
      if (args.length > 0 && !args[0].startsWith("--")) {
        flags.name = args[0];
        args.shift(); // Remove the name from args
      }
      
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a.startsWith("--")) {
          const key = a.replace(/^--+/, "");
          const next = args[i + 1];
          if (next && !next.startsWith("--")) {
            flags[key] = next;
            i++;
          } else {
            flags[key] = "yes";
          }
        }
      }

      await createNewProject(flags);
    } else if (command === 'generate' || command === 'g') {
      const schematic = argv[1];
      const name = argv[2];
      
      if (!schematic || !name) {
        console.error("❌ Usage: npx fiexpress generate <schematic> <name>");
        console.log("Available schematics: controller, service, middleware, route, model, interface, test, resource");
        throw new Error("Not in a FiExpress project directory");
      }
      
      await generateComponent(schematic, name);
    } else if (command === 'add') {
      console.log("➕ Add command - Coming soon!");
      console.log("This feature will allow you to add packages and integrations to existing projects.");
      console.log("For now, please manually add packages to your project.");
    } else {
      console.error(`❌ Unknown command: ${command}`);
      console.log("Run 'npx fiexpress --help' to see available commands.");
      throw new Error("Not in a FiExpress project directory");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    throw new Error("Not in a FiExpress project directory");
  }
}

async function createNewProject(flags) {
  try {
    let name = flags.name;
    let db = flags.db;
    let orm = flags.orm;
    let dotenvOpt = flags.dotenv;
    let jwt = flags.jwt;
    let casl = flags.casl;
    let user = flags.user;
    let roles = flags.roles;
    let ts = flags.ts;
    let tsyringe = flags.tsyringe;
    let jest = flags.jest;
    let demo = flags.demo;

    // Only ask for missing required parameters
    if (!name) {
      name = (await question("New project directory name [my-app]: ")) || "my-app";
    }
    
    // Set defaults for optional parameters if not provided
    db = db || "postgres";
    orm = orm || "none";
    dotenvOpt = dotenvOpt || "yes";
    jwt = jwt || "no";
    casl = casl || "no";
    user = user || "no";
    roles = roles || "no";
    ts = ts || "no";
    tsyringe = tsyringe || "no";
    jest = jest || "no";
    demo = demo || "none";

    rl.close();

    const repoSpec = "developersailor/fiexpress";
    const dir = name || "my-app";

    process.env.FIEXPRESS_DB = (db || "postgres").toLowerCase();
    process.env.FIEXPRESS_ORM = (orm || "none").toLowerCase();
    process.env.FIEXPRESS_DOTENV = (dotenvOpt || "yes").toLowerCase();
    process.env.FIEXPRESS_JWT = (jwt || "no").toLowerCase();
    process.env.FIEXPRESS_CASL = (casl || "no").toLowerCase();
    process.env.FIEXPRESS_USER = (user || "no").toLowerCase();
    process.env.FIEXPRESS_ROLES = (roles || "no").toLowerCase();
    process.env.FIEXPRESS_TS = (ts || "no").toLowerCase();
    process.env.FIEXPRESS_TSYRINGE = (tsyringe || "no").toLowerCase();
    process.env.FIEXPRESS_JEST = (jest || "no").toLowerCase();
    process.env.FIEXPRESS_DEMO = (demo || "none").toLowerCase();

    const dbVal = process.env.FIEXPRESS_DB;
    const ormVal = process.env.FIEXPRESS_ORM;
    const mapDbToOrm = (d) => {
      if (!d) return null;
      if (d === "mongo") return "mongoose";
      if (d === "postgres" || d === "mysql") return "sequelize";
      return "sequelize";
    };
    // Auto-select compatible ORM if not specified
    const suggestedOrm = mapDbToOrm(dbVal);
    if (suggestedOrm && ormVal === "none") {
      process.env.FIEXPRESS_ORM = suggestedOrm;
      console.log(`Auto-selected ORM '${suggestedOrm}' for DB '${dbVal}'`);
    }

    console.log(`📥 Cloning template from ${repoSpec} into ./${dir}...`);

    const isLocalTest = !!process.env.FIEXPRESS_LOCAL_TEMPLATE;

    if (isLocalTest) {
      const src = path.resolve(process.env.FIEXPRESS_LOCAL_TEMPLATE);
      const dst = path.resolve(dir);
      try {
        copyLocalTemplateToDst(src, dst);
        await runPostClone(dst);
        console.log("✅ Project created successfully!");
      } catch (err) {
        console.error("❌ Failed to copy local template:", err);
        throw new Error("Not in a FiExpress project directory");
      }
    } else {
      const child = spawn("npx", ["degit", repoSpec, dir], {
        stdio: "inherit",
      });
      child.on("close", (code) => {
        if (code === 0) {
          runPostClone(path.resolve(process.cwd(), dir));
          console.log("✅ Project created successfully!");
        } else {
          console.error("❌ Template cloning failed with code", code);
          throw new Error("Not in a FiExpress project directory");
        }
      });
    }
  } catch (err) {
    console.error("❌ Error creating project:", err);
    throw new Error("Not in a FiExpress project directory");
  }
}

main();
