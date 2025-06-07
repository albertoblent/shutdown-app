import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getHabits,
  saveHabits,
  getDailyEntry,
  saveDailyEntry,
  getSettings,
  saveSettings,
  getStorageStats,
  pruneOldEntries,
  getTodaysEntry,
  StorageError,
} from './storage'
import type { Habit, DailyEntry, Settings } from '../../types/data'

describe('Storage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  const mockHabit: Habit = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Habit',
    type: 'boolean',
    atomic_prompt: 'Did you do the thing?',
    configuration: {},
    position: 0,
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  }

  const mockEntry: DailyEntry = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    date: '2024-01-15',
    started_at: '2024-01-15T10:00:00Z',
    is_complete: false,
    habit_completions: [],
  }

  const mockSettings: Settings = {
    theme: 'dark',
    notifications: true,
    shutdown_time: '22:00',
    timezone: 'America/New_York',
  }

  describe('Habits operations', () => {
    describe('getHabits', () => {
      it('should return empty array when no habits stored', () => {
        const result = getHabits()
        expect(result.success).toBe(true)
        expect(result.data).toEqual([])
      })

      it('should return parsed habits from localStorage', () => {
        const habits = [mockHabit]
        localStorage.setItem('shutdown_habits', JSON.stringify(habits))

        const result = getHabits()
        expect(result.success).toBe(true)
        expect(result.data).toEqual(habits)
      })

      it('should handle invalid JSON', () => {
        localStorage.setItem('shutdown_habits', 'invalid json')

        const result = getHabits()
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid JSON format')
      })
    })

    describe('saveHabits', () => {
      it('should save valid habits to localStorage', () => {
        const habits = [mockHabit]
        
        const result = saveHabits(habits)
        expect(result.success).toBe(true)
        
        const stored = localStorage.getItem('shutdown_habits')
        expect(stored).toBe(JSON.stringify(habits))
      })
    })

  })

  describe('Daily Entry operations', () => {
    describe('getDailyEntry', () => {
      it('should return null when no entry exists', () => {
        const result = getDailyEntry('2024-01-15')
        expect(result.success).toBe(true)
        expect(result.data).toBeNull()
      })

      it('should return parsed daily entry', () => {
        localStorage.setItem('shutdown_entries_2024-01-15', JSON.stringify(mockEntry))

        const result = getDailyEntry('2024-01-15')
        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockEntry)
      })

      it('should handle invalid JSON in daily entry', () => {
        localStorage.setItem('shutdown_entries_2024-01-15', 'invalid json')

        const result = getDailyEntry('2024-01-15')
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid JSON format')
      })

      it('should handle invalid daily entry data', () => {
        localStorage.setItem('shutdown_entries_2024-01-15', JSON.stringify({ invalid: 'data' }))

        const result = getDailyEntry('2024-01-15')
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid daily entry data')
      })
    })

    describe('saveDailyEntry', () => {
      it('should save valid entry to localStorage', () => {
        const result = saveDailyEntry(mockEntry)
        expect(result.success).toBe(true)
        
        const stored = localStorage.getItem('shutdown_entries_2024-01-15')
        expect(stored).toBe(JSON.stringify(mockEntry))
      })
    })

    describe('getTodaysEntry', () => {
      it('should get entry for current date', () => {
        const today = new Date().toISOString().split('T')[0]
        const todayEntry = { ...mockEntry, date: today }
        localStorage.setItem(`shutdown_entries_${today}`, JSON.stringify(todayEntry))

        const result = getTodaysEntry()
        expect(result.success).toBe(true)
        expect(result.data?.date).toBe(today)
      })
    })
  })

  describe('Settings operations', () => {
    describe('getSettings', () => {
      it('should return stored settings', () => {
        localStorage.setItem('shutdown_settings', JSON.stringify(mockSettings))

        const result = getSettings()
        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockSettings)
      })

      it('should create and return default settings when none exist', () => {
        const result = getSettings()
        expect(result.success).toBe(true)
        expect(result.data?.theme).toBe('dark')
        expect(result.data?.shutdown_time).toBe('22:00')
        
        // Should have saved default settings
        const stored = localStorage.getItem('shutdown_settings')
        expect(stored).toBeDefined()
      })

      it('should handle invalid JSON in settings', () => {
        localStorage.setItem('shutdown_settings', 'invalid json')

        const result = getSettings()
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid JSON format')
      })

      it('should handle invalid settings data', () => {
        localStorage.setItem('shutdown_settings', JSON.stringify({ invalid: 'data' }))

        const result = getSettings()
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid settings data')
      })
    })

    describe('saveSettings', () => {
      it('should save valid settings to localStorage', () => {
        const result = saveSettings(mockSettings)
        expect(result.success).toBe(true)
        
        const stored = localStorage.getItem('shutdown_settings')
        expect(stored).toBe(JSON.stringify(mockSettings))
      })

      it('should reject invalid settings data', () => {
        const invalidSettings = { invalid: 'data' } as unknown as Settings

        const result = saveSettings(invalidSettings)
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })

  describe('Storage management', () => {
    describe('getStorageStats', () => {
      it('should calculate storage statistics', () => {
        // Add some test data
        localStorage.setItem('shutdown_entries_2024-01-13', JSON.stringify(mockEntry))
        localStorage.setItem('shutdown_entries_2024-01-14', JSON.stringify(mockEntry))
        localStorage.setItem('shutdown_entries_2024-01-15', JSON.stringify(mockEntry))
        localStorage.setItem('shutdown_habits', JSON.stringify([mockHabit]))

        const stats = getStorageStats()
        expect(stats.entryCount).toBe(3)
        expect(stats.oldestEntry).toBe('2024-01-13')
        expect(stats.newestEntry).toBe('2024-01-15')
        expect(stats.habitsCount).toBe(1)
        expect(stats.totalSize).toBeGreaterThan(0)
      })

      it('should handle empty storage', () => {
        const stats = getStorageStats()
        expect(stats.entryCount).toBe(0)
        expect(stats.oldestEntry).toBeUndefined()
        expect(stats.newestEntry).toBeUndefined()
        expect(stats.habitsCount).toBe(0)
        expect(stats.totalSize).toBe(0) // Empty storage should have 0 size
      })
    })

    describe('pruneOldEntries', () => {
      it('should remove entries older than specified days', () => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 100) // 100 days ago
        const oldKey = `shutdown_entries_${oldDate.toISOString().split('T')[0]}`
        
        const recentDate = new Date()
        recentDate.setDate(recentDate.getDate() - 30) // 30 days ago
        const recentKey = `shutdown_entries_${recentDate.toISOString().split('T')[0]}`

        localStorage.setItem(oldKey, JSON.stringify(mockEntry))
        localStorage.setItem(recentKey, JSON.stringify(mockEntry))

        const result = pruneOldEntries(90) // Keep 90 days
        expect(result.success).toBe(true)
        expect(result.data).toBe(1) // One entry removed

        expect(localStorage.getItem(oldKey)).toBeNull()
        expect(localStorage.getItem(recentKey)).not.toBeNull()
      })

      it('should handle entries with invalid date keys', () => {
        localStorage.setItem('shutdown_entries_invalid-date', JSON.stringify(mockEntry))
        localStorage.setItem('other_key', 'data')

        const result = pruneOldEntries(30)
        expect(result.success).toBe(true)
        expect(result.data).toBe(0) // No valid entries to prune
      })

      it('should use default days to keep when not specified', () => {
        const result = pruneOldEntries() // Should default to 90 days
        expect(result.success).toBe(true)
        expect(result.data).toBe(0)
      })
    })
  })

  describe('Error handling', () => {
    it('should create StorageError with operation context', () => {
      const error = new StorageError('Test error', 'testOperation')
      expect(error.message).toBe('Test error')
      expect(error.operation).toBe('testOperation')
      expect(error.name).toBe('StorageError')
    })
  })
})