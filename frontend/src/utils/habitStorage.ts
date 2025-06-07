/**
 * Habit-specific storage operations
 * Handles CRUD operations for habits with validation and limits
 */

import type { Habit } from '../types/data';
import { STORAGE_KEYS, generateId } from '../types/data';
import { validateHabit } from '../types/schemas';
import { getHabits, saveHabits, type StorageResult, StorageError } from './storage';

// Habit CRUD operations
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