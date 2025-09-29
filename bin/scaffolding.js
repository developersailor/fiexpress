import fs from "fs";
import path from "path";
import { writeFileSafe, addDepsToPackageJson, createNewPackageJson } from "./utils.js";
import { generateWeatherDemo, generateTodoDemo, generateBlogDemo } from "./demos.js";

export async function runPostClone(targetRoot) {
  // Running post-clone scaffolding
  const ext = process.env.FIEXPRESS_TS === "yes" ? "ts" : "js";
  
  // Create new package.json with project-specific configuration
  const projectName = path.basename(targetRoot);
  const options = {
    ts: process.env.FIEXPRESS_TS === "yes",
    jest: process.env.FIEXPRESS_JEST === "yes",
    orm: process.env.FIEXPRESS_ORM,
    db: process.env.FIEXPRESS_DB,
    jwt: process.env.FIEXPRESS_JWT === "yes",
    casl: process.env.FIEXPRESS_CASL === "yes",
    tsyringe: process.env.FIEXPRESS_TSYRINGE === "yes"
  };
  
  // Create fresh package.json
  createNewPackageJson(targetRoot, projectName, options);

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
    await setupDatabase(orm, dbForDriver, toInstall, targetRoot, ext);
  }

  if (process.env.FIEXPRESS_JWT === "yes") {
    await setupJWT(toInstall, targetRoot, ext);
  }

  if (process.env.FIEXPRESS_CASL === "yes") {
    await setupCASL(toInstall, targetRoot, ext);
  }

  if (process.env.FIEXPRESS_ROLES === "yes") {
    await setupRoles(targetRoot, ext);
  }

  if (process.env.FIEXPRESS_USER === "yes") {
    await setupUser(targetRoot, ext);
  }

  if (process.env.FIEXPRESS_TS === "yes") {
    await setupTypeScript(toInstall, orm);
  }

  if (process.env.FIEXPRESS_JEST === "yes") {
    await setupJest(toInstall, targetRoot, ext);
  }

  await setupESLintPrettier(toInstall, targetRoot, ext);

  await setupGitignore(targetRoot);

  await setupPackageScripts(targetRoot, ext);

  // Generate demo app if requested
  if (process.env.FIEXPRESS_DEMO !== "none") {
    await generateDemoApp(targetRoot, ext);
  }

  // Dependencies are already added in createNewPackageJson
}

async function setupDatabase(orm, dbForDriver, toInstall, targetRoot, ext) {
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

async function setupJWT(toInstall, targetRoot, ext) {
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

async function setupCASL(toInstall, targetRoot, ext) {
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

async function setupRoles(targetRoot, ext) {
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

async function setupUser(targetRoot, ext) {
  writeFileSafe(
    path.join(targetRoot, "src", "routes", `user.${ext}`),
    `// user routes stub\nimport express from 'express';\nconst router = express.Router();\nrouter.get('/', (req,res)=>res.json({msg:'users'}));\nexport default router;\n`,
  );
  // Added user routes stub
}

async function setupTypeScript(toInstall, orm) {
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
}

async function setupJest(toInstall, targetRoot, ext) {
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
    app = express();
    app.use(express.json());
    app.get('/', (req, res) => {
      res.json({ message: 'test' });
    });
  });

  it('should respond to GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('test');
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
    app = express();
    app.use(express.json());
    app.get('/', (req, res) => {
      res.json({ message: 'test' });
    });
  });

  it('should respond to GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('test');
  });
});
`
    );
  }
  
  // Added Jest testing framework
}

async function setupESLintPrettier(toInstall, targetRoot, ext) {
  // Add ESLint and Prettier configuration
  if (process.env.FIEXPRESS_TS === "yes") {
    toInstall.dev["eslint"] = "^8.50.0";
    toInstall.dev["@typescript-eslint/parser"] = "^6.7.0";
    toInstall.dev["@typescript-eslint/eslint-plugin"] = "^6.7.0";
    toInstall.dev["prettier"] = "^3.0.3";
    
    writeFileSafe(
      path.join(targetRoot, ".eslintrc.js"),
      `module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};`
    );
    
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
    
    writeFileSafe(
      path.join(targetRoot, ".eslintrc.js"),
      `module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
  },
};`
    );
    
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
}

async function setupGitignore(targetRoot) {
  writeFileSafe(
    path.join(targetRoot, ".gitignore"),
    `node_modules/
.env
.env.local
.env.production
dist/
build/
coverage/
.DS_Store
*.log
`
  );
  
  // Added .gitignore file
}

async function setupPackageScripts(targetRoot, ext) {
  const pkgPath = path.join(targetRoot, "package.json");
  try {
    const raw = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.start = ext === "ts" ? "node dist/index.js" : "node src/index.js";
    pkg.scripts.dev = ext === "ts" ? "ts-node src/index.ts" : "node src/index.js";
    
    if (ext === "ts") {
      pkg.scripts.build = "tsc";
      pkg.scripts["type-check"] = "tsc --noEmit";
    }
    
    if (process.env.FIEXPRESS_JEST === "yes") {
      pkg.scripts.test = "jest";
      pkg.scripts["test:watch"] = "jest --watch";
      pkg.scripts["test:coverage"] = "jest --coverage";
    }
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    // Added start/dev scripts to generated package.json
  } catch {
    /* ignore */
  }
}

async function generateDemoApp(targetRoot, ext) {
  const demoType = process.env.FIEXPRESS_DEMO;
  
  if (demoType === "weather") {
    await generateWeatherDemo(targetRoot, ext);
  } else if (demoType === "todo") {
    await generateTodoDemo(targetRoot, ext);
  } else if (demoType === "blog") {
    await generateBlogDemo(targetRoot, ext);
  }
}

// Demo app generators are implemented in demos.js
