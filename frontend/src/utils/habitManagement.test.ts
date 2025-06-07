/**
 * Tests for habit management CRUD operations
 * Follows TDD approach with comprehensive coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  addHabit,
  editHabit,
  deleteHabit,
  reorderHabits,
  getHabitsSorted,
  validateHabitLimit,
  loadHabitTemplate,
  clearAllHabits,
  HABIT_TEMPLATES,
} from './storage';

describe('Habit Management CRUD Operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('addHabit', () => {
    it('should add a new habit with generated ID and position', () => {
      const habitData = {
        name: 'Test Habit',
        type: 'boolean' as const,
        atomic_prompt: 'Did you complete this test habit?',
        configuration: {},
        is_active: true,
      };

      const result = addHabit(habitData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.name).toBe('Test Habit');
      expect(result.data!.position).toBe(0);
      expect(result.data!.created_at).toBeDefined();
    });

    it('should enforce 7-habit limit', () => {
      // Add 7 habits
      for (let i = 0; i < 7; i++) {
        const result = addHabit({
          name: `Habit ${i}`,
          type: 'boolean',
          atomic_prompt: `Test habit ${i}`,
          configuration: {},
          is_active: true,
        });
        expect(result.success).toBe(true);
      }

      // Try to add 8th habit
      const result = addHabit({
        name: 'Eighth Habit',
        type: 'boolean',
        atomic_prompt: 'This should fail',
        configuration: {},
        is_active: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum of 7 habits allowed');
    });

    it('should assign correct positions when adding multiple habits', () => {
      const habits = [
        { name: 'First', type: 'boolean' as const, atomic_prompt: 'First', configuration: {}, is_active: true },
        { name: 'Second', type: 'boolean' as const, atomic_prompt: 'Second', configuration: {}, is_active: true },
        { name: 'Third', type: 'boolean' as const, atomic_prompt: 'Third', configuration: {}, is_active: true },
      ];

      habits.forEach((habit, index) => {
        const result = addHabit(habit);
        expect(result.success).toBe(true);
        expect(result.data!.position).toBe(index);
      });
    });
  });

  describe('editHabit', () => {
    it('should update habit properties', () => {
      // First add a habit
      const addResult = addHabit({
        name: 'Original Name',
        type: 'boolean',
        atomic_prompt: 'Original prompt',
        configuration: {},
        is_active: true,
      });
      expect(addResult.success).toBe(true);
      const habitId = addResult.data!.id;

      // Update the habit
      const editResult = editHabit(habitId, {
        name: 'Updated Name',
        atomic_prompt: 'Updated prompt',
      });

      expect(editResult.success).toBe(true);
      expect(editResult.data!.name).toBe('Updated Name');
      expect(editResult.data!.atomic_prompt).toBe('Updated prompt');
      expect(editResult.data!.type).toBe('boolean'); // Unchanged
    });

    it('should return error for non-existent habit', () => {
      const result = editHabit('non-existent-id', { name: 'New Name' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Habit not found');
    });

    it('should validate updated habit data', () => {
      // Add a habit first
      const addResult = addHabit({
        name: 'Test Habit',
        type: 'boolean',
        atomic_prompt: 'Test prompt',
        configuration: {},
        is_active: true,
      });
      const habitId = addResult.data!.id;

      // Try to update with invalid data
      const editResult = editHabit(habitId, {
        name: '', // Invalid empty name
      });

      expect(editResult.success).toBe(false);
      expect(editResult.error).toBeDefined();
    });
  });

  describe('deleteHabit', () => {
    it('should delete habit and reorder positions', () => {
      // Add 3 habits
      const habitIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const result = addHabit({
          name: `Habit ${i}`,
          type: 'boolean',
          atomic_prompt: `Prompt ${i}`,
          configuration: {},
          is_active: true,
        });
        habitIds.push(result.data!.id);
      }

      // Delete the middle habit
      const deleteResult = deleteHabit(habitIds[1]);
      expect(deleteResult.success).toBe(true);

      // Check that remaining habits have correct positions
      const habitsResult = getHabitsSorted();
      expect(habitsResult.success).toBe(true);
      expect(habitsResult.data!.length).toBe(2);
      expect(habitsResult.data![0].position).toBe(0);
      expect(habitsResult.data![1].position).toBe(1);
    });

    it('should return error for non-existent habit', () => {
      const result = deleteHabit('non-existent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Habit not found');
    });
  });

  describe('reorderHabits', () => {
    it('should reorder habits correctly', () => {
      // Add 3 habits
      const habitIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const result = addHabit({
          name: `Habit ${i}`,
          type: 'boolean',
          atomic_prompt: `Prompt ${i}`,
          configuration: {},
          is_active: true,
        });
        habitIds.push(result.data!.id);
      }

      // Reorder: move last to first
      const newOrder = [habitIds[2], habitIds[0], habitIds[1]];
      const reorderResult = reorderHabits(newOrder);
      
      expect(reorderResult.success).toBe(true);
      expect(reorderResult.data!.length).toBe(3);
      expect(reorderResult.data![0].name).toBe('Habit 2');
      expect(reorderResult.data![1].name).toBe('Habit 0');
      expect(reorderResult.data![2].name).toBe('Habit 1');
      
      // Check positions are updated
      reorderResult.data!.forEach((habit, index) => {
        expect(habit.position).toBe(index);
      });
    });

    it('should return error for mismatched array length', () => {
      // Add 2 habits
      for (let i = 0; i < 2; i++) {
        addHabit({
          name: `Habit ${i}`,
          type: 'boolean',
          atomic_prompt: `Prompt ${i}`,
          configuration: {},
          is_active: true,
        });
      }

      // Try to reorder with wrong number of IDs
      const result = reorderHabits(['id1', 'id2', 'id3']);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('array length mismatch');
    });

    it('should return error for non-existent habit ID', () => {
      // Add 1 habit
      const addResult = addHabit({
        name: 'Test Habit',
        type: 'boolean',
        atomic_prompt: 'Test prompt',
        configuration: {},
        is_active: true,
      });
      expect(addResult.success).toBe(true);

      // Try to reorder with non-existent ID
      const result = reorderHabits(['non-existent-id']);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getHabitsSorted', () => {
    it('should return habits sorted by position', () => {
      // Add habits
      const habitIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const result = addHabit({
          name: `Habit ${i}`,
          type: 'boolean',
          atomic_prompt: `Prompt ${i}`,
          configuration: {},
          is_active: true,
        });
        habitIds.push(result.data!.id);
      }

      // Reorder to test sorting
      reorderHabits([habitIds[2], habitIds[0], habitIds[1]]);

      // Get sorted habits
      const result = getHabitsSorted();
      
      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(3);
      expect(result.data![0].name).toBe('Habit 2');
      expect(result.data![1].name).toBe('Habit 0');
      expect(result.data![2].name).toBe('Habit 1');
    });

    it('should return empty array when no habits exist', () => {
      const result = getHabitsSorted();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('validateHabitLimit', () => {
    it('should return true when under limit', () => {
      expect(validateHabitLimit(0)).toBe(true);
      expect(validateHabitLimit(3)).toBe(true);
      expect(validateHabitLimit(6)).toBe(true);
    });

    it('should return false when at or over limit', () => {
      expect(validateHabitLimit(7)).toBe(false);
      expect(validateHabitLimit(8)).toBe(false);
    });
  });

  describe('clearAllHabits', () => {
    it('should remove all habits from storage', () => {
      // Add some habits
      addHabit({
        name: 'Test Habit',
        type: 'boolean',
        atomic_prompt: 'Test',
        configuration: {},
        is_active: true,
      });

      // Clear all habits
      const clearResult = clearAllHabits();
      expect(clearResult.success).toBe(true);

      // Verify habits are cleared
      const habitsResult = getHabitsSorted();
      expect(habitsResult.success).toBe(true);
      expect(habitsResult.data).toEqual([]);
    });
  });
});

describe('Habit Templates', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('HABIT_TEMPLATES', () => {
    it('should have 3 preset templates', () => {
      expect(HABIT_TEMPLATES).toHaveLength(3);
      expect(HABIT_TEMPLATES.map(t => t.name)).toEqual([
        'Productivity Focus',
        'Health & Wellness',
        'Work-Life Balance',
      ]);
    });

    it('should have valid habit data in templates', () => {
      HABIT_TEMPLATES.forEach(template => {
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.habits).toBeInstanceOf(Array);
        expect(template.habits.length).toBeGreaterThan(0);
        
        template.habits.forEach(habit => {
          expect(habit.name).toBeDefined();
          expect(habit.type).toMatch(/^(boolean|numeric|choice)$/);
          expect(habit.atomic_prompt).toBeDefined();
          expect(habit.configuration).toBeDefined();
          expect(habit.is_active).toBe(true);
        });
      });
    });
  });

  describe('loadHabitTemplate', () => {
    it('should load template habits successfully', () => {
      const result = loadHabitTemplate('Productivity Focus');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data![0].name).toBe('Deep Work Hours');
      expect(result.data![1].name).toBe('Budget Reviewed');
      expect(result.data![2].name).toBe('Exercise Completed');
      
      // Check that IDs and timestamps were generated
      result.data!.forEach((habit, index) => {
        expect(habit.id).toBeDefined();
        expect(habit.created_at).toBeDefined();
        expect(habit.position).toBe(index);
      });
    });

    it('should return error for non-existent template', () => {
      const result = loadHabitTemplate('Non-existent Template');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Template \'Non-existent Template\' not found');
    });

    it('should enforce 7-habit limit when loading templates', () => {
      // Add 5 habits first
      for (let i = 0; i < 5; i++) {
        addHabit({
          name: `Existing Habit ${i}`,
          type: 'boolean',
          atomic_prompt: `Prompt ${i}`,
          configuration: {},
          is_active: true,
        });
      }

      // Try to load 3-habit template (would make 8 total)
      const result = loadHabitTemplate('Productivity Focus');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('would exceed 7 habit limit');
    });

    it('should append template habits to existing habits', () => {
      // Add 2 existing habits
      const addResult1 = addHabit({
        name: 'Existing Habit 1',
        type: 'boolean',
        atomic_prompt: 'Existing 1',
        configuration: {},
        is_active: true,
      });
      const addResult2 = addHabit({
        name: 'Existing Habit 2',
        type: 'boolean',
        atomic_prompt: 'Existing 2',
        configuration: {},
        is_active: true,
      });
      
      expect(addResult1.success).toBe(true);
      expect(addResult2.success).toBe(true);

      // Load template
      const result = loadHabitTemplate('Work-Life Balance');
      expect(result.success).toBe(true);

      // Check all habits exist
      const allHabits = getHabitsSorted();
      expect(allHabits.success).toBe(true);
      expect(allHabits.data!).toHaveLength(5); // 2 existing + 3 template

      // Check positions are correct
      expect(allHabits.data![0].name).toBe('Existing Habit 1');
      expect(allHabits.data![1].name).toBe('Existing Habit 2');
      expect(allHabits.data![2].name).toBe('Family Time');
      expect(allHabits.data![3].name).toBe('Learning Activity');
      expect(allHabits.data![4].name).toBe('Gratitude Practice');
    });
  });
});