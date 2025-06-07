# Shutdown Routine App - Frontend

A modern Progressive Web App (PWA) built with React and TypeScript that helps users build healthy shutdown routines through habit tracking and daily routine management.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📱 Features

### Habit Management System

- **CRUD Operations**: Create, read, update, and delete habits with validation
- **7-Habit Limit**: Enforced limit to maintain focus and prevent overwhelm
- **Drag & Drop Reordering**: Intuitive habit prioritization through reordering
- **Inline Editing**: Quick habit updates with auto-save on blur
- **Template System**: 3 preset habit collections for quick setup

### Habit Templates

- **Productivity Focus**: Deep work tracking, budget review, exercise
- **Health & Wellness**: Steps, water intake, sleep tracking
- **Work-Life Balance**: Family time, learning, gratitude practice

### User Experience

- **Progressive Web App**: Installable, offline-capable mobile experience
- **Dark Theme**: Optimized for evening use with dark color scheme
- **Mobile-First Design**: Responsive layout with 48px minimum touch targets
- **Accessibility**: Screen reader compatible with semantic HTML

## 🏗️ Architecture

### Feature-Based Organization

```
src/
├── features/           # Feature-specific modules (domain-driven)
│   └── habits/         # Habit management feature
│       ├── api/        # Business logic and data operations
│       ├── components/ # Feature-specific React components
│       ├── __tests__/  # Feature-specific tests
│       └── index.ts    # Feature barrel export
├── shared/             # Shared utilities across features
│   ├── api/            # Core data operations
│   ├── components/     # Reusable UI components (Modal, ConfirmModal)
│   └── utils/          # Pure utility functions only
├── types/              # Global TypeScript types and Zod schemas
└── test/               # Test setup and global test utilities
```

### Key Architectural Principles

- **Domain Separation**: Each feature owns its business logic, components, and tests
- **Barrel Exports**: Clean public APIs through `index.ts` files
- **Shared vs Feature**: Code only goes in `shared/` if used by multiple features
- **Self-Contained**: Features are largely independent modules

## 🧪 Testing

### Test Coverage

- **87.45%** statement coverage
- **80.24%** function coverage
- **148+ comprehensive tests** across all modules
- **Real Implementation Testing**: Uses actual browser APIs instead of mocks

### Test Commands

```bash
npm test              # Run all tests in watch mode
npm run test:ui       # Run tests with browser UI
npm run test:coverage # Generate coverage report
```

### Testing Philosophy

- **Test-Driven Development**: Write tests before implementing features
- **Feature Isolation**: Each feature's tests live within that feature directory
- **Real APIs**: Test actual localStorage and crypto APIs via jsdom
- **User Behavior**: Focus on what users can see and interact with

## 🛠️ Tech Stack

### Core Technologies

- **React 19** with TypeScript for modern UI development
- **Vite 6** for fast build tool and development server
- **CSS Modules** with mobile-first responsive design
- **Zod 3** for runtime type validation and data schemas

### Development Tools

- **Vitest 3** with jsdom environment for unit testing
- **ESLint** with TypeScript rules for code quality
- **Testing Library** for component testing utilities
- **Workbox** for PWA service worker functionality

### Progressive Web App

- **Service Worker**: Precaches critical resources for offline use
- **App Manifest**: Installable app experience with custom icons
- **Responsive Design**: Mobile-optimized with dark theme default
- **Offline Support**: Core functionality works without internet

## 📊 Data Management

### Storage Architecture

- **localStorage**: Client-side persistence with 5MB limit monitoring
- **Zod Validation**: Runtime type checking for all data operations
- **Error Handling**: Comprehensive error recovery with user feedback
- **Data Models**: TypeScript interfaces with validation schemas

### Data Models

```typescript
interface Habit {
  id: string;              // UUID
  name: string;            // Display name
  type: 'boolean' | 'numeric' | 'choice';
  atomic_prompt: string;   // Daily question
  configuration: {...};   // Type-specific settings
  position: number;        // Display order
  is_active: boolean;      // Enable/disable status
  created_at: string;      // ISO timestamp
}
```

### Storage Operations

- **Habits**: CRUD operations with 7-habit limit enforcement
- **Daily Entries**: Day-specific completion tracking
- **Settings**: User preferences and configuration
- **Storage Stats**: Size monitoring and automatic pruning

## 🎨 User Interface

### Component Library

- **HabitManager**: Main habit CRUD interface with drag-and-drop
- **Modal System**: Custom modal components replacing browser dialogs
- **Template Selector**: Preset habit collection loader
- **Form Components**: Inline editing with validation feedback

### Design System

- **Dark Theme**: Default dark color scheme for evening use
- **CSS Modules**: Component-scoped styling with camelCase conversion
- **Mobile-First**: Responsive breakpoints starting from mobile
- **Accessibility**: 48px minimum touch targets, semantic HTML

## ⚡ Performance

