import { writeFileSafe } from "../utils.js";
import path from "path";
import fs from "fs";

export function generateMicroservicesSupport(targetRoot, options = {}) {
  const { ts = false, services = ['user', 'product', 'order'] } = options;
  
  // Cote configuration
  const coteConfig = generateCoteConfig(ts);
  writeFileSafe(path.join(targetRoot, "src", "config", "cote.config.js"), coteConfig);
  
  // Service discovery
  const serviceDiscovery = generateServiceDiscovery(ts);
  writeFileSafe(path.join(targetRoot, "src", "microservices", "service.discovery.js"), serviceDiscovery);
  
  // API Gateway
  const apiGateway = generateAPIGateway(ts);
  writeFileSafe(path.join(targetRoot, "src", "microservices", "api.gateway.js"), apiGateway);
  
  // Generate individual services
  services.forEach(service => {
    generateService(targetRoot, service, ts);
  });
  
  // Inter-service communication
  const communication = generateInterServiceCommunication(ts);
  writeFileSafe(path.join(targetRoot, "src", "microservices", "communication.js"), communication);
  
  // Update package.json with Cote dependencies
  updatePackageJsonWithCote(targetRoot);
  
  console.log("🏗️ Microservices support with Cote added successfully!");
}

function generateCoteConfig(ts) {
  if (ts) {
    return `export const coteConfig = {
  // Service discovery configuration
  discovery: {
    host: process.env.DISCOVERY_HOST || 'localhost',
    port: process.env.DISCOVERY_PORT || 5000,
    key: process.env.DISCOVERY_KEY || 'cote-discovery',
    broadcast: process.env.DISCOVERY_BROADCAST || '255.255.255.255'
  },
  
  // Service configuration
  services: {
    user: {
      name: 'user-service',
      port: 3001,
      key: 'user-service'
    },
    product: {
      name: 'product-service', 
      port: 3002,
      key: 'product-service'
    },
    order: {
      name: 'order-service',
      port: 3003, 
      key: 'order-service'
    }
  },
  
  // Communication settings
  communication: {
    timeout: 5000,
    retries: 3,
    heartbeat: 1000
  }
};

export default coteConfig;`;
  } else {
    return `const coteConfig = {
  // Service discovery configuration
  discovery: {
    host: process.env.DISCOVERY_HOST || 'localhost',
    port: process.env.DISCOVERY_PORT || 5000,
    key: process.env.DISCOVERY_KEY || 'cote-discovery',
    broadcast: process.env.DISCOVERY_BROADCAST || '255.255.255.255'
  },
  
  // Service configuration
  services: {
    user: {
      name: 'user-service',
      port: 3001,
      key: 'user-service'
    },
    product: {
      name: 'product-service', 
      port: 3002,
      key: 'product-service'
    },
    order: {
      name: 'order-service',
      port: 3003, 
      key: 'order-service'
    }
  },
  
  // Communication settings
  communication: {
    timeout: 5000,
    retries: 3,
    heartbeat: 1000
  }
};

module.exports = { coteConfig };
module.exports.default = coteConfig;
`;
  }
}

