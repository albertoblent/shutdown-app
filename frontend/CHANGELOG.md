# Changelog

All notable changes to the Shutdown Routine frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Automatic Daily Habit Reset**: Implements date change detection with automatic habit reset at midnight (#38)
- **Reset Notification System**: Visual feedback component showing users when daily reset occurs
- **Date Change Detection**: Interval-based checking every 60 seconds to detect when date changes
- **Page Visibility Handlers**: Event listeners for tab focus/return scenarios to trigger date checks
- **Habit Management System**: Complete CRUD operations for habits with 7-habit limit enforcement
- **Habit Templates**: 3 preset templates (Productivity Focus, Health & Wellness, Work-Life Balance)
- **Habit Manager Component**: React component with inline editing, drag-and-drop reordering, and template loading
- **Modal System**: Custom Modal and ConfirmModal components replacing browser dialogs for better UX
- **Comprehensive Testing**: 148 total tests with feature-specific test organization and 80%+ function coverage

### Fixed

- **Habit Persistence Issue**: Fixed habit completion state persisting across days when app stays open overnight (#38)
- **Date Change Detection**: Dashboard now automatically refreshes when date changes vs old behavior of only loading on mount
- **Timezone Handling**: Graceful handling of timezone changes during overnight app usage

### Changed

- **Dashboard Component**: Enhanced with date change detection, automatic data reloading, and cleanup mechanisms
- **User Experience**: Habits now automatically reset at midnight with clear visual feedback
- **Architecture**: Migrated from utils-based to feature-based architecture for better separation of concerns
- **File Organization**: Implemented `src/features/{feature}/{api,components,__tests__}/` structure
- **Import Structure**: Added barrel exports for clean public APIs
- **User Interface**: Replaced browser confirm dialogs with custom modal components for consistent styling

### Developer Experience

- **Modal Testing**: Added 50+ comprehensive tests for Modal and ConfirmModal components
- **Focus Management Testing**: Extensive keyboard navigation and accessibility test coverage
- **User Interaction Testing**: Complete test suite for loading states, variants, and error handling
- **Test Organization**: Modal tests organized in `shared/components/__tests__/` following architecture

### Infrastructure

- **Documentation**: Updated CLAUDE.md files with feature-based architecture guidelines
- **Architectural Decision Records**: Documented migration rationale and future development patterns
- **Test Coverage**: Achieved 80.24% function coverage, passing CI/CD quality gates
- **Build Configuration**: Excluded test files from production TypeScript build for cleaner compilation
- **Coverage Configuration**: Optimized to exclude barrel export files from coverage calculations

## [0.1.1] - 2025-06-05

### Added

- **Coverage Reporting**: Codecov integration setup documentation and instructions
- **Documentation**: README badge displaying test coverage percentage

### Infrastructure

- **Coverage Monitoring**: Documentation for Codecov dashboard and PR integration
- **Badge Integration**: Codecov coverage badge for repository visibility

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
