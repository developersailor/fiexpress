import fs from "fs";
import path from "path";

export function writeFileSafe(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

export function addDepsToPackageJson(targetRoot, deps = {}, devDeps = {}) {
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

export function sanitizeGeneratedPackageJson(targetRoot) {
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

export function createNewPackageJson(targetRoot, projectName, options = {}) {
  const { ts, jest, orm, db } = options;
  
  // Base package.json structure
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    description: "Express.js application",
    main: ts ? "dist/index.js" : "src/index.js",
    type: ts ? "module" : "commonjs",
    scripts: {
      start: ts ? "node dist/index.js" : "node src/index.js",
      dev: ts ? "ts-node src/index.ts" : "node src/index.js"
    },
    keywords: ["express", "nodejs", "api"],
    author: "",
    license: "MIT",
    dependencies: {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "dotenv": "^16.3.1"
    },
    devDependencies: {}
  };

  // Add TypeScript dependencies if enabled
  if (ts) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      "typescript": "^5.2.2",
      "ts-node": "^10.9.1",
      "@types/node": "^20.5.1",
      "@types/express": "^4.17.21",
      "@types/cors": "^2.8.12",
      "@types/dotenv": "^8.2.0"
    };
    
    packageJson.scripts = {
      ...packageJson.scripts,
      "build": "tsc",
      "type-check": "tsc --noEmit"
    };
  }

  // Add Jest dependencies if enabled
  if (jest) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      "jest": "^29.7.0",
      "supertest": "^6.3.3"
    };
    
    if (ts) {
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        "@types/jest": "^29.5.8",
        "@types/supertest": "^2.0.16",
        "ts-jest": "^29.1.1"
      };
    }
    
    packageJson.scripts = {
      ...packageJson.scripts,
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage"
    };
  }

  // Add database dependencies based on ORM
  if (orm && orm !== "none") {
    switch (orm) {
      case "prisma":
        packageJson.dependencies["@prisma/client"] = "^5.0.0";
        packageJson.devDependencies["prisma"] = "^5.0.0";
        if (db === "mysql") {
          packageJson.dependencies["mysql2"] = "^3.5.0";
        } else if (db === "postgres") {
          packageJson.dependencies["pg"] = "^8.11.0";
        }
        break;
      case "sequelize":
        packageJson.dependencies["sequelize"] = "^6.32.1";
        if (db === "mysql") {
          packageJson.dependencies["mysql2"] = "^3.5.0";
        } else {
          packageJson.dependencies["pg"] = "^8.11.0";
          packageJson.dependencies["pg-hstore"] = "^2.3.4";
        }
        if (ts) {
          packageJson.devDependencies["@types/sequelize"] = "^4.28.14";
        }
        break;
      case "drizzle":
        packageJson.dependencies["drizzle-orm"] = "^1.0.0";
        if (db === "mysql") {
          packageJson.dependencies["mysql2"] = "^3.5.0";
        } else {
          packageJson.dependencies["pg"] = "^8.11.0";
        }
        break;
      case "mongoose":
        packageJson.dependencies["mongoose"] = "^7.6.0";
        break;
    }
  }

  // Add authentication dependencies if enabled
  if (options.jwt) {
    packageJson.dependencies["jsonwebtoken"] = "^9.0.0";
    packageJson.dependencies["bcryptjs"] = "^2.4.3";
    if (ts) {
      packageJson.devDependencies["@types/jsonwebtoken"] = "^9.0.0";
      packageJson.devDependencies["@types/bcryptjs"] = "^2.4.0";
    }
  }

  // Add CASL dependencies if enabled
  if (options.casl) {
    packageJson.dependencies["@casl/ability"] = "^6.4.0";
  }

  // Add tsyringe dependencies if enabled
  if (options.tsyringe) {
    packageJson.dependencies["tsyringe"] = "^4.8.0";
    packageJson.dependencies["reflect-metadata"] = "^0.1.13";
    if (ts) {
      packageJson.devDependencies["@types/reflect-metadata"] = "^0.1.0";
    }
  }

  // Add ESLint and Prettier
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    "eslint": "^8.50.0",
    "prettier": "^3.0.3"
  };

  if (ts) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      "@typescript-eslint/parser": "^6.7.0",
      "@typescript-eslint/eslint-plugin": "^6.7.0"
    };
  }

  // Write the new package.json
  const pkgPath = path.join(targetRoot, "package.json");
  fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));
  
  return packageJson;
}

export function copyLocalTemplateToDst(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
}
