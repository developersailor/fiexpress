#!/usr/bin/env node
import { spawn } from "child_process";
import readline from "readline";
import process from "process";
import fs from "fs";
import path from "path";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(q) {
  return new Promise((res) => rl.question(q, (a) => res(a.trim())));
}

function writeFileSafe(targetPath, content) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, { flag: "w" });
}

async function main() {
  console.log("fiexpress project creator (degit)");
  // simple flag parsing for non-interactive usage
  const argv = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.replace(/^--+/, "");
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = "yes";
      }
    }
  }

  // if flags provided, use them; otherwise prompt interactively
  let name = flags.name;
  let db = flags.db;
  let orm = flags.orm;
  let dotenvOpt = flags.dotenv;
  let jwt = flags.jwt;
  let casl = flags.casl;
  let user = flags.user;
  let roles = flags.roles;
  let ts = flags.ts;

  if (
    !name ||
    !db ||
    !orm ||
    !dotenvOpt ||
    !jwt ||
    !casl ||
    !user ||
    !roles ||
    !ts
  ) {
    // some flags missing, prompt for any that are undefined
    name = name || (await question("New project directory name [my-app]: "));
    db = db || (await question("Database (postgres/mysql/mongo) [postgres]: "));
    orm =
      orm || (await question("ORM (none/prisma/sequelize/drizzle) [none]: "));
    dotenvOpt =
      dotenvOpt ||
      (await question("Add dotenv config (.env.example)? (yes/no) [yes]: "));
    jwt =
      jwt || (await question("Include JWT auth scaffolding? (yes/no) [no]: "));
    casl =
      casl ||
      (await question(
        "Include CASL (authorization) scaffolding? (yes/no) [no]: ",
      ));
    user =
      user ||
      (await question("Include example user model/routes? (yes/no) [no]: "));
    roles =
      roles ||
      (await question("Include role-based auth helpers? (yes/no) [no]: "));
    ts = ts || (await question("Enable TypeScript? (yes/no) [no]: "));
  }

  rl.close();

  const repoSpec = "developersailor/fiexpress";
  const dir = name || "my-app";

  // persist options for post-clone step
  process.env.FIEXPRESS_DB = (db || "postgres").toLowerCase();
  process.env.FIEXPRESS_ORM = (orm || "none").toLowerCase();
  process.env.FIEXPRESS_DOTENV = (dotenvOpt || "yes").toLowerCase();
  process.env.FIEXPRESS_JWT = (jwt || "no").toLowerCase();
  process.env.FIEXPRESS_CASL = (casl || "no").toLowerCase();
  process.env.FIEXPRESS_USER = (user || "no").toLowerCase();
  process.env.FIEXPRESS_ROLES = (roles || "no").toLowerCase();
  process.env.FIEXPRESS_TS = (ts || "no").toLowerCase();

  // detect potential conflict between db and orm and confirm if interactive
  const dbVal = process.env.FIEXPRESS_DB;
  const ormVal = process.env.FIEXPRESS_ORM;
  const mapDbToOrm = (d) => {
    if (!d) return null;
    if (d === "mongo") return "mongoose";
    if (d === "postgres" || d === "mysql") return "sequelize";
    return "sequelize";
  };
  const suggestedOrm = mapDbToOrm(dbVal);
  if (suggestedOrm && ormVal && suggestedOrm !== ormVal) {
    // interactive prompt if possible
    if (process.stdin.isTTY && process.stdout.isTTY) {
      const confirmRl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const answer = await new Promise((res) =>
        confirmRl.question(
          `Conflict: --db='${dbVal}' and --orm='${ormVal}' look incompatible. Change ORM to '${suggestedOrm}'? (yes/no) [yes]: `,
          (a) => res(a.trim()),
        ),
      );
      confirmRl.close();
      if (answer === "" || answer.toLowerCase().startsWith("y")) {
        process.env.FIEXPRESS_ORM = suggestedOrm;
        console.log(
          `Overriding ORM to '${suggestedOrm}' to match DB '${dbVal}'`,
        );
      } else {
        console.log(`Keeping ORM='${ormVal}' as requested`);
      }
    } else {
      console.warn(
        `Warning: provided --db='${dbVal}' conflicts with --orm='${ormVal}'; overriding ORM to '${suggestedOrm}' to match DB.`,
      );
      process.env.FIEXPRESS_ORM = suggestedOrm;
    }
  }

  console.log(`Cloning ${repoSpec} into ./${dir} using degit...`);

  const child = spawn("npx", ["degit", `${repoSpec}`, dir], {
    stdio: "inherit",
  });

  child.on("close", (code) => {
    if (code === 0) {
      console.log("Template copied. Running post-clone scaffolding...");

      // Post-clone scaffolding based on options
      // For simplicity we read options from environment variables set earlier via prompts
      const targetRoot = path.resolve(process.cwd(), dir);
      const ext = process.env.FIEXPRESS_TS === "yes" ? "ts" : "js";

      // dotenv
      if (process.env.FIEXPRESS_DOTENV === "yes") {
        const envExample = `PORT=3000\nDB_URL=\nJWT_SECRET=your_jwt_secret\n`;
        writeFileSafe(path.join(targetRoot, ".env.example"), envExample);
        console.log("Added .env.example");
      }

      // helper: merge deps into package.json
      function addDepsToPackageJson(deps = {}, devDeps = {}) {
        const pkgPath = path.join(targetRoot, "package.json");
        let pkg = { name: dir, version: "1.0.0" };
        try {
          const raw = fs.readFileSync(pkgPath, "utf8");
          pkg = JSON.parse(raw);
        } catch {
          // no package.json exists, we'll create one
        }

        pkg.dependencies = pkg.dependencies || {};
        pkg.devDependencies = pkg.devDependencies || {};

        for (const [k, v] of Object.entries(deps)) pkg.dependencies[k] = v;
        for (const [k, v] of Object.entries(devDeps))
          pkg.devDependencies[k] = v;

        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        console.log("Updated", pkgPath, "with dependencies");
      }

      const toInstall = { deps: {}, dev: {} };

      // If ORM not selected but DB provided, choose sensible default
      const selectedDb = process.env.FIEXPRESS_DB;
      let selectedOrm = process.env.FIEXPRESS_ORM;
      if ((!selectedOrm || selectedOrm === "none") && selectedDb) {
        if (selectedDb === "mongo")
          selectedOrm = "mongoose"; // treat as mongoose flow
        else if (selectedDb === "postgres" || selectedDb === "mysql")
          selectedOrm = "sequelize";
        else selectedOrm = "sequelize";
        console.log(
          `Auto-selected ORM '${selectedOrm}' for DB '${selectedDb}'`,
        );
      }

      // If user provided both and they conflict, warn and override orm based on db
      const userProvidedDb = !!flags.db;
      const userProvidedOrm = !!flags.orm;
      if (
        userProvidedDb &&
        userProvidedOrm &&
        selectedOrm &&
        selectedOrm !== process.env.FIEXPRESS_ORM
      ) {
        console.warn(
          `Warning: provided --db='${selectedDb}' conflicts with --orm='${process.env.FIEXPRESS_ORM}'; overriding ORM to '${selectedOrm}' to match DB.`,
        );
      }

      // normalize back to env for the rest of the script
      process.env.FIEXPRESS_ORM = selectedOrm;

      // ORM support
      const orm = process.env.FIEXPRESS_ORM;
      const dbForDriver = process.env.FIEXPRESS_DB;
      if (orm && orm !== "none") {
        if (orm === "prisma") {
          toInstall.deps["@prisma/client"] = "^5.0.0";
          toInstall.dev["prisma"] = "^5.0.0";
          // add underlying driver for prisma if known
          if (dbForDriver === "mysql") {
            toInstall.deps["mysql2"] = "^3.5.0";
          } else if (dbForDriver === "postgres") {
            toInstall.deps["pg"] = "^8.11.0";
          }
          writeFileSafe(
            path.join(targetRoot, "prisma", "schema.prisma"),
            `generator client {\n  provider = "prisma-client-js"\n}\n\nmodel User {\n  id String @id @default(cuid())\n  email String @unique\n  name String?\n}\n`,
          );
          console.log("Added prisma schema stub");
        } else if (orm === "sequelize") {
          toInstall.deps["sequelize"] = "^6.32.1";
          // choose driver based on DB
          if (dbForDriver === "mysql") {
            toInstall.deps["mysql2"] = "^3.5.0";
          } else {
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
          console.log("Added sequelize stubs");
        } else if (orm === "drizzle") {
          toInstall.deps["drizzle-orm"] = "^1.0.0";
          if (dbForDriver === "mysql") {
            toInstall.deps["mysql2"] = "^3.5.0";
          } else {
            toInstall.deps["pg"] = "^8.11.0";
          }
          writeFileSafe(
            path.join(targetRoot, "src", "db", `drizzle.${ext}`),
            `// drizzle-orm connection stub\nimport { drizzle } from 'drizzle-orm/node-postgres';\n// configure with pg pool\n`,
          );
          console.log("Added drizzle stubs");
        } else if (orm === "mongoose" || orm === "mongo") {
          // mongoose path
          toInstall.deps["mongoose"] = "^7.6.0";
          writeFileSafe(
            path.join(targetRoot, "src", "db", `mongo.${ext}`),
            `import mongoose from 'mongoose';\nexport async function connect(url){\n  return mongoose.connect(url);\n}\n`,
          );
          console.log("Added Mongoose stubs");
        }
      }

      // Auth
      if (process.env.FIEXPRESS_JWT === "yes") {
        toInstall.deps["jsonwebtoken"] = "^9.0.0";
        toInstall.deps["bcryptjs"] = "^2.4.3";
        const ext = process.env.FIEXPRESS_TS === "yes" ? "ts" : "js";
        writeFileSafe(
          path.join(targetRoot, "src", "auth", `jwt.${ext}`),
          `// JWT auth helper\nimport jwt from 'jsonwebtoken';\nconst secret = process.env.JWT_SECRET || 'change-me';\nexport function sign(payload){ return jwt.sign(payload, secret); }\nexport function verify(token){ return jwt.verify(token, secret); }\n`,
        );
        console.log("Added JWT auth helper");
      }

      if (process.env.FIEXPRESS_CASL === "yes") {
        toInstall.deps["@casl/ability"] = "^6.4.0";
        writeFileSafe(
          path.join(targetRoot, "src", "auth", `casl.${ext}`),
          `// CASL ability stub\nimport { Ability } from '@casl/ability';\nexport const defineAbility = (user) => new Ability([]);\n`,
        );
        console.log("Added CASL stub");
      }

      if (process.env.FIEXPRESS_ROLES === "yes") {
        writeFileSafe(
          path.join(targetRoot, "src", "middleware", `roles.${ext}`),
          `export function requireRole(role){\n  return (req,res,next)=>{\n    if(req.user && req.user.role===role) return next();\n    res.status(403).end();\n  }\n}\n`,
        );
        console.log("Added role-based middleware stub");
      }

      // User model scaffold if requested
      if (process.env.FIEXPRESS_USER === "yes") {
        const ext = process.env.FIEXPRESS_TS === "yes" ? "ts" : "js";
        writeFileSafe(
          path.join(targetRoot, "src", "routes", `user.${ext}`),
          `// user routes stub\nimport express from 'express';\nconst router = express.Router();\nrouter.get('/', (req,res)=>res.json({msg:'users'}));\nexport default router;\n`,
        );
        console.log("Added user routes stub");
      }

      // TypeScript support
      if (process.env.FIEXPRESS_TS === "yes") {
        toInstall.dev["typescript"] = "^5.2.2";
        toInstall.dev["ts-node"] = "^10.9.1";
        toInstall.dev["@types/node"] = "^20.5.1";
        // common types
        toInstall.dev["@types/express"] = "^4.17.21";
        toInstall.dev["@types/cors"] = "^2.8.12";
        toInstall.dev["@types/dotenv"] = "^8.2.0";
        // ORM-specific types
        const orm = process.env.FIEXPRESS_ORM;
        if (orm === "sequelize") {
          toInstall.dev["@types/sequelize"] = "^4.28.14";
        }
        if (orm === "prisma") {
          // Prisma ships its own types via @prisma/client
        }
        if (orm === "drizzle") {
          // drizzle has TypeScript-first support; no @types required
        }
        writeFileSafe(
          path.join(targetRoot, "tsconfig.json"),
          `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
`,
        );
        console.log("Added tsconfig.json");
      }

      // Merge and write package.json
      addDepsToPackageJson(toInstall.deps, toInstall.dev);

      // Ensure generated project has a minimal start script and entrypoint
      try {
        const pkgPath = path.join(targetRoot, "package.json");
        const raw = fs.readFileSync(pkgPath, "utf8");
        const pkg = JSON.parse(raw);
        pkg.scripts = pkg.scripts || {};
        // add start/dev scripts if missing
        if (!pkg.scripts.start) {
          pkg.scripts.start =
            process.env.FIEXPRESS_TS === "yes"
              ? "node dist/index.js"
              : "node src/index.js";
        }
        if (!pkg.scripts.dev) {
          pkg.scripts.dev =
            process.env.FIEXPRESS_TS === "yes"
              ? "ts-node src/index.ts"
              : "node src/index.js";
        }
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        console.log("Added start/dev scripts to generated package.json");
      } catch {
        // ignore
      }

      // Write a minimal src/index.(js|ts) entry if not present
      try {
        const ext = process.env.FIEXPRESS_TS === "yes" ? "ts" : "js";
        const entryPath = path.join(targetRoot, "src", `index.${ext}`);
        if (!fs.existsSync(entryPath)) {
          const content =
            process.env.FIEXPRESS_TS === "yes"
              ? `import express from 'express';\nconst app = express();\napp.get('/', (req,res)=>res.send('hello from generated app'));\napp.listen(process.env.PORT||3000, ()=>console.log('listening'));\n`
              : `const express = require('express');\nconst app = express();\napp.get('/', (req,res)=>res.send('hello from generated app'));\napp.listen(process.env.PORT||3000, ()=>console.log('listening'));\n`;
          writeFileSafe(entryPath, content);
          console.log(`Added minimal app entry ${entryPath}`);
        }
      } catch {
        // ignore file write errors
      }

      // sanitize generated project: remove CLI artifacts (bin, degit dep, publishConfig/files, repository/homepage/bugs)
      function sanitizeGeneratedPackageJson() {
        const pkgPath = path.join(targetRoot, "package.json");
        try {
          const raw = fs.readFileSync(pkgPath, "utf8");
          const pkg = JSON.parse(raw);

          // set sensible name
          pkg.name = pkg.name && pkg.name !== "" ? pkg.name : dir;

          // remove CLI entrypoint
          if (pkg.bin) delete pkg.bin;

          // remove degit if present (CLI-only) from dependencies or devDependencies
          if (pkg.dependencies && pkg.dependencies.degit)
            delete pkg.dependencies.degit;
          if (pkg.devDependencies && pkg.devDependencies.degit)
            delete pkg.devDependencies.degit;

          // remove publishing metadata that ties to generator
          if (pkg.publishConfig) delete pkg.publishConfig;
          if (pkg.files) delete pkg.files;

          // remove repository/homepage/bugs pointing to template
          if (pkg.repository) delete pkg.repository;
          if (pkg.homepage) delete pkg.homepage;
          if (pkg.bugs) delete pkg.bugs;

          // remove prepare husky script and husky devDependency if present
          // remove husky prepare script and husky devDependency if present
          if (
            pkg.scripts &&
            pkg.scripts.prepare &&
            pkg.scripts.prepare.includes("husky")
          ) {
            delete pkg.scripts.prepare;
          }
          if (pkg.devDependencies && pkg.devDependencies.husky) {
            delete pkg.devDependencies.husky;
          }

          // remove any copied CLI files/dirs under the generated project (e.g., bin/create-fiexpress.js)
          try {
            const binDir = path.join(targetRoot, "bin");
            if (fs.existsSync(binDir)) {
              fs.rmSync(binDir, { recursive: true, force: true });
              console.log(
                "Removed copied bin/ directory from generated project",
              );
            }
            const cliFile = path.join(targetRoot, "create-fiexpress.js");
            if (fs.existsSync(cliFile)) {
              fs.rmSync(cliFile, { force: true });
              console.log(
                "Removed copied create-fiexpress.js from generated project root",
              );
            }
          } catch {
            // ignore file system cleanup errors
          }

          fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
          console.log(
            "Sanitized generated package.json (removed CLI artifacts)",
          );
        } catch {
          // ignore
        }
      }

      sanitizeGeneratedPackageJson();

      console.log("Scaffolding complete. Next steps:");
      console.log("  cd", dir);
      console.log("  npm install");
      if (process.env.FIEXPRESS_TS === "yes")
        console.log("  npx tsc --noEmit (to check types)");

      console.log("Scaffolding complete. Next: cd", dir, "&& npm install");
    } else {
      console.error("degit failed with code", code);
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
