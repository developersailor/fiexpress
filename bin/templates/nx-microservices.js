import { writeFileSafe } from "../utils.js";
import path from "path";

export function generateMicroserviceApp(targetRoot, serviceName, ts) {
  const serviceDir = path.join(targetRoot, "apps", serviceName + "-service");
  
  // Service package.json
  const servicePackageJson = generateMicroservicePackageJson(serviceName, ts);
  writeFileSafe(path.join(serviceDir, "package.json"), servicePackageJson);
  
  // Service configuration
  const serviceConfig = generateMicroserviceConfig(serviceName, ts);
  writeFileSafe(path.join(serviceDir, "project.json"), serviceConfig);
  
  // TypeScript config
  if (ts) {
    const tsConfig = generateMicroserviceTsConfig(serviceName);
    writeFileSafe(path.join(serviceDir, "tsconfig.json"), tsConfig);
    writeFileSafe(path.join(serviceDir, "tsconfig.app.json"), tsConfig);
  }
  
  // Jest config
  const jestConfig = generateMicroserviceJestConfig(serviceName, ts);
  writeFileSafe(path.join(serviceDir, "jest.config.js"), jestConfig);
  
  // ESLint config
  const eslintConfig = generateMicroserviceEslintConfig(serviceName);
  writeFileSafe(path.join(serviceDir, ".eslintrc.json"), eslintConfig);
  
  // Generate service source files
  generateMicroserviceSource(targetRoot, serviceName, ts);
}

function generateMicroserviceSource(targetRoot, serviceName, ts) {
  const serviceDir = path.join(targetRoot, "apps", serviceName + "-service", "src");
  
  // Main service file
  const mainFile = ts ? generateMicroserviceMainTs(serviceName) : generateMicroserviceMainJs(serviceName);
  writeFileSafe(path.join(serviceDir, ts ? "main.ts" : "main.js"), mainFile);
  
  // Service controller
  const controller = ts ? generateMicroserviceControllerTs(serviceName) : generateMicroserviceControllerJs(serviceName);
  writeFileSafe(path.join(serviceDir, "controllers", `${serviceName}.controller.ts`), controller);
  
  // Service service
  const service = ts ? generateMicroserviceServiceTs(serviceName) : generateMicroserviceServiceJs(serviceName);
  writeFileSafe(path.join(serviceDir, "services", `${serviceName}.service.ts`), service);
  
  // Service routes
  const routes = ts ? generateMicroserviceRoutesTs(serviceName) : generateMicroserviceRoutesJs(serviceName);
  writeFileSafe(path.join(serviceDir, "routes", "index.ts"), routes);
  
  // Service model
  const model = ts ? generateMicroserviceModelTs(serviceName) : generateMicroserviceModelJs(serviceName);
  writeFileSafe(path.join(serviceDir, "models", `${serviceName}.model.ts`), model);
}

