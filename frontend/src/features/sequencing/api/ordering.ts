/**
 * Quick-Win First Ordering Algorithm
 * Optimizes habit sequence for maximum psychological momentum
 */

import type {
  Habit,
  SequencingData,
  HabitGroup,
  OptimizedSequence,
  SequencingPreferences
} from '../../../types/data'
import { getSequencingData } from './timeTracking'
import { getHabitGroups } from './grouping'

interface StorageResult<T> {
  success: boolean
  data?: T
  error?: string
}

interface HabitPriority {
  habit_id: string
  score: number
  factors: string[]
}

interface SequenceRecommendation {
  type: 'reorder' | 'grouping' | 'timing' | 'optimization'
  title: string
  description: string
  confidence: number
  action?: {
    move_habit: string
    to_position: number
  }
}

/**
 * Generates an optimized habit sequence prioritizing quick wins for momentum
 */
export function generateOptimizedSequence(habits: Habit[]): StorageResult<OptimizedSequence[]> {
  try {
    if (habits.length === 0) {
      return { success: true, data: [] }
    }

    // Get sequencing data and groups
    const sequencingResult = getSequencingData()
    const groupsResult = getHabitGroups()
    
    const sequencingData = sequencingResult.success ? sequencingResult.data! : []
    const groups = groupsResult.success ? groupsResult.data! : []

    // Calculate priorities for each habit
    const priorities: HabitPriority[] = habits.map(habit => {
      const data = sequencingData.find(d => d.habit_id === habit.id)
      if (data) {
        return calculateHabitPriority(data, groups)
      } else {
        // Default priority for habits without data
        return {
          habit_id: habit.id,
          score: 0.5, // Neutral priority
          factors: ['default', 'no_data']
        }
      }
    })

    // Sort by priority score (highest first), with quick win score as tiebreaker
    priorities.sort((a, b) => {
      const scoreDiff = b.score - a.score
      if (Math.abs(scoreDiff) < 0.001) { // Essentially equal scores
        // Use quick win score from sequencing data as tiebreaker
        const aData = sequencingData.find(d => d.habit_id === a.habit_id)
        const bData = sequencingData.find(d => d.habit_id === b.habit_id)
        const aQuickWin = aData?.quick_win_score || 0.5
        const bQuickWin = bData?.quick_win_score || 0.5
        return bQuickWin - aQuickWin
      }
      return scoreDiff
    })

    // Apply group constraints
    const groupedSequence = applyGroupConstraints(priorities, groups)

    // Generate final sequence with momentum scores and reasoning
    const optimizedSequence: OptimizedSequence[] = groupedSequence.map((priority, index) => {
      const data = sequencingData.find(d => d.habit_id === priority.habit_id)
      const group = groups.find(g => g.habit_ids.includes(priority.habit_id))

      return {
        habit_id: priority.habit_id,
        position: index,
        group_id: group?.id,
        momentum_score: priority.score,
        reasoning: generateReasoning(priority, data, group, index)
      }
    })

    return { success: true, data: optimizedSequence }
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate optimized sequence: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Calculates priority score for a habit based on multiple factors
 */
export function calculateHabitPriority(data: SequencingData, groups: HabitGroup[]): HabitPriority {
  let score = 0
  const factors: string[] = []

  // Base score from quick win score (0-1)
  score += data.quick_win_score * 0.6
  if (data.quick_win_score > 0.7) {
    factors.push('quick_win')
  }

  // Completion consistency bonus
  const consistencyScore = Math.min(data.completion_count / 20, 1.0) * 0.2
  score += consistencyScore
  if (data.completion_count > 10) {
    factors.push('consistent')
  }

  // Group membership bonus (grouped habits work better together)
  const isGrouped = groups.some(group => group.habit_ids.includes(data.habit_id))
  if (isGrouped) {
    score += 0.15
    factors.push('grouped')
  }

  // Speed bonus (faster habits build momentum)
  if (data.average_completion_time < 30000) { // Under 30 seconds
    score += 0.1
    factors.push('fast')
  }

  // Default factors for new habits
  if (data.completion_count === 0) {
    factors.push('default')
  }

  return {
    habit_id: data.habit_id,
    score: Math.min(score, 1.0),
    factors
  }
}

/**
 * Applies user preferences to modify the sequence
 */
export function applySequencingPreferences(
  baseSequence: OptimizedSequence[],
  preferences: SequencingPreferences
): StorageResult<OptimizedSequence[]> {
  try {
    let sequence = [...baseSequence]

    // Apply manual override if specified
    if (preferences.override_algorithm && preferences.manual_order) {
      sequence = applyManualOrder(sequence, preferences.manual_order)
    } else {
      // Apply individual preferences
      if (preferences.quick_wins_first) {
        sequence = prioritizeQuickWins(sequence)
      }

      if (preferences.disabled_grouping) {
        sequence = removeGrouping(sequence)
      }
    }

    // Update positions after reordering
    sequence.forEach((item, index) => {
      item.position = index
    })

    return { success: true, data: sequence }
  } catch (error) {
    return {
      success: false,
      error: `Failed to apply preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validates that a sequence is properly structured
 */
export function validateSequence(sequence: OptimizedSequence[], habits: Habit[]): StorageResult<boolean> {
  try {
    const habitIds = new Set(habits.map(h => h.id))

    // Check for invalid habit IDs first
    const invalidHabits = sequence.filter(s => !habitIds.has(s.habit_id))
    if (invalidHabits.length > 0) {
      return { success: false, error: `Invalid habit ID: ${invalidHabits[0].habit_id}` }
    }

    // Check for duplicate positions
    const positions = sequence.map(s => s.position)
    const uniquePositions = new Set(positions)
    if (positions.length !== uniquePositions.size) {
      return { success: false, error: 'Duplicate position found in sequence' }
    }

    // Check all habits are present
    const sequenceHabitIds = new Set(sequence.map(s => s.habit_id))
    const missingHabits = [...habitIds].filter(id => !sequenceHabitIds.has(id))
    if (missingHabits.length > 0) {
      return { success: false, error: `Missing habits in sequence: ${missingHabits.join(', ')}` }
    }

    // Check positions are sequential
    const sortedPositions = [...positions].sort((a, b) => a - b)
    for (let i = 0; i < sortedPositions.length; i++) {
      if (sortedPositions[i] !== i) {
        return { success: false, error: 'Positions must be sequential starting from 0' }
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Reorders habits to maximize psychological momentum
 */
export function reorderHabitsByMomentum(habits: Habit[]): StorageResult<OptimizedSequence[]> {
  try {
    // Generate base sequence
    const baseResult = generateOptimizedSequence(habits)
    if (!baseResult.success) {
      return baseResult
    }

    let sequence = baseResult.data!

    // Apply momentum optimization
    sequence = optimizeForMomentum(sequence)

    // Update reasoning to reflect momentum optimization
    sequence.forEach((item, index) => {
      if (index === 0) {
        item.reasoning = 'momentum_builder - ' + item.reasoning
      } else if (item.momentum_score > 0.8) {
        item.reasoning = 'quick_win - ' + item.reasoning
      } else if (item.group_id) {
        item.reasoning = 'grouped - ' + item.reasoning
      } else {
        item.reasoning = 'completion - ' + item.reasoning
      }
    })

    return { success: true, data: sequence }
  } catch (error) {
    return {
      success: false,
      error: `Failed to reorder by momentum: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Provides recommendations for improving the sequence
 */
export function getSequenceRecommendations(
  sequence: OptimizedSequence[]
  // Note: habits parameter removed as it's not currently used in analysis
): StorageResult<SequenceRecommendation[]> {
  try {
    const recommendations: SequenceRecommendation[] = []

    // Check if quick wins are early enough
    const quickWinRecommendation = analyzeQuickWinPlacement(sequence)
    if (quickWinRecommendation) {
      recommendations.push(quickWinRecommendation)
    }

    // Check grouping efficiency
    const groupingRecommendation = analyzeGrouping(sequence)
    if (groupingRecommendation) {
      recommendations.push(groupingRecommendation)
    }

    // Check for momentum gaps
    const momentumRecommendation = analyzeMomentumFlow(sequence)
    if (momentumRecommendation) {
      recommendations.push(momentumRecommendation)
    }

    // Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence)

    return { success: true, data: recommendations }
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Private helper functions

function applyGroupConstraints(priorities: HabitPriority[], groups: HabitGroup[]): HabitPriority[] {
  const result = [...priorities]
  
  // For each group, try to keep habits together while respecting their individual priorities
  for (const group of groups) {
    const groupHabits = result.filter(p => group.habit_ids.includes(p.habit_id))
    if (groupHabits.length > 1) {
      // Sort group habits by their priority scores
      groupHabits.sort((a, b) => b.score - a.score)
      
      // Find position of the highest priority habit in the group
      const highestPriorityHabit = groupHabits[0]
      const targetIndex = result.findIndex(p => p.habit_id === highestPriorityHabit.habit_id)
      
      // Remove all group habits from current positions
      groupHabits.forEach(habit => {
        const index = result.findIndex(p => p.habit_id === habit.habit_id)
        if (index >= 0) {
          result.splice(index, 1)
        }
      })
      
      // Insert group habits together at target position, maintaining their priority order
      result.splice(targetIndex, 0, ...groupHabits)
    }
  }
  
  return result
}

function generateReasoning(
  priority: HabitPriority,
  _data?: SequencingData,
  group?: HabitGroup,
  position?: number
): string {
  const reasons: string[] = []

  if (priority.factors.includes('quick_win')) {
    reasons.push('quick win')
  }
  if (priority.factors.includes('grouped') && group) {
    reasons.push(`grouped with ${group.name}`)
  }
  if (priority.factors.includes('fast')) {
    reasons.push('fast completion')
  }
  if (priority.factors.includes('consistent')) {
    reasons.push('consistent performance')
  }
  if (priority.factors.includes('default')) {
    reasons.push('default positioning')
  }

  if (position === 0) {
    reasons.unshift('momentum starter')
  }

  return reasons.join(', ') || 'balanced positioning'
}

function applyManualOrder(sequence: OptimizedSequence[], manualOrder: string[]): OptimizedSequence[] {
  const orderedSequence: OptimizedSequence[] = []
  
  // Add habits in manual order
  for (const habitId of manualOrder) {
    const item = sequence.find(s => s.habit_id === habitId)
    if (item) {
      orderedSequence.push({
        ...item,
        reasoning: 'Manual override - ' + item.reasoning
      })
    }
  }
  
  // Add any remaining habits not in manual order
  for (const item of sequence) {
    if (!manualOrder.includes(item.habit_id)) {
      orderedSequence.push(item)
    }
  }
  
  return orderedSequence
}

function prioritizeQuickWins(sequence: OptimizedSequence[]): OptimizedSequence[] {
  return [...sequence].sort((a, b) => b.momentum_score - a.momentum_score)
}

function removeGrouping(sequence: OptimizedSequence[]): OptimizedSequence[] {
  return sequence.map(item => ({
    ...item,
    group_id: undefined,
    reasoning: item.reasoning.replace(/grouped[^,]*,?\s*/g, '').trim()
  }))
}

function optimizeForMomentum(sequence: OptimizedSequence[]): OptimizedSequence[] {
  // Simple momentum optimization: ensure highest momentum habits are early
  const momentumSorted = [...sequence].sort((a, b) => {
    // Prioritize high momentum first, but keep groups together
    if (a.group_id && b.group_id && a.group_id === b.group_id) {
      return a.position - b.position // Keep group order
    }
    return b.momentum_score - a.momentum_score
  })
  
  return momentumSorted
}

function analyzeQuickWinPlacement(sequence: OptimizedSequence[]): SequenceRecommendation | null {
  const quickWins = sequence.filter(s => s.momentum_score > 0.8)
  
  if (quickWins.length > 0) {
    // Find the first quick win that's not in an optimal early position
    const laterQuickWin = quickWins.find(qw => qw.position > 0)
    
    if (laterQuickWin) {
      return {
        type: 'reorder',
        title: 'Move Quick Wins Earlier',
        description: 'Moving high-momentum habits earlier will improve psychological flow',
        confidence: 0.8,
        action: {
          move_habit: laterQuickWin.habit_id,
          to_position: 0
        }
      }
    }
  }
  
  return null
}

function analyzeGrouping(sequence: OptimizedSequence[]): SequenceRecommendation | null {
  const grouped = sequence.filter(s => s.group_id)
  const groups = new Set(grouped.map(s => s.group_id))
  
  // Check for scattered grouped habits
  for (const groupId of groups) {
    const groupItems = sequence.filter(s => s.group_id === groupId)
    if (groupItems.length > 1) {
      const positions = groupItems.map(item => item.position)
      const minPos = Math.min(...positions)
      const maxPos = Math.max(...positions)
      
      // If the span is larger than the number of items, they're scattered
      if (maxPos - minPos >= groupItems.length) {
        return {
          type: 'grouping',
          title: 'Consolidate Grouped Habits',
          description: 'Grouping related habits together improves flow and reduces context switching',
          confidence: 0.7
        }
      }
    }
  }
  
  // Also check for habits that could be grouped but aren't
  const ungrouped = sequence.filter(s => !s.group_id)
  if (ungrouped.length >= 2) {
    // Look for habits that seem similar (high momentum scores close together)
    const highMomentumUngrouped = ungrouped.filter(s => s.momentum_score > 0.8)
    if (highMomentumUngrouped.length >= 2) {
      return {
        type: 'grouping',
        title: 'Consider Grouping Similar Habits',
        description: 'Creating groups for similar high-momentum habits can improve flow',
        confidence: 0.6
      }
    }
  }
  
  return null
}

function analyzeMomentumFlow(sequence: OptimizedSequence[]): SequenceRecommendation | null {
  // Check for momentum drops (high score followed by very low score)
  for (let i = 0; i < sequence.length - 1; i++) {
    const current = sequence[i]
    const next = sequence[i + 1]
    
    if (current.momentum_score > 0.8 && next.momentum_score < 0.3) {
      return {
        type: 'timing',
        title: 'Smooth Momentum Transition',
        description: 'Consider placing a medium-momentum habit between high and low momentum tasks',
        confidence: 0.6
      }
    }
  }
  
  return null
}