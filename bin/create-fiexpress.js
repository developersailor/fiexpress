#!/usr/bin/env node
import process from "process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runPostClone } from "./scaffolding.js";
import { generateComponent } from "./generator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    ts: false,
    db: "postgres",
    orm: "auto",
    jwt: false,
    casl: false,
    roles: false,
    user: false,
    jest: false,
    // demo: "none", // Removed - no longer generating demo applications
    dotenv: true,
    docker: false,
    swagger: false,
    health: false,
    rateLimit: false,
    redis: false,
    oauth: false,
    graphql: false,
    websocket: false,
    template: false,
    css: false,
    e2e: false,
    i18n: false,
    monitoring: false,
    microservices: false,
    microservicesServices: [],
    cote: false,
    queues: false,
    queuesTypes: [],
    security: false,
    securityTools: [],
    nx: false,
    nxApps: [],
    nxLibs: [],
    nxExpress: false,
    nxReact: false,
    nxAngular: false,
    nxNext: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--ts":
        options.ts = true;
      break;
      case "--db":
        options.db = args[++i] || "postgres";
      break;
      case "--orm":
        options.orm = args[++i] || "auto";
      break;
      case "--jwt":
        options.jwt = true;
      break;
      case "--casl":
        options.casl = true;
      break;
      case "--roles":
        options.roles = true;
        break;
      case "--user":
        options.user = true;
        break;
      case "--jest":
        options.jest = true;
        break;
      // Demo option removed - no longer generating demo applications
      case "--no-dotenv":
        options.dotenv = false;
        break;
      case "--docker":
        options.docker = true;
        break;
      case "--swagger":
        options.swagger = true;
        break;
      case "--health":
        options.health = true;
        break;
      case "--rate-limit":
        options.rateLimit = true;
        break;
      case "--redis":
        options.redis = true;
        break;
      case "--oauth":
        options.oauth = true;
        // Check for providers
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.oauthProviders = args[++i].split(',');
        }
      break;
      case "--graphql":
        options.graphql = true;
      break;
      case "--websocket":
        options.websocket = true;
      break;
      case "--template":
        options.template = true;
        // Check for engine
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.templateEngine = args[++i];
        }
        break;
      case "--css":
        options.css = true;
        // Check for framework
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.cssFramework = args[++i];
        }
        break;
      case "--e2e":
        options.e2e = true;
        // Check for tools
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.e2eTools = args[++i].split(',');
        }
        break;
      case "--i18n":
        options.i18n = true;
        // Check for languages
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.i18nLanguages = args[++i].split(',');
        }
        break;
      case "--monitoring":
        options.monitoring = true;
        // Check for tools
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.monitoringTools = args[++i].split(',');
        }
        break;
      case "--microservices":
        options.microservices = true;
        // Check for services
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.microservicesServices = args[++i].split(',');
        }
        break;
      case "--cote":
        options.cote = true;
        break;
      case "--queues":
        options.queues = true;
        // Check for queue types
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.queuesTypes = args[++i].split(',');
        }
        break;
      case "--security":
        options.security = true;
        // Check for security tools
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.securityTools = args[++i].split(',');
        }
        break;
      case "--nx":
        options.nx = true;
        // Set default Nx options when --nx is used
        if (options.nxApps.length === 0) {
          options.nxApps = ['api', 'frontend'];
        }
        if (options.nxLibs.length === 0) {
          options.nxLibs = ['shared', 'types', 'utils'];
        }
        // Default to Express if no framework is specified
        if (!options.nxExpress && !options.nxReact && !options.nxAngular && !options.nxNext) {
          options.nxExpress = true;
        }
        break;
      case "--nx-apps":
        if (!options.nx) {
          console.warn("⚠️  --nx-apps requires --nx flag to be set first");
          break;
        }
        // Check for apps
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.nxApps = args[++i].split(',');
        }
        break;
      case "--nx-libs":
        if (!options.nx) {
          console.warn("⚠️  --nx-libs requires --nx flag to be set first");
          break;
        }
        // Check for libs
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.nxLibs = args[++i].split(',');
        }
        break;
      case "--nx-express":
        if (!options.nx) {
          console.warn("⚠️  --nx-express requires --nx flag to be set first");
          break;
        }
        options.nxExpress = true;
        options.nxReact = false;
        options.nxAngular = false;
        options.nxNext = false;
        break;
      case "--nx-react":
        if (!options.nx) {
          console.warn("⚠️  --nx-react requires --nx flag to be set first");
          break;
        }
        options.nxReact = true;
        options.nxExpress = false;
        options.nxAngular = false;
        options.nxNext = false;
        break;
      case "--nx-angular":
        if (!options.nx) {
          console.warn("⚠️  --nx-angular requires --nx flag to be set first");
          break;
        }
        options.nxAngular = true;
        options.nxExpress = false;
        options.nxReact = false;
        options.nxNext = false;
        break;
      case "--nx-next":
        if (!options.nx) {
          console.warn("⚠️  --nx-next requires --nx flag to be set first");
          break;
        }
        options.nxNext = true;
        options.nxExpress = false;
        options.nxReact = false;
        options.nxAngular = false;
        break;
    }
  }

  return options;
}

