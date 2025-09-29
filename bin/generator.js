import fs from "fs";
import path from "path";
import { writeFileSafe } from "./utils.js";

export async function generateComponent(schematic, name, targetRoot) {
  // Check if we're in a FiExpress project
  if (!fs.existsSync(path.join(targetRoot, "package.json"))) {
    throw new Error("Not in a FiExpress project directory. Please run this command from your project root.");
  }

  const ext = fs.existsSync(path.join(targetRoot, "tsconfig.json")) ? "ts" : "js";
  const isTypeScript = ext === "ts";

  console.log(`🔧 Generating ${schematic}: ${name}`);

  switch (schematic) {
    case "controller":
      await generateController(name, targetRoot, ext, isTypeScript);
      break;
    case "service":
      await generateService(name, targetRoot, ext, isTypeScript);
      break;
    case "middleware":
      await generateMiddleware(name, targetRoot, ext, isTypeScript);
      break;
    case "route":
      await generateRoute(name, targetRoot, ext, isTypeScript);
      break;
    case "model":
      await generateModel(name, targetRoot, ext, isTypeScript);
      break;
    case "interface":
      if (!isTypeScript) {
        throw new Error("Interfaces are only available for TypeScript projects.");
      }
      await generateInterface(name, targetRoot);
      break;
    case "test":
      await generateTest(name, targetRoot, ext, isTypeScript);
      break;
    case "resource":
      await generateResource(name, targetRoot, ext, isTypeScript);
      break;
    default:
      throw new Error(`Unknown schematic: ${schematic}`);
  }
}

async function generateController(name, targetRoot, ext, isTypeScript) {
  const fileName = `${name.toLowerCase()}-controller`;
  const className = name.endsWith("Controller") ? name : `${name}Controller`;
  
  let content;
  if (isTypeScript) {
    content = `import { Request, Response } from 'express';

export class ${className} {
  async getAll(req: Request, res: Response) {
    try {
      // TODO: Implement getAll logic
      res.json({ message: 'Get all ${name.toLowerCase()}s' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // TODO: Implement getById logic
      res.json({ message: \`Get ${name.toLowerCase()} by id: \${id}\` });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      // TODO: Implement create logic
      res.json({ message: 'Create ${name.toLowerCase()}' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // TODO: Implement update logic
      res.json({ message: \`Update ${name.toLowerCase()} \${id}\` });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // TODO: Implement delete logic
      res.json({ message: \`Delete ${name.toLowerCase()} \${id}\` });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}`;
  } else {
    content = `class ${className} {
  async getAll(req, res) {
    try {
      // TODO: Implement getAll logic
      res.json({ message: 'Get all ${name.toLowerCase()}s' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      // TODO: Implement getById logic
      res.json({ message: \`Get ${name.toLowerCase()} by id: \${id}\` });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async create(req, res) {
    try {
      // TODO: Implement create logic
      res.json({ message: 'Create ${name.toLowerCase()}' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      // TODO: Implement update logic
      res.json({ message: \`Update ${name.toLowerCase()} \${id}\` });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      // TODO: Implement delete logic
      res.json({ message: \`Delete ${name.toLowerCase()} \${id}\` });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = { ${className} };`;
  }

  writeFileSafe(path.join(targetRoot, "src", "controllers", `${fileName}.${ext}`), content);
  console.log(`✅ Generated controller: src/controllers/${fileName}.${ext}`);
}

async function generateService(name, targetRoot, ext, isTypeScript) {
  const fileName = `${name.toLowerCase()}-service`;
  const className = name.endsWith("Service") ? name : `${name}Service`;
  
  let content;
  if (isTypeScript) {
    content = `export class ${className} {
  async getAll() {
    // TODO: Implement getAll logic
    return [];
  }

  async getById(id: string) {
    // TODO: Implement getById logic
    return null;
  }

  async create(data: any) {
    // TODO: Implement create logic
    return data;
  }

  async update(id: string, data: any) {
    // TODO: Implement update logic
    return data;
  }

  async delete(id: string) {
    // TODO: Implement delete logic
    return true;
  }
}`;
  } else {
    content = `class ${className} {
  async getAll() {
    // TODO: Implement getAll logic
    return [];
  }

  async getById(id) {
    // TODO: Implement getById logic
    return null;
  }

  async create(data) {
    // TODO: Implement create logic
    return data;
  }

  async update(id, data) {
    // TODO: Implement update logic
    return data;
  }

  async delete(id) {
    // TODO: Implement delete logic
    return true;
  }
}

module.exports = { ${className} };`;
  }

  writeFileSafe(path.join(targetRoot, "src", "services", `${fileName}.${ext}`), content);
  console.log(`✅ Generated service: src/services/${fileName}.${ext}`);
}

