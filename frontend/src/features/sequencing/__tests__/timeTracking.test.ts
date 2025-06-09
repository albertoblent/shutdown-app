/**
 * Completion Time Tracking Tests
 * Tests for recording and analyzing habit completion times for sequencing optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  trackCompletionTime,
  getAverageCompletionTime,
  getQuickWinScore,
  updateSequencingData,
  getSequencingData,
  calculateMomentumScore
} from '../api/timeTracking'
import type { SequencingData, HabitCompletion } from '../../../types/data'

describe('Completion Time Tracking', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('trackCompletionTime', () => {
    it('should record completion time for new habit', () => {
      const habitCompletion: HabitCompletion = {
        id: 'completion-1',
        habit_id: 'habit-1',
        value: { boolean: true },
        completed_at: new Date().toISOString(),
        flagged_for_action: false,
        time_to_complete: 30000 // 30 seconds
      }

      const result = trackCompletionTime(habitCompletion)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.habit_id).toBe('habit-1')
      expect(result.data?.average_completion_time).toBe(30000)
      expect(result.data?.completion_count).toBe(1)
    })

    it('should update existing tracking data', () => {
      const firstCompletion: HabitCompletion = {
        id: 'completion-1',
        habit_id: 'habit-1',
        value: { boolean: true },
        completed_at: new Date().toISOString(),
        flagged_for_action: false,
        time_to_complete: 30000
      }

      const secondCompletion: HabitCompletion = {
        id: 'completion-2',
        habit_id: 'habit-1',
        value: { boolean: true },
        completed_at: new Date().toISOString(),
        flagged_for_action: false,
        time_to_complete: 20000
      }

      trackCompletionTime(firstCompletion)
      const result = trackCompletionTime(secondCompletion)

      expect(result.success).toBe(true)
      expect(result.data?.average_completion_time).toBe(25000) // (30000 + 20000) / 2
      expect(result.data?.completion_count).toBe(2)
    })

    it('should handle invalid completion data', () => {
      const invalidCompletion = {
        id: 'completion-1',
        habit_id: '',
        value: { boolean: true },
        completed_at: new Date().toISOString(),
        flagged_for_action: false,
        time_to_complete: -1000 // Invalid negative time
      } as HabitCompletion

      const result = trackCompletionTime(invalidCompletion)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid completion data')
    })
  })

  describe('getAverageCompletionTime', () => {
    it('should return average completion time for existing habit', () => {
      const mockData: SequencingData = {
        habit_id: 'habit-1',
        average_completion_time: 45000,
        completion_count: 5,
        quick_win_score: 0.8,
        last_updated: new Date().toISOString()
      }

      localStorage.setItem('shutdown_sequencing_data', JSON.stringify([mockData]))

      const averageTime = getAverageCompletionTime('habit-1')
      expect(averageTime).toBe(45000)
    })

    it('should return null for non-existent habit', () => {
      const averageTime = getAverageCompletionTime('non-existent-habit')
      expect(averageTime).toBeNull()
    })

    it('should handle corrupted storage data', () => {
      localStorage.setItem('shutdown_sequencing_data', 'invalid-json')

      const averageTime = getAverageCompletionTime('habit-1')
      expect(averageTime).toBeNull()
    })
  })

  describe('getQuickWinScore', () => {
    it('should calculate quick win score based on completion time', () => {
      // Quick completion (under 30 seconds) should have high score
      const quickScore = getQuickWinScore(15000) // 15 seconds
      expect(quickScore).toBeGreaterThan(0.9)

      // Medium-quick completion (30-60 seconds) should still be fairly high  
      const mediumScore = getQuickWinScore(45000) // 45 seconds
      expect(mediumScore).toBeGreaterThan(0.8)
      expect(mediumScore).toBeLessThan(1.0)

      // Slow completion (over 2 minutes) should have low score
      const slowScore = getQuickWinScore(150000) // 2.5 minutes
      expect(slowScore).toBeLessThan(0.4)
    })

    it('should handle edge cases', () => {
      // Very fast completion
      const veryFastScore = getQuickWinScore(1000) // 1 second
      expect(veryFastScore).toBe(1.0)

      // Very slow completion
      const verySlowScore = getQuickWinScore(600000) // 10 minutes
      expect(verySlowScore).toBe(0.0)

      // Zero time (invalid but should handle gracefully)
      const zeroScore = getQuickWinScore(0)
      expect(zeroScore).toBe(1.0)
    })
  })

  describe('updateSequencingData', () => {
    it('should create new sequencing data entry', () => {
      const newData: SequencingData = {
        habit_id: 'habit-1',
        average_completion_time: 30000,
        completion_count: 1,
        quick_win_score: 0.9,
        last_updated: new Date().toISOString()
      }

      const result = updateSequencingData(newData)

      expect(result.success).toBe(true)
      
      const stored = getSequencingData()
      expect(stored.success).toBe(true)
      expect(stored.data).toHaveLength(1)
      expect(stored.data?.[0].habit_id).toBe('habit-1')
    })

    it('should update existing sequencing data entry', () => {
      const initialData: SequencingData = {
        habit_id: 'habit-1',
        average_completion_time: 30000,
        completion_count: 1,
        quick_win_score: 0.9,
        last_updated: new Date().toISOString()
      }

      updateSequencingData(initialData)

      const updatedData: SequencingData = {
        habit_id: 'habit-1',
        average_completion_time: 25000,
        completion_count: 2,
        quick_win_score: 0.95,
        last_updated: new Date().toISOString()
      }

      const result = updateSequencingData(updatedData)

      expect(result.success).toBe(true)
      
      const stored = getSequencingData()
      expect(stored.data).toHaveLength(1)
      expect(stored.data?.[0].average_completion_time).toBe(25000)
      expect(stored.data?.[0].completion_count).toBe(2)
    })
  })

  describe('calculateMomentumScore', () => {
    it('should calculate momentum score based on quick win and completion patterns', () => {
      const mockData: SequencingData = {
        habit_id: 'habit-1',
        average_completion_time: 20000, // Quick completion
        completion_count: 10, // Good completion history
        quick_win_score: 0.9,
        last_updated: new Date().toISOString()
      }

      const momentum = calculateMomentumScore(mockData)
      
      expect(momentum).toBeGreaterThan(0.7)
      expect(momentum).toBeLessThanOrEqual(1.0)
    })

    it('should handle habits with limited data', () => {
      const limitedData: SequencingData = {
        habit_id: 'habit-1',
        average_completion_time: 60000,
        completion_count: 1, // Very limited data
        quick_win_score: 0.5,
        last_updated: new Date().toISOString()
      }

      const momentum = calculateMomentumScore(limitedData)
      
      expect(momentum).toBeGreaterThan(0)
      expect(momentum).toBeLessThan(0.7) // Should be conservative with limited data
    })
  })

  describe('Integration with localStorage', () => {
    it('should persist sequencing data across sessions', () => {
      const mockData: SequencingData = {
        habit_id: 'habit-1',
        average_completion_time: 35000,
        completion_count: 3,
        quick_win_score: 0.85,
        last_updated: new Date().toISOString()
      }

      updateSequencingData(mockData)

      // Simulate new session
      const retrieved = getSequencingData()
      expect(retrieved.success).toBe(true)
      expect(retrieved.data?.[0]).toEqual(mockData)
    })

    it('should handle storage quota exceeded gracefully', () => {
      // Mock localStorage to simulate quota exceeded
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem')
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const mockData: SequencingData = {
        habit_id: 'habit-1',
        average_completion_time: 30000,
        completion_count: 1,
        quick_win_score: 0.9,
        last_updated: new Date().toISOString()
      }

      const result = updateSequencingData(mockData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('storage')

      mockSetItem.mockRestore()
    })
  })
})