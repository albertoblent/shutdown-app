# Frontend Development Guidelines

## Overview

This document provides specific guidelines for frontend development of the Shutdown Routine App. It complements the root repository's CLAUDE.md with frontend-specific practices, testing standards, and development workflows.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: CSS Modules with mobile-first responsive design
- **PWA**: vite-plugin-pwa with Workbox
- **Validation**: Zod for runtime type checking
- **Testing**: Vitest with jsdom environment
- **Linting**: ESLint with TypeScript rules

## Directory Structure

We follow a **feature-based architecture** that promotes separation of concerns, modularity, and maintainability:

```
src/
├── features/           # Feature-specific modules (domain-driven)
│   └── habits/         # Habit management feature
│       ├── api/        # Business logic and data operations
│       │   ├── storage.ts      # CRUD operations
│       │   ├── templates.ts    # Template system
│       │   └── index.ts        # API barrel export
│       ├── components/ # Feature-specific React components
│       │   ├── HabitManager.tsx
│       │   └── index.ts        # Component barrel export
│       ├── __tests__/  # Feature-specific tests
│       │   ├── storage.test.ts
│       │   ├── templates.test.ts
│       │   └── HabitManager.test.tsx
│       └── index.ts    # Feature barrel export
├── shared/             # Shared utilities across features
│   ├── api/            # Core data operations
│   │   ├── storage.ts  # Base localStorage utilities
│   │   └── index.ts    # Shared API barrel export
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Shared custom React hooks
│   └── utils/          # Pure utility functions only
├── types/              # Global TypeScript types and Zod schemas
│   ├── data.ts         # Core data models
│   ├── schemas.ts      # Zod validation schemas
│   └── *.test.ts       # Type and schema tests
├── test/               # Test setup and global test utilities
├── App.tsx             # Main app component
├── App.module.css      # App-level styles
└── main.tsx            # Application entry point
```

### Feature-Based Architecture Principles

**✅ DO - Follow these patterns:**
- **Domain Separation**: Each feature owns its business logic, components, and tests
- **Barrel Exports**: Use `index.ts` files to provide clean public APIs
- **Shared vs Feature**: Put code in `shared/` only if used by multiple features
- **Self-Contained**: Features should be largely independent modules
- **Test Co-location**: Keep tests close to the code they test

**❌ DON'T - Avoid these anti-patterns:**
- **Utils Dumping Ground**: Don't put domain-specific code in `shared/utils/`
- **Circular Dependencies**: Features shouldn't depend on each other directly
- **Leaky Abstractions**: Keep feature internals private, expose through barrel exports
- **Mixed Concerns**: Don't mix business logic with pure utilities

### Adding New Features

When adding a new feature, follow this structure:

```bash
# 1. Create feature directory
mkdir -p src/features/newfeature/{api,components,__tests__}

# 2. Create barrel exports for clean APIs
touch src/features/newfeature/{index.ts,api/index.ts,components/index.ts}

# 3. Add feature-specific business logic
touch src/features/newfeature/api/operations.ts

# 4. Add React components
touch src/features/newfeature/components/FeatureComponent.tsx

# 5. Add comprehensive tests
touch src/features/newfeature/__tests__/{operations.test.ts,FeatureComponent.test.tsx}
```

**Example barrel export structure:**
```typescript
// src/features/newfeature/index.ts
export * from './api'
export * from './components'
export type { FeatureType } from '../../types/data'
```

## Test-Driven Development (TDD)

### Testing Philosophy

- **Test First**: Write tests before implementing features when possible
- **Comprehensive Coverage**: All utility functions require 80%+ test coverage
- **Real Implementation Testing**: Use actual browser APIs (localStorage, crypto) rather than mocks when possible
- **Fast Feedback**: Tests should run quickly and provide clear error messages

### Testing Framework Setup

We use Vitest with jsdom for a Node.js environment that simulates browser APIs:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

### Test Commands

```bash
npm test              # Run all tests in watch mode
npm run test:ui       # Run tests with browser UI
npm run test:coverage # Generate coverage report (single run, no watch)
```

### Test File Organization

Follow the feature-based architecture for test organization:

