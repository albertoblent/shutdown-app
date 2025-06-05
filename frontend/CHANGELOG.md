# Changelog

All notable changes to the Shutdown Routine frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Testing Framework**: Comprehensive Vitest setup with 66 unit tests achieving 92%+ coverage
- **Test Configuration**: Coverage thresholds, proper file exclusions, and CI integration
- **Version Management**: Semantic versioning with npm scripts and git tags
- **Changelog Process**: Structured changelog following Keep a Changelog format
- **CI/CD Testing**: GitHub Actions integration with test coverage enforcement
- **Frontend Guidelines**: Complete development workflow documentation in CLAUDE.md

### Infrastructure

- **Coverage Enforcement**: 80%+ thresholds for functions/lines/statements, 70% for branches
- **Quality Pipeline**: Pre-commit checks with lint + test + build verification
- **Git Tags**: Version tracking with `v0.1.0` baseline tag established
- **Test Exclusions**: Proper coverage configuration excluding App.tsx, main.tsx, vite-env.d.ts

### Developer Experience

- **TDD Workflow**: Test-driven development practices established
- **Helper Scripts**: `npm run version:patch/minor/major` for version bumps
- **Documentation**: Clear separation between changelog (retrospective) and issues (planning)

## [0.1.0] - 2025-06-05

### Added

- **Data Foundation**: Complete TypeScript data models and Zod validation schemas
- **Storage Layer**: localStorage utilities with comprehensive error handling and CRUD operations
- **Testing Infrastructure**: Vitest framework with 66 comprehensive unit tests achieving 92%+ coverage
- **PWA Configuration**: Service worker, manifest, and offline-first capabilities
- **CI/CD Pipeline**: GitHub Actions workflow with automated testing, linting, and deployment
- **Build Optimization**: Bundle size monitoring and code splitting with <100KB target
- **Development Workflow**: TDD practices, ESLint configuration, and quality gates
- **Type Safety**: Strict TypeScript configuration with runtime validation
- **App Shell**: Basic React application structure with dark theme and responsive design
- **Documentation**: Comprehensive development guidelines in frontend/CLAUDE.md

### Infrastructure

- **Deployment**: Fly.io hosting with custom domain (shutdown.lobel.dev)
- **Domain**: Cloudflare DNS configuration with SSL certificates
- **Monitoring**: Bundle size tracking and coverage reporting
- **Security**: CSP headers and PWA security best practices

### Technical Specifications

- React 19 with TypeScript 5.8
- Vite 6 build system with HMR
- CSS Modules for component styling
- Zod 3 for runtime validation
- Vitest 3 for unit testing with jsdom
- PWA with Workbox service worker

### Developer Experience

- Test-driven development (TDD) workflow
- Pre-commit quality checks (lint + test + build)
- Coverage thresholds enforcement (80%+ for utilities)
- Fast development server with hot reload
- Comprehensive error handling patterns

## Release Notes

### v0.1.0 - Foundation Release

This initial release establishes the complete development infrastructure and data foundation for the Shutdown Routine app. While the user interface is minimal (app shell only), the backend systems are production-ready with comprehensive test coverage and robust error handling.

**Key Achievements:**

- 🧪 **66 unit tests** with 92% coverage
- 🏗️ **Complete data layer** with validation
- 🚀 **Production deployment** pipeline
- 📱 **PWA capabilities** for mobile use
- 🔒 **Type-safe** development environment

---

## Changelog Guidelines

When updating this changelog:

### Version Format

- **MAJOR.MINOR.PATCH** following semantic versioning
- Date format: YYYY-MM-DD

### Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
- **Infrastructure**: Deployment, CI/CD, tooling changes
- **Developer Experience**: DX improvements, tooling, documentation

### Guidelines

- Keep entries concise but descriptive
- Use present tense ("Add feature" not "Added feature")
- Group related changes together
- Link to issues/PRs when relevant
- Include breaking changes clearly
- Add technical details for significant changes

### Example Entry Format

```markdown
## [0.2.0] - 2025-06-10

### Added
- Habit management interface with CRUD operations (#5)
- Habit type validation (boolean, numeric, choice)
- Drag-and-drop habit reordering
- Habit configuration modal with atomic prompts

### Changed
- Storage utilities now support habit position updates
- App navigation updated with habit management tab

### Fixed
- localStorage quota exceeded error handling
- Habit validation edge cases for numeric ranges

### Infrastructure
- Bundle size optimization reducing gzipped size by 5KB
- Test coverage increased to 95% with habit management tests
```
