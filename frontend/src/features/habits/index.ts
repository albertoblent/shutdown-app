/**
 * Habits feature barrel export
 * Provides clean public API for habits functionality
 */

// Components
export { HabitManager } from './components/HabitManager';

// API
export * from './api/storage';
export * from './api/templates';

// Types (re-export from shared)
export type { Habit } from '../../types/data';