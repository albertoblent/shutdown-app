/**
 * Zod validation schemas for runtime type checking
 * Matches TypeScript interfaces in data.ts
 */

import { z } from 'zod';

// Base validation schemas
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// UUID validation
export const UUIDSchema = z.string().regex(UUID_REGEX, 'Invalid UUID format');

// Date validation (YYYY-MM-DD)
export const DateSchema = z.string().regex(DATE_REGEX, 'Invalid date format (YYYY-MM-DD)');

// Time validation (HH:mm)
export const TimeSchema = z.string().regex(TIME_REGEX, 'Invalid time format (HH:mm)');

// ISO timestamp validation
export const TimestampSchema = z.string().datetime({ message: 'Invalid ISO timestamp' });

// Habit configuration schema
export const HabitConfigurationSchema = z.object({
  numeric_unit: z.string().optional(),
  numeric_range: z.tuple([z.number(), z.number()]).optional(),
  choices: z.array(z.string()).optional(),
  context_url: z.string().url().optional(),
  icon: z.string().optional(),
});

// Habit schema
export const HabitSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1, 'Habit name is required').max(100, 'Habit name too long'),
  type: z.enum(['boolean', 'numeric', 'choice']),
  atomic_prompt: z.string().min(1, 'Atomic prompt is required').max(500, 'Atomic prompt too long'),
  configuration: HabitConfigurationSchema,
  position: z.number().int().min(0, 'Position must be non-negative'),
  is_active: z.boolean(),
  created_at: TimestampSchema,
});

// Habit completion value schema
export const HabitCompletionValueSchema = z.object({
  boolean: z.boolean().optional(),
  numeric: z.number().optional(),
  choice: z.string().optional(),
}).refine(
  (data) => {
    const keys = Object.keys(data).filter(key => data[key as keyof typeof data] !== undefined);
    return keys.length <= 1; // Allow empty (0) or exactly one completion value
  },
  { message: 'At most one completion value may be provided' }
);

// Habit completion schema
export const HabitCompletionSchema = z.object({
  id: UUIDSchema,
  habit_id: UUIDSchema,
  value: HabitCompletionValueSchema,
  completed_at: TimestampSchema,
  flagged_for_action: z.boolean(),
  action_note: z.string().max(500, 'Action note too long').optional(),
  time_to_complete: z.number().int().min(0, 'Time to complete must be non-negative'),
});

// Daily entry schema
export const DailyEntrySchema = z.object({
  id: UUIDSchema,
  date: DateSchema,
  started_at: TimestampSchema,
  completed_at: TimestampSchema.optional(),
  is_complete: z.boolean(),
  habit_completions: z.array(HabitCompletionSchema),
});

// Settings schemas
export const WeekendScheduleSchema = z.object({
  enabled: z.boolean(),
  different_time: TimeSchema.optional(),
});

export const CompletionRitualSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(200, 'Completion message too long').optional(),
  sound: z.boolean().optional(),
});

export const SettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'auto']),
  notifications: z.boolean(),
  shutdown_time: TimeSchema,
  timezone: z.string().min(1, 'Timezone is required'),
  weekend_schedule: WeekendScheduleSchema.optional(),
  completion_ritual: CompletionRitualSchema.optional(),
});

// Array schemas for bulk operations
export const HabitsArraySchema = z.array(HabitSchema);
export const HabitCompletionsArraySchema = z.array(HabitCompletionSchema);

// Validation helper functions
export const validateHabit = (data: unknown) => HabitSchema.parse(data);
export const validateHabitCompletion = (data: unknown) => HabitCompletionSchema.parse(data);
export const validateDailyEntry = (data: unknown) => DailyEntrySchema.parse(data);
export const validateSettings = (data: unknown) => SettingsSchema.parse(data);
export const validateHabitsArray = (data: unknown) => HabitsArraySchema.parse(data);

// Safe parsing (returns success/error instead of throwing)
export const safeValidateHabit = (data: unknown) => HabitSchema.safeParse(data);
export const safeValidateHabitCompletion = (data: unknown) => HabitCompletionSchema.safeParse(data);
export const safeValidateDailyEntry = (data: unknown) => DailyEntrySchema.safeParse(data);
export const safeValidateSettings = (data: unknown) => SettingsSchema.safeParse(data);
export const safeValidateHabitsArray = (data: unknown) => HabitsArraySchema.safeParse(data);

// Type inference from schemas
export type ValidatedHabit = z.infer<typeof HabitSchema>;
export type ValidatedHabitCompletion = z.infer<typeof HabitCompletionSchema>;
export type ValidatedDailyEntry = z.infer<typeof DailyEntrySchema>;
export type ValidatedSettings = z.infer<typeof SettingsSchema>;