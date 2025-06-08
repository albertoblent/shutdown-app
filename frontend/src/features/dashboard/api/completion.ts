/**
 * Daily Completion API
 * Handles CRUD operations for daily habit completion entries
 */

import type { DailyEntry, HabitCompletion, Habit } from '../../../types/data';
import { generateId, getEntryKey, formatDate, formatTimestamp } from '../../../types/data';
import { validateDailyEntry, validateHabitCompletion } from '../../../types/schemas';
import type { StorageResult } from '../../../shared/api/storage';

// Daily entry CRUD operations
export const createDailyEntry = (date: string, habits: Habit[]): StorageResult<DailyEntry> => {
  try {
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const entryKey = getEntryKey(date);

    // Check if entry already exists
    const existing = localStorage.getItem(entryKey);
    if (existing) {
      throw new Error(`Daily entry already exists for ${date}`);
    }

    const entryStartTime = formatTimestamp(new Date());
    
    // Create habit completions for all active habits
    const habit_completions: HabitCompletion[] = habits
      .filter(habit => habit.is_active)
      .map(habit => ({
        id: generateId(),
        habit_id: habit.id,
        value: {}, // Empty value - not completed yet
        completed_at: entryStartTime, // Set to entry creation time, will be updated when actually completed
        flagged_for_action: false,
        time_to_complete: 0,
      }));

    const dailyEntry: DailyEntry = {
      id: generateId(),
      date,
      started_at: entryStartTime,
      is_complete: false,
      habit_completions,
    };

    // Validate the daily entry
    validateDailyEntry(dailyEntry);

    // Save to localStorage
    localStorage.setItem(entryKey, JSON.stringify(dailyEntry));

    return { success: true, data: dailyEntry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating daily entry',
    };
  }
};

export const getDailyEntry = (date: string): StorageResult<DailyEntry | null> => {
  try {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const entryKey = getEntryKey(date);
    const stored = localStorage.getItem(entryKey);

    if (!stored) {
      return { success: true, data: null };
    }

    const dailyEntry = JSON.parse(stored) as DailyEntry;
    validateDailyEntry(dailyEntry);

    return { success: true, data: dailyEntry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error retrieving daily entry',
    };
  }
};

export const saveDailyEntry = (dailyEntry: DailyEntry): StorageResult<DailyEntry> => {
  try {
    validateDailyEntry(dailyEntry);

    const entryKey = getEntryKey(dailyEntry.date);
    localStorage.setItem(entryKey, JSON.stringify(dailyEntry));

    return { success: true, data: dailyEntry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving daily entry',
    };
  }
};

export const updateHabitCompletion = (
  date: string,
  habitId: string,
  value: HabitCompletion['value'],
  flagged?: boolean,
  actionNote?: string
): StorageResult<HabitCompletion> => {
  try {
    const entryResult = getDailyEntry(date);
    if (!entryResult.success) {
      throw new Error(entryResult.error || 'Failed to get daily entry');
    }

    if (!entryResult.data) {
      throw new Error('Daily entry not found for date: ' + date);
    }

    const dailyEntry = entryResult.data;
    const completionIndex = dailyEntry.habit_completions.findIndex(c => c.habit_id === habitId);

    if (completionIndex === -1) {
      throw new Error('Habit completion not found for habit: ' + habitId);
    }

    const completion = dailyEntry.habit_completions[completionIndex];
    const wasEmpty = Object.keys(completion.value).length === 0;
    const startTime = wasEmpty ? new Date(dailyEntry.started_at).getTime() : new Date(completion.completed_at || dailyEntry.started_at).getTime();

    // Update the completion
    const updatedCompletion: HabitCompletion = {
      ...completion,
      value,
      completed_at: wasEmpty ? formatTimestamp(new Date()) : completion.completed_at, // Only update timestamp when transitioning from incomplete to complete
      flagged_for_action: flagged ?? completion.flagged_for_action,
      action_note: actionNote ?? completion.action_note,
      time_to_complete: wasEmpty ? Date.now() - startTime : completion.time_to_complete,
    };

    validateHabitCompletion(updatedCompletion);

    // Update the daily entry
    dailyEntry.habit_completions[completionIndex] = updatedCompletion;

    // Check if all habits are now complete
    const allComplete = isDailyEntryComplete(dailyEntry);
    if (allComplete && !dailyEntry.is_complete) {
      dailyEntry.is_complete = true;
      dailyEntry.completed_at = formatTimestamp(new Date());
    }

    const saveResult = saveDailyEntry(dailyEntry);
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to save updated daily entry');
    }

    return { success: true, data: updatedCompletion };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating habit completion',
    };
  }
};

export const completeDailyEntry = (date: string): StorageResult<DailyEntry> => {
  try {
    const entryResult = getDailyEntry(date);
    if (!entryResult.success || !entryResult.data) {
      throw new Error('Daily entry not found for date: ' + date);
    }

    const dailyEntry = entryResult.data;

    // Check if all habits are completed
    if (!isDailyEntryComplete(dailyEntry)) {
      throw new Error('Not all habits completed. Cannot mark daily entry as complete.');
    }

    // Mark as complete
    dailyEntry.is_complete = true;
    dailyEntry.completed_at = formatTimestamp(new Date());

    const saveResult = saveDailyEntry(dailyEntry);
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to save completed daily entry');
    }

    return { success: true, data: dailyEntry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error completing daily entry',
    };
  }
};

// Utility functions
export const getTodaysEntry = (habits: Habit[]): StorageResult<DailyEntry> => {
  const today = formatDate(new Date());

  const existingResult = getDailyEntry(today);
  if (!existingResult.success) {
    return { success: false, error: existingResult.error };
  }

  if (existingResult.data) {
    return { success: true, data: existingResult.data };
  }

  // Create new entry for today
  return createDailyEntry(today, habits);
};

export const getYesterdaysEntry = (): StorageResult<DailyEntry | null> => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  return getDailyEntry(yesterdayStr);
};

export const isDailyEntryComplete = (dailyEntry: DailyEntry): boolean => {
  return dailyEntry.habit_completions.every(completion => {
    const { value } = completion;
    return Object.keys(value).length > 0 && (
      value.boolean !== undefined ||
      value.numeric !== undefined ||
      value.choice !== undefined
    );
  });
};

// Date utilities for navigation
export const getDateString = (daysOffset: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDate(date);
};

export const isToday = (dateString: string): boolean => {
  return dateString === getDateString(0);
};

export const isYesterday = (dateString: string): boolean => {
  return dateString === getDateString(-1);
};