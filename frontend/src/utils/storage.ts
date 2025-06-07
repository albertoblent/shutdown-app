/**
 * localStorage utilities with error handling and data validation
 * Provides CRUD operations for all data models with Zod validation
 */

import type { Habit, DailyEntry, Settings } from '../types/data';
import {
  STORAGE_KEYS,
  getEntryKey,
  parseDateFromEntryKey,
  generateId,
  formatDate,
  createDefaultSettings,
} from '../types/data';
import {
  validateHabit,
  validateDailyEntry,
  validateSettings,
  validateHabitsArray,
  safeValidateDailyEntry,
  safeValidateSettings,
  safeValidateHabitsArray,
} from '../types/schemas';

// Storage operation results
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Preset habit templates
export interface HabitTemplate {
  name: string;
  description: string;
  habits: Omit<Habit, 'id' | 'created_at' | 'position'>[];
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    name: 'Productivity Focus',
    description: 'Deep work, financial awareness, and physical health',
    habits: [
      {
        name: 'Deep Work Hours',
        type: 'numeric',
        atomic_prompt: 'How many hours of focused, deep work did you complete today?',
        configuration: {
          numeric_unit: 'hours',
          numeric_range: [0, 12],
        },
        is_active: true,
      },
      {
        name: 'Budget Reviewed',
        type: 'boolean',
        atomic_prompt: 'Did you check your budget or financial situation today?',
        configuration: {},
        is_active: true,
      },
      {
        name: 'Exercise Completed',
        type: 'boolean',
        atomic_prompt: 'Did you complete at least 30 minutes of physical exercise?',
        configuration: {},
        is_active: true,
      },
    ],
  },
  {
    name: 'Health & Wellness',
    description: 'Physical health tracking and wellness metrics',
    habits: [
      {
        name: 'Daily Steps',
        type: 'numeric',
        atomic_prompt: 'How many steps did you take today?',
        configuration: {
          numeric_unit: 'steps',
          numeric_range: [0, 30000],
        },
        is_active: true,
      },
      {
        name: 'Water Intake',
        type: 'numeric',
        atomic_prompt: 'How many glasses of water did you drink today?',
        configuration: {
          numeric_unit: 'glasses',
          numeric_range: [0, 15],
        },
        is_active: true,
      },
      {
        name: 'Sleep Hours',
        type: 'numeric',
        atomic_prompt: 'How many hours of sleep did you get last night?',
        configuration: {
          numeric_unit: 'hours',
          numeric_range: [0, 12],
        },
        is_active: true,
      },
    ],
  },
  {
    name: 'Work-Life Balance',
    description: 'Personal relationships, growth, and mindfulness',
    habits: [
      {
        name: 'Family Time',
        type: 'boolean',
        atomic_prompt: 'Did you spend quality time with family or loved ones today?',
        configuration: {},
        is_active: true,
      },
      {
        name: 'Learning Activity',
        type: 'boolean',
        atomic_prompt: 'Did you engage in learning something new today?',
        configuration: {},
        is_active: true,
      },
      {
        name: 'Gratitude Practice',
        type: 'boolean',
        atomic_prompt: 'Did you practice gratitude or mindfulness today?',
        configuration: {},
        is_active: true,
      },
    ],
  },
];

export interface StorageStats {
  totalSize: number;
  entryCount: number;
  oldestEntry?: string;
  newestEntry?: string;
  habitsCount: number;
}

// Storage error types
export class StorageError extends Error {
  constructor(message: string, public readonly operation: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Storage size limits (5MB = 5 * 1024 * 1024 bytes)
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;
const STORAGE_WARNING_THRESHOLD = 0.8; // 80%

// Helper functions
const safeParseJSON = <T>(json: string): T | null => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const calculateStorageSize = (): number => {
  let totalSize = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  return totalSize;
};

const isStorageApproachingLimit = (): boolean => {
  return calculateStorageSize() > STORAGE_LIMIT_BYTES * STORAGE_WARNING_THRESHOLD;
};

// Habits CRUD operations
export const getHabits = (): StorageResult<Habit[]> => {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!json) {
      return { success: true, data: [] };
    }

    const parsed = safeParseJSON(json);
    if (!parsed) {
      throw new StorageError('Invalid JSON format', 'getHabits');
    }

    const validation = safeValidateHabitsArray(parsed);
    if (!validation.success) {
      throw new StorageError(`Invalid habits data: ${validation.error.message}`, 'getHabits');
    }

    return { success: true, data: validation.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting habits',
    };
  }
};

export const saveHabits = (habits: Habit[]): StorageResult<void> => {
  try {
    validateHabitsArray(habits);
    
    if (isStorageApproachingLimit()) {
      console.warn('Storage approaching limit, consider pruning old data');
    }

    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving habits',
    };
  }
};