### Bundle Optimization

- **Code Splitting**: Vendor chunk separation (React, React-DOM)
- **Tree Shaking**: Dead code elimination via ES modules
- **Bundle Size**: <100KB gzipped target with monitoring
- **PWA Caching**: Aggressive caching for instant loading

### Development Experience

- **Hot Module Replacement**: Instant updates during development
- **TypeScript Strict Mode**: Maximum type safety
- **Pre-commit Hooks**: Automated linting and testing
- **Fast Tests**: Vitest with parallel execution

## 📋 Development Guidelines

### Code Quality Standards

```bash
npm run lint         # ESLint with TypeScript rules
npm run test:coverage # 80%+ coverage requirement
npm run build        # TypeScript compilation check
```

### Commit Standards

- **Conventional Commits**: `type(scope): description` format
- **Atomic Commits**: Single logical change per commit
- **Issue References**: Link commits to GitHub issues
- **Pre-commit Validation**: Automated quality checks

### Feature Development Workflow

1. **Create Feature Branch**: `feature/issue-#-description`
2. **Write Tests First**: Test-driven development approach
3. **Implement Feature**: Make tests pass with minimal code
4. **Quality Check**: Run lint, test, and build commands
5. **Create PR**: Include test coverage and bundle impact

## 🚀 Deployment

### Production Build

```bash
npm run build     # TypeScript compilation + Vite build
npm run preview   # Preview production build locally
```

### Environment Configuration

- **Vite Environment Variables**: Type-safe environment configuration
- **PWA Manifest**: Customizable app metadata and icons
- **Service Worker**: Automatic updates with cache busting

### CI/CD Pipeline

- **GitHub Actions**: Automated testing and deployment
- **Quality Gates**: Tests, linting, and build verification
- **Coverage Reporting**: Codecov integration for coverage tracking
- **Bundle Analysis**: Size monitoring and optimization alerts

## 📚 Documentation

### Development Guides

- **[CLAUDE.md](./CLAUDE.md)**: Comprehensive development guidelines and architectural decisions
- **[CHANGELOG.md](./CHANGELOG.md)**: Detailed release history and feature tracking
- **Test Documentation**: Inline test descriptions and coverage reports

### API Reference

- **Type Definitions**: Complete TypeScript interfaces in `src/types/`
- **Validation Schemas**: Zod schemas for runtime type checking
- **Storage API**: localStorage abstraction with error handling

## 🔧 Configuration Files

### Core Configuration

- **`package.json`**: Dependencies, scripts, and project metadata
- **`vite.config.ts`**: Build configuration, PWA setup, CSS modules
- **`vitest.config.ts`**: Test environment, coverage thresholds
- **`tsconfig.json`**: TypeScript project references and strict mode

### Quality Tools

- **`eslint.config.js`**: ESLint rules for TypeScript and React
- **Coverage Thresholds**: 80% function, 80% statement, 70% branch coverage
- **PWA Configuration**: Service worker, manifest, and offline capabilities

## 📈 Version History

**Current Version**: 0.1.0

### Recent Updates

- ✅ **Habit Management System**: Complete CRUD with 7-habit limit
- ✅ **Template System**: 3 preset habit collections
- ✅ **Modal System**: Custom dialogs with focus management
- ✅ **Comprehensive Testing**: 148+ tests with 80%+ coverage
- ✅ **Feature-Based Architecture**: Domain-driven code organization

### Upcoming Features

- Timer Integration: Shutdown routine timing and progress tracking
- Data Export: CSV/JSON export for habit completion data
- Notifications: PWA push notifications for routine reminders
- Analytics: Habit completion trends and insights

## 🤝 Contributing

### Getting Started

1. **Clone Repository**: `git clone [repo-url]`
2. **Install Dependencies**: `npm install`
3. **Read Guidelines**: Review `CLAUDE.md` for development standards
4. **Run Tests**: `npm test` to verify setup

### Development Standards

- **Feature-Based Architecture**: Keep domain logic within feature directories
- **Test-Driven Development**: Write tests before implementation
- **Type Safety**: Use TypeScript strict mode with runtime validation
- **Mobile-First**: Design for mobile, enhance for desktop

### Pull Request Process

1. **Create Feature Branch**: Follow naming convention `feature/issue-#-description`
2. **Write Tests**: Ensure 80%+ coverage for new functionality
3. **Update Documentation**: Include relevant documentation updates
4. **Quality Checks**: Pass all lint, test, and build requirements

## 📄 License

This project is part of the Shutdown Routine App ecosystem. See the main repository for license information.

## 🔗 Related Documentation

- **[Main Repository](../README.md)**: Project overview and setup instructions
- **[Planning Documents](../docs/planning/)**: Technical architecture and roadmap
- **[Testing Guide](../docs/user-testing/)**: Manual testing procedures

---

Built with ❤️ using React, TypeScript, and modern web technologies for creating healthy shutdown routines.
