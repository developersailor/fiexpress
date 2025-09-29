#!/usr/bin/env node
import { spawn } from "child_process";
import readline from "readline";
import process from "process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileSafe, sanitizeGeneratedPackageJson, copyLocalTemplateToDst } from "./utils.js";
import { runPostClone } from "./scaffolding.js";
import { generateComponent } from "./generator.js";
import { generateWeatherDemo, generateTodoDemo, generateBlogDemo } from "./demos.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(q) {
  return new Promise((res) => rl.question(q, (a) => res((a || "").trim())));
}

async function interactiveSetup() {
  console.log("🚀 FiExpress CLI - Creating new Express.js project");
  console.log("This will create a new Express.js project with modern tooling.\n");

  const name = await question("Project name: ");
  if (!name) {
    console.error("❌ Project name is required");
    process.exit(1);
  }

  const useTypeScript = await question("Use TypeScript? (y/N): ");
  const useDatabase = await question("Database (postgres/mysql/mongo/none) [postgres]: ");
  const useORM = await question("ORM (prisma/sequelize/drizzle/mongoose/none) [auto]: ");
  const useJWT = await question("Include JWT authentication? (y/N): ");
  const useCASL = await question("Include CASL authorization? (y/N): ");
  const useRoles = await question("Include role-based middleware? (y/N): ");
  const useUser = await question("Include example user routes? (y/N): ");
  const useJest = await question("Include Jest testing? (y/N): ");
  const useDemo = await question("Demo app (weather/todo/blog/none) [none]: ");

  return {
    name,
    ts: useTypeScript.toLowerCase() === "y",
    db: useDatabase || "postgres",
    orm: useORM || "auto",
    jwt: useJWT.toLowerCase() === "y",
    casl: useCASL.toLowerCase() === "y",
    roles: useRoles.toLowerCase() === "y",
    user: useUser.toLowerCase() === "y",
    jest: useJest.toLowerCase() === "y",
    demo: useDemo || "none"
  };
}

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
    demo: "none",
    dotenv: true
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
      case "--demo":
        options.demo = args[++i] || "weather";
        break;
      case "--no-dotenv":
        options.dotenv = false;
        break;
    }
  }

  return options;
}

async function createProject(options) {
  const { name, ts, db, orm, jwt, casl, roles, user, jest, demo, dotenv } = options;
  
  // Set environment variables for scaffolding
  process.env.FIEXPRESS_TS = ts ? "yes" : "no";
  process.env.FIEXPRESS_DB = db;
  process.env.FIEXPRESS_ORM = orm;
  process.env.FIEXPRESS_JWT = jwt ? "yes" : "no";
  process.env.FIEXPRESS_CASL = casl ? "yes" : "no";
  process.env.FIEXPRESS_ROLES = roles ? "yes" : "no";
  process.env.FIEXPRESS_USER = user ? "yes" : "no";
  process.env.FIEXPRESS_JEST = jest ? "yes" : "no";
  process.env.FIEXPRESS_DEMO = demo;
  process.env.FIEXPRESS_DOTENV = dotenv ? "yes" : "no";

  const targetRoot = path.resolve(name);
  
  if (fs.existsSync(targetRoot)) {
    console.error(`❌ Directory ${name} already exists`);
    process.exit(1);
  }

  try {
    // Clone template
    const repoSpec = "developersailor/fiexpress-template";
    console.log(`📥 Cloning template from ${repoSpec} into ./${name}...`);
    
    const { degit } = await import("degit");
    const emitter = degit(repoSpec);
    
    await emitter.clone(targetRoot);
    
    // Run post-clone scaffolding
    await runPostClone(targetRoot);
    
    // Sanitize generated package.json
    sanitizeGeneratedPackageJson(targetRoot);
    
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
  --demo <type>          Create demo app (weather|todo|blog)
  --no-dotenv            Skip .env.example file

Examples:
  npx fiexpress new my-api
  npx fiexpress new my-api --ts --db postgres --jwt --casl
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
  --demo <type>          Create demo app (weather|todo|blog)
  --no-dotenv            Skip .env.example file

Examples:
  npx fiexpress new my-api
  npx fiexpress new my-api --ts --db postgres --jwt --casl
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
