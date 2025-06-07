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
  });
});