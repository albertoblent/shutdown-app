/**
 * Quick-Win First Ordering Algorithm Tests
 * Tests for optimal habit sequencing based on psychological momentum
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateOptimizedSequence,
  calculateHabitPriority,
  applySequencingPreferences,
  validateSequence,
  reorderHabitsByMomentum,
  getSequenceRecommendations
} from '../api/ordering'
import type { 
  Habit, 
  SequencingData, 
  HabitGroup, 
  OptimizedSequence,
  SequencingPreferences 
} from '../../../types/data'

const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    name: 'Read for 30 minutes',
    type: 'numeric',
    atomic_prompt: 'Read a book or article',
    configuration: { numeric_unit: 'minutes', numeric_range: [5, 120] },
    position: 0,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'habit-2',
    name: 'Close laptop',
    type: 'boolean',
    atomic_prompt: 'Shut down and close laptop',
    configuration: {},
    position: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'habit-3',
    name: 'Set phone to Do Not Disturb',
    type: 'boolean',
    atomic_prompt: 'Enable DND mode on phone',
    configuration: {},
    position: 2,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'habit-4',
    name: 'Write daily reflection',
    type: 'numeric',
    atomic_prompt: 'Write thoughts in journal',
    configuration: { numeric_unit: 'minutes', numeric_range: [1, 30] },
    position: 3,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  }
]

const mockSequencingData: SequencingData[] = [
  {
    habit_id: 'habit-1',
    average_completion_time: 120000, // 2 minutes - slow
    completion_count: 10,
    quick_win_score: 0.3,
    last_updated: '2025-01-01T00:00:00Z'
  },
  {
    habit_id: 'habit-2',
    average_completion_time: 15000, // 15 seconds - very quick
    completion_count: 20,
    quick_win_score: 0.95,
    last_updated: '2025-01-01T00:00:00Z'
  },
  {
    habit_id: 'habit-3',
    average_completion_time: 10000, // 10 seconds - very quick
    completion_count: 25,
    quick_win_score: 0.98,
    last_updated: '2025-01-01T00:00:00Z'
  },
  {
    habit_id: 'habit-4',
    average_completion_time: 90000, // 1.5 minutes - medium
    completion_count: 8,
    quick_win_score: 0.6,
    last_updated: '2025-01-01T00:00:00Z'
  }
]

const mockGroups: HabitGroup[] = [
  {
    id: 'group-1',
    name: 'Digital Shutdown',
    habit_ids: ['habit-2', 'habit-3'],
    group_type: 'contextual',
    created_at: '2025-01-01T00:00:00Z'
  }
]

describe('Quick-Win First Ordering Algorithm', () => {
  beforeEach(() => {
    localStorage.clear()
    
    // Set up mock data in localStorage
    localStorage.setItem('shutdown_sequencing_data', JSON.stringify(mockSequencingData))
    localStorage.setItem('shutdown_habit_groups', JSON.stringify(mockGroups))
  })

  describe('generateOptimizedSequence', () => {
    it('should order habits with quick wins first', () => {
      const result = generateOptimizedSequence(mockHabits)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBe(4)

      // Should order by quick win score: habit-3 (0.98), habit-2 (0.95), habit-4 (0.6), habit-1 (0.3)
      const sequence = result.data!
      expect(sequence[0].habit_id).toBe('habit-3') // Highest quick win score
      expect(sequence[1].habit_id).toBe('habit-2') // Second highest
      expect(sequence[2].habit_id).toBe('habit-4') // Third
      expect(sequence[3].habit_id).toBe('habit-1') // Lowest quick win score
    })

    it('should respect group constraints', () => {
      const result = generateOptimizedSequence(mockHabits)

      expect(result.success).toBe(true)
      
      const sequence = result.data!
      // habit-2 and habit-3 are in the same group, should be adjacent or close
      const habit2Index = sequence.findIndex(s => s.habit_id === 'habit-2')
      const habit3Index = sequence.findIndex(s => s.habit_id === 'habit-3')
      
      expect(Math.abs(habit2Index - habit3Index)).toBeLessThanOrEqual(1)
    })

    it('should provide momentum scores and reasoning', () => {
      const result = generateOptimizedSequence(mockHabits)

      expect(result.success).toBe(true)
      
      result.data!.forEach((item, index) => {
        expect(item.position).toBe(index)
        expect(item.momentum_score).toBeGreaterThanOrEqual(0)
        expect(item.momentum_score).toBeLessThanOrEqual(1)
        expect(item.reasoning).toBeDefined()
        expect(item.reasoning.length).toBeGreaterThan(0)
      })
    })

    it('should handle habits without sequencing data', () => {
      const newHabit: Habit = {
        id: 'habit-new',
        name: 'New habit',
        type: 'boolean',
        atomic_prompt: 'Do something new',
        configuration: {},
        position: 4,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z'
      }

      const habitsWithNew = [...mockHabits, newHabit]
      const result = generateOptimizedSequence(habitsWithNew)

      expect(result.success).toBe(true)
      expect(result.data!.length).toBe(5)
      
      // New habit should be assigned a default position
      const newHabitInSequence = result.data!.find(s => s.habit_id === 'habit-new')
      expect(newHabitInSequence).toBeDefined()
      expect(newHabitInSequence!.reasoning).toContain('default')
    })
  })

  describe('calculateHabitPriority', () => {
    it('should calculate priority based on quick win score and momentum', () => {
      const quickHabit = mockSequencingData.find(d => d.habit_id === 'habit-3')!
      const slowHabit = mockSequencingData.find(d => d.habit_id === 'habit-1')!

      const quickPriority = calculateHabitPriority(quickHabit, mockGroups)
      const slowPriority = calculateHabitPriority(slowHabit, mockGroups)

      expect(quickPriority.score).toBeGreaterThan(slowPriority.score)
      expect(quickPriority.factors).toContain('quick_win')
      expect(quickPriority.factors).toContain('grouped')  // habit-3 is in a group
    })

    it('should boost priority for grouped habits', () => {
      const groupedHabit = mockSequencingData.find(d => d.habit_id === 'habit-2')!
      const ungroupedHabit = mockSequencingData.find(d => d.habit_id === 'habit-1')!

      const groupedPriority = calculateHabitPriority(groupedHabit, mockGroups)
      const ungroupedPriority = calculateHabitPriority(ungroupedHabit, mockGroups)

      expect(groupedPriority.factors).toContain('grouped')
      expect(ungroupedPriority.factors).not.toContain('grouped')
    })

    it('should handle missing sequencing data gracefully', () => {
      const newData: SequencingData = {
        habit_id: 'habit-new',
        average_completion_time: 0,
        completion_count: 0,
        quick_win_score: 0.5, // Default score
        last_updated: new Date().toISOString()
      }

      const priority = calculateHabitPriority(newData, mockGroups)

      expect(priority.score).toBeGreaterThan(0)
      expect(priority.factors).toContain('default')
    })
  })

  describe('applySequencingPreferences', () => {
    it('should respect manual ordering when override is enabled', () => {
      const preferences: SequencingPreferences = {
        manual_order: ['habit-1', 'habit-4', 'habit-2', 'habit-3'],
        disabled_grouping: false,
        quick_wins_first: true,
        adapt_to_patterns: true,
        override_algorithm: true
      }

      const baseSequence: OptimizedSequence[] = [
        { habit_id: 'habit-3', position: 0, momentum_score: 0.9, reasoning: 'Quick win' },
        { habit_id: 'habit-2', position: 1, momentum_score: 0.85, reasoning: 'Quick win' },
        { habit_id: 'habit-4', position: 2, momentum_score: 0.6, reasoning: 'Medium' },
        { habit_id: 'habit-1', position: 3, momentum_score: 0.3, reasoning: 'Slow' }
      ]

      const result = applySequencingPreferences(baseSequence, preferences)

      expect(result.success).toBe(true)
      
      // Should follow manual order exactly
      const sequence = result.data!
      expect(sequence[0].habit_id).toBe('habit-1')
      expect(sequence[1].habit_id).toBe('habit-4')
      expect(sequence[2].habit_id).toBe('habit-2')
      expect(sequence[3].habit_id).toBe('habit-3')
    })

    it('should apply quick wins first when enabled', () => {
      const preferences: SequencingPreferences = {
        disabled_grouping: false,
        quick_wins_first: true,
        adapt_to_patterns: true,
        override_algorithm: false
      }

      const baseSequence: OptimizedSequence[] = [
        { habit_id: 'habit-1', position: 0, momentum_score: 0.3, reasoning: 'Slow' },
        { habit_id: 'habit-3', position: 1, momentum_score: 0.9, reasoning: 'Quick win' }
      ]

      const result = applySequencingPreferences(baseSequence, preferences)

      expect(result.success).toBe(true)
      
      // Should reorder to put quick wins first
      const sequence = result.data!
      expect(sequence[0].habit_id).toBe('habit-3') // Quick win should be first
      expect(sequence[1].habit_id).toBe('habit-1')
    })

    it('should disable grouping when requested', () => {
      const preferences: SequencingPreferences = {
        disabled_grouping: true,
        quick_wins_first: true,
        adapt_to_patterns: true,
        override_algorithm: false
      }

      const baseSequence: OptimizedSequence[] = [
        { habit_id: 'habit-2', position: 0, group_id: 'group-1', momentum_score: 0.85, reasoning: 'Grouped' },
        { habit_id: 'habit-3', position: 1, group_id: 'group-1', momentum_score: 0.9, reasoning: 'Grouped' }
      ]

      const result = applySequencingPreferences(baseSequence, preferences)

      expect(result.success).toBe(true)
      
      // Should remove group_id from all items
      const sequence = result.data!
      sequence.forEach(item => {
        expect(item.group_id).toBeUndefined()
      })
    })
  })

  describe('validateSequence', () => {
    it('should validate correct sequence structure', () => {
      const validSequence: OptimizedSequence[] = [
        { habit_id: 'habit-1', position: 0, momentum_score: 0.8, reasoning: 'Quick win' },
        { habit_id: 'habit-2', position: 1, momentum_score: 0.6, reasoning: 'Medium' },
        { habit_id: 'habit-3', position: 2, momentum_score: 0.9, reasoning: 'Fast' },
        { habit_id: 'habit-4', position: 3, momentum_score: 0.5, reasoning: 'Final' }
      ]

      const result = validateSequence(validSequence, mockHabits)

      expect(result.success).toBe(true)
    })

    it('should detect missing habits', () => {
      const incompleteSequence: OptimizedSequence[] = [
        { habit_id: 'habit-1', position: 0, momentum_score: 0.8, reasoning: 'Quick win' }
        // Missing other habits
      ]

      const result = validateSequence(incompleteSequence, mockHabits)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Missing habits')
    })

    it('should detect duplicate positions', () => {
      const invalidSequence: OptimizedSequence[] = [
        { habit_id: 'habit-1', position: 0, momentum_score: 0.8, reasoning: 'Quick win' },
        { habit_id: 'habit-2', position: 0, momentum_score: 0.6, reasoning: 'Medium' } // Duplicate position
      ]

      const result = validateSequence(invalidSequence, mockHabits)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Duplicate position')
    })

    it('should detect invalid habit IDs', () => {
      const invalidSequence: OptimizedSequence[] = [
        { habit_id: 'non-existent-habit', position: 0, momentum_score: 0.8, reasoning: 'Quick win' }
      ]

      const result = validateSequence(invalidSequence, mockHabits)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid habit ID')
    })
  })

  describe('reorderHabitsByMomentum', () => {
    it('should reorder habits to maximize psychological momentum', () => {
      const habits = [...mockHabits]
      const result = reorderHabitsByMomentum(habits)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      const reordered = result.data!
      
      // Should start with highest momentum habits
      expect(reordered[0].momentum_score).toBeGreaterThanOrEqual(reordered[1].momentum_score)
      expect(reordered[1].momentum_score).toBeGreaterThanOrEqual(reordered[2].momentum_score)
    })

    it('should provide momentum building rationale', () => {
      const result = reorderHabitsByMomentum(mockHabits)

      expect(result.success).toBe(true)
      
      result.data!.forEach(item => {
        expect(item.reasoning).toBeDefined()
        expect(['momentum_builder', 'quick_win', 'grouped', 'completion'].some(r => 
          item.reasoning.includes(r)
        )).toBe(true)
      })
    })
  })

  describe('getSequenceRecommendations', () => {
    it('should provide actionable recommendations for sequence optimization', () => {
      const sequence: OptimizedSequence[] = [
        { habit_id: 'habit-1', position: 0, momentum_score: 0.3, reasoning: 'Slow habit' },
        { habit_id: 'habit-3', position: 1, momentum_score: 0.9, reasoning: 'Quick win' }
      ]

      const result = getSequenceRecommendations(sequence)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBeGreaterThan(0)

      const recommendations = result.data!
      
      // Should recommend moving quick wins earlier
      const quickWinRec = recommendations.find(r => r.type === 'reorder')
      expect(quickWinRec).toBeDefined()
      expect(quickWinRec!.confidence).toBeGreaterThan(0.5)
    })

    it('should suggest grouping improvements', () => {
      const sequence: OptimizedSequence[] = [
        { habit_id: 'habit-2', position: 0, momentum_score: 0.85, reasoning: 'Quick win' },
        { habit_id: 'habit-1', position: 1, momentum_score: 0.3, reasoning: 'Slow' },
        { habit_id: 'habit-3', position: 2, momentum_score: 0.9, reasoning: 'Quick win' }
      ]

      const result = getSequenceRecommendations(sequence)

      expect(result.success).toBe(true)
      
      const groupingRec = result.data!.find(r => r.type === 'grouping')
      expect(groupingRec).toBeDefined()
    })

    it('should handle optimal sequences gracefully', () => {
      const optimalSequence: OptimizedSequence[] = [
        { habit_id: 'habit-3', position: 0, group_id: 'group-1', momentum_score: 0.9, reasoning: 'Perfect quick win' },
        { habit_id: 'habit-2', position: 1, group_id: 'group-1', momentum_score: 0.85, reasoning: 'Grouped quick win' },
        { habit_id: 'habit-4', position: 2, momentum_score: 0.6, reasoning: 'Good momentum' },
        { habit_id: 'habit-1', position: 3, momentum_score: 0.3, reasoning: 'Final task' }
      ]

      const result = getSequenceRecommendations(optimalSequence)

      expect(result.success).toBe(true)
      
      // Should have few or no recommendations for optimal sequence
      const recommendations = result.data!
      expect(recommendations.length).toBeLessThanOrEqual(2)
      
      if (recommendations.length > 0) {
        recommendations.forEach(rec => {
          expect(rec.confidence).toBeLessThanOrEqual(0.8) // Low to medium confidence for already good sequence
        })
      }
    })
  })

  describe('Integration with localStorage', () => {
    it('should use stored sequencing data for ordering', () => {
      const result = generateOptimizedSequence(mockHabits)

      expect(result.success).toBe(true)
      
      // Should use the quick win scores from localStorage
      const sequence = result.data!
      const quickHabit = sequence.find(s => s.habit_id === 'habit-3')
      expect(quickHabit!.position).toBe(0) // Should be first due to high quick win score
    })

    it('should handle missing localStorage data gracefully', () => {
      localStorage.removeItem('shutdown_sequencing_data')
      
      const result = generateOptimizedSequence(mockHabits)

      expect(result.success).toBe(true)
      
      // Should still provide ordering with default scores
      const sequence = result.data!
      expect(sequence.length).toBe(mockHabits.length)
      sequence.forEach(item => {
        expect(item.reasoning).toContain('default')
      })
    })
  })
})