# FiExpress CLI

A NestJS CLI-like tool for Express.js projects. Create, scaffold, and manage Express.js applications with ease.

## Features

- **🚀 Quick Project Creation**: `npx fiexpress new <name>` creates a new Express.js project
- **📦 Template System**: Uses external template repositories for clean, up-to-date projects
- **🔧 Interactive & Non-Interactive**: Both guided setup and automation-friendly CLI flags
- **🗄️ Database & ORM Support**: PostgreSQL, MySQL, MongoDB with Prisma, Sequelize, Drizzle, Mongoose
- **📝 TypeScript Ready**: Optional TypeScript support with proper configuration
- **🔐 Authentication & Authorization**: JWT helpers, CASL integration, role-based middleware
- **💉 Dependency Injection**: tsyringe support for clean architecture
- **🧪 Testing Framework**: Jest integration with test setup and examples
- **🎯 Demo Apps**: Pre-built Weather, Todo, and Blog applications
- **🔧 Code Generation**: Generate controllers, services, middleware, and more
- **📦 Build System**: TypeScript compilation and production builds
- **🔍 Code Quality**: ESLint and Prettier configuration
- **📁 Project Structure**: Clean, organized folder structure
- **🧹 Clean Output**: Generated projects are sanitized with no CLI artifacts

## Installation

No installation required! Use directly with npx:

```bash
npx fiexpress new my-api
```

## Quick Start

### Create a New Project

```bash
# Interactive mode - guided setup
npx fiexpress new my-api

# Non-interactive mode with options
npx fiexpress new my-api --ts --db postgres --orm prisma --jwt --casl

# Create Weather API with TypeScript and Dependency Injection
npx fiexpress new weather-api --ts --tsyringe --demo weather
```

### Available Commands

```bash
npx fiexpress new <name> [options]     # Create new Express.js project
npx fiexpress generate <schematic>     # Generate components, services, etc.
npx fiexpress --help                   # Show help
npx fiexpress --version                # Show version
```

## Command Options

### `new` Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--db <database>` | Database type (postgres\|mysql\|mongo) | postgres |
| `--orm <orm>` | ORM (prisma\|sequelize\|drizzle\|mongoose\|none) | auto |
| `--ts` | Enable TypeScript support | false |
| `--tsyringe` | Enable tsyringe dependency injection | false |
| `--jest` | Include Jest testing framework | false |
| `--demo <type>` | Create demo app (weather\|todo\|blog) | none |
| `--dotenv` | Add .env.example file | true |
| `--jwt` | Include JWT authentication helpers | false |
| `--casl` | Include CASL authorization stubs | false |
| `--user` | Add example user routes and model | false |
| `--roles` | Add role-based middleware helpers | false |

## Examples

### Basic Express.js Project
```bash
npx fiexpress new my-api
cd my-api
npm install
npm run dev
```

### Full-Stack TypeScript Project
```bash
npx fiexpress new my-api --ts --db postgres --orm prisma --jwt --casl --user --roles
cd my-api
npm install
npm run dev
```

### MongoDB with Mongoose
```bash
npx fiexpress new my-api --db mongo --orm mongoose --jwt --user
cd my-api
npm install
npm run dev
```

### TypeScript with Dependency Injection (No Demo)
```bash
npx fiexpress new my-api --ts --tsyringe --jwt --casl
cd my-api
npm install
npm run dev
```

### Weather API with TypeScript & Dependency Injection
```bash
npx fiexpress new weather-api --ts --tsyringe --demo weather
cd weather-api
npm install
npm run dev
# Visit: http://localhost:3000/api/weather/city/Istanbul
# Note: Uses mock weather data - no external API required
```

### Todo API with CRUD Operations
```bash
npx fiexpress new todo-api --ts --tsyringe --demo todo
cd todo-api
npm install
npm run dev
# Visit: http://localhost:3000/api/todos
# Features: Create, Read, Update, Delete, Toggle todos
```

### Blog API with Posts and Comments
```bash
npx fiexpress new blog-api --ts --tsyringe --demo blog
cd blog-api
npm install
npm run dev
# Visit: http://localhost:3000/api/blog/posts
# Features: Posts CRUD, Comments, Publishing system
```

### Full-Stack Project with Testing
```bash
npx fiexpress new my-api --ts --tsyringe --jest --jwt --casl
cd my-api
npm install
npm run dev
npm test
```

## Code Generation

Generate components, services, and other files in existing projects:

### Available Schematics

| Schematic | Description | Example |
|-----------|-------------|---------|
| `controller` | Generate a controller | `npx fiexpress generate controller UserController` |
| `service` | Generate a service | `npx fiexpress generate service UserService` |
| `middleware` | Generate a middleware | `npx fiexpress generate middleware AuthMiddleware` |
| `route` | Generate a route | `npx fiexpress generate route user` |
| `model` | Generate a model | `npx fiexpress generate model User` |
| `interface` | Generate an interface (TS only) | `npx fiexpress generate interface UserInterface` |
| `test` | Generate a test file | `npx fiexpress generate test UserService` |
| `resource` | Generate CRUD resource | `npx fiexpress generate resource Product` |

### Generate Examples

```bash
# Generate a controller with CRUD methods
npx fiexpress generate controller UserController

# Generate a service with business logic
npx fiexpress generate service UserService

# Generate a complete CRUD resource (controller + service + routes)
npx fiexpress generate resource Product

# Generate a middleware for authentication
npx fiexpress generate middleware AuthMiddleware

# Generate a test file
npx fiexpress generate test UserService
```

## Project Structure

Generated projects follow a clean, organized structure:

```
my-api/
├── src/
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic services
│   ├── middleware/      # Custom middleware
│   ├── models/          # Data models
│   ├── interfaces/      # TypeScript interfaces
│   ├── auth/           # Authentication helpers
│   ├── db/             # Database configuration
│   └── index.ts        # Application entry point
├── tests/              # Test files
├── prisma/             # Prisma schema (if selected)
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── .eslintrc.js        # ESLint configuration
├── .prettierrc         # Prettier configuration
├── jest.config.js      # Jest configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies and scripts
└── README.md           # Project documentation
```

## Future Features

- **📦 Generate Command**: `npx fiexpress generate <schematic>` for components, services, etc.
- **➕ Add Command**: `npx fiexpress add <package>` for adding integrations
- **🔧 Configuration**: Project-specific configuration management
- **📊 Analytics**: Usage tracking and project insights

## Contributing

This is a minimal CLI repository. The actual templates are maintained in separate repositories. To contribute:

1. Fork this repository
2. Make your changes to the CLI
3. Test with `npm test`
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v2.0.0
- 🎉 Complete rewrite as NestJS CLI-like tool
- 🚀 New command structure: `npx fiexpress new <name>`
- 📦 Minimal repository with only CLI essentials
- 🔧 Enhanced help and version commands
- 🎨 Improved user experience with emojis and better messaging
- 🧹 Removed unnecessary dependencies and files
