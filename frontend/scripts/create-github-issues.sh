#!/bin/bash

# Script to create GitHub issues from taskmaster tasks

echo "Creating GitHub issues for Phase 1 MVP tasks..."

# Task 1: TypeScript Configuration
gh issue create \
  --title "[Frontend] Complete TypeScript Configuration and Project Foundation" \
  --body "## Description
Finalize TypeScript configuration and establish core project structure with proper build tooling

## Details
Complete the TypeScript setup that's already in progress. Configure tsconfig.json with strict mode enabled, set up proper folder structure (/src/components, /src/utils, /src/types, /src/styles). Configure Vite with TypeScript support, tree shaking, and code splitting. Set up CSS Modules configuration. Install and configure essential dev dependencies: @types/react@^18.2.0, @types/react-dom@^18.2.0, typescript@^5.3.0. Ensure bundle size target <100KB gzipped is achievable with current setup.

## Acceptance Criteria
- [ ] TypeScript compilation with no errors
- [ ] Vite dev server startup time <1s
- [ ] Bundle size analysis with vite-bundle-analyzer shows <100KB gzipped
- [ ] Hot reload works correctly

## Subtasks
- [ ] Configure TypeScript with strict mode
- [ ] Establish project folder structure
- [ ] Install and configure TypeScript dependencies
- [ ] Configure Vite with TypeScript support
- [ ] Set up CSS Modules configuration

## Test Strategy
Verify TypeScript compilation with no errors, test Vite dev server startup time <1s, validate bundle size analysis with vite-bundle-analyzer, ensure hot reload works correctly

## Phase
Phase 1 - MVP Core Shutdown Routine" \
  --label "Phase 1" --label "frontend" --label "P1-high"

# Task 2: PWA Configuration
gh issue create \
  --title "[Frontend] Implement PWA Configuration and Service Worker" \
  --body "## Description
Set up Progressive Web App capabilities with manifest and service worker for offline functionality

## Details
Create manifest.json with app metadata (name: 'Shutdown Routine', theme_color: '#000000', background_color: '#000000', display: 'standalone', start_url: '/'). Implement basic service worker using Workbox 7.0+ for caching strategies. Configure Vite PWA plugin (vite-plugin-pwa@^0.17.0) with generateSW strategy. Set up install prompt handling with beforeinstallprompt event. Ensure HTTPS requirement is documented for deployment. Configure 48px minimum touch targets as per PWA requirements.

## Acceptance Criteria
- [ ] PWA installation works on Chrome/Safari
- [ ] Offline functionality verified
- [ ] Lighthouse PWA audit score >90
- [ ] Install prompt works on mobile devices

## Subtasks
- [ ] Create manifest.json file
- [ ] Implement service worker with Workbox
- [ ] Configure Vite PWA plugin
- [ ] Implement install prompt handling
- [ ] Document deployment requirements and finalize PWA compliance

## Test Strategy
Test PWA installation on Chrome/Safari, verify offline functionality, validate manifest with Lighthouse PWA audit, test install prompt on mobile devices

## Dependencies
Depends on: Task 1 (TypeScript Configuration)

## Phase
Phase 1 - MVP Core Shutdown Routine" \
  --label "Phase 1" --label "frontend" --label "P1-high"

# Task 3: localStorage Utilities
gh issue create \
  --title "[Frontend] Create localStorage Utilities and Data Models" \
  --body "## Description
Build robust localStorage wrapper with TypeScript interfaces for all data models

## Details
Create TypeScript interfaces for Habit, DailyEntry, and Settings models as specified in PRD. Implement localStorage utility functions with error handling and data validation using Zod@^3.22.0 for runtime type checking. Create storage keys constants: 'shutdown_habits', 'shutdown_entries_YYYY-MM-DD', 'shutdown_settings', 'shutdown_last_export'. Implement data size monitoring to track 5MB localStorage limit. Add automatic data pruning for entries older than 90 days. Include UUID generation using crypto.randomUUID() for habit IDs.

## Acceptance Criteria
- [ ] All CRUD operations work correctly
- [ ] Data validation catches invalid inputs
- [ ] Storage limit warnings trigger appropriately
- [ ] Data pruning removes old entries correctly

## Subtasks
- [ ] Define TypeScript Interfaces for Data Models
- [ ] Implement Zod Schemas for Runtime Validation
- [ ] Develop LocalStorage Utility Functions with Error Handling
- [ ] Implement Data Size Monitoring and Automatic Pruning
- [ ] Integrate UUID Generation for Habit IDs

## Test Strategy
Unit tests for CRUD operations, test data validation with invalid inputs, verify storage limit warnings, test data pruning logic with mock old entries

## Dependencies
Depends on: Task 1 (TypeScript Configuration)

## Phase
Phase 1 - MVP Core Shutdown Routine" \
  --label "Phase 1" --label "frontend" --label "P1-high"

# Task 4: Core UI Components
gh issue create \
  --title "[Frontend] Build Core UI Components and Dark Theme" \
  --body "## Description
Create reusable UI components with mobile-first responsive design and dark theme

