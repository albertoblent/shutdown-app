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

```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── pages/              # Page-level components
├── types/              # TypeScript types and Zod schemas
├── utils/              # Utility functions and business logic
├── test/               # Test setup and global test utilities
├── App.tsx             # Main app component
├── App.module.css      # App-level styles
└── main.tsx            # Application entry point
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

- **Co-location**: Test files should be adjacent to source files
- **Naming**: Use `.test.ts` or `.spec.ts` extensions
- **Structure**: Group tests by functionality, not by test type

```
src/
├── types/
│   ├── data.ts
│   ├── data.test.ts
│   ├── schemas.ts
│   └── schemas.test.ts
└── utils/
    ├── storage.ts
    └── storage.test.ts
```

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

- **Semantic HTML**: Use proper semantic elements
- **Props Interface**: Define clear TypeScript interfaces for props
- **Single Responsibility**: Components should have one clear purpose
- **Composition**: Prefer composition over inheritance

```typescript
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
```

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