- **Feature Tests**: Place in `features/{feature}/__tests__/` directory
- **Shared Tests**: Co-locate with shared utilities
- **Global Types**: Keep type tests adjacent to type definitions
- **Naming**: Use `.test.ts` or `.spec.ts` extensions

```
src/
├── features/
│   └── habits/
│       └── __tests__/           # Feature-specific tests
│           ├── storage.test.ts  # Business logic tests
│           ├── templates.test.ts
│           └── HabitManager.test.tsx  # Component tests
├── shared/
│   └── api/
│       └── storage.test.ts      # Shared utility tests
└── types/
    ├── data.test.ts             # Global type tests
    └── schemas.test.ts          # Validation tests
```

**Test Organization Principles:**
- **Feature Isolation**: Each feature's tests live within that feature directory
- **Shared Test Utilities**: Global test helpers go in `src/test/`
- **Mock Co-location**: Feature-specific mocks stay within feature tests
- **Integration Tests**: Cross-feature tests can go in top-level `__tests__/` if needed

### Test Patterns and Best Practices

#### 1. Data Layer Testing

**Test real functionality, not mocks:**
```typescript
// ✅ Good: Test actual localStorage behavior
beforeEach(() => {
  localStorage.clear() // jsdom provides real localStorage
})

// ❌ Avoid: Unnecessary mocking of browser APIs
const mockLocalStorage = { getItem: vi.fn() }
```

**Test validation extensively:**
```typescript
// Test both success and failure cases
describe('validateHabit', () => {
  it('should accept valid habit', () => {
    expect(() => validateHabit(validHabit)).not.toThrow()
  })
  
  it('should reject invalid habit', () => {
    expect(() => validateHabit(invalidHabit)).toThrow()
  })
})
```

#### 2. Component Testing

**Use React Testing Library patterns:**
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('should handle user interaction', async () => {
  const user = userEvent.setup()
  render(<MyComponent />)
  
  await user.click(screen.getByRole('button'))
  expect(screen.getByText('Expected result')).toBeInTheDocument()
})
```

#### 3. Hook Testing

**Test custom hooks in isolation:**
```typescript
import { renderHook } from '@testing-library/react'

it('should manage state correctly', () => {
  const { result } = renderHook(() => useCustomHook())
  expect(result.current.value).toBe(expectedValue)
})
```

### TDD Workflow

1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code quality while keeping tests green
4. **Repeat**: Continue with next piece of functionality

#### Example TDD Cycle

```typescript
// 1. RED: Write failing test
it('should add new habit with generated ID', () => {
  const result = addHabit(newHabitData)
  expect(result.success).toBe(true)
  expect(result.data?.id).toBeDefined()
})

// 2. GREEN: Implement minimal functionality
export const addHabit = (data) => {
  const newHabit = { ...data, id: generateId() }
  return { success: true, data: newHabit }
}

