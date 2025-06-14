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
    const wasEmpty = Object.keys(completion.value).length === 0; // OLD state
    const becomesEmpty = Object.keys(value).length === 0; // NEW state

    // Determine transition type
    const isCompleting = wasEmpty && !becomesEmpty; // empty → filled
    const isUnCompleting = !wasEmpty && becomesEmpty; // filled → empty

    // Calculate appropriate timestamps based on transition
    let completedAt: string;
    let timeToComplete: number;

    if (isCompleting) {
      // Transitioning from empty to completed
      completedAt = formatTimestamp(new Date());
      const startTime = new Date(dailyEntry.started_at).getTime();
      timeToComplete = Date.now() - startTime;
    } else if (isUnCompleting) {
      // Transitioning from completed to empty - reset timestamps
      completedAt = dailyEntry.started_at; // Reset to entry start time
      timeToComplete = 0; // Reset time
    } else {
      // Modifying existing completion or no change - preserve timestamps
      completedAt = completion.completed_at;
      timeToComplete = completion.time_to_complete;
    }

    // Update the completion
    const updatedCompletion: HabitCompletion = {
      ...completion,
      value,
      completed_at: completedAt,
      flagged_for_action: flagged ?? completion.flagged_for_action,
      action_note: actionNote ?? completion.action_note,
      time_to_complete: timeToComplete,
    };

    validateHabitCompletion(updatedCompletion);

    // Update the daily entry
    dailyEntry.habit_completions[completionIndex] = updatedCompletion;

    // Check daily entry completion status (both directions)
    const allComplete = isDailyEntryComplete(dailyEntry);
    if (allComplete && !dailyEntry.is_complete) {
      // All habits now complete - mark daily entry as complete
      dailyEntry.is_complete = true;
      dailyEntry.completed_at = formatTimestamp(new Date());
    } else if (!allComplete && dailyEntry.is_complete) {
      // Some habits now incomplete - mark daily entry as incomplete
      dailyEntry.is_complete = false;
      delete dailyEntry.completed_at; // Remove completion timestamp
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
    // Sync existing entry with current habit list
    const syncResult = syncDailyEntryWithHabits(existingResult.data, habits);
    if (!syncResult.success) {
      return { success: false, error: syncResult.error };
    }
    return { success: true, data: syncResult.data };
  }

  // Create new entry for today
  return createDailyEntry(today, habits);
};

// Helper function to sync daily entry completions with current active habits
const syncDailyEntryWithHabits = (dailyEntry: DailyEntry, habits: Habit[]): StorageResult<DailyEntry> => {
  try {
    const activeHabits = habits.filter(habit => habit.is_active);
    const activeHabitIds = new Set(activeHabits.map(habit => habit.id));
    
    // Remove completions for habits that are no longer active
    const existingCompletions = dailyEntry.habit_completions.filter(completion => 
      activeHabitIds.has(completion.habit_id)
    );
    
    // Find habits that need new completion records
    const existingHabitIds = new Set(existingCompletions.map(completion => completion.habit_id));
    const newHabits = activeHabits.filter(habit => !existingHabitIds.has(habit.id));
    
    // Create completions for new habits
    const newCompletions: HabitCompletion[] = newHabits.map(habit => ({
      id: generateId(),
      habit_id: habit.id,
      value: {}, // Empty value - not completed yet
      completed_at: dailyEntry.started_at, // Set to entry creation time
      flagged_for_action: false,
      time_to_complete: 0,
    }));
    
    // Combine existing and new completions
    const allCompletions = [...existingCompletions, ...newCompletions];
    
    // Update daily entry with synced completions
    const syncedEntry: DailyEntry = {
      ...dailyEntry,
      habit_completions: allCompletions,
    };
    
    // Recalculate completion status after sync
    const allComplete = isDailyEntryComplete(syncedEntry);
    if (!allComplete && syncedEntry.is_complete) {
      // Entry was complete but now has new incomplete habits
      syncedEntry.is_complete = false;
      delete syncedEntry.completed_at;
    }
    
    // Validate and save the synced entry
    validateDailyEntry(syncedEntry);
    const saveResult = saveDailyEntry(syncedEntry);
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to save synced daily entry');
    }
    
    return { success: true, data: syncedEntry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error syncing daily entry with habits',
    };
  }
};

export const getYesterdaysEntry = (): StorageResult<DailyEntry | null> => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  return getDailyEntry(yesterdayStr);
};

export const isDailyEntryComplete = (dailyEntry: DailyEntry): boolean => {
  const completions = dailyEntry.habit_completions;
  const isComplete = completions.every(completion => {
    const { value } = completion;
    
    // Empty value = not completed
    if (Object.keys(value).length === 0) {
      return false;
    }
    
    // Boolean: only true is completed (false or undefined = not completed)
    if (value.boolean !== undefined) {
      return value.boolean === true;
    }
    
    // Numeric: only positive values are completed (zero or undefined = not completed)
    if (value.numeric !== undefined) {
      return value.numeric > 0;
    }
    
    // Choice: any defined choice is completed
    if (value.choice !== undefined) {
      return true;
    }
    
    return false;
  });
  
  return isComplete;
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