## Details
Implement CSS Modules with dark theme variables. Create core components: HabitCheckbox (boolean habits), NumberInput (with +/- buttons), HabitList container. Use CSS custom properties for theming. Implement mobile-first responsive design with 48px minimum touch targets. Use CSS Grid/Flexbox for layouts. Implement high contrast colors for accessibility. No external UI libraries - build custom components to keep bundle <100KB. Use CSS-in-JS alternative or CSS Modules for component styling.

## Acceptance Criteria
- [ ] Visual regression tests pass on mobile/desktop
- [ ] Accessibility audit with axe-core passes
- [ ] Touch targets meet 48px minimum on mobile devices
- [ ] Dark theme contrast ratios meet WCAG standards

## Subtasks
- [ ] Set Up Theming System with CSS Custom Properties
- [ ] Configure CSS Modules for Component Styling
- [ ] Develop Core UI Components
- [ ] Implement Mobile-First Responsive Design
- [ ] Optimize Bundle Size and Remove External UI Libraries

## Test Strategy
Visual regression testing on mobile/desktop, accessibility audit with axe-core, test touch targets on actual mobile devices, validate dark theme contrast ratios

## Dependencies
Depends on: Task 1 (TypeScript Configuration)

## Phase
Phase 1 - MVP Core Shutdown Routine" \
  --label "Phase 1" --label "frontend" --label "P2-medium"

# Task 5: Habit Management
gh issue create \
  --title "[Frontend] Implement Habit Management System" \
  --body "## Description
Build habit CRUD operations with up to 7 habits limit and preset templates

## Details
Create habit management functions: addHabit(), editHabit(), deleteHabit(), reorderHabits(). Implement 7-habit limit validation. Create 3 preset templates: 'Productivity Focus' (deep work hours, budget reviewed, exercise), 'Health & Wellness' (steps, water intake, sleep hours), 'Work-Life Balance' (family time, learning, gratitude). Add inline editing with auto-save on blur. Implement drag-and-drop reordering using native HTML5 drag API. Store habits with position field for ordering. Include habit type validation (boolean/numeric).

## Acceptance Criteria
- [ ] Habit limit (7) is enforced
- [ ] Preset templates load correctly
- [ ] Inline editing auto-saves on blur
- [ ] Drag-and-drop works on desktop and touch devices

## Subtasks
- [ ] Implement Core CRUD Operations
- [ ] Implement Habit Validation and Limits
- [ ] Create Preset Habit Templates
- [ ] Implement Inline Editing with Auto-Save
- [ ] Implement Drag-and-Drop Reordering

## Test Strategy
Test habit limit enforcement, validate preset template loading, test inline editing auto-save, verify drag-and-drop on touch devices

## Dependencies
Depends on: Task 3 (localStorage Utilities), Task 4 (Core UI Components)

## Phase
Phase 1 - MVP Core Shutdown Routine" \
  --label "Phase 1" --label "frontend" --label "P1-high"

# Task 6: Daily Entry Interface
gh issue create \
  --title "[Frontend] Build Daily Entry Interface and Auto-save" \
  --body "## Description
Create the core daily shutdown interface with real-time auto-save functionality

## Details
Build single-screen interface displaying all habits for today. Implement auto-save on every interaction using debounced localStorage writes (300ms delay). Create entry state management with React useState/useReducer. Add visual feedback for completed habits (checkmarks, progress indicators). Implement completion detection when all habits are marked. Store entries with ISO timestamp using new Date().toISOString(). Add optimistic UI updates for instant feedback. Handle edge cases like rapid clicking and network interruptions.

## Acceptance Criteria
- [ ] Auto-save works with rapid interactions
- [ ] Completion detection is accurate
- [ ] Performance is smooth on slow devices
- [ ] Timestamp storage uses correct ISO format

## Subtasks
- [ ] Design Daily Habits Interface
- [ ] Implement Entry State Management
- [ ] Develop Debounced Auto-save Logic
- [ ] Handle Edge Cases and Error States
- [ ] Detect and Indicate Completion

## Test Strategy
Test auto-save functionality with rapid interactions, verify completion detection accuracy, test with slow devices for performance, validate timestamp storage format

## Dependencies
Depends on: Task 4 (Core UI Components), Task 5 (Habit Management)

## Phase
Phase 1 - MVP Core Shutdown Routine" \
  --label "Phase 1" --label "frontend" --label "P1-high"

# Task 7: Date Navigation
gh issue create \
  --title "[Frontend] Implement Today/Yesterday Toggle and Date Navigation" \
  --body "## Description
Add ability to complete yesterday's habits with proper date handling and validation

## Details
Create date navigation component with Today/Yesterday toggle. Implement date validation to prevent editing beyond yesterday using Date.getTime() comparisons. Add visual differentiation for past entries (muted colors, 'Yesterday' label). Update URL state with date parameter for bookmarking. Handle timezone edge cases using local date calculations. Implement retroactive streak updates when yesterday's habits are completed. Add confirmation dialog for editing past entries.

## Acceptance Criteria
- [ ] Date boundary validation works correctly
- [ ] Timezone handling works across different locales
- [ ] Retroactive streak calculations are accurate
- [ ] URL state management allows bookmarking

