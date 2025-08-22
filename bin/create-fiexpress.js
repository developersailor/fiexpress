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
    console.log("Sanitized generated package.json (removed CLI artifacts)");
  } catch (e) {
    console.error("Failed to sanitize package.json", e);
  }
}

function copyLocalTemplateToDst(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
}

async function runPostClone(targetRoot) {
  console.log("Running post-clone scaffolding in:", targetRoot);
  const ext = process.env.FIEXPRESS_TS === "yes" ? "ts" : "js";

  if (process.env.FIEXPRESS_DOTENV === "yes") {
    const envExample = `PORT=3000\nDB_URL=\nJWT_SECRET=your_jwt_secret\n`;
    writeFileSafe(path.join(targetRoot, ".env.example"), envExample);
    console.log("Added .env.example");
  }

  const toInstall = { deps: {}, dev: {} };
  const selectedDb = (process.env.FIEXPRESS_DB || "postgres").toLowerCase();
  let selectedOrm = (process.env.FIEXPRESS_ORM || "").toLowerCase();
  if ((!selectedOrm || selectedOrm === "none") && selectedDb) {
    if (selectedDb === "mongo") selectedOrm = "mongoose";
    else if (selectedDb === "postgres" || selectedDb === "mysql")
      selectedOrm = "sequelize";
    else selectedOrm = "sequelize";
    console.log(`Auto-selected ORM '${selectedOrm}' for DB '${selectedDb}'`);
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
      console.log("Added prisma schema stub");
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
      console.log("Added sequelize stubs");
    } else if (orm === "drizzle") {
      toInstall.deps["drizzle-orm"] = "^1.0.0";
      if (dbForDriver === "mysql") toInstall.deps["mysql2"] = "^3.5.0";
      else toInstall.deps["pg"] = "^8.11.0";
      writeFileSafe(
        path.join(targetRoot, "src", "db", `drizzle.${ext}`),
        `// drizzle-orm connection stub\nimport { drizzle } from 'drizzle-orm/node-postgres';\n// configure with pg pool\n`,
      );
      console.log("Added drizzle stubs");
    } else if (orm === "mongoose" || orm === "mongo") {
      toInstall.deps["mongoose"] = "^7.6.0";
      writeFileSafe(
        path.join(targetRoot, "src", "db", `mongo.${ext}`),
        `import mongoose from 'mongoose';\nexport async function connect(url){\n  return mongoose.connect(url);\n}\n`,
      );
      console.log("Added Mongoose stubs");
    }
  }

  if (process.env.FIEXPRESS_JWT === "yes") {
    toInstall.deps["jsonwebtoken"] = "^9.0.0";
    toInstall.deps["bcryptjs"] = "^2.4.3";
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

  if (process.env.FIEXPRESS_USER === "yes") {
    writeFileSafe(
      path.join(targetRoot, "src", "routes", `user.${ext}`),
      `// user routes stub\nimport express from 'express';\nconst router = express.Router();\nrouter.get('/', (req,res)=>res.json({msg:'users'}));\nexport default router;\n`,
    );
    console.log("Added user routes stub");
  }

  if (process.env.FIEXPRESS_TS === "yes") {
    toInstall.dev["typescript"] = "^5.2.2";
    toInstall.dev["ts-node"] = "^10.9.1";
    toInstall.dev["@types/node"] = "^20.5.1";
    toInstall.dev["@types/express"] = "^4.17.21";
    toInstall.dev["@types/cors"] = "^2.8.12";
    toInstall.dev["@types/dotenv"] = "^8.2.0";
    if (orm === "sequelize") toInstall.dev["@types/sequelize"] = "^4.28.14";
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
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log("Added start/dev scripts to generated package.json");
  } catch {
    /* ignore */
  }

  try {
    const entryExt = process.env.FIEXPRESS_TS === "yes" ? "ts" : "js";
    const entryPath = path.join(targetRoot, "src", `index.${entryExt}`);
    if (!fs.existsSync(entryPath)) {
      const content =
        process.env.FIEXPRESS_TS === "yes"
          ? `import express from 'express';\nconst app = express();\napp.get('/', (req,res)=>res.send('hello from generated app'));\napp.listen(process.env.PORT||3000, ()=>console.log('listening'));\n`
          : `const express = require('express');\nconst app = express();\napp.get('/', (req,res)=>res.send('hello from generated app'));\napp.listen(process.env.PORT||3000, ()=>console.log('listening'));\n`;
      writeFileSafe(entryPath, content);
      console.log(`Added minimal app entry ${entryPath}`);
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

async function main() {
  try {
    console.log("fiexpress project creator (degit)");

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
      name =
        name ||
        (await question("New project directory name [my-app]: ")) ||
        "my-app";
      db =
        db ||
        (await question("Database (postgres/mysql/mongo) [postgres]: ")) ||
        "postgres";
      orm =
        orm ||
        (await question(
          "ORM (none/prisma/sequelize/drizzle/mongoose) [none]: ",
        )) ||
        "none";
      dotenvOpt =
        dotenvOpt ||
        (await question(
          "Add dotenv config (.env.example)? (yes/no) [yes]: ",
        )) ||
        "yes";
      jwt =
        jwt ||
        (await question("Include JWT auth scaffolding? (yes/no) [no]: ")) ||
        "no";
      casl =
        casl ||
        (await question(
          "Include CASL (authorization) scaffolding? (yes/no) [no]: ",
        )) ||
        "no";
      user =
        user ||
        (await question(
          "Include example user model/routes? (yes/no) [no]: ",
        )) ||
        "no";
      roles =
        roles ||
        (await question("Include role-based auth helpers? (yes/no) [no]: ")) ||
        "no";
      ts = ts || (await question("Enable TypeScript? (yes/no) [no]: ")) || "no";
    }

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

    const isLocalTest = !!process.env.FIEXPRESS_LOCAL_TEMPLATE;

    if (isLocalTest) {
      const src = path.resolve(process.env.FIEXPRESS_LOCAL_TEMPLATE);
      const dst = path.resolve(dir);
      try {
        copyLocalTemplateToDst(src, dst);
        await runPostClone(dst);
      } catch (err) {
        console.error("Failed to copy local template:", err);
        process.exit(1);
      }
    } else {
      const child = spawn("npx", ["degit", repoSpec, dir], {
        stdio: "inherit",
      });
      child.on("close", (code) => {
        if (code === 0) {
          runPostClone(path.resolve(process.cwd(), dir));
        } else {
          console.error("degit failed with code", code);
          process.exit(1);
        }
      });
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
