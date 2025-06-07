import { describe, it, expect } from 'vitest'
import {
  UUIDSchema,
  DateSchema,
  TimeSchema,
  TimestampSchema,
  validateHabit,
  validateHabitCompletion,
  validateDailyEntry,
  validateSettings,
  safeValidateHabit,
} from './schemas'

describe('Schema validation', () => {
  describe('UUIDSchema', () => {
    it('should accept valid UUID', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      expect(() => UUIDSchema.parse(validUUID)).not.toThrow()
    })

    it('should reject invalid UUID', () => {
      expect(() => UUIDSchema.parse('not-a-uuid')).toThrow()
      expect(() => UUIDSchema.parse('123-456-789')).toThrow()
    })
  })

  describe('DateSchema', () => {
    it('should accept valid date format', () => {
      expect(() => DateSchema.parse('2024-01-15')).not.toThrow()
      expect(() => DateSchema.parse('2024-12-31')).not.toThrow()
    })

    it('should reject invalid date format', () => {
      expect(() => DateSchema.parse('2024-1-15')).toThrow() // single digit month
      expect(() => DateSchema.parse('24-01-15')).toThrow() // 2-digit year
      expect(() => DateSchema.parse('2024/01/15')).toThrow() // wrong separator
    })
  })

  describe('TimeSchema', () => {
    it('should accept valid time format', () => {
      expect(() => TimeSchema.parse('00:00')).not.toThrow()
      expect(() => TimeSchema.parse('23:59')).not.toThrow()
      expect(() => TimeSchema.parse('12:30')).not.toThrow()
    })

    it('should reject invalid time format', () => {
      expect(() => TimeSchema.parse('24:00')).toThrow() // invalid hour
      expect(() => TimeSchema.parse('12:60')).toThrow() // invalid minute
      expect(() => TimeSchema.parse('12:3')).toThrow() // single digit minute
    })
  })

  describe('TimestampSchema', () => {
    it('should accept valid ISO timestamp', () => {
      expect(() => TimestampSchema.parse('2024-01-15T10:30:00Z')).not.toThrow()
      expect(() => TimestampSchema.parse('2024-01-15T10:30:00.000Z')).not.toThrow()
    })

    it('should reject invalid timestamp', () => {
      expect(() => TimestampSchema.parse('2024-01-15')).toThrow()
      expect(() => TimestampSchema.parse('not-a-timestamp')).toThrow()
    })
  })

  describe('HabitSchema', () => {
    const validHabit = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Habit',
      type: 'boolean' as const,
      atomic_prompt: 'Did you complete this habit?',
      configuration: {},
      position: 0,
      is_active: true,
      created_at: '2024-01-15T10:30:00Z',
    }

    it('should accept valid habit', () => {
      expect(() => validateHabit(validHabit)).not.toThrow()
    })

    it('should reject habit with missing required fields', () => {
      const incomplete: Partial<typeof validHabit> = { ...validHabit }
      delete incomplete.name
      expect(() => validateHabit(incomplete)).toThrow()
    })

    it('should reject habit with invalid type', () => {
      const invalid = { ...validHabit, type: 'invalid' }
      expect(() => validateHabit(invalid)).toThrow()
    })

    it('should reject habit with negative position', () => {
      const invalid = { ...validHabit, position: -1 }
      expect(() => validateHabit(invalid)).toThrow()
    })

    it('should accept numeric habit with configuration', () => {
      const numericHabit = {
        ...validHabit,
        type: 'numeric' as const,
        configuration: {
          numeric_unit: 'minutes',
          numeric_range: [0, 120] as [number, number],
        },
      }
      expect(() => validateHabit(numericHabit)).not.toThrow()
    })

    it('should accept choice habit with configuration', () => {
      const choiceHabit = {
        ...validHabit,
        type: 'choice' as const,
        configuration: {
          choices: ['Option A', 'Option B', 'Option C'],
        },
      }
      expect(() => validateHabit(choiceHabit)).not.toThrow()
    })
  })

  describe('HabitCompletionSchema', () => {
    const validCompletion = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      habit_id: '987fcdeb-51d2-43a1-b456-426614174000',
      value: { boolean: true },
      completed_at: '2024-01-15T10:30:00Z',
      flagged_for_action: false,
      time_to_complete: 30000,
    }

    it('should accept valid boolean completion', () => {
      expect(() => validateHabitCompletion(validCompletion)).not.toThrow()
    })

    it('should accept valid numeric completion', () => {
      const numericCompletion = {
        ...validCompletion,
        value: { numeric: 45 },
      }
      expect(() => validateHabitCompletion(numericCompletion)).not.toThrow()
    })

    it('should accept valid choice completion', () => {
      const choiceCompletion = {
        ...validCompletion,
        value: { choice: 'Option A' },
      }
      expect(() => validateHabitCompletion(choiceCompletion)).not.toThrow()
    })

    it('should reject completion with multiple values', () => {
      const invalid = {
        ...validCompletion,
        value: { boolean: true, numeric: 45 },
      }
      expect(() => validateHabitCompletion(invalid)).toThrow()
    })

    it('should accept completion with no values (incomplete habit)', () => {
      const incomplete = {
        ...validCompletion,
        value: {},
      }
      expect(() => validateHabitCompletion(incomplete)).not.toThrow()
    })
  })

  describe('DailyEntrySchema', () => {
    const validEntry = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      date: '2024-01-15',
      started_at: '2024-01-15T10:30:00Z',
      is_complete: false,
      habit_completions: [],
    }

    it('should accept valid daily entry', () => {
      expect(() => validateDailyEntry(validEntry)).not.toThrow()
    })

    it('should accept entry with completed_at', () => {
      const completed = {
        ...validEntry,
        completed_at: '2024-01-15T11:00:00Z',
        is_complete: true,
      }
      expect(() => validateDailyEntry(completed)).not.toThrow()
    })

    it('should accept entry with habit completions', () => {
      const withCompletions = {
        ...validEntry,
        habit_completions: [
          {
            id: '987fcdeb-51d2-43a1-b456-426614174000',
            habit_id: '456e7890-e89b-12d3-a456-426614174000',
            value: { boolean: true },
            completed_at: '2024-01-15T10:35:00Z',
            flagged_for_action: false,
            time_to_complete: 5000,
          },
        ],
      }
      expect(() => validateDailyEntry(withCompletions)).not.toThrow()
    })
  })

  describe('SettingsSchema', () => {
    const validSettings = {
      theme: 'dark' as const,
      notifications: true,
      shutdown_time: '22:00',
      timezone: 'America/New_York',
    }

    it('should accept valid settings', () => {
      expect(() => validateSettings(validSettings)).not.toThrow()
    })

    it('should accept settings with optional fields', () => {
      const withOptional = {
        ...validSettings,
        weekend_schedule: {
          enabled: true,
          different_time: '23:00',
        },
        completion_ritual: {
          enabled: true,
          message: 'Well done!',
          sound: true,
        },
      }
      expect(() => validateSettings(withOptional)).not.toThrow()
    })

    it('should reject invalid theme', () => {
      const invalid = { ...validSettings, theme: 'invalid' }
      expect(() => validateSettings(invalid)).toThrow()
    })

    it('should reject invalid time format', () => {
      const invalid = { ...validSettings, shutdown_time: '25:00' }
      expect(() => validateSettings(invalid)).toThrow()
    })
  })

  describe('Safe validation functions', () => {
    it('should return success for valid data', () => {
      const validHabit = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Habit',
        type: 'boolean' as const,
        atomic_prompt: 'Test prompt',
        configuration: {},
        position: 0,
        is_active: true,
        created_at: '2024-01-15T10:30:00Z',
      }

      const result = safeValidateHabit(validHabit)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validHabit)
    })

    it('should return error for invalid data', () => {
      const invalidHabit = { name: 'Missing required fields' }
      
      const result = safeValidateHabit(invalidHabit)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})