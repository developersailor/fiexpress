import { writeFileSafe } from "../utils.js";
import path from "path";
import fs from "fs";

export function generateSwaggerSupport(targetRoot, options = {}) {
  const { ts = false, auth = false } = options;
  
  // Swagger configuration
  const swaggerConfig = generateSwaggerConfig(ts, auth);
  writeFileSafe(path.join(targetRoot, "src", "swagger", "swagger.config.js"), swaggerConfig);
  
  // Swagger middleware
  const swaggerMiddleware = generateSwaggerMiddleware(ts);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "swagger.middleware.js"), swaggerMiddleware);
  
  // API schemas
  generateApiSchemas(targetRoot, ts);
  
  // API paths
  generateApiPaths(targetRoot, ts);
  
  // Swagger YAML
  const swaggerYaml = generateSwaggerYaml(auth);
  writeFileSafe(path.join(targetRoot, "swagger.yaml"), swaggerYaml);
  
  // Update package.json with swagger dependencies
  updatePackageJsonWithSwagger(targetRoot);
  
  console.log("📚 Swagger/OpenAPI documentation added successfully!");
}

function generateSwaggerConfig(ts, auth) {
  const ext = ts ? 'ts' : 'js';
  
  if (ts) {
    return `import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API',
      version: '1.0.0',
      description: 'A simple Express API with Swagger documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    ${auth ? `components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],` : ''}
  },
  apis: ['./src/routes/*.${ext}', './src/controllers/*.${ext}'],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
`;
  } else {
    return `const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API',
      version: '1.0.0',
      description: 'A simple Express API with Swagger documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    ${auth ? `components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],` : ''}
  },
  apis: ['./src/routes/*.${ext}', './src/controllers/*.${ext}'],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
`;
  }
}

function generateSwaggerMiddleware(ts) {
  
  if (ts) {
    return `import { Request, Response, NextFunction } from 'express';
import { swaggerUi, specs } from '../swagger/swagger.config';

export function setupSwagger(app: Express) {
  // Swagger documentation route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation',
  }));

  // Swagger JSON endpoint
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentation available at /api-docs');
}
`;
  } else {
    return `const { swaggerUi, specs } = require('../swagger/swagger.config');

function setupSwagger(app) {
  // Swagger documentation route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation',
  }));

  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentation available at /api-docs');
}

module.exports = { setupSwagger };
`;
  }
}

function generateApiSchemas(targetRoot, ts) {
  
  const userSchema = ts ? 
    `export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
}` :
    `// User schemas for API documentation
const userSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'User ID'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address'
    },
    name: {
      type: 'string',
      description: 'User full name'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'User creation date'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'User last update date'
    }
  }
};

const createUserSchema = {
  type: 'object',
  required: ['email', 'name', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address'
    },
    name: {
      type: 'string',
      description: 'User full name'
    },
    password: {
      type: 'string',
      minLength: 6,
      description: 'User password'
    }
  }
};

const updateUserSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address'
    },
    name: {
      type: 'string',
      description: 'User full name'
    }
  }
};

module.exports = {
  userSchema,
  createUserSchema,
  updateUserSchema
};`;

  const ext = ts ? 'ts' : 'js';
  writeFileSafe(path.join(targetRoot, "src", "swagger", "schemas", `user.${ext}`), userSchema);
}

function generateApiPaths(targetRoot, ts) {
  
  const userPaths = `/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         name:
 *           type: string
 *           description: User full name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update date
 *     CreateUser:
 *       type: object
 *       required:
 *         - email
 *         - name
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         name:
 *           type: string
 *           description: User full name
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User password
 *     UpdateUser:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         name:
 *           type: string
 *           description: User full name
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */`;

  const ext = ts ? 'ts' : 'js';
  writeFileSafe(path.join(targetRoot, "src", "swagger", "paths", `users.${ext}`), userPaths);
}

function generateSwaggerYaml(auth) {
  return `openapi: 3.0.0
info:
  title: Express API
  version: 1.0.0
  description: A simple Express API with Swagger documentation
servers:
  - url: http://localhost:3000
    description: Development server
${auth ? `components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []` : ''}
paths:
  /api/users:
    get:
      summary: Get all users
      tags: [Users]
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
        '500':
          description: Internal server error
    post:
      summary: Create a new user
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUser'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Bad request
        '500':
          description: Internal server error
  /api/users/{id}:
    get:
      summary: Get user by ID
      tags: [Users]
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: User ID
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
        '500':
          description: Internal server error
    put:
      summary: Update user
      tags: [Users]
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: User ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateUser'
      responses:
        '200':
          description: User updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
        '500':
          description: Internal server error
    delete:
      summary: Delete user
      tags: [Users]
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: User ID
      responses:
        '200':
          description: User deleted successfully
        '404':
          description: User not found
        '500':
          description: Internal server error
components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - name
      properties:
        id:
          type: string
          description: User ID
        email:
          type: string
          format: email
          description: User email address
        name:
          type: string
          description: User full name
        createdAt:
          type: string
          format: date-time
          description: User creation date
        updatedAt:
          type: string
          format: date-time
          description: User last update date
    CreateUser:
      type: object
      required:
        - email
        - name
        - password
      properties:
        email:
          type: string
          format: email
          description: User email address
        name:
          type: string
          description: User full name
        password:
          type: string
          minLength: 6
          description: User password
    UpdateUser:
      type: object
      properties:
        email:
          type: string
          format: email
          description: User email address
        name:
          type: string
          description: User full name
`;
}

function updatePackageJsonWithSwagger(targetRoot) {
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["swagger-jsdoc"] = "^6.2.8";
    pkg.dependencies["swagger-ui-express"] = "^5.0.0";
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with Swagger dependencies:", error);
  }
}