function generateServiceDiscovery(ts) {
  if (ts) {
    return `import { Requester, Responder } from 'cote';
import { coteConfig } from '../config/cote.config';

export class ServiceDiscovery {
  private requester: Requester;
  private responders: Map<string, Responder> = new Map();
  
  constructor() {
    this.requester = new Requester({
      name: 'service-discovery',
      key: coteConfig.discovery.key,
      ...coteConfig.discovery
    });
  }
  
  async discoverService(serviceName: string): Promise<any> {
    try {
      const response = await this.requester.send({
        type: 'discover',
        service: serviceName
      });
      return response;
    } catch (error) {
      console.error(\`Failed to discover service \${serviceName}:\`, error);
      throw error;
    }
  }
  
  async registerService(serviceName: string, serviceData: any): Promise<void> {
    const responder = new Responder({
      name: serviceName,
      key: coteConfig.discovery.key,
      ...coteConfig.discovery
    });
    
    responder.on('discover', (req, callback) => {
      callback(null, serviceData);
    });
    
    this.responders.set(serviceName, responder);
    console.log(\`Service \${serviceName} registered successfully\`);
  }
  
  async unregisterService(serviceName: string): Promise<void> {
    const responder = this.responders.get(serviceName);
    if (responder) {
      responder.close();
      this.responders.delete(serviceName);
      console.log(\`Service \${serviceName} unregistered\`);
    }
  }
  
  close(): void {
    this.requester.close();
    this.responders.forEach(responder => responder.close());
  }
}

export default ServiceDiscovery;`;
  } else {
    return `const { Requester, Responder } = require('cote');
const { coteConfig } = require('../config/cote.config');

class ServiceDiscovery {
  constructor() {
    this.requester = new Requester({
      name: 'service-discovery',
      key: coteConfig.discovery.key,
      ...coteConfig.discovery
    });
    this.responders = new Map();
  }
  
  async discoverService(serviceName) {
    try {
      const response = await this.requester.send({
        type: 'discover',
        service: serviceName
      });
      return response;
    } catch (error) {
      console.error(\`Failed to discover service \${serviceName}:\`, error);
      throw error;
    }
  }
  
  async registerService(serviceName, serviceData) {
    const responder = new Responder({
      name: serviceName,
      key: coteConfig.discovery.key,
      ...coteConfig.discovery
    });
    
    responder.on('discover', (req, callback) => {
      callback(null, serviceData);
    });
    
    this.responders.set(serviceName, responder);
    console.log(\`Service \${serviceName} registered successfully\`);
  }
  
  async unregisterService(serviceName) {
    const responder = this.responders.get(serviceName);
    if (responder) {
      responder.close();
      this.responders.delete(serviceName);
      console.log(\`Service \${serviceName} unregistered\`);
    }
  }
  
  close() {
    this.requester.close();
    this.responders.forEach(responder => responder.close());
  }
}

module.exports = { ServiceDiscovery };
module.exports.default = ServiceDiscovery;
`;
  }
}