function generateMicroserviceMainTs(serviceName) {
  return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { ServiceDiscovery } from '@fiexpress/shared';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: '${serviceName}',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Service discovery registration
const discovery = new ServiceDiscovery();
discovery.register('${serviceName}-service', {
  port: PORT,
  host: process.env.HOST || 'localhost',
  version: '1.0.0'
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 ${serviceName} service running on port \${PORT}\`);
});`;
}

function generateMicroserviceMainJs(serviceName) {
  return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const routes = require('./routes');
const { ServiceDiscovery } = require('@fiexpress/shared');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: '${serviceName}',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Service discovery registration
const discovery = new ServiceDiscovery();
discovery.register('${serviceName}-service', {
  port: PORT,
  host: process.env.HOST || 'localhost',
  version: '1.0.0'
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 ${serviceName} service running on port \${PORT}\`);
});`;
}

function generateMicroserviceControllerTs(serviceName) {
  return `import { Request, Response } from 'express';
import { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service } from '../services/${serviceName}.service';

export class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller {
  private ${serviceName}Service: ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service;

  constructor() {
    this.${serviceName}Service = new ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service();
  }

  public getAll = async (req: Request, res: Response) => {
    try {
      const ${serviceName}s = await this.${serviceName}Service.getAll();
      res.json(${serviceName}s);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  public getById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const ${serviceName} = await this.${serviceName}Service.getById(id);
      if (!${serviceName}) {
        return res.status(404).json({ error: '${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} not found' });
      }
      res.json(${serviceName});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  public create = async (req: Request, res: Response) => {
    try {
      const ${serviceName} = await this.${serviceName}Service.create(req.body);
      res.status(201).json(${serviceName});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const ${serviceName} = await this.${serviceName}Service.update(id, req.body);
      if (!${serviceName}) {
        return res.status(404).json({ error: '${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} not found' });
      }
      res.json(${serviceName});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const deleted = await this.${serviceName}Service.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: '${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}`;
}

function generateMicroserviceControllerJs(serviceName) {
  return `class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller {
  constructor() {
    this.${serviceName}Service = new ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service();
  }

  getAll = async (req, res) => {
    try {
      const ${serviceName}s = await this.${serviceName}Service.getAll();
      res.json(${serviceName}s);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const id = req.params.id;
      const ${serviceName} = await this.${serviceName}Service.getById(id);
      if (!${serviceName}) {
        return res.status(404).json({ error: '${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} not found' });
      }
      res.json(${serviceName});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  create = async (req, res) => {
    try {
      const ${serviceName} = await this.${serviceName}Service.create(req.body);
      res.status(201).json(${serviceName});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const id = req.params.id;
      const ${serviceName} = await this.${serviceName}Service.update(id, req.body);
      if (!${serviceName}) {
        return res.status(404).json({ error: '${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} not found' });
      }
      res.json(${serviceName});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  delete = async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await this.${serviceName}Service.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: '${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

module.exports = { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller };`;
}

function generateMicroserviceServiceTs(serviceName) {
  return `import { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Model } from '../models/${serviceName}.model';

export class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service {
  private ${serviceName}Model: ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Model;

  constructor() {
    this.${serviceName}Model = new ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Model();
  }

  public async getAll() {
    return await this.${serviceName}Model.findAll();
  }

  public async getById(id: string) {
    return await this.${serviceName}Model.findById(id);
  }

  public async create(data: any) {
    return await this.${serviceName}Model.create(data);
  }

  public async update(id: string, data: any) {
    return await this.${serviceName}Model.update(id, data);
  }

  public async delete(id: string) {
    return await this.${serviceName}Model.delete(id);
  }
}`;
}

function generateMicroserviceServiceJs(serviceName) {
  return `class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service {
  constructor() {
    this.${serviceName}Model = new ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Model();
  }

  async getAll() {
    return await this.${serviceName}Model.findAll();
  }

  async getById(id) {
    return await this.${serviceName}Model.findById(id);
  }

  async create(data) {
    return await this.${serviceName}Model.create(data);
  }

  async update(id, data) {
    return await this.${serviceName}Model.update(id, data);
  }

  async delete(id) {
    return await this.${serviceName}Model.delete(id);
  }
}

module.exports = { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service };`;
}

function generateMicroserviceRoutesTs(serviceName) {
  return `import { Router } from 'express';
import { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller } from '../controllers/${serviceName}.controller';

const router = Router();
const ${serviceName}Controller = new ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller();

// Routes
router.get('/', ${serviceName}Controller.getAll);
router.get('/:id', ${serviceName}Controller.getById);
router.post('/', ${serviceName}Controller.create);
router.put('/:id', ${serviceName}Controller.update);
router.delete('/:id', ${serviceName}Controller.delete);

export default router;`;
}

function generateMicroserviceRoutesJs(serviceName) {
  return `const express = require('express');
const { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller } = require('../controllers/${serviceName}.controller');

const router = express.Router();
const ${serviceName}Controller = new ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller();

// Routes
router.get('/', ${serviceName}Controller.getAll);
router.get('/:id', ${serviceName}Controller.getById);
router.post('/', ${serviceName}Controller.create);
router.put('/:id', ${serviceName}Controller.update);
router.delete('/:id', ${serviceName}Controller.delete);

module.exports = router;`;
}

function generateMicroserviceModelTs(serviceName) {
  return `export class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Model {
  private data: any[] = [];

  public async findAll() {
    return this.data;
  }

  public async findById(id: string) {
    return this.data.find(item => item.id === id);
  }

  public async create(data: any) {
    const newItem = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.push(newItem);
    return newItem;
  }

  public async update(id: string, data: any) {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    this.data[index] = {
      ...this.data[index],
      ...data,
      updatedAt: new Date()
    };
    return this.data[index];
  }

  public async delete(id: string) {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.data.splice(index, 1);
    return true;
  }
}`;
}

function generateMicroserviceModelJs(serviceName) {
  return `class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Model {
  constructor() {
    this.data = [];
  }

  async findAll() {
    return this.data;
  }

  async findById(id) {
    return this.data.find(item => item.id === id);
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

module.exports = { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Model };`;
}

// Helper functions for microservice configurations
function generateMicroservicePackageJson(serviceName, ts) {
  return JSON.stringify({
    "name": `@fiexpress/${serviceName}-service`,
    "version": "1.0.0",
    "main": ts ? "main.ts" : "main.js",
    "scripts": {
      "build": "nx build",
      "serve": "nx serve",
      "test": "nx test",
      "lint": "nx lint"
    }
  }, null, 2);
}

function generateMicroserviceConfig(serviceName, ts) {
  return JSON.stringify({
    "name": `${serviceName}-service`,
    "root": `apps/${serviceName}-service`,
    "sourceRoot": `apps/${serviceName}-service/src`,
    "projectType": "application",
    "targets": {
      "build": {
        "executor": "@nx/webpack:webpack",
        "outputs": ["{options.outputPath}"],
        "options": {
          "target": "node",
          "compiler": "tsc",
          "outputPath": `dist/apps/${serviceName}-service`,
          "main": `apps/${serviceName}-service/src/main.${ts ? 'ts' : 'js'}`,
          "tsConfig": `apps/${serviceName}-service/tsconfig.app.json`,
          "assets": [`apps/${serviceName}-service/src/assets`]
        }
      },
      "serve": {
        "executor": "@nx/js:node",
        "options": {
          "buildTarget": `${serviceName}-service:build`
        }
      },
      "test": {
        "executor": "@nx/jest:jest",
        "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
        "options": {
          "jestConfig": `apps/${serviceName}-service/jest.config.js`,
          "passWithNoTests": true
        }
      },
      "lint": {
        "executor": "@nx/eslint:lint",
        "outputs": ["{options.outputFile}"]
      }
    }
  }, null, 2);
}

function generateMicroserviceTsConfig(serviceName) {
  return JSON.stringify({
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "module": "commonjs",
      "outDir": "../../dist/out-tsc",
      "forceConsistentCasingInFileNames": true,
      "strict": true,
      "noImplicitOverride": true,
      "noPropertyAccessFromIndexSignature": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true
    },
    "files": [],
    "include": [],
    "references": [
      {
        "path": "./tsconfig.app.json"
      }
    ]
  }, null, 2);
}

function generateMicroserviceJestConfig(serviceName) {
  return `module.exports = {
  displayName: '${serviceName}-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/${serviceName}-service',
};`;
}

function generateMicroserviceEslintConfig(serviceName) {
  return JSON.stringify({
    "extends": ["../../.eslintrc.json"],
    "ignorePatterns": ["!**/*"],
    "overrides": [
      {
        "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
        "rules": {}
      }
    ]
  }, null, 2);
}
