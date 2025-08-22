This repository is a small Express backend starter template (fiexpress) and a local CLI used to scaffold new backend projects.

What I am: a coding assistant that modifies this repo, or helps generate new backend projects from this template.

How this repo is organized (big picture)

- Root: project metadata and tooling (`package.json`, `README.md`, `LICENSE`). The project is an Express starter.
- `bin/create-fiexpress.js`: interactive generator CLI that uses `npx degit` to clone the template into a new folder, then scaffolds optional features (ORMs, TypeScript, JWT, CASL, user routes) and sanitizes the generated project's `package.json` to remove CLI artifacts.
- `src/` (in generated projects): where application code is expected (routes, db, auth, middleware). This template writes stubs under `src/` when options are enabled.

Key workflows and commands

- Create a new backend from the template:
  - `npx degit developersailor/fiexpress my-backend` (direct template copy)
  - `npx create-fiexpress` (interactive CLI provided by this package)
- After generation: `cd my-backend && npm install` then follow README. If TypeScript was selected run `npx tsc --noEmit` to sanity-check types.
- Tests: `npm test` runs Jest in node environment (see `jest.config.js`).
- Linting/format: `npm run lint` uses ESLint; `npm run format` uses Prettier.

Project-specific conventions

- The generator writes stubs under `src/` and uses either `.js` or `.ts` depending on TypeScript prompt. Use `process.env.FIEXPRESS_TS` logic in the CLI as a reference for ext handling.
- Sanitization: generated projects are cleaned of generator-related metadata (no `bin`, no `publishConfig`, no `files` listing, no `degit` dependency, no repository/homepage/bugs pointing back to template). The sanitization lives in `bin/create-fiexpress.js` (function `sanitizeGeneratedPackageJson`).
- ORM choices implemented: `prisma`, `sequelize`, `drizzle`. See `bin/create-fiexpress.js` for dependency hints and generated file locations:
  - Prisma: `prisma/schema.prisma`
  - Sequelize: `src/db/sequelize.(js|ts)` and `src/models/User.(js|ts)`
  - Drizzle: `src/db/drizzle.(js|ts)` (simple stub)
- Auth/authorization:
  - JWT helper: `src/auth/jwt.(js|ts)` stub
  - CASL helper: `src/auth/casl.(js|ts)` stub
  - Role middleware: `src/middleware/roles.(js|ts)` stub

Integration points & external dependencies

- Uses `degit` (npx degit) to copy the template. If a private repo is used, degit may fail — fallback would be `git clone --depth=1` (not implemented here).
- Optional runtime deps added to generated project's `package.json` by the generator (e.g., `@prisma/client`, `sequelize`, `mongoose`, `pg`, `drizzle-orm`). TypeScript selection adds `typescript`, `ts-node`, and relevant `@types/*` devDependencies.

Patterns for contributors and agents

- When editing generator behavior, update both the CLI stubs and README usage examples.
- Keep sanitization rules minimal and explicit in `sanitizeGeneratedPackageJson` to avoid removing legitimate consumer fields.
- Tests and linting should run in the template repo; generated projects will likely have their own `package.json` and must run `npm install` to be runnable.

Examples to reference in code

- Stub creation example: `writeFileSafe(path.join(targetRoot, 'src', 'db', `postgres.${ext}`), '...')` in `bin/create-fiexpress.js`.
- Sanitization example: the `sanitizeGeneratedPackageJson` function near the end of `bin/create-fiexpress.js`.

If something is unclear or you need more specifics (e.g., add CI, support private templates with token, or add non-interactive flags), ask and I will update these instructions.