function generateAPIGateway(ts) {
  if (ts) {
    return `import express from 'express';
import { Requester } from 'cote';
import { coteConfig } from '../config/cote.config';
import { ServiceDiscovery } from './service.discovery';

export class APIGateway {
  private app: express.Application;
  private serviceDiscovery: ServiceDiscovery;
  private requesters: Map<string, Requester> = new Map();
  
  constructor() {
    this.app = express();
    this.serviceDiscovery = new ServiceDiscovery();
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }
  
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    // User service routes
    this.app.use('/api/users', this.createServiceRouter('user-service'));
    
    // Product service routes  
    this.app.use('/api/products', this.createServiceRouter('product-service'));
    
    // Order service routes
    this.app.use('/api/orders', this.createServiceRouter('order-service'));
  }
  
  private createServiceRouter(serviceName: string): express.Router {
    const router = express.Router();
    
    router.all('*', async (req, res) => {
      try {
        const requester = await this.getRequester(serviceName);
        const response = await requester.send({
          type: 'api-request',
          method: req.method,
          path: req.path,
          body: req.body,
          query: req.query,
          headers: req.headers
        });
        
        res.status(response.status || 200).json(response.data);
      } catch (error) {
        console.error(\`Error calling \${serviceName}:\`, error);
        res.status(500).json({ error: 'Service unavailable' });
      }
    });
    
    return router;
  }
  
  private async getRequester(serviceName: string): Promise<Requester> {
    if (!this.requesters.has(serviceName)) {
      const requester = new Requester({
        name: \`gateway-\${serviceName}\`,
        key: coteConfig.services[serviceName]?.key || serviceName,
        ...coteConfig.discovery
      });
      this.requesters.set(serviceName, requester);
    }
    
    return this.requesters.get(serviceName)!;
  }
  
  start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(\`API Gateway running on port \${port}\`);
    });
  }
  
  close(): void {
    this.serviceDiscovery.close();
    this.requesters.forEach(requester => requester.close());
  }
}

export default APIGateway;`;
  } else {
    return `const express = require('express');
const { Requester } = require('cote');
const { coteConfig } = require('../config/cote.config');
const { ServiceDiscovery } = require('./service.discovery');

class APIGateway {
  constructor() {
    this.app = express();
    this.serviceDiscovery = new ServiceDiscovery();
    this.requesters = new Map();
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    // User service routes
    this.app.use('/api/users', this.createServiceRouter('user-service'));
    
    // Product service routes  
    this.app.use('/api/products', this.createServiceRouter('product-service'));
    
    // Order service routes
    this.app.use('/api/orders', this.createServiceRouter('order-service'));
  }
  
  createServiceRouter(serviceName) {
    const router = express.Router();
    
    router.all('*', async (req, res) => {
      try {
        const requester = await this.getRequester(serviceName);
        const response = await requester.send({
          type: 'api-request',
          method: req.method,
          path: req.path,
          body: req.body,
          query: req.query,
          headers: req.headers
        });
        
        res.status(response.status || 200).json(response.data);
      } catch (error) {
        console.error(\`Error calling \${serviceName}:\`, error);
        res.status(500).json({ error: 'Service unavailable' });
      }
    });
    
    return router;
  }
  
  async getRequester(serviceName) {
    if (!this.requesters.has(serviceName)) {
      const requester = new Requester({
        name: \`gateway-\${serviceName}\`,
        key: coteConfig.services[serviceName]?.key || serviceName,
        ...coteConfig.discovery
      });
      this.requesters.set(serviceName, requester);
    }
    
    return this.requesters.get(serviceName);
  }
  
  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(\`API Gateway running on port \${port}\`);
    });
  }
  
  close() {
    this.serviceDiscovery.close();
    this.requesters.forEach(requester => requester.close());
  }
}

module.exports = { APIGateway };
module.exports.default = APIGateway;
`;
  }
}

function generateService(targetRoot, serviceName, ts) {
  const serviceCode = generateServiceCode(serviceName, ts);
  writeFileSafe(path.join(targetRoot, "src", "services", `${serviceName}.service.js`), serviceCode);
  
  const serviceController = generateServiceController(serviceName, ts);
  writeFileSafe(path.join(targetRoot, "src", "controllers", `${serviceName}.controller.js`), serviceController);
}