export const loadHabitTemplate = (templateName: string): StorageResult<Habit[]> => {
  try {
    const template = HABIT_TEMPLATES.find(t => t.name === templateName);
    if (!template) {
      throw new StorageError(`Template '${templateName}' not found`, 'loadHabitTemplate');
    }

    const habitsResult = getHabits();
    if (!habitsResult.success) {
      throw new StorageError(habitsResult.error || 'Failed to get existing habits', 'loadHabitTemplate');
    }

    const existingHabits = habitsResult.data || [];
    
    // Check if adding template would exceed limit
    if (existingHabits.length + template.habits.length > 7) {
      throw new StorageError(
        `Cannot load template: would exceed 7 habit limit (${existingHabits.length + template.habits.length} total)`,
        'loadHabitTemplate'
      );
    }

    const newHabits: Habit[] = template.habits.map((habitTemplate, index) => ({
      ...habitTemplate,
      id: generateId(),
      created_at: new Date().toISOString(),
      position: existingHabits.length + index,
    }));

    // Validate all new habits
    newHabits.forEach(validateHabit);

    const allHabits = [...existingHabits, ...newHabits];
    const saveResult = saveHabits(allHabits);
    if (!saveResult.success) {
      throw new StorageError(saveResult.error || 'Failed to save template habits', 'loadHabitTemplate');
    }

    return { success: true, data: newHabits };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error loading template',
    };
  }
};

export const addHabit = (habit: Omit<Habit, 'id' | 'created_at' | 'position'>): StorageResult<Habit> => {
  try {
    const habitsResult = getHabits();
    if (!habitsResult.success) {
      throw new StorageError(habitsResult.error || 'Failed to get existing habits', 'addHabit');
    }

    const habits = habitsResult.data || [];
    
    // Enforce 7-habit limit
    if (habits.length >= 7) {
      throw new StorageError('Maximum of 7 habits allowed', 'addHabit');
    }

    const newHabit: Habit = {
      ...habit,
      id: generateId(),
      created_at: new Date().toISOString(),
      position: habits.length,
    };

    validateHabit(newHabit);
    habits.push(newHabit);

    const saveResult = saveHabits(habits);
    if (!saveResult.success) {
      throw new StorageError(saveResult.error || 'Failed to save habit', 'addHabit');
    }

    return { success: true, data: newHabit };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error adding habit',
    };
  }
};

export const editHabit = (habitId: string, updates: Partial<Omit<Habit, 'id' | 'created_at'>>): StorageResult<Habit> => {
  try {
    const habitsResult = getHabits();
    if (!habitsResult.success) {
      throw new StorageError(habitsResult.error || 'Failed to get existing habits', 'editHabit');
    }

    const habits = habitsResult.data || [];
    const habitIndex = habits.findIndex(h => h.id === habitId);
    
    if (habitIndex === -1) {
      throw new StorageError('Habit not found', 'editHabit');
    }

    const updatedHabit: Habit = {
      ...habits[habitIndex],
      ...updates,
    };

    validateHabit(updatedHabit);
    habits[habitIndex] = updatedHabit;

    const saveResult = saveHabits(habits);
    if (!saveResult.success) {
      throw new StorageError(saveResult.error || 'Failed to save updated habit', 'editHabit');
    }

    return { success: true, data: updatedHabit };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error editing habit',
    };
  }
};

export const deleteHabit = (habitId: string): StorageResult<void> => {
  try {
    const habitsResult = getHabits();
    if (!habitsResult.success) {
      throw new StorageError(habitsResult.error || 'Failed to get existing habits', 'deleteHabit');
    }

    const habits = habitsResult.data || [];
    const habitIndex = habits.findIndex(h => h.id === habitId);
    
    if (habitIndex === -1) {
      throw new StorageError('Habit not found', 'deleteHabit');
    }

    // Remove the habit
    habits.splice(habitIndex, 1);
    
    // Reorder positions to fill the gap
    habits.forEach((habit, index) => {
      habit.position = index;
    });

    const saveResult = saveHabits(habits);
    if (!saveResult.success) {
      throw new StorageError(saveResult.error || 'Failed to save after deletion', 'deleteHabit');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting habit',
    };
  }
};

