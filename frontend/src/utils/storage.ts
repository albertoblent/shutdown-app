/**
 * localStorage utilities with error handling and data validation
 * Provides CRUD operations for all data models with Zod validation
 */

import type { Habit, DailyEntry, Settings } from '../types/data';
import {
  STORAGE_KEYS,
  getEntryKey,
  parseDateFromEntryKey,
  formatDate,
  createDefaultSettings,
} from '../types/data';
import {
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

// Convenience functions
export const getTodaysEntry = (): StorageResult<DailyEntry | null> => {
  const today = formatDate(new Date());
  return getDailyEntry(today);
};