function generateServiceCode(serviceName, ts) {
  if (ts) {
    return `import { Responder } from 'cote';
import { coteConfig } from '../config/cote.config';

export class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service {
  private responder: Responder;
  
  constructor() {
    this.responder = new Responder({
      name: '${serviceName}-service',
      key: coteConfig.services.${serviceName}?.key || '${serviceName}-service',
      ...coteConfig.discovery
    });
    
    this.setupHandlers();
  }
  
  private setupHandlers(): void {
    this.responder.on('api-request', async (req, callback) => {
      try {
        const result = await this.handleRequest(req);
        callback(null, { status: 200, data: result });
      } catch (error) {
        callback(error, { status: 500, data: { error: error.message } });
      }
    });
  }
  
  private async handleRequest(req: any): Promise<any> {
    const { method, path, body, query } = req;
    
    switch (method) {
      case 'GET':
        return await this.get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path, query);
      case 'POST':
        return await this.create${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(body);
      case 'PUT':
        return await this.update${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path, body);
      case 'DELETE':
        return await this.delete${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path);
      default:
        throw new Error(\`Unsupported method: \${method}\`);
    }
  }
  
  private async get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path: string, query: any): Promise<any> {
    // Implement GET logic
    return { message: \`GET ${serviceName} - \${path}\`, query };
  }
  
  private async create${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(body: any): Promise<any> {
    // Implement POST logic
    return { message: \`CREATE ${serviceName}\`, data: body };
  }
  
  private async update${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path: string, body: any): Promise<any> {
    // Implement PUT logic
    return { message: \`UPDATE ${serviceName} - \${path}\`, data: body };
  }
  
  private async delete${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path: string): Promise<any> {
    // Implement DELETE logic
    return { message: \`DELETE ${serviceName} - \${path}\` };
  }
  
  close(): void {
    this.responder.close();
  }
}

export default ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service;`;
  } else {
    return `const { Responder } = require('cote');
const { coteConfig } = require('../config/cote.config');

class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service {
  constructor() {
    this.responder = new Responder({
      name: '${serviceName}-service',
      key: coteConfig.services.${serviceName}?.key || '${serviceName}-service',
      ...coteConfig.discovery
    });
    
    this.setupHandlers();
  }
  
  setupHandlers() {
    this.responder.on('api-request', async (req, callback) => {
      try {
        const result = await this.handleRequest(req);
        callback(null, { status: 200, data: result });
      } catch (error) {
        callback(error, { status: 500, data: { error: error.message } });
      }
    });
  }
  
  async handleRequest(req) {
    const { method, path, body, query } = req;
    
    switch (method) {
      case 'GET':
        return await this.get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path, query);
      case 'POST':
        return await this.create${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(body);
      case 'PUT':
        return await this.update${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path, body);
      case 'DELETE':
        return await this.delete${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path);
      default:
        throw new Error(\`Unsupported method: \${method}\`);
    }
  }
  
  async get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path, query) {
    // Implement GET logic
    return { message: \`GET ${serviceName} - \${path}\`, query };
  }
  
  async create${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(body) {
    // Implement POST logic
    return { message: \`CREATE ${serviceName}\`, data: body };
  }
  
  async update${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path, body) {
    // Implement PUT logic
    return { message: \`UPDATE ${serviceName} - \${path}\`, data: body };
  }
  
  async delete${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(path) {
    // Implement DELETE logic
    return { message: \`DELETE ${serviceName} - \${path}\` };
  }
  
  close() {
    this.responder.close();
  }
}

module.exports = { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service };
module.exports.default = ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service;
`;
  }
}

function generateServiceController(serviceName, ts) {
  if (ts) {
    return `import { Request, Response } from 'express';
import { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service } from '../services/${serviceName}.service';

export class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller {
  private service: ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service;
  
  constructor() {
    this.service = new ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service();
  }
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}('/${serviceName}s', req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(\`/${serviceName}s/\${req.params.id}\`, req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.create${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async update(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.update${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(\`/${serviceName}s/\${req.params.id}\`, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.delete${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(\`/${serviceName}s/\${req.params.id}\`);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  close(): void {
    this.service.close();
  }
}

export default ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller;`;
  } else {
    return `const { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service } = require('../services/${serviceName}.service');

class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller {
  constructor() {
    this.service = new ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service();
  }
  
  async getAll(req, res) {
    try {
      const result = await this.service.get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}('/${serviceName}s', req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async getById(req, res) {
    try {
      const result = await this.service.get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(\`/${serviceName}s/\${req.params.id}\`, req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async create(req, res) {
    try {
      const result = await this.service.create${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async update(req, res) {
    try {
      const result = await this.service.update${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(\`/${serviceName}s/\${req.params.id}\`, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async delete(req, res) {
    try {
      const result = await this.service.delete${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}(\`/${serviceName}s/\${req.params.id}\`);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  close() {
    this.service.close();
  }
}

module.exports = { ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller };
module.exports.default = ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Controller;
`;
  }
}

