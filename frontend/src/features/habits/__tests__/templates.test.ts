/**
 * Tests for habit template system
 * Tests preset templates and template loading functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { addHabit, getHabitsSorted } from '../api/storage';
import {
  loadHabitTemplate,
  HABIT_TEMPLATES,
} from '../api/templates';

describe('Habit Templates', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('HABIT_TEMPLATES', () => {
    it('should have 4 preset templates', () => {
      expect(HABIT_TEMPLATES).toHaveLength(4);
      expect(HABIT_TEMPLATES.map(t => t.name)).toEqual([
        'Productivity Focus',
        'Health & Wellness',
        'Work-Life Balance',
        'Creative & Social',
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