async function generateMiddleware(name, targetRoot, ext, isTypeScript) {
  const fileName = `${name.toLowerCase()}-middleware`;
  const className = name.endsWith("Middleware") ? name : `${name}Middleware`;
  
  let content;
  if (isTypeScript) {
    content = `import { Request, Response, NextFunction } from 'express';

export function ${className}(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement middleware logic
  console.log('${className} executed');
  next();
}`;
  } else {
    content = `function ${className}(req, res, next) {
  // TODO: Implement middleware logic
  console.log('${className} executed');
  next();
}

module.exports = { ${className} };`;
  }

  writeFileSafe(path.join(targetRoot, "src", "middleware", `${fileName}.${ext}`), content);
  console.log(`✅ Generated middleware: src/middleware/${fileName}.${ext}`);
}

async function generateRoute(name, targetRoot, ext, isTypeScript) {
  const fileName = name.toLowerCase();
  
  let content;
  if (isTypeScript) {
    content = `import express from 'express';
import { ${name}Controller } from '../controllers/${name.toLowerCase()}-controller';

const router = express.Router();
const controller = new ${name}Controller();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;`;
  } else {
    content = `const express = require('express');
const { ${name}Controller } = require('../controllers/${name.toLowerCase()}-controller');

const router = express.Router();
const controller = new ${name}Controller();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;`;
  }

  writeFileSafe(path.join(targetRoot, "src", "routes", `${fileName}.${ext}`), content);
  console.log(`✅ Generated route: src/routes/${fileName}.${ext}`);
}

async function generateModel(name, targetRoot, ext, isTypeScript) {
  const fileName = name.toLowerCase();
  
  let content;
  if (isTypeScript) {
    content = `export interface ${name} {
  id: string;
  // TODO: Add your properties here
  createdAt: Date;
  updatedAt: Date;
}

export class ${name}Model {
  // TODO: Implement model methods
}`;
  } else {
    content = `class ${name}Model {
  constructor(data) {
    this.id = data.id;
    // TODO: Add your properties here
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // TODO: Implement model methods
}

module.exports = { ${name}Model };`;
  }

  writeFileSafe(path.join(targetRoot, "src", "models", `${fileName}.${ext}`), content);
  console.log(`✅ Generated model: src/models/${fileName}.${ext}`);
}

async function generateInterface(name, targetRoot) {
  const fileName = `${name.toLowerCase()}-interface`;
  
  const content = `export interface ${name} {
  id: string;
  // TODO: Add your interface properties here
  createdAt: Date;
  updatedAt: Date;
}`;

  writeFileSafe(path.join(targetRoot, "src", "interfaces", `${fileName}.ts`), content);
  console.log(`✅ Generated interface: src/interfaces/${fileName}.ts`);
}

async function generateTest(name, targetRoot, ext, isTypeScript) {
  const fileName = `${name.toLowerCase()}.test`;
  
  let content;
  if (isTypeScript) {
    content = `import { ${name} } from '../src/services/${name.toLowerCase()}-service';

describe('${name}', () => {
  let service: ${name};

  beforeEach(() => {
    service = new ${name}();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: Add more tests
});`;
  } else {
    content = `const { ${name} } = require('../src/services/${name.toLowerCase()}-service');

describe('${name}', () => {
  let service;

  beforeEach(() => {
    service = new ${name}();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: Add more tests
});`;
  }

  writeFileSafe(path.join(targetRoot, "tests", `${fileName}.${ext}`), content);
  console.log(`✅ Generated test: tests/${fileName}.${ext}`);
}

async function generateResource(name, targetRoot, ext, isTypeScript) {
  console.log(`🔧 Generating complete CRUD resource: ${name}`);
  
  // Generate all components
  await generateController(name, targetRoot, ext, isTypeScript);
  await generateService(name, targetRoot, ext, isTypeScript);
  await generateRoute(name, targetRoot, ext, isTypeScript);
  await generateModel(name, targetRoot, ext, isTypeScript);
  
  if (isTypeScript) {
    await generateInterface(name, targetRoot);
  }
  
  await generateTest(name, targetRoot, ext, isTypeScript);
  
  console.log(`✅ Generated complete CRUD resource: ${name}`);
  console.log(`📁 Files created:`);
  console.log(`   - src/controllers/${name.toLowerCase()}-controller.${ext}`);
  console.log(`   - src/services/${name.toLowerCase()}-service.${ext}`);
  console.log(`   - src/routes/${name.toLowerCase()}.${ext}`);
  console.log(`   - src/models/${name.toLowerCase()}.${ext}`);
  if (isTypeScript) {
    console.log(`   - src/interfaces/${name.toLowerCase()}-interface.ts`);
  }
  console.log(`   - tests/${name.toLowerCase()}.test.${ext}`);
  
  console.log(`
📝 Next steps:
1. Update your main router to include the new routes
2. Implement the business logic in the service
3. Add database integration in the model
4. Write comprehensive tests
`);
}
