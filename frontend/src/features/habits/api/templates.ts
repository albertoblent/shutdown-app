/**
 * Habit template system
 * Provides preset habit collections for quick setup
 */

import type { Habit } from '../../../types/data';
import { generateId } from '../../../types/data';
import { validateHabit } from '../../../types/schemas';
import { getHabits, saveHabits, type StorageResult, StorageError } from '../../../shared/api/storage';

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
          icon: '🧠',
        },
        is_active: true,
      },
      {
        name: 'Budget Reviewed',
        type: 'boolean',
        atomic_prompt: 'Did you check your budget or financial situation today?',
        configuration: {
          icon: '💰',
        },
        is_active: true,
      },
      {
        name: 'Exercise Completed',
        type: 'boolean',
        atomic_prompt: 'Did you complete at least 30 minutes of physical exercise?',
        configuration: {
          icon: '🏃',
        },
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
          icon: '👟',
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
          icon: '💧',
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
          icon: '😴',
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
        configuration: {
          icon: '👨‍👩‍👧‍👦',
        },
        is_active: true,
      },
      {
        name: 'Learning Activity',
        type: 'boolean',
        atomic_prompt: 'Did you engage in learning something new today?',
        configuration: {
          icon: '📚',
        },
        is_active: true,
      },
      {
        name: 'Gratitude Practice',
        type: 'boolean',
        atomic_prompt: 'Did you practice gratitude or mindfulness today?',
        configuration: {
          icon: '🙏',
        },
        is_active: true,
      },
    ],
  },
];

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