function generateInterServiceCommunication(ts) {
  if (ts) {
    return `import { Requester, Responder } from 'cote';
import { coteConfig } from '../config/cote.config';

export class InterServiceCommunication {
  private requesters: Map<string, Requester> = new Map();
  private responders: Map<string, Responder> = new Map();
  
  async callService(serviceName: string, method: string, data: any): Promise<any> {
    try {
      const requester = await this.getRequester(serviceName);
      const response = await requester.send({
        type: method,
        data: data
      });
      return response;
    } catch (error) {
      console.error(\`Error calling service \${serviceName}:\`, error);
      throw error;
    }
  }
  
  async registerService(serviceName: string, handlers: Record<string, Function>): Promise<void> {
    const responder = new Responder({
      name: serviceName,
      key: coteConfig.services[serviceName]?.key || serviceName,
      ...coteConfig.discovery
    });
    
    Object.entries(handlers).forEach(([method, handler]) => {
      responder.on(method, async (req, callback) => {
        try {
          const result = await handler(req.data);
          callback(null, result);
        } catch (error) {
          callback(error, null);
        }
      });
    });
    
    this.responders.set(serviceName, responder);
    console.log(\`Service \${serviceName} registered with handlers\`);
  }
  
  private async getRequester(serviceName: string): Promise<Requester> {
    if (!this.requesters.has(serviceName)) {
      const requester = new Requester({
        name: \`communication-\${serviceName}\`,
        key: coteConfig.services[serviceName]?.key || serviceName,
        ...coteConfig.discovery
      });
      this.requesters.set(serviceName, requester);
    }
    
    return this.requesters.get(serviceName)!;
  }
  
  close(): void {
    this.requesters.forEach(requester => requester.close());
    this.responders.forEach(responder => responder.close());
  }
}

export default InterServiceCommunication;`;
  } else {
    return `const { Requester, Responder } = require('cote');
const { coteConfig } = require('../config/cote.config');

class InterServiceCommunication {
  constructor() {
    this.requesters = new Map();
    this.responders = new Map();
  }
  
  async callService(serviceName, method, data) {
    try {
      const requester = await this.getRequester(serviceName);
      const response = await requester.send({
        type: method,
        data: data
      });
      return response;
    } catch (error) {
      console.error(\`Error calling service \${serviceName}:\`, error);
      throw error;
    }
  }
  
  async registerService(serviceName, handlers) {
    const responder = new Responder({
      name: serviceName,
      key: coteConfig.services[serviceName]?.key || serviceName,
      ...coteConfig.discovery
    });
    
    Object.entries(handlers).forEach(([method, handler]) => {
      responder.on(method, async (req, callback) => {
        try {
          const result = await handler(req.data);
          callback(null, result);
        } catch (error) {
          callback(error, null);
        }
      });
    });
    
    this.responders.set(serviceName, responder);
    console.log(\`Service \${serviceName} registered with handlers\`);
  }
  
  async getRequester(serviceName) {
    if (!this.requesters.has(serviceName)) {
      const requester = new Requester({
        name: \`communication-\${serviceName}\`,
        key: coteConfig.services[serviceName]?.key || serviceName,
        ...coteConfig.discovery
      });
      this.requesters.set(serviceName, requester);
    }
    
    return this.requesters.get(serviceName);
  }
  
  close() {
    this.requesters.forEach(requester => requester.close());
    this.responders.forEach(responder => responder.close());
  }
}

module.exports = { InterServiceCommunication };
module.exports.default = InterServiceCommunication;
`;
  }
}

function updatePackageJsonWithCote(targetRoot) {
  // fs is already imported at the top of the file
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['cote'] = '^1.0.0';
    
    // Add microservices scripts
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['start:gateway'] = 'node src/microservices/api.gateway.js';
    pkg.scripts['start:user-service'] = 'node src/services/user.service.js';
    pkg.scripts['start:product-service'] = 'node src/services/product.service.js';
    pkg.scripts['start:order-service'] = 'node src/services/order.service.js';
    pkg.scripts['start:all'] = 'concurrently "npm run start:gateway" "npm run start:user-service" "npm run start:product-service" "npm run start:order-service"';
    
    // Add concurrently for running multiple services
    pkg.devDependencies = pkg.devDependencies || {};
    pkg.devDependencies['concurrently'] = '^8.2.0';
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with Cote dependencies:", error);
  }
}
