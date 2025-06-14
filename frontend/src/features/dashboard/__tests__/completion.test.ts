/**
 * Daily Completion API Tests
 * Tests for managing daily habit completion entries
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDailyEntry,
  getDailyEntry,
  updateHabitCompletion,
  completeDailyEntry,
  getTodaysEntry,
  getYesterdaysEntry,
  isDailyEntryComplete,
} from '../api/completion';
import type { Habit } from '../../../types/data';

// Mock habit data for testing
const mockHabits: Habit[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Exercise',
    type: 'boolean',
    atomic_prompt: 'Did you exercise for 30 minutes?',
    configuration: {},
    position: 0,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002', 
    name: 'Water Intake',
    type: 'numeric',
    atomic_prompt: 'How many glasses of water did you drink?',
    configuration: {
      numeric_unit: 'glasses',
      numeric_range: [0, 10],
    },
    position: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
  },
];

describe('Daily Completion API', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createDailyEntry', () => {
    it('should create a new daily entry with empty completions', () => {
      const date = '2025-01-07';
      const result = createDailyEntry(date, mockHabits);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.date).toBe(date);
      expect(result.data!.is_complete).toBe(false);
      expect(result.data!.habit_completions).toHaveLength(2);
      expect(result.data!.started_at).toBeDefined();
      expect(result.data!.completed_at).toBeUndefined();
    });

    it('should create habit completions for all active habits', () => {
      const date = '2025-01-07';
      const result = createDailyEntry(date, mockHabits);

      const completions = result.data!.habit_completions;
      expect(completions[0].habit_id).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(completions[0].value).toEqual({});
      expect(completions[0].flagged_for_action).toBe(false);
      expect(completions[1].habit_id).toBe('550e8400-e29b-41d4-a716-446655440002');
    });

    it('should return error if entry already exists for date', () => {
      const date = '2025-01-07';
      createDailyEntry(date, mockHabits);
      
      const result = createDailyEntry(date, mockHabits);
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should handle empty habits array', () => {
      const date = '2025-01-07';
      const result = createDailyEntry(date, []);

      expect(result.success).toBe(true);
      expect(result.data!.habit_completions).toHaveLength(0);
    });
  });

  describe('getDailyEntry', () => {
    it('should retrieve existing daily entry', () => {
      const date = '2025-01-07';
      const created = createDailyEntry(date, mockHabits);
      
      const result = getDailyEntry(date);
      expect(result.success).toBe(true);
      expect(result.data!.id).toBe(created.data!.id);
    });

    it('should return null for non-existent entry', () => {
      const result = getDailyEntry('2025-01-07');
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle invalid date format', () => {
      const result = getDailyEntry('invalid-date');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });
  });

  describe('updateHabitCompletion', () => {
    it('should update boolean habit completion', () => {
      const date = '2025-01-07';
      createDailyEntry(date, mockHabits);

      const result = updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440001', { boolean: true });
      expect(result.success).toBe(true);
      
      const entry = getDailyEntry(date);
      const completion = entry.data!.habit_completions.find(c => c.habit_id === '550e8400-e29b-41d4-a716-446655440001');
      expect(completion!.value.boolean).toBe(true);
      expect(completion!.completed_at).toBeDefined();
    });

    it('should update numeric habit completion', () => {
      const date = '2025-01-07';
      createDailyEntry(date, mockHabits);

      const result = updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440002', { numeric: 8 });
      expect(result.success).toBe(true);
      
      const entry = getDailyEntry(date);
      const completion = entry.data!.habit_completions.find(c => c.habit_id === '550e8400-e29b-41d4-a716-446655440002');
      expect(completion!.value.numeric).toBe(8);
    });

    it('should return error for non-existent entry', () => {
      const result = updateHabitCompletion('2025-01-07', '550e8400-e29b-41d4-a716-446655440001', { boolean: true });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Daily entry not found');
    });

    it('should return error for non-existent habit', () => {
      const date = '2025-01-07';
      createDailyEntry(date, mockHabits);

      const result = updateHabitCompletion(date, 'non-existent', { boolean: true });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Habit completion not found');
    });

    it('should update time_to_complete when completion changes', () => {
      const date = '2025-01-07';
      createDailyEntry(date, mockHabits);

      // First update
      updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440001', { boolean: true });
      
      const entry = getDailyEntry(date);
      const completion = entry.data!.habit_completions.find(c => c.habit_id === '550e8400-e29b-41d4-a716-446655440001');
      expect(completion!.time_to_complete).toBeGreaterThanOrEqual(0);
    });
  });

  describe('completeDailyEntry', () => {
    it('should mark entry as complete when all habits are completed', () => {
      const date = '2025-01-07';
      createDailyEntry(date, mockHabits);
      
      // Complete all habits
      updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440001', { boolean: true });
      updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440002', { numeric: 8 });

      const result = completeDailyEntry(date);
      expect(result.success).toBe(true);
      
      const entry = getDailyEntry(date);
      expect(entry.data!.is_complete).toBe(true);
      expect(entry.data!.completed_at).toBeDefined();
    });

    it('should return error if not all habits are completed', () => {
      const date = '2025-01-07';
      createDailyEntry(date, mockHabits);
      
      // Only complete one habit
      updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440001', { boolean: true });

      const result = completeDailyEntry(date);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not all habits completed');
    });
  });

  describe('getTodaysEntry', () => {
    it('should get or create todays entry', () => {
      const today = new Date().toISOString().split('T')[0];
      
      const result = getTodaysEntry(mockHabits);
      expect(result.success).toBe(true);
      expect(result.data!.date).toBe(today);
    });

    it('should return existing entry if already created today', () => {
      const today = new Date().toISOString().split('T')[0];
      const created = createDailyEntry(today, mockHabits);
      
      const result = getTodaysEntry(mockHabits);
      expect(result.success).toBe(true);
      expect(result.data!.id).toBe(created.data!.id);
    });
  });

  describe('getYesterdaysEntry', () => {
    it('should get yesterdays entry if it exists', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      createDailyEntry(yesterdayStr, mockHabits);
      
      const result = getYesterdaysEntry();
      expect(result.success).toBe(true);
      expect(result.data!.date).toBe(yesterdayStr);
    });

    it('should return null if yesterdays entry does not exist', () => {
      const result = getYesterdaysEntry();
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('isDailyEntryComplete', () => {
    it('should return true when all habits have values', () => {
      const date = '2025-01-07';
      createDailyEntry(date, mockHabits);
      updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440001', { boolean: true });
      updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440002', { numeric: 8 });

      const entry = getDailyEntry(date);
      const result = isDailyEntryComplete(entry.data!);
      expect(result).toBe(true);
    });

    it('should return false when some habits are incomplete', () => {
      const date = '2025-01-07';
      createDailyEntry(date, mockHabits);
      updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440001', { boolean: true });

      const entry = getDailyEntry(date);
      const result = isDailyEntryComplete(entry.data!);
      expect(result).toBe(false);
    });

    it('should return true for entry with no habits', () => {
      const date = '2025-01-07';
      createDailyEntry(date, []);

      const entry = getDailyEntry(date);
      const result = isDailyEntryComplete(entry.data!);
      expect(result).toBe(true);
    });

    describe('Issue #39: Zero Value Completion Logic', () => {
      it('should return false when numeric habit has zero value (zero should never complete)', () => {
        const date = '2025-01-07';
        createDailyEntry(date, mockHabits);
        updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440002', { numeric: 0 });

        const entry = getDailyEntry(date);
        const result = isDailyEntryComplete(entry.data!);
        expect(result).toBe(false); // Zero values should NOT mark habit as complete
      });

      it('should return true when numeric habit has positive value', () => {
        const date = '2025-01-07';
        createDailyEntry(date, mockHabits);
        updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440001', { boolean: true });
        updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440002', { numeric: 1 });

        const entry = getDailyEntry(date);
        const result = isDailyEntryComplete(entry.data!);
        expect(result).toBe(true); // Positive values should mark habit as complete
      });

      it('should handle mixed completion states correctly', () => {
        const date = '2025-01-07';
        createDailyEntry(date, mockHabits);
        updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440001', { boolean: true }); // Complete
        updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440002', { numeric: 0 }); // Not complete (zero)

        const entry = getDailyEntry(date);
        const result = isDailyEntryComplete(entry.data!);
        expect(result).toBe(false); // One completed, one with zero = not all complete
      });

      it('should handle boolean false as incomplete', () => {
        const date = '2025-01-07';
        createDailyEntry(date, mockHabits);
        updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440001', { boolean: false });
        updateHabitCompletion(date, '550e8400-e29b-41d4-a716-446655440002', { numeric: 5 });

        const entry = getDailyEntry(date);
        const result = isDailyEntryComplete(entry.data!);
        expect(result).toBe(false); // Boolean false should not mark as complete
      });
    });
  });

  describe('Boolean habit unchecking edge case', () => {
    it('should handle boolean habit unchecking by passing empty value', () => {
      // Test the edge case where user unchecks a completed boolean habit
      const date = '2025-01-08';
      const mockHabit = mockHabits[0]; // Boolean habit
      
      // Create daily entry
      const createResult = createDailyEntry(date, [mockHabit]);
      expect(createResult.success).toBe(true);

      // First complete the habit
      const completeResult = updateHabitCompletion(date, mockHabit.id, { boolean: true });
      expect(completeResult.success).toBe(true);
      
      // Verify it's completed
      const completedEntry = getDailyEntry(date);
      expect(completedEntry.success).toBe(true);
      const completion1 = completedEntry.data!.habit_completions.find(c => c.habit_id === mockHabit.id);
      expect(completion1?.value.boolean).toBe(true);
      
      // Now uncheck by passing empty object (simulates unchecking checkbox)
      const uncheckResult = updateHabitCompletion(date, mockHabit.id, {});
      expect(uncheckResult.success).toBe(true);
      
      // Verify it's now incomplete
      const uncheckedEntry = getDailyEntry(date);
      expect(uncheckedEntry.success).toBe(true);
      const completion2 = uncheckedEntry.data!.habit_completions.find(c => c.habit_id === mockHabit.id);
      expect(Object.keys(completion2!.value)).toHaveLength(0);
      expect(completion2?.value.boolean).toBeUndefined();
      
      // Verify entry is no longer complete
      const isComplete = isDailyEntryComplete(uncheckedEntry.data!);
      expect(isComplete).toBe(false);
    });

    it('should reset timestamps and time_to_complete when unchecking completed habits', () => {
      // Test the specific bug fix: timestamps should reset on uncompletion
      const date = '2025-01-09';
      const mockHabit = mockHabits[0]; // Boolean habit
      
      // Create daily entry
      const createResult = createDailyEntry(date, [mockHabit]);
      expect(createResult.success).toBe(true);
      const entryStartTime = createResult.data!.started_at;
      
      // Get initial state
      const initialEntry = getDailyEntry(date);
      expect(initialEntry.success).toBe(true);
      const initialHabit = initialEntry.data!.habit_completions.find(c => c.habit_id === mockHabit.id);
      expect(Object.keys(initialHabit!.value)).toHaveLength(0); // Initially empty
      expect(initialHabit?.completed_at).toBe(entryStartTime); // Initially set to entry start time
      expect(initialHabit?.time_to_complete).toBe(0); // Initially 0
      
      // Complete the habit
      const completeResult = updateHabitCompletion(date, mockHabit.id, { boolean: true });
      expect(completeResult.success).toBe(true);
      
      // Verify completion state
      const completedEntry = getDailyEntry(date);
      expect(completedEntry.success).toBe(true);
      const completedHabit = completedEntry.data!.habit_completions.find(c => c.habit_id === mockHabit.id);
      expect(completedHabit?.value.boolean).toBe(true);
      expect(completedHabit?.time_to_complete).toBeGreaterThanOrEqual(0); // Should have calculated time
      
      // Uncheck the habit (this is where the bug was)
      const uncheckResult = updateHabitCompletion(date, mockHabit.id, {});
      expect(uncheckResult.success).toBe(true);
      
      // Verify timestamps are reset correctly (the main bug fix)
      const uncheckedEntry = getDailyEntry(date);
      expect(uncheckedEntry.success).toBe(true);
      const uncheckedHabit = uncheckedEntry.data!.habit_completions.find(c => c.habit_id === mockHabit.id);
      
      // Critical bug fix verification:
      expect(Object.keys(uncheckedHabit!.value)).toHaveLength(0); // Value should be empty
      expect(uncheckedHabit?.completed_at).toBe(entryStartTime); // Reset to entry start time
      expect(uncheckedHabit?.time_to_complete).toBe(0); // Reset to 0
      
      // Before the fix, these would have been the same (the bug):
      // - completed_at would have kept the completion timestamp
      // - time_to_complete would have kept the calculated time
      // Now they should be reset
      
      // Verify daily entry status also resets
      expect(uncheckedEntry.data?.is_complete).toBe(false);
      expect(uncheckedEntry.data?.completed_at).toBeUndefined(); // Daily entry completion timestamp removed
    });
  });

  describe('Habit-Completion Synchronization Bug', () => {
    it('should handle habits added after daily entry creation (reproduces habit completion sync bug)', () => {
      // This test reproduces the specific bug scenario:
      // 1. Create first habit → daily entry created with completion for habit 1
      // 2. Create second habit → habit stored but daily entry not updated
      // 3. Try to complete second habit → "Habit completion not found" error
      
      const today = new Date().toISOString().split('T')[0];
      const firstHabit = mockHabits[0];
      const secondHabit = mockHabits[1];
      
      // Step 1: Create daily entry with first habit only (simulates first habit creation)
      const initialResult = getTodaysEntry([firstHabit]);
      expect(initialResult.success).toBe(true);
      expect(initialResult.data!.habit_completions).toHaveLength(1);
      expect(initialResult.data!.habit_completions[0].habit_id).toBe(firstHabit.id);
      
      // Step 2: Now add second habit to the list (simulates creating second habit via Manage Habits)
      // When user returns to dashboard, getTodaysEntry is called with BOTH habits
      // but existing daily entry only has completion record for first habit
      const syncResult = getTodaysEntry([firstHabit, secondHabit]);
      expect(syncResult.success).toBe(true);
      expect(syncResult.data!.habit_completions).toHaveLength(2); // Should now have both completions
      
      // Verify both habits have completion records
      const firstCompletion = syncResult.data!.habit_completions.find(c => c.habit_id === firstHabit.id);
      const secondCompletion = syncResult.data!.habit_completions.find(c => c.habit_id === secondHabit.id);
      
      expect(firstCompletion).toBeDefined();
      expect(secondCompletion).toBeDefined();
      
      // Step 3: Now both habits should be completable without error
      const completeFirstResult = updateHabitCompletion(today, firstHabit.id, { boolean: true });
      expect(completeFirstResult.success).toBe(true);
      
      const completeSecondResult = updateHabitCompletion(today, secondHabit.id, { numeric: 5 });
      expect(completeSecondResult.success).toBe(true);
      
      // Verify both completions were successful
      const finalEntry = getDailyEntry(today);
      expect(finalEntry.success).toBe(true);
      
      const finalFirstCompletion = finalEntry.data!.habit_completions.find(c => c.habit_id === firstHabit.id);
      const finalSecondCompletion = finalEntry.data!.habit_completions.find(c => c.habit_id === secondHabit.id);
      
      expect(finalFirstCompletion!.value.boolean).toBe(true);
      expect(finalSecondCompletion!.value.numeric).toBe(5);
    });

    it('should handle habits removed from active list (cleanup unused completions)', () => {
      // Test the inverse scenario: what happens when habits are deactivated
      
      // Start with both habits
      const initialResult = getTodaysEntry(mockHabits);
      expect(initialResult.success).toBe(true);
      expect(initialResult.data!.habit_completions).toHaveLength(2);
      
      // Remove one habit from active list
      const remainingHabit = mockHabits[0];
      const syncResult = getTodaysEntry([remainingHabit]);
      expect(syncResult.success).toBe(true);
      expect(syncResult.data!.habit_completions).toHaveLength(1);
      expect(syncResult.data!.habit_completions[0].habit_id).toBe(remainingHabit.id);
    });
  });
});