async function createBasicProject(targetRoot, options) {
  const { name, ts, db, orm, jwt, casl, roles, user, jest, dotenv, docker, swagger, health, rateLimit, redis, oauth, oauthProviders, graphql, websocket, template, templateEngine, css, cssFramework, e2e, e2eTools, i18n, i18nLanguages, monitoring, monitoringTools, microservices, microservicesServices, cote, queues, queuesTypes, security, securityTools } = options;
  
  // Create basic directory structure
  const dirs = [
    "src",
    "src/controllers",
    "src/services", 
    "src/middleware",
    "src/routes",
    "src/config",
    "src/models",
    "src/utils",
    "tests",
    "docs"
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(targetRoot, dir);
    fs.mkdirSync(fullPath, { recursive: true });
  });
  
  // Create basic package.json
  const packageJson = {
    "name": name.toLowerCase(),
    "version": "1.0.0",
    "description": "Express.js application created with FiExpress",
    "main": ts ? "dist/index.js" : "src/index.js",
    "scripts": {
      "start": ts ? "node dist/index.js" : "node src/index.js",
      "dev": ts ? "ts-node src/index.ts" : "nodemon src/index.js",
      "build": ts ? "tsc" : "echo 'No build step needed for JavaScript'",
      "test": jest ? "jest" : "echo 'No tests configured'"
    },
    "dependencies": {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "helmet": "^7.1.0"
    },
    "devDependencies": {},
    "engines": {
      "node": ">=18.0.0"
    }
  };
  
  // Add TypeScript dependencies if needed
  if (ts) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      "typescript": "^5.3.0",
      "ts-node": "^10.9.0",
      "@types/node": "^20.10.0",
      "@types/express": "^4.17.21",
      "@types/cors": "^2.8.17"
    };
  }
  
  // Add database dependencies
  if (db === "postgres") {
    if (orm === "prisma") {
      packageJson.dependencies["@prisma/client"] = "^5.7.0";
      packageJson.devDependencies["prisma"] = "^5.7.0";
    } else if (orm === "sequelize") {
      packageJson.dependencies["sequelize"] = "^6.35.0";
      packageJson.dependencies["pg"] = "^8.11.3";
      packageJson.dependencies["pg-hstore"] = "^2.3.4";
    }
  } else if (db === "mysql") {
    if (orm === "sequelize") {
      packageJson.dependencies["sequelize"] = "^6.35.0";
      packageJson.dependencies["mysql2"] = "^3.6.5";
    }
  } else if (db === "mongodb") {
    if (orm === "mongoose") {
      packageJson.dependencies["mongoose"] = "^8.0.3";
    }
  }
  
  // Add JWT if needed
  if (jwt) {
    packageJson.dependencies["jsonwebtoken"] = "^9.0.2";
    if (ts) {
      packageJson.devDependencies["@types/jsonwebtoken"] = "^9.0.5";
    }
  }
  
  // Add dotenv if needed
  if (dotenv) {
    packageJson.dependencies["dotenv"] = "^16.3.1";
  }
  
  // Add nodemon for development
  packageJson.devDependencies["nodemon"] = "^3.0.2";
  
  // Write package.json
  fs.writeFileSync(
    path.join(targetRoot, "package.json"), 
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create basic index file
  const indexContent = ts ? 
    `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '${name}',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 ${name} running on port \${PORT}\`);
});` :
    `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '${name}',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 ${name} running on port \${PORT}\`);
});`;

  fs.writeFileSync(
    path.join(targetRoot, "src", ts ? "index.ts" : "index.js"),
    indexContent
  );
  
  // Create TypeScript config if needed
  if (ts) {
    const tsConfig = {
      "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "lib": ["ES2020"],
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist"]
    };
    
    fs.writeFileSync(
      path.join(targetRoot, "tsconfig.json"),
      JSON.stringify(tsConfig, null, 2)
    );
  }
  
  // Create .env file if dotenv is enabled
  if (dotenv) {
    const envContent = `PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${name.toLowerCase()}
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret-key
`;
    fs.writeFileSync(path.join(targetRoot, ".env"), envContent);
  }
  
  // Create .gitignore
  const gitignoreContent = `node_modules/
dist/
.env
.env.local
.env.production
*.log
.DS_Store
coverage/
.nyc_output/
`;
  fs.writeFileSync(path.join(targetRoot, ".gitignore"), gitignoreContent);
  
  console.log("✅ Basic project structure created");
}