// 3. REFACTOR: Add validation, error handling, etc.
export const addHabit = (data) => {
  try {
    validateHabitInput(data)
    const newHabit = { ...data, id: generateId(), created_at: new Date().toISOString() }
    const saveResult = saveHabits([...existingHabits, newHabit])
    return saveResult.success ? { success: true, data: newHabit } : saveResult
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

## Code Quality Standards

### Coverage Configuration

The coverage thresholds are configured to exclude files that shouldn't be tested:

**Excluded from coverage:**
- `src/vite-env.d.ts` - TypeScript environment declarations
- `src/main.tsx` - Application entry point (difficult to test meaningfully)
- `src/App.tsx` - App shell component (should use integration tests instead)
- `src/utils/pwa.ts` - PWA utility (browser-specific, hard to unit test)

**Coverage thresholds:**
- Functions: 80%
- Lines: 80%
- Statements: 80%
- Branches: 70%

### Pre-commit Checklist

Run these commands before every commit:
```bash
npm run lint         # Fix linting errors
npm run test:coverage # Ensure all tests pass with coverage requirements
npm run build        # Verify production build
```

**Note**: These same checks run automatically in CI/CD, so failures will block deployment.

### CI/CD Integration

Our GitHub Actions workflow automatically runs:

1. **Lint check** - Code quality and style enforcement
2. **Test suite with coverage** - All 66+ tests must pass with 80%+ coverage
3. **Build verification** - TypeScript compilation and Vite build
4. **Bundle size check** - Ensures bundle stays under 100KB gzipped
5. **Coverage upload** - Reports test coverage to Codecov (optional)

Failed tests will **block deployment** to prevent broken code from reaching production.

### TypeScript Guidelines

- **Strict Mode**: Always use TypeScript strict mode
- **Runtime Validation**: Use Zod schemas for data coming from external sources
- **Type Safety**: Prefer type safety over `any` types
- **Interface Design**: Design interfaces to match actual data structures

```typescript
// ✅ Good: Type-safe with runtime validation
const result = safeValidateHabit(unknownData)
if (result.success) {
  // result.data is properly typed as Habit
  console.log(result.data.name)
}

// ❌ Avoid: Unsafe casting
const habit = unknownData as Habit
```

### CSS and Styling

- **CSS Modules**: Use CSS Modules for component styling
- **Mobile First**: Design for mobile, enhance for desktop
- **Accessibility**: Ensure 48px minimum touch targets
- **Dark Theme**: Default to dark theme for evening use

```css
/* App.module.css */
.button {
  min-height: 48px; /* Accessibility requirement */
  min-width: 48px;
  background-color: var(--primary-color);
}

@media (min-width: 768px) {
  .button {
    min-height: 40px; /* Desktop can be smaller */
  }
}
```

### Component Testing Strategy

**Unit Testing**: For utility functions and business logic  
**Integration Testing**: For component interactions and App.tsx  
**E2E Testing**: For full user workflows (future consideration)

**Component testing approach:**
- Test user behavior, not implementation details
- Use `@testing-library/react` for component tests
- Focus on what users see and interact with
- Test error states and edge cases

Example component test structure:
```typescript
describe('HabitCard', () => {
  it('should display habit information', () => {
    render(<HabitCard habit={mockHabit} onComplete={vi.fn()} />)
    expect(screen.getByText(mockHabit.name)).toBeInTheDocument()
  })
  
  it('should call onComplete when button clicked', async () => {
    const onComplete = vi.fn()
    render(<HabitCard habit={mockHabit} onComplete={onComplete} />)
    
    await userEvent.click(screen.getByRole('button'))
    expect(onComplete).toHaveBeenCalledWith(mockHabit.id)
  })
})
```

### Component Guidelines

Follow feature-based component organization and design principles:

#### Component Placement Rules
- **Feature Components**: Place in `features/{feature}/components/` if specific to one feature
- **Shared Components**: Place in `shared/components/` only if used by multiple features
- **Page Components**: Place in top-level for routing and layout
- **Barrel Exports**: Expose components through feature `index.ts` files

#### Component Design Principles
- **Semantic HTML**: Use proper semantic elements
- **Props Interface**: Define clear TypeScript interfaces for props
- **Single Responsibility**: Components should have one clear purpose
- **Composition**: Prefer composition over inheritance
- **Feature Coupling**: Keep feature-specific logic within feature boundaries

```typescript
// src/features/habits/components/HabitCard.tsx
interface HabitCardProps {
  habit: Habit
  onComplete: (habitId: string) => void
  isCompleted: boolean
}

export function HabitCard({ habit, onComplete, isCompleted }: HabitCardProps) {
  return (
    <article className={styles.card}>
      <h3>{habit.name}</h3>
      <p>{habit.atomic_prompt}</p>
      <button onClick={() => onComplete(habit.id)}>
        {isCompleted ? 'Completed' : 'Mark Complete'}
      </button>
    </article>
  )
}

// src/features/habits/components/index.ts - Barrel export
export { HabitCard } from './HabitCard'
export { HabitManager } from './HabitManager'

// Usage in other files
import { HabitCard } from '../features/habits'  // Clean import via barrel
```

#### When to Create Shared Components
Only move components to `shared/` when they meet **ALL** these criteria:
- Used by 2+ different features
- No feature-specific business logic
- Purely presentational or basic interaction
- Unlikely to diverge between features

**Examples:**
- ✅ Shared: `Button`, `Modal`, `Card`, `Input` (generic UI components)
- ❌ Not Shared: `HabitCard`, `TimerDisplay` (feature-specific components)

## Performance Guidelines

### Bundle Size Management

- **Target**: Keep total bundle under 100KB gzipped
- **Monitoring**: Use `vite-bundle-analyzer` to track bundle size
- **Code Splitting**: Implement route-based code splitting
- **Tree Shaking**: Ensure imports are tree-shakeable

### PWA Optimization

- **Service Worker**: Precache critical resources
- **Offline First**: Design for offline functionality
- **Installation**: Provide clear PWA installation prompts

## Development Workflow

### Feature Development

1. **Create Feature Branch**: `feature/issue-#-description`
2. **Write Tests First**: Start with failing tests (TDD)
3. **Implement Feature**: Make tests pass with minimal code
4. **Refactor**: Improve code quality while maintaining green tests
5. **Quality Check**: Run lint, test, and build
6. **Create PR**: Include test coverage and bundle size impact

### Versioning Strategy

We follow semantic versioning (SemVer) for the frontend application:

**Format**: `MAJOR.MINOR.PATCH`

- **MAJOR** (0.x.x → 1.x.x): Breaking changes, major feature releases
- **MINOR** (x.1.x → x.2.x): New features, significant enhancements  
- **PATCH** (x.x.1 → x.x.2): Bug fixes, small improvements

**Current Version**: `0.1.0` - Initial release with data foundation and testing infrastructure

**When to increment:**
- Merge to `main` with new features → increment MINOR
- Hotfixes for bugs → increment PATCH  
- Breaking changes or major milestones → increment MAJOR

### Changelog Maintenance

We maintain a detailed [CHANGELOG.md](./CHANGELOG.md) following [Keep a Changelog](https://keepachangelog.com/) format.

**Release Process:**
1. **During Development**: Add entries to `[Unreleased]` section
2. **Before Release**: Move unreleased items to new version section
3. **Version Bump**: Update package.json, manifest.json, and CHANGELOG.md together
4. **Tag Release**: Create git tag with version number

**Changelog Categories:**
- **Added**: New features and capabilities
- **Changed**: Modifications to existing functionality
- **Fixed**: Bug fixes and error corrections
- **Infrastructure**: CI/CD, deployment, tooling changes
- **Developer Experience**: DX improvements, documentation

**Example Workflow:**
```bash
# 1. Update CHANGELOG.md with new version section
# 2. Update package.json version using npm scripts
npm run version:minor  # or version:patch, version:major

# 3. Update manifest.json version manually to match
# 4. Commit changes
git add CHANGELOG.md package.json public/manifest.json
git commit -m "chore: bump version to 0.2.0"

# 5. Create and push git tag
git tag v0.2.0
git push origin main --tags
```

**Helper Scripts:**
```bash
npm run version:patch  # 0.1.0 → 0.1.1 (bug fixes)
npm run version:minor  # 0.1.0 → 0.2.0 (new features) 
npm run version:major  # 0.1.0 → 1.0.0 (breaking changes)
```

### Git Tags Benefits

**Deployment Tracking**: Know exactly which version is deployed to production  
**Easy Rollbacks**: `git checkout v0.1.0` to revert to stable version  
**Release Management**: GitHub automatically creates releases from tags  
**PWA Updates**: Version changes can trigger app update notifications  
**Issue Correlation**: "Bug appeared after v0.1.5" becomes meaningful  

**Tag Naming Convention**: `v{MAJOR}.{MINOR}.{PATCH}` (e.g., `v0.1.0`, `v1.2.3`)

**Useful Git Tag Commands:**
```bash
git tag                           # List all tags
git tag -l "v0.*"                # List tags matching pattern
git show v0.1.0                  # Show tag details and commit
git checkout v0.1.0              # Switch to tagged version
git push origin --tags           # Push all tags to remote
git tag -d v0.1.0                # Delete local tag
git push origin :refs/tags/v0.1.0 # Delete remote tag
```

### Error Handling Patterns

**Use Result pattern for operations that can fail:**
```typescript
interface StorageResult<T> {
  success: boolean
  data?: T
  error?: string
}

// Usage promotes explicit error handling
const result = getHabits()
if (!result.success) {
  console.error('Failed to load habits:', result.error)
  return
}
// result.data is guaranteed to exist and be typed
```

### Testing Anti-Patterns to Avoid

❌ **Over-mocking**: Don't mock what you don't need to mock  
❌ **Implementation testing**: Don't test implementation details  
❌ **Brittle selectors**: Don't rely on class names or IDs in tests  
❌ **Async pitfalls**: Always use proper async/await patterns  
❌ **Shared test state**: Each test should be independent  

### Common Testing Patterns

✅ **Test user behavior**: Focus on what users can see and do  
✅ **Test error conditions**: Ensure graceful failure handling  
✅ **Test edge cases**: Validate boundary conditions  
✅ **Test accessibility**: Ensure screen reader compatibility  
✅ **Test responsive behavior**: Verify mobile and desktop layouts  

## Debugging Guidelines

### Test Debugging

```typescript
// Use test.only to focus on specific failing tests
it.only('should debug this specific test', () => {
  // Your test code
})

// Use descriptive test names that explain the scenario
it('should save habit to localStorage when valid data provided', () => {
  // Clear what this test validates
})
```

### Browser Debugging

- **React DevTools**: Use for component state inspection
- **Vite DevTools**: Leverage fast HMR for quick iteration
- **Network Tab**: Monitor PWA caching behavior
- **Application Tab**: Inspect localStorage data

## Deployment Considerations

### Production Checks

- **Bundle Analysis**: Review bundle size before deployment
- **PWA Validation**: Test offline functionality
- **Performance Audit**: Run Lighthouse audits
- **Cross-browser Testing**: Verify on multiple browsers and devices

### Environment Configuration

```typescript
// Use Vite's environment variables
const isDev = import.meta.env.DEV
const apiUrl = import.meta.env.VITE_API_URL

// Type environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_VERSION: string
}
```

## Architectural Decision Records

### Feature-Based Architecture Migration (Issue #5)

**Decision**: Migrated from utils-based to feature-based architecture  
**Date**: January 2025  
**Status**: Implemented  

**Context**: 
The original architecture placed all business logic in `src/utils/`, creating a dumping ground for domain-specific code. This violated separation of concerns and made the codebase harder to maintain as features grew.

**Decision**:
Implemented feature-based architecture with the following structure:
- `src/features/{feature}/{api,components,__tests__}/` - Domain-specific modules
- `src/shared/{api,components,utils}/` - Truly shared utilities only
- Barrel exports (`index.ts`) for clean public APIs

**Benefits Realized**:
- ✅ Clear separation between domain logic and shared utilities
- ✅ Self-contained features with their own business logic and tests
- ✅ Easier to locate and modify feature-specific code
- ✅ Scalable pattern for adding new features
- ✅ Reduced coupling between different domains

**Guidelines for Future Development**:
1. **Always ask**: "Is this code specific to one feature or truly shared?"
2. **Default to feature-specific**: Only put code in `shared/` if used by 2+ features
3. **Use barrel exports**: Maintain clean public APIs for each feature
4. **Keep features independent**: Avoid direct dependencies between features

**Example Migration Pattern**:
```typescript
// ❌ Before: Mixed concerns in utils
src/utils/storage.ts           // Contains habits + general storage
src/utils/habitManagement.ts  // Domain-specific code in utils

// ✅ After: Proper separation
src/features/habits/api/storage.ts     // Habit-specific operations
src/features/habits/api/templates.ts   // Habit templates
src/shared/api/storage.ts              // Core storage utilities only
```

**Lesson Learned**: Establish architectural boundaries early and enforce them consistently. The `utils/` directory should only contain pure utility functions, not domain-specific business logic.

---

## Quick Reference

### Essential Commands
```bash
npm run dev         # Start development server
npm test            # Run tests in watch mode
npm run lint        # Check code quality
npm run build       # Build for production
npm run preview     # Preview production build

# Version Management
npm run version:patch  # Bump patch version (bug fixes)
npm run version:minor  # Bump minor version (new features)
npm run version:major  # Bump major version (breaking changes)
```

### Key Dependencies
- **React 19**: Latest React with concurrent features
- **TypeScript 5.8**: Latest TypeScript for type safety
- **Vite 6**: Fast build tool and dev server
- **Vitest 3**: Fast unit testing framework
- **Zod 3**: Runtime type validation
- **@testing-library/react**: Component testing utilities

This frontend development guide ensures we maintain high code quality, comprehensive test coverage, and optimal user experience while building the Shutdown Routine App.