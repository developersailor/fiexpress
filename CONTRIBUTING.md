# Contributing to FiExpress CLI

## 🤝 How to Contribute

We welcome contributions from the community! This guide will help you get started.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Feature Development](#feature-development)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Code of Conduct](#code-of-conduct)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Basic knowledge of Express.js

### Fork and Clone
```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/fiexpress.git
cd fiexpress
```

### Install Dependencies
```bash
npm install
```

### Development Setup
```bash
# Link the CLI for local testing
npm link

# Test the CLI
fiexpress --help
```

## 🛠️ Development Setup

### Project Structure
```
fiexpress/
├── bin/                    # CLI source code
│   ├── commands/          # Command handlers
│   ├── templates/         # Template generators
│   ├── utils/            # Utility functions
│   └── create-fiexpress.js
├── tests/                 # Test files
├── docs/                  # Documentation
└── examples/              # Example projects
```

### Development Commands
```bash
# Run tests
npm test

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Build for production
npm run build

# Test CLI locally
npm run test:cli
```

## 📝 Contributing Guidelines

### Code Style
- Use ESLint configuration provided
- Follow existing code patterns
- Write clear, self-documenting code
- Use meaningful variable names

### Commit Messages
Follow conventional commits:
```
feat: add Docker support
fix: resolve template cloning issue
docs: update README with new features
test: add unit tests for utils
```

### Branch Naming
```
feature/docker-support
fix/template-cloning
docs/api-documentation
test/coverage-improvement
```

## 🎯 Feature Development

### 1. Planning
- Check existing issues and discussions
- Create a new issue for your feature
- Get feedback from maintainers
- Plan the implementation approach

### 2. Implementation
- Create a feature branch
- Implement the feature following existing patterns
- Add comprehensive tests
- Update documentation

### 3. Testing
- Test your changes thoroughly
- Ensure all existing tests pass
- Add new tests for your feature
- Test with different scenarios

### 4. Documentation
- Update README if needed
- Add feature documentation
- Update examples
- Write clear commit messages

## 🧪 Testing

### Test Structure
```
tests/
├── unit/                 # Unit tests
│   ├── utils.test.js
│   ├── scaffolding.test.js
│   └── generator.test.js
├── integration/          # Integration tests
│   ├── project-creation.test.js
│   └── command-execution.test.js
└── e2e/                 # End-to-end tests
    ├── basic-project.test.js
    └── advanced-features.test.js
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Requirements
- **Unit Tests**: 90% coverage minimum
- **Integration Tests**: All major features
- **E2E Tests**: Critical user workflows
- **Performance Tests**: Large project creation

## 📚 Documentation

### Documentation Types
1. **User Documentation**: README, guides, tutorials
2. **API Documentation**: Command reference, options
3. **Developer Documentation**: Architecture, contributing
4. **Code Documentation**: JSDoc comments, inline docs

### Documentation Standards
- Use clear, concise language
- Include code examples
- Keep documentation up-to-date
- Use consistent formatting

### Documentation Files
```
docs/
├── getting-started.md
├── api-reference.md
├── advanced-usage.md
├── troubleshooting.md
└── architecture.md
```

## 🔄 Pull Request Process

### Before Submitting
- [ ] Fork the repository
- [ ] Create a feature branch
- [ ] Make your changes
- [ ] Add tests for new features
- [ ] Update documentation
- [ ] Run all tests
- [ ] Check linting

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process
1. **Automated Checks**: CI/CD pipeline runs
2. **Code Review**: Maintainers review code
3. **Testing**: Manual testing by reviewers
4. **Approval**: At least 2 approvals required
5. **Merge**: Squash and merge to main

## 🎯 Feature Development Guidelines

### New Commands
When adding new commands:

1. **Create Command File**
```javascript
// bin/commands/new-command.js
export async function handleNewCommand(args) {
  // Implementation
}
```

2. **Register Command**
```javascript
// bin/create-fiexpress.js
import { handleNewCommand } from './commands/new-command.js';

// Add to main() function
if (command === "new-command") {
  await handleNewCommand(args.slice(1));
}
```

3. **Add Help Text**
```javascript
// Update help text in main() function
console.log(`
  npx fiexpress new-command    # Description
`);
```

### New Templates
When adding new templates:

1. **Create Template File**
```javascript
// bin/templates/new-template.js
export function generateNewTemplate(targetRoot, options) {
  // Template generation logic
}
```

2. **Register Template**
```javascript
// bin/scaffolding.js
import { generateNewTemplate } from './templates/new-template.js';

// Add to runPostClone function
if (options.newTemplate) {
  await generateNewTemplate(targetRoot, options);
}
```

### New Utilities
When adding new utilities:

1. **Create Utility File**
```javascript
// bin/utils/new-utility.js
export function newUtilityFunction() {
  // Implementation
}
```

2. **Export from Utils**
```javascript
// bin/utils/index.js
export { newUtilityFunction } from './new-utility.js';
```

## 🐛 Bug Reports

### Before Reporting
- Check existing issues
- Try latest version
- Test with minimal reproduction

### Bug Report Template
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Run command: `fiexpress new test`
2. Select options: TypeScript, PostgreSQL
3. See error: [error message]

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 13.0]
- Node.js: [e.g., 18.17.0]
- FiExpress: [e.g., 2.0.2]

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

### Before Requesting
- Check existing issues
- Search discussions
- Consider if it fits project scope

### Feature Request Template
```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this be implemented?

## Alternatives
Other ways to solve this problem

## Additional Context
Any other relevant information
```

## 🏆 Recognition

### Contributors
- Listed in README
- GitHub contributor graph
- Release notes mention

### Maintainers
- Special GitHub badges
- Direct repository access
- Release management rights

### Enterprise Contributors
- Priority support
- Custom feature development
- Direct communication channel

## 📞 Getting Help

### Community Support
- **GitHub Discussions**: General questions
- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Real-time chat (coming soon)
- **Email**: [maintainer@example.com]

### Development Help
- **Code Review**: Get feedback on your code
- **Mentorship**: Pair programming sessions
- **Documentation**: Architecture and design docs
- **Examples**: Working code samples

## 📋 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior
- Be respectful and inclusive
- Use welcoming language
- Accept constructive criticism
- Focus on what's best for the community

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or inflammatory comments
- Personal attacks
- Inappropriate language or imagery

### Enforcement
- Maintainers will address violations
- Temporary or permanent bans if needed
- Report violations to maintainers

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to FiExpress CLI!** 🚀

**Last Updated**: December 2024  
**Maintainer**: Mehmet Fiskindal  
**Contact**: [GitHub Issues](https://github.com/developersailor/fiexpress/issues)