async function createProject(options) {
  const { name, ts, db, orm, jwt, casl, roles, user, jest, dotenv, docker, swagger, health, rateLimit, redis, oauth, oauthProviders, graphql, websocket, template, templateEngine, css, cssFramework, e2e, e2eTools, i18n, i18nLanguages, monitoring, monitoringTools, microservices, microservicesServices, cote, queues, queuesTypes, security, securityTools, nx, nxApps, nxLibs, nxExpress, nxReact, nxAngular, nxNext } = options;
  
  // Set environment variables for scaffolding
  process.env.FIEXPRESS_TS = ts ? "yes" : "no";
  process.env.FIEXPRESS_DB = db;
  process.env.FIEXPRESS_ORM = orm;
  process.env.FIEXPRESS_JWT = jwt ? "yes" : "no";
  process.env.FIEXPRESS_CASL = casl ? "yes" : "no";
  process.env.FIEXPRESS_ROLES = roles ? "yes" : "no";
  process.env.FIEXPRESS_USER = user ? "yes" : "no";
  process.env.FIEXPRESS_JEST = jest ? "yes" : "no";
  // process.env.FIEXPRESS_DEMO = demo; // Removed - no longer generating demo applications
  process.env.FIEXPRESS_DOTENV = dotenv ? "yes" : "no";
  process.env.FIEXPRESS_DOCKER = docker ? "yes" : "no";
  process.env.FIEXPRESS_SWAGGER = swagger ? "yes" : "no";
  process.env.FIEXPRESS_HEALTH = health ? "yes" : "no";
  process.env.FIEXPRESS_RATE_LIMIT = rateLimit ? "yes" : "no";
  process.env.FIEXPRESS_REDIS = redis ? "yes" : "no";
  process.env.FIEXPRESS_OAUTH = oauth ? "yes" : "no";
  process.env.FIEXPRESS_OAUTH_PROVIDERS = oauthProviders ? oauthProviders.join(',') : '';
  process.env.FIEXPRESS_GRAPHQL = graphql ? "yes" : "no";
  process.env.FIEXPRESS_WEBSOCKET = websocket ? "yes" : "no";
  process.env.FIEXPRESS_TEMPLATE = template ? "yes" : "no";
  process.env.FIEXPRESS_TEMPLATE_ENGINE = templateEngine || 'ejs';
  process.env.FIEXPRESS_CSS = css ? "yes" : "no";
  process.env.FIEXPRESS_CSS_FRAMEWORK = cssFramework || 'bootstrap';
  process.env.FIEXPRESS_E2E = e2e ? "yes" : "no";
  process.env.FIEXPRESS_E2E_TOOLS = e2eTools ? e2eTools.join(',') : 'playwright,cypress';
  process.env.FIEXPRESS_I18N = i18n ? "yes" : "no";
  process.env.FIEXPRESS_I18N_LANGUAGES = i18nLanguages ? i18nLanguages.join(',') : 'en,tr,es';
  process.env.FIEXPRESS_MONITORING = monitoring ? "yes" : "no";
  process.env.FIEXPRESS_MONITORING_TOOLS = monitoringTools ? monitoringTools.join(',') : 'prometheus,grafana';
  process.env.FIEXPRESS_MICROSERVICES = microservices ? "yes" : "no";
  process.env.FIEXPRESS_MICROSERVICES_SERVICES = microservicesServices ? microservicesServices.join(',') : 'user,product,order';
  process.env.FIEXPRESS_COTE = cote ? "yes" : "no";
  process.env.FIEXPRESS_QUEUES = queues ? "yes" : "no";
  process.env.FIEXPRESS_QUEUES_TYPES = queuesTypes ? queuesTypes.join(',') : 'rabbitmq,kafka';
  process.env.FIEXPRESS_SECURITY = security ? "yes" : "no";
  process.env.FIEXPRESS_SECURITY_TOOLS = securityTools ? securityTools.join(',') : 'helmet,csrf,validation,rate-limit';
  process.env.FIEXPRESS_NX = nx ? "yes" : "no";
  process.env.FIEXPRESS_NX_APPS = nxApps ? nxApps.join(',') : 'api,frontend';
  process.env.FIEXPRESS_NX_LIBS = nxLibs ? nxLibs.join(',') : 'shared,types,utils';
  process.env.FIEXPRESS_NX_EXPRESS = nxExpress ? "yes" : "no";
  process.env.FIEXPRESS_NX_REACT = nxReact ? "yes" : "no";
  process.env.FIEXPRESS_NX_ANGULAR = nxAngular ? "yes" : "no";
  process.env.FIEXPRESS_NX_NEXT = nxNext ? "yes" : "no";

  const targetRoot = path.resolve(name);
  
  if (fs.existsSync(targetRoot)) {
    console.error(`❌ Directory ${name} already exists`);
    process.exit(1);
  }

  try {
    if (nx) {
      // For Nx workspaces, create from scratch
      console.log(`🏗️ Creating Nx workspace from scratch...`);
      
      // Create directory
      fs.mkdirSync(targetRoot, { recursive: true });
      
      // Run Nx-specific scaffolding
      await runPostClone(targetRoot);
    } else {
      // For regular Express projects, create from scratch
      console.log(`🏗️ Creating Express project from scratch...`);
      
      // Create basic project structure
      await createBasicProject(targetRoot, options);
      
      // Run post-clone scaffolding
      await runPostClone(targetRoot);
    }
    
    console.log("✅ Project created successfully!");
    console.log("Scaffolding complete. Next steps:");
    console.log("  cd", name);
    console.log("  npm install");
    if (ts) {
      console.log("  npx tsc --noEmit (to check types)");
    }
    console.log("  npm run dev");
    
  } catch (err) {
    console.error("❌ Error creating project:", err);
    process.exit(1);
  }
}

