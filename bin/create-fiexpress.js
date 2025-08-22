#!/usr/bin/env node
import { spawn } from 'child_process';
import readline from 'readline';
import process from 'process';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(q) {
  return new Promise((res) => rl.question(q, (a) => res(a.trim())));
}

function writeFileSafe(targetPath, content) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, { flag: 'w' });
}

async function main() {
  console.log('fiexpress project creator (degit)');
  const repo = await question('Template repo (owner/repo) [developersailor/fiexpress]: ');
  const name = await question('New project directory name [my-app]: ');

  // Options
  const db = await question('Database (none/mongo/postgres) [none]: ');
  const dotenvOpt = await question('Add dotenv config (.env.example)? (yes/no) [yes]: ');
  const jwt = await question('Include JWT auth scaffolding? (yes/no) [no]: ');
  const casl = await question('Include CASL (authorization) scaffolding? (yes/no) [no]: ');
  const user = await question('Include example user model/routes? (yes/no) [no]: ');

  rl.close();

  const repoSpec = repo || 'developersailor/fiexpress';
  const dir = name || 'my-app';

  // persist options for post-clone step
  process.env.FIEXPRESS_DB = (db || 'none').toLowerCase();
  process.env.FIEXPRESS_DOTENV = (dotenvOpt || 'yes').toLowerCase();
  process.env.FIEXPRESS_JWT = (jwt || 'no').toLowerCase();
  process.env.FIEXPRESS_CASL = (casl || 'no').toLowerCase();
  process.env.FIEXPRESS_USER = (user || 'no').toLowerCase();

  console.log(`Cloning ${repoSpec} into ./${dir} using degit...`);

  const child = spawn('npx', ['degit', `${repoSpec}`, dir], { stdio: 'inherit' });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('Template copied. Running post-clone scaffolding...');

      // Post-clone scaffolding based on options
      // For simplicity we read options from environment variables set earlier via prompts
      const targetRoot = path.resolve(process.cwd(), dir);

      // dotenv
      if (process.env.FIEXPRESS_DOTENV === 'yes') {
        const envExample = `PORT=3000\nDB_URL=\nJWT_SECRET=your_jwt_secret\n`;
        writeFileSafe(path.join(targetRoot, '.env.example'), envExample);
        console.log('Added .env.example');
      }

      // DB
      if (process.env.FIEXPRESS_DB && process.env.FIEXPRESS_DB !== 'none') {
        const db = process.env.FIEXPRESS_DB;
        if (db === 'mongo') {
          writeFileSafe(
            path.join(targetRoot, 'src', 'db', 'mongo.js'),
            `import mongoose from 'mongoose';\nexport async function connect(url){\n  return mongoose.connect(url);\n}\n`
          );
          console.log('Added MongoDB connection stub');
        } else if (db === 'postgres') {
          writeFileSafe(
            path.join(targetRoot, 'src', 'db', 'postgres.js'),
            `import { Pool } from 'pg';\nexport function getPool(cfg){\n  return new Pool(cfg);\n}\n`
          );
          console.log('Added Postgres connection stub');
        }
      }

      // Auth
      if (process.env.FIEXPRESS_JWT === 'yes' || process.env.FIEXPRESS_CASL === 'yes' || process.env.FIEXPRESS_USER === 'yes') {
        writeFileSafe(
          path.join(targetRoot, 'src', 'auth', 'index.js'),
          `// auth scaffolding - customize as needed\nexport default {}\n`
        );
        console.log('Added auth scaffolding');
      }

      console.log('Scaffolding complete. Next: cd', dir, '&& npm install');
    } else {
      console.error('degit failed with code', code);
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
