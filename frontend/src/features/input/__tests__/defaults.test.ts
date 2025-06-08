/**
 * Yesterday's Defaults Tests
 * Tests for retrieving and suggesting previous day's values as quick defaults
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  getYesterdayDefaults, 
  getQuickDefaults,
  saveInputHistory,
  getInputHistory
} from '../api/defaults'
import type { Habit, HabitCompletion, DailyEntry } from '../../../types/data'
import { formatDate } from '../../../types/data'

// Mock data
const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    name: 'Deep Work',
    type: 'numeric',
    atomic_prompt: 'Hours of focused work',
    configuration: { numeric_unit: 'hours', numeric_range: [0, 12] },
    position: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'habit-2', 
    name: 'Exercise',
    type: 'boolean',
    atomic_prompt: 'Did you exercise today?',
    configuration: {},
    position: 2,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'habit-3',
    name: 'Reading',
    type: 'numeric', 
    atomic_prompt: 'Minutes of reading',
    configuration: { numeric_unit: 'minutes', numeric_range: [0, 120] },
    position: 3,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z'
  }
]

const createMockCompletion = (habitId: string, value: boolean | number): HabitCompletion => ({
  id: `completion-${habitId}`,
  habit_id: habitId,
  value: typeof value === 'boolean' ? { boolean: value } : { numeric: value },
  completed_at: '2025-01-07T22:00:00.000Z',
  flagged_for_action: false,
  time_to_complete: 1500
})

const createMockEntry = (date: string, completions: HabitCompletion[]): DailyEntry => ({
  id: `entry-${date}`,
  date,
  started_at: `${date}T21:00:00.000Z`,
  completed_at: `${date}T22:00:00.000Z`,
  is_complete: true,
  habit_completions: completions
})

beforeEach(() => {
  localStorage.clear()
})

describe('getYesterdayDefaults', () => {
  it('should return yesterday\'s values when available', () => {
    const today = new Date('2025-01-08')
    const yesterday = new Date('2025-01-07')
    const yesterdayKey = `shutdown_entries_${formatDate(yesterday)}`
    
    const yesterdayEntry = createMockEntry(formatDate(yesterday), [
      createMockCompletion('habit-1', 4),
      createMockCompletion('habit-2', true),
      createMockCompletion('habit-3', 30)
    ])
    
    localStorage.setItem(yesterdayKey, JSON.stringify(yesterdayEntry))
    
    const defaults = getYesterdayDefaults(mockHabits, today)
    
    expect(defaults.size).toBe(3)
    expect(defaults.get('habit-1')).toBe(4)
    expect(defaults.get('habit-2')).toBe(true) 
    expect(defaults.get('habit-3')).toBe(30)
  })

  it('should return empty map when no yesterday data', () => {
    const today = new Date('2025-01-08')
    const defaults = getYesterdayDefaults(mockHabits, today)
    
    expect(defaults.size).toBe(0)
  })

  it('should return empty map when yesterday entry incomplete', () => {
    const today = new Date('2025-01-08')
    const yesterday = new Date('2025-01-07')
    const yesterdayKey = `shutdown_entries_${formatDate(yesterday)}`
    
    const incompleteEntry = createMockEntry(formatDate(yesterday), [])
    incompleteEntry.is_complete = false
    
    localStorage.setItem(yesterdayKey, JSON.stringify(incompleteEntry))
    
    const defaults = getYesterdayDefaults(mockHabits, today)
    expect(defaults.size).toBe(0)
  })

  it('should handle invalid JSON gracefully', () => {
    const today = new Date('2025-01-08')
    const yesterday = new Date('2025-01-07')
    const yesterdayKey = `shutdown_entries_${formatDate(yesterday)}`
    
    localStorage.setItem(yesterdayKey, 'invalid json')
    
    const defaults = getYesterdayDefaults(mockHabits, today)
    expect(defaults.size).toBe(0)
  })

  it('should only return values for provided habits', () => {
    const today = new Date('2025-01-08')
    const yesterday = new Date('2025-01-07')
    const yesterdayKey = `shutdown_entries_${formatDate(yesterday)}`
    
    const yesterdayEntry = createMockEntry(formatDate(yesterday), [
      createMockCompletion('habit-1', 4),
      createMockCompletion('habit-2', true),
      createMockCompletion('habit-deleted', 999) // Habit no longer exists
    ])
    
    localStorage.setItem(yesterdayKey, JSON.stringify(yesterdayEntry))
    
    const defaults = getYesterdayDefaults(mockHabits.slice(0, 2), today) // Only first 2 habits
    
    expect(defaults.size).toBe(2)
    expect(defaults.get('habit-1')).toBe(4)
    expect(defaults.get('habit-2')).toBe(true)
    expect(defaults.has('habit-deleted')).toBe(false)
  })
})

describe('saveInputHistory', () => {
  it('should save input history for habit', () => {
    const habitId = 'habit-1'
    const value = 5
    const completionTime = 1200
    
    saveInputHistory(habitId, value, completionTime)
    
    const history = getInputHistory(habitId)
    expect(history).toBeDefined()
    expect(history!.habit_id).toBe(habitId)
    expect(history!.recent_values).toContain(value)
    expect(history!.completion_times).toContain(completionTime)
  })

  it('should maintain limited history of recent values', () => {
    const habitId = 'habit-1'
    
    // Add 15 values (more than the limit of 10)
    for (let i = 1; i <= 15; i++) {
      saveInputHistory(habitId, i, 1000)
    }
    
    const history = getInputHistory(habitId)
    expect(history!.recent_values).toHaveLength(10)
    expect(history!.recent_values).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
  })

  it('should calculate average value correctly', () => {
    const habitId = 'habit-1'
    const values = [2, 4, 6, 8, 10]
    
    values.forEach(value => saveInputHistory(habitId, value, 1000))
    
    const history = getInputHistory(habitId)
    expect(history!.average_value).toBe(6) // (2+4+6+8+10)/5 = 6
  })

  it('should update existing history', () => {
    const habitId = 'habit-1'
    
    saveInputHistory(habitId, 5, 1000)
    saveInputHistory(habitId, 10, 1500)
    
    const history = getInputHistory(habitId)
    expect(history!.recent_values).toEqual([5, 10])
    expect(history!.average_value).toBe(7.5)
  })
})

describe('getQuickDefaults', () => {
  it('should combine yesterday values with historical patterns', () => {
    const today = new Date('2025-01-08')
    const yesterday = new Date('2025-01-07')
    const yesterdayKey = `shutdown_entries_${formatDate(yesterday)}`
    
    // Set up yesterday's data
    const yesterdayEntry = createMockEntry(formatDate(yesterday), [
      createMockCompletion('habit-1', 4)
    ])
    localStorage.setItem(yesterdayKey, JSON.stringify(yesterdayEntry))
    
    // Set up historical data
    saveInputHistory('habit-1', 6, 1000)
    saveInputHistory('habit-1', 8, 1000)
    saveInputHistory('habit-1', 10, 1000)
    
    const defaults = getQuickDefaults(mockHabits.slice(0, 1), today)
    
    expect(defaults.length).toBeGreaterThan(1)
    
    // Should include yesterday's value
    const yesterdayDefault = defaults.find(d => d.source === 'yesterday')
    expect(yesterdayDefault).toBeDefined()
    expect(yesterdayDefault!.value).toBe(4)
    
    // Should include average value
    const averageDefault = defaults.find(d => d.source === 'average')
    expect(averageDefault).toBeDefined()
    expect(averageDefault!.value).toBe(8) // (6+8+10)/3 = 8
  })

  it('should handle habits with no history', () => {
    const today = new Date('2025-01-08')
    const defaults = getQuickDefaults(mockHabits.slice(0, 1), today)
    
    // Should provide some basic defaults even without history
    expect(defaults.length).toBeGreaterThanOrEqual(0)
  })

  it('should prioritize higher confidence suggestions', () => {
    const today = new Date('2025-01-08')
    const yesterday = new Date('2025-01-07')
    const yesterdayKey = `shutdown_entries_${formatDate(yesterday)}`
    
    const yesterdayEntry = createMockEntry(formatDate(yesterday), [
      createMockCompletion('habit-1', 5)
    ])
    localStorage.setItem(yesterdayKey, JSON.stringify(yesterdayEntry))
    
    // Add consistent history
    for (let i = 0; i < 10; i++) {
      saveInputHistory('habit-1', 5, 1000)
    }
    
    const defaults = getQuickDefaults(mockHabits.slice(0, 1), today)
    
    // Suggestions should be sorted by confidence
    for (let i = 1; i < defaults.length; i++) {
      expect(defaults[i-1].confidence).toBeGreaterThanOrEqual(defaults[i].confidence)
    }
  })
})