## Subtasks
- [ ] Create Today/Yesterday Toggle Component
- [ ] Implement Date Validation Logic
- [ ] Add Visual Differentiation for Past Entries
- [ ] Implement URL State Management with Date Parameter
- [ ] Develop Retroactive Streak Updates

## Test Strategy
Test date boundary validation, verify timezone handling across different locales, test retroactive streak calculations, validate URL state management

## Dependencies
Depends on: Task 6 (Daily Entry Interface)

## Phase
Phase 1 - MVP Core Shutdown Routine" \
  --label "Phase 1" --label "frontend" --label "P2-medium"

# Task 8: Streak Visualization
gh issue create \
  --title "[Frontend] Build Streak Calculation and Visualization" \
  --body "## Description
Implement streak logic with 7-day visualization and performance optimization

## Details
Create streak calculation algorithm that counts consecutive days from localStorage entries. Implement 7-day dot visualization (complete/incomplete indicators). Optimize calculations for performance using memoization with React.useMemo(). Handle edge cases: missed days reset streaks, partial completions, timezone changes. Create streak display component showing current streak number and visual history. Implement efficient date range queries to avoid loading all historical data. Cache calculations to prevent recalculation on every render.

## Acceptance Criteria
- [ ] Streak algorithm handles all edge cases correctly
- [ ] Performance remains smooth with 90 days of data
- [ ] Edge cases like daylight saving time are handled
- [ ] Visual representation is accurate

## Subtasks
- [ ] Design Streak Calculation Algorithm
- [ ] Implement 7-Day Dot Visualization Component
- [ ] Optimize Streak Calculations with Memoization
- [ ] Implement Efficient Date Range Queries and Caching
- [ ] Build Streak Display Component

## Test Strategy
Unit tests for streak algorithm with various scenarios, performance testing with 90 days of mock data, test edge cases like daylight saving time, verify visual accuracy

## Dependencies
Depends on: Task 6 (Daily Entry Interface)

## Phase
Phase 1 - MVP Core Shutdown Routine" \
  --label "Phase 1" --label "frontend" --label "P2-medium"

# Task 9: Completion Animation
gh issue create \
  --title "[Frontend] Add Completion Animation and Shutdown Ritual" \
  --body "## Description
Create satisfying completion experience with CSS animations and positive reinforcement

## Details
Implement completion detection when all daily habits are marked complete. Create CSS animation using @keyframes for celebration effect (confetti, checkmark pulse, or color transition). Display 'Shutdown complete!' message with today's summary stats. Use requestAnimationFrame for smooth animations. Keep animations lightweight (<16ms execution time). Add sound effect option using Web Audio API (optional, user-controlled). Implement daily reset logic for next day. Store completion timestamp for analytics.

## Acceptance Criteria
- [ ] Animation performs well on low-end devices
- [ ] Completion detection is 100% accurate
- [ ] Daily reset functionality works correctly
- [ ] Animations have accessibility options

## Subtasks
- [ ] Implement Completion Detection
- [ ] Create CSS Animation
- [ ] Display Completion Message and Stats
- [ ] Optimize Animation Performance
- [ ] Implement Daily Reset and Analytics

## Test Strategy
Test animation performance on low-end devices, verify completion detection accuracy, test daily reset functionality, validate animation accessibility options

## Dependencies
Depends on: Task 6 (Daily Entry Interface), Task 8 (Streak Visualization)

## Phase
Phase 1 - MVP Core Shutdown Routine" \
  --label "Phase 1" --label "frontend" --label "P3-low"

# Task 10: Data Export/Import
gh issue create \
  --title "[Frontend] Implement Data Export/Import and Backup System" \
  --body "## Description
Build manual backup system with JSON export/import and data validation

## Details
Create export function that generates JSON file with all localStorage data (habits, entries, settings). Implement file download using Blob API and URL.createObjectURL(). Build import functionality with file input and JSON validation using Zod schemas. Add data merge strategy for importing partial data. Implement clear data option with confirmation dialog. Create backup reminder system based on last export date. Add data validation to prevent corruption during import. Include export timestamp and version metadata.

## Acceptance Criteria
- [ ] Export/import works with large datasets
- [ ] JSON schema validation prevents corruption
- [ ] Backup reminder triggers at appropriate times
- [ ] File download works on all major browsers

## Subtasks
- [ ] Implement JSON Export Functionality
- [ ] Build JSON Import and Validation System
- [ ] Implement Data Merge and Overwrite Strategies
- [ ] Add Data Clearing and Confirmation Dialog
- [ ] Create Backup Reminder and Validation System

## Test Strategy
Test export/import with large datasets, validate JSON schema compliance, test data corruption scenarios, verify backup reminder timing, test file download on various browsers

## Dependencies
Depends on: Task 3 (localStorage Utilities), Task 5 (Habit Management)

## Phase
Phase 1 - MVP Core Shutdown Routine" \
  --label "Phase 1" --label "frontend" --label "P2-medium"

echo "All issues created successfully!"