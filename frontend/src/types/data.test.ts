import { describe, it, expect } from 'vitest'
import {
  generateId,
  formatDate,
  formatTimestamp,
  parseDate,
  getEntryKey,
  parseDateFromEntryKey,
  createDefaultSettings,
  STORAGE_KEYS,
} from './data'

describe('Data utilities', () => {
  describe('generateId', () => {
    it('should generate a valid UUID format', () => {
      const id = generateId()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(id).toMatch(uuidRegex)
    })

    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toBe('2024-01-15')
    })

    it('should handle leap year', () => {
      // Use local date constructor instead of UTC to match our new implementation
      const date = new Date(2024, 1, 29, 0, 0, 0) // Feb 29, 2024 local time
      const formatted = formatDate(date)
      expect(formatted).toBe('2024-02-29')
    })

    // TIMEZONE BUG TESTS - These test the core bug: UTC vs local time
    describe('timezone handling (local time)', () => {
      it('should use local date components not UTC', () => {
        // Create a date that demonstrates the UTC vs local difference
        // This represents 10pm EST on Dec 12th in local system time
        const date = new Date(2024, 11, 12, 22, 0, 0) // Month is 0-indexed, so 11 = December
        const formatted = formatDate(date)
        expect(formatted).toBe('2024-12-12') // Should match local date components
      })

      it('should work with current Date() (always local)', () => {
        // This tests that formatDate works with new Date() which is always in local timezone
        const now = new Date()
        const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        expect(formatDate(now)).toBe(expected)
      })

      it('should handle date boundary correctly in local time', () => {
        // Test midnight on a specific date
        const midnightLocal = new Date(2024, 11, 13, 0, 0, 0) // Midnight Dec 13th local
        const formatted = formatDate(midnightLocal)
        expect(formatted).toBe('2024-12-13')
      })

      it('should handle end of day correctly in local time', () => {
        // Test 11:59 PM on a specific date  
        const endOfDay = new Date(2024, 11, 12, 23, 59, 59) // 11:59 PM Dec 12th local
        const formatted = formatDate(endOfDay)
        expect(formatted).toBe('2024-12-12') // Should still be Dec 12th
      })

      it('should handle DST transition dates', () => {
        // Test a date during DST transition
        const dstDate = new Date(2024, 2, 10, 1, 30, 0) // 1:30am Mar 10, 2024 local (DST starts)
        const formatted = formatDate(dstDate)
        expect(formatted).toBe('2024-03-10')
      })

      it('should handle leap year correctly', () => {
        // Test Feb 29th in a leap year - this replaces the failing original test
        const leapDay = new Date(2024, 1, 29, 12, 0, 0) // Feb 29th, 2024 at noon local
        const formatted = formatDate(leapDay)
        expect(formatted).toBe('2024-02-29')
      })

      it('should handle New Years Eve correctly', () => {
        // December 31st late evening in local time
        const newYearsEve = new Date(2024, 11, 31, 23, 0, 0) // 11pm Dec 31st local
        const formatted = formatDate(newYearsEve)
        expect(formatted).toBe('2024-12-31')
      })

      it('should demonstrate the original UTC bug was fixed', () => {
        // This test demonstrates what the original bug would have produced
        // Create a date and compare UTC vs local formatting
        const testDate = new Date(2024, 11, 12, 22, 0, 0) // 10pm Dec 12th local
        
        // Our fixed formatDate should use local components
        const localFormatted = formatDate(testDate)
        
        // The old UTC-based approach would have been:
        // const utcFormatted = testDate.toISOString().split('T')[0]
        
        expect(localFormatted).toBe('2024-12-12') // Local date
        // UTC formatted might be different if local time zone isn't UTC
        // This test ensures our fix works regardless of system timezone
      })
    })
  })

  describe('formatTimestamp', () => {
    it('should format date to ISO timestamp', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      const formatted = formatTimestamp(date)
      expect(formatted).toBe('2024-01-15T10:30:00.000Z')
    })
  })

  describe('parseDate', () => {
    it('should parse YYYY-MM-DD format', () => {
      const parsed = parseDate('2024-01-15')
      expect(parsed.getFullYear()).toBe(2024)
      expect(parsed.getMonth()).toBe(0) // 0-indexed
      expect(parsed.getUTCDate()).toBe(15)
    })

    it('should parse ISO timestamp', () => {
      const parsed = parseDate('2024-01-15T10:30:00Z')
      expect(parsed.getUTCFullYear()).toBe(2024)
      expect(parsed.getUTCHours()).toBe(10)
      expect(parsed.getUTCMinutes()).toBe(30)
    })
  })

  describe('getEntryKey', () => {
    it('should create entry key with prefix', () => {
      const key = getEntryKey('2024-01-15')
      expect(key).toBe('shutdown_entries_2024-01-15')
    })
  })

  describe('parseDateFromEntryKey', () => {
    it('should extract date from entry key', () => {
      const date = parseDateFromEntryKey('shutdown_entries_2024-01-15')
      expect(date).toBe('2024-01-15')
    })

    it('should return null for invalid key', () => {
      const date = parseDateFromEntryKey('invalid_key')
      expect(date).toBeNull()
    })
  })

  describe('createDefaultSettings', () => {
    it('should create valid default settings', () => {
      const settings = createDefaultSettings()
      
      expect(settings.theme).toBe('dark')
      expect(settings.notifications).toBe(true)
      expect(settings.shutdown_time).toBe('22:00')
      expect(settings.timezone).toBeDefined()
      expect(settings.weekend_schedule?.enabled).toBe(false)
      expect(settings.completion_ritual?.enabled).toBe(true)
      expect(settings.completion_ritual?.message).toContain('Great job')
    })

    it('should use system timezone', () => {
      const settings = createDefaultSettings()
      const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      expect(settings.timezone).toBe(systemTimezone)
    })
  })

  describe('STORAGE_KEYS', () => {
    it('should have consistent key prefixes', () => {
      expect(STORAGE_KEYS.HABITS).toBe('shutdown_habits')
      expect(STORAGE_KEYS.ENTRY_PREFIX).toBe('shutdown_entries_')
      expect(STORAGE_KEYS.SETTINGS).toBe('shutdown_settings')
      expect(STORAGE_KEYS.LAST_EXPORT).toBe('shutdown_last_export')
    })
  })
})