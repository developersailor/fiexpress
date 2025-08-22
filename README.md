# fiexpress

A lightweight Express.js backend starter template and generator.

## Features

- **Interactive CLI**: `npx create-fiexpress` guides you through project setup.
- **Non-Interactive Mode**: Automate project creation using command-line flags.
- **Database & ORM Scaffolding**: Choose from PostgreSQL, MySQL, or MongoDB, with support for Prisma, Sequelize, Drizzle, and Mongoose.
- **TypeScript Support**: Generates a `tsconfig.json` and adds necessary TypeScript dependencies.
- **Essential Tooling**: Includes stubs for `.env` configuration, JWT authentication, CASL for authorization, user routes, and role-based middleware.
- **Clean Output**: The generated project is sanitized, containing no artifacts from the generator itself.

## Quick Start (degit)

To clone the base template directly without any scaffolding:

```bash
npx degit developersailor/fiexpress my-app
cd my-app
npm install
```

## Usage with `fiexpress`

### Interactive Mode

For a guided setup, run the CLI without any arguments:

```bash
npx fiexpress
```

The CLI will prompt you for the project name and scaffolding options.

### Non-Interactive Mode

You can also provide all options as command-line flags to create a project non-interactively. This is ideal for automation and CI/CD pipelines.

**Example:**

```bash
npx fiexpress \
  --name my-api \
  --db postgres \
  --orm prisma \
  --ts yes \
  --dotenv yes \
  --jwt yes \
  --casl yes \
  --user yes \
  --roles yes
```

### Scaffolding Options

- `--name`: The name of the new project directory.
- `--db`: The database to use (`postgres`, `mysql`, `mongo`).
- `--orm`: The ORM to use (`prisma`, `sequelize`, `drizzle`, `mongoose`). If not provided, a sensible default is chosen based on the database (e.g., `sequelize` for SQL, `mongoose` for MongoDB).
- `--ts`: Enable TypeScript support (`yes`/`no`).
- `--dotenv`: Add `.env.example` for environment variables (`yes`/`no`).
- `--jwt`: Include JWT authentication helpers (`yes`/`no`).
- `--casl`: Include CASL authorization stubs (`yes`/`no`).
- `--user`: Add example user routes and model (`yes`/`no`).
- `--roles`: Add role-based middleware helpers (`yes`/`no`).

## Testing

This repository includes a smoke test to ensure the generator works correctly across all options. To run it:

```bash
npm run smoke-test
```

This will create a temporary project, run the generator with a full set of options, and verify that the output is correct and sanitized.

## Changelog

- **2025-08-23**:
  - Re-introduced the `--db` flag.
  - The generator now auto-selects a suitable ORM if one isn't specified.
  - If `--db` and `--orm` are specified and conflict, the generator will override the ORM to match the database and issue a warning.
