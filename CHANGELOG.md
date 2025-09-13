# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-01-15

### Added
- **NestJS CLI-like Interface**: Complete command structure similar to NestJS CLI
- **TypeScript Support**: Full TypeScript support with proper type definitions
- **Dependency Injection**: tsyringe integration for clean architecture
- **Testing Framework**: Jest integration with TypeScript support
- **Code Generation**: Comprehensive `generate` command with multiple schematics
- **Demo Applications**: Weather, Todo, and Blog demo apps with full CRUD operations
- **Build System**: TypeScript compilation with proper build scripts
- **Code Quality**: ESLint and Prettier configuration
- **Database Support**: Multiple database and ORM combinations
- **Authentication**: JWT authentication helpers
- **Authorization**: CASL authorization system
- **Role-based Access**: Role-based middleware helpers

### Changed
- **CLI Structure**: Complete rewrite from simple degit wrapper to full-featured CLI
- **Project Architecture**: Modular architecture with proper separation of concerns
- **Command Parsing**: Improved command line argument parsing
- **Template System**: Enhanced template generation with conditional logic

### Fixed
- **Parameter Parsing**: Fixed CLI parameter parsing issues
- **Interactive Prompts**: Removed unnecessary interactive prompts when parameters are provided
- **TypeScript Build**: Resolved all TypeScript build errors and type issues
- **ORM Compatibility**: Auto-selection of compatible ORM for specified database
- **Test Setup**: Fixed Jest test configuration and setup

## [1.0.0] - 2024-01-01

### Added
- **Basic CLI**: Initial Express.js project generator
- **Template System**: Basic template cloning with degit
- **Project Structure**: Basic Express.js project structure
- **Package Management**: Basic package.json generation

## Available Commands

### New Project Creation
```bash
npx fiexpress new <name> [options]
```

**Options:**
- `--ts` - Enable TypeScript support
- `--db <database>` - Database type (postgres|mysql|mongo)
- `--orm <orm>` - ORM to use (prisma|sequelize|drizzle|mongoose|none)
- `--jest` - Include Jest testing framework
- `--jwt` - Include JWT authentication helpers
- `--casl` - Include CASL authorization stubs
- `--user` - Add example user routes and model
- `--roles` - Add role-based middleware helpers
- `--tsyringe` - Enable tsyringe dependency injection
- `--demo <type>` - Create demo app (weather|todo|blog)
- `--dotenv` - Add .env.example file

### Code Generation
```bash
npx fiexpress generate <schematic> <name>
```

**Available Schematics:**
- `controller` - Generate a controller
- `service` - Generate a service
- `middleware` - Generate a middleware
- `route` - Generate a route
- `model` - Generate a model
- `interface` - Generate an interface (TS only)
- `test` - Generate a test file
- `resource` - Generate a CRUD resource (controller + service + routes)

## Examples

### Basic TypeScript Project
```bash
npx fiexpress new my-api --ts --jest
```

### Full-Stack Project with All Features
```bash
npx fiexpress new fullstack-api \
  --ts \
  --db postgres \
  --orm prisma \
  --jest \
  --jwt \
  --casl \
  --user \
  --roles \
  --tsyringe \
  --demo todo \
  --dotenv
```

### Quick JavaScript Project
```bash
npx fiexpress new quick-api --db mongo --orm mongoose --jwt --demo weather
```

## Generated Project Structure

```
my-api/
├── src/
│   ├── auth/                 # Authentication & Authorization
│   │   ├── jwt.ts           # JWT helpers
│   │   └── casl.ts          # CASL authorization
│   ├── controllers/         # Controllers
│   ├── services/            # Services
│   ├── middleware/          # Custom middleware
│   │   └── roles.ts         # Role-based middleware
│   ├── routes/              # Route definitions
│   ├── models/              # Data models
│   ├── interfaces/          # TypeScript interfaces
│   └── index.ts            # Main application file
├── tests/                   # Test files
│   ├── setup.ts
│   └── app.test.ts
├── prisma/                  # Prisma schema (if using Prisma)
│   └── schema.prisma
├── jest.config.js           # Jest configuration
├── tsconfig.json           # TypeScript configuration
├── .eslintrc.cjs           # ESLint configuration
├── .prettierrc             # Prettier configuration
├── .gitignore              # Git ignore rules
├── .env.example            # Environment variables template
└── package.json            # Project dependencies and scripts
```

## Demo Applications

### Weather API
- Mock weather data (no external API required)
- City-based and coordinate-based weather queries
- Full TypeScript support with interfaces

### Todo API
- Complete CRUD operations
- In-memory storage
- Toggle functionality
- Full validation

### Blog API
- Post management (CRUD)
- Comment system
- Publishing workflow
- Author management

## Dependencies

### Core Dependencies
- `express` - Web framework
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `tsyringe` - Dependency injection
- `reflect-metadata` - Metadata reflection

### Database & ORM
- `@prisma/client` + `prisma` - Prisma ORM
- `sequelize` - Sequelize ORM
- `drizzle-orm` - Drizzle ORM
- `mongoose` - MongoDB ODM
- `pg`, `mysql2` - Database drivers

### Authentication & Authorization
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing
- `@casl/ability` - Authorization

### Development Dependencies
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `jest` - Testing framework
- `supertest` - HTTP testing
- `eslint` - Code linting
- `prettier` - Code formatting

## Breaking Changes

### From v1.0.0 to v2.0.0
- Complete CLI rewrite
- New command structure
- Enhanced project generation
- TypeScript-first approach
- New dependency injection system

## Migration Guide

### From v1.0.0
1. Update CLI usage to new command structure
2. Migrate existing projects to new architecture
3. Update dependencies to match new versions
4. Adopt new project structure conventions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- GitHub Issues: [Report bugs and request features](https://github.com/developersailor/fiexpress/issues)
- Documentation: [README.md](README.md)
- Examples: See demo applications in generated projects