export const reorderHabits = (habitIds: string[]): StorageResult<Habit[]> => {
  try {
    const habitsResult = getHabits();
    if (!habitsResult.success) {
      throw new StorageError(habitsResult.error || 'Failed to get existing habits', 'reorderHabits');
    }

    const habits = habitsResult.data || [];
    
    // Validate that all habit IDs exist
    if (habitIds.length !== habits.length) {
      throw new StorageError('Habit ID array length mismatch', 'reorderHabits');
    }

    const habitMap = new Map(habits.map(h => [h.id, h]));
    const reorderedHabits: Habit[] = [];

    for (const [index, habitId] of habitIds.entries()) {
      const habit = habitMap.get(habitId);
      if (!habit) {
        throw new StorageError(`Habit with ID ${habitId} not found`, 'reorderHabits');
      }
      
      reorderedHabits.push({
        ...habit,
        position: index,
      });
    }

    const saveResult = saveHabits(reorderedHabits);
    if (!saveResult.success) {
      throw new StorageError(saveResult.error || 'Failed to save reordered habits', 'reorderHabits');
    }

    return { success: true, data: reorderedHabits };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error reordering habits',
    };
  }
};

export const clearAllHabits = (): StorageResult<void> => {
  try {
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error clearing habits',
    };
  }
};

// Daily Entry operations
export const getDailyEntry = (date: string): StorageResult<DailyEntry | null> => {
  try {
    const key = getEntryKey(date);
    const json = localStorage.getItem(key);
    
    if (!json) {
      return { success: true, data: null };
    }

    const parsed = safeParseJSON(json);
    if (!parsed) {
      throw new StorageError('Invalid JSON format', 'getDailyEntry');
    }

    const validation = safeValidateDailyEntry(parsed);
    if (!validation.success) {
      throw new StorageError(`Invalid daily entry data: ${validation.error.message}`, 'getDailyEntry');
    }

    return { success: true, data: validation.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting daily entry',
    };
  }
};

export const saveDailyEntry = (entry: DailyEntry): StorageResult<void> => {
  try {
    validateDailyEntry(entry);
    
    if (isStorageApproachingLimit()) {
      console.warn('Storage approaching limit, consider pruning old data');
    }

    const key = getEntryKey(entry.date);
    localStorage.setItem(key, JSON.stringify(entry));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving daily entry',
    };
  }
};

// Settings operations
export const getSettings = (): StorageResult<Settings> => {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    
    if (!json) {
      const defaultSettings = createDefaultSettings();
      const saveResult = saveSettings(defaultSettings);
      if (!saveResult.success) {
        throw new StorageError(saveResult.error || 'Failed to save default settings', 'getSettings');
      }
      return { success: true, data: defaultSettings };
    }

    const parsed = safeParseJSON(json);
    if (!parsed) {
      throw new StorageError('Invalid JSON format', 'getSettings');
    }

    const validation = safeValidateSettings(parsed);
    if (!validation.success) {
      throw new StorageError(`Invalid settings data: ${validation.error.message}`, 'getSettings');
    }

    return { success: true, data: validation.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting settings',
    };
  }
};

export const saveSettings = (settings: Settings): StorageResult<void> => {
  try {
    validateSettings(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving settings',
    };
  }
};

// Storage management
export const getStorageStats = (): StorageStats => {
  const entryKeys = Object.keys(localStorage).filter(key => 
    key.startsWith(STORAGE_KEYS.ENTRY_PREFIX)
  );
  
  const entryDates = entryKeys
    .map(parseDateFromEntryKey)
    .filter((date): date is string => date !== null)
    .sort();

  const habitsResult = getHabits();
  const habitsCount = habitsResult.success ? (habitsResult.data || []).length : 0;

  return {
    totalSize: calculateStorageSize(),
    entryCount: entryKeys.length,
    oldestEntry: entryDates[0],
    newestEntry: entryDates[entryDates.length - 1],
    habitsCount,
  };
};

export const pruneOldEntries = (daysToKeep: number = 90): StorageResult<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = formatDate(cutoffDate);

    const entryKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(STORAGE_KEYS.ENTRY_PREFIX)
    );

    let prunedCount = 0;
    for (const key of entryKeys) {
      const date = parseDateFromEntryKey(key);
      if (date && date < cutoffString) {
        localStorage.removeItem(key);
        prunedCount++;
      }
    }

    return { success: true, data: prunedCount };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error pruning entries',
    };
  }
};

// Habit management utilities
export const getHabitsSorted = (): StorageResult<Habit[]> => {
  const result = getHabits();
  if (!result.success) {
    return result;
  }
  
  const sortedHabits = (result.data || []).sort((a, b) => a.position - b.position);
  return { success: true, data: sortedHabits };
};

export const validateHabitLimit = (currentCount: number): boolean => {
  return currentCount < 7;
};

// Convenience functions
export const getTodaysEntry = (): StorageResult<DailyEntry | null> => {
  const today = formatDate(new Date());
  return getDailyEntry(today);
};