async function handleGenerateCommand(args) {
  if (args.length < 2) {
    console.error("❌ Usage: npx fiexpress generate <schematic> <name>");
    console.log("Available schematics: controller, service, middleware, route, model, interface, test, resource");
    process.exit(1);
  }

  const [schematic, name] = args;
  const targetRoot = process.cwd();
  
  try {
    await generateComponent(schematic, name, targetRoot);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

async function handleAddCommand() {
  console.log("➕ Add command - Coming soon!");
  console.log("This feature will allow you to add packages and integrations to existing projects.");
  console.log("For now, please manually add packages to your project.");
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🚀 FiExpress CLI - Express.js Project Generator

Usage:
  npx fiexpress new <name> [options]     Create new Express.js project
  npx fiexpress generate <schematic>      Generate components
  npx fiexpress --help                   Show this help
  npx fiexpress --version                Show version

Options for 'new' command:
  --ts                    Enable TypeScript support
  --db <database>        Database type (postgres|mysql|mongo)
  --orm <orm>            ORM (prisma|sequelize|drizzle|mongoose|none)
  --jwt                  Include JWT authentication
  --casl                 Include CASL authorization
  --roles                Include role-based middleware
  --user                 Include example user routes
  --jest                 Include Jest testing
  // --demo option removed - no longer generating demo applications
  --no-dotenv            Skip .env.example file
  --docker               Add Docker support
  --swagger              Add Swagger/OpenAPI documentation
  --health               Add health check endpoints
  --rate-limit           Add rate limiting
  --redis                Add Redis support
  --oauth [providers]    Add OAuth2 authentication (google,github,facebook)
  --graphql              Add GraphQL support
  --websocket            Add WebSocket support
  --template [engine]    Add template engine (ejs,pug,handlebars,mustache)
  --css [framework]      Add CSS framework (bootstrap,tailwind,bulma,foundation)
  --e2e [tools]         Add E2E testing (playwright,cypress)
  --i18n [languages]    Add internationalization (en,tr,es)
  --monitoring [tools]  Add advanced monitoring (prometheus,grafana)
  --microservices [services] Add microservices support (user,product,order)
  --cote                     Add Cote microservice communication
  --queues [types]         Add message queues (rabbitmq,kafka)
  --security [tools]       Add advanced security (helmet,csrf,validation,rate-limit)
  --nx                    Create Nx monorepo workspace
  --nx-apps [apps]        Nx applications (requires --nx)
  --nx-libs [libs]        Nx libraries (requires --nx)
  --nx-express            Use Express.js for Nx apps (requires --nx)
  --nx-react              Use React for Nx apps (requires --nx)
  --nx-angular            Use Angular for Nx apps (requires --nx)
  --nx-next               Use Next.js for Nx apps (requires --nx)

Examples:
  npx fiexpress new my-api
  npx fiexpress new my-api --ts --db postgres --jwt --casl
  npx fiexpress new my-nx-workspace --nx --nx-apps api,frontend --nx-libs shared,types
  npx fiexpress new my-monorepo --nx --nx-express --nx-react --ts
  npx fiexpress generate controller UserController
  npx fiexpress generate resource Product
`);
    return;
  }

  const command = args[0];

  if (command === "--help" || command === "-h") {
  console.log(`
🚀 FiExpress CLI - Express.js Project Generator

Usage:
  npx fiexpress new <name> [options]     Create new Express.js project
  npx fiexpress generate <schematic>      Generate components
  npx fiexpress --help                   Show this help
  npx fiexpress --version                Show version

Options for 'new' command:
  --ts                    Enable TypeScript support
  --db <database>        Database type (postgres|mysql|mongo)
  --orm <orm>            ORM (prisma|sequelize|drizzle|mongoose|none)
  --jwt                  Include JWT authentication
  --casl                 Include CASL authorization
  --roles                Include role-based middleware
  --user                 Include example user routes
  --jest                 Include Jest testing
  // --demo option removed - no longer generating demo applications
  --no-dotenv            Skip .env.example file
  --docker               Add Docker support
  --swagger              Add Swagger/OpenAPI documentation
  --health               Add health check endpoints
  --rate-limit           Add rate limiting
  --redis                Add Redis support
  --oauth [providers]    Add OAuth2 authentication (google,github,facebook)
  --graphql              Add GraphQL support
  --websocket            Add WebSocket support
  --template [engine]    Add template engine (ejs,pug,handlebars,mustache)
  --css [framework]      Add CSS framework (bootstrap,tailwind,bulma,foundation)
  --e2e [tools]         Add E2E testing (playwright,cypress)
  --i18n [languages]    Add internationalization (en,tr,es)
  --monitoring [tools]  Add advanced monitoring (prometheus,grafana)
  --microservices [services] Add microservices support (user,product,order)
  --cote                     Add Cote microservice communication
  --queues [types]         Add message queues (rabbitmq,kafka)
  --security [tools]       Add advanced security (helmet,csrf,validation,rate-limit)
  --nx                    Create Nx monorepo workspace
  --nx-apps [apps]        Nx applications (requires --nx)
  --nx-libs [libs]        Nx libraries (requires --nx)
  --nx-express            Use Express.js for Nx apps (requires --nx)
  --nx-react              Use React for Nx apps (requires --nx)
  --nx-angular            Use Angular for Nx apps (requires --nx)
  --nx-next               Use Next.js for Nx apps (requires --nx)

Examples:
  npx fiexpress new my-api
  npx fiexpress new my-api --ts --db postgres --jwt --casl
  npx fiexpress new my-nx-workspace --nx --nx-apps api,frontend --nx-libs shared,types
  npx fiexpress new my-monorepo --nx --nx-express --nx-react --ts
  npx fiexpress generate controller UserController
  npx fiexpress generate resource Product
`);
    return;
}

  if (command === "--version" || command === "-v") {
  try {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));
    console.log(pkg.version);
  } catch {
      console.log("1.0.0");
    }
      return;
    }
    
  if (command === "new") {
    const name = args[1];
    if (!name) {
      console.error("❌ Project name is required");
      console.log("Usage: npx fiexpress new <name> [options]");
      process.exit(1);
    }

    const options = parseArgs();
    options.name = name;
    
    await createProject(options);
  } else if (command === "generate") {
    await handleGenerateCommand(args.slice(1));
  } else if (command === "add") {
    await handleAddCommand();
    } else {
      console.error(`❌ Unknown command: ${command}`);
      console.log("Run 'npx fiexpress --help' to see available commands.");
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("❌ Error:", err.message);
        process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Error:", err.message);
          process.exit(1);
});

main().catch((err) => {
  console.error("❌ Error:", err.message);
    process.exit(1);
});
