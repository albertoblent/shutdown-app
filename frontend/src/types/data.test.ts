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
      const date = new Date('2024-02-29T00:00:00Z')
      const formatted = formatDate(date)
      expect(formatted).toBe('2024-02-29')
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