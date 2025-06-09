/**
 * Completion Time Tracking API
 * Records and analyzes habit completion times for sequencing optimization
 */

import type { 
  HabitCompletion, 
  SequencingData
} from '../../../types/data'
import { formatTimestamp } from '../../../types/data'

interface StorageResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Records completion time for a habit and updates sequencing data
 */
export function trackCompletionTime(completion: HabitCompletion): StorageResult<SequencingData> {
  try {
    // Validate completion data
    if (!completion.habit_id || completion.time_to_complete < 0) {
      return {
        success: false,
        error: 'Invalid completion data: habit_id required and time_to_complete must be non-negative'
      }
    }

    const existingData = getSequencingDataArray()
    const habitIndex = existingData.findIndex(data => data.habit_id === completion.habit_id)

    let updatedData: SequencingData

    if (habitIndex >= 0) {
      // Update existing data
      const existing = existingData[habitIndex]
      const totalTime = (existing.average_completion_time * existing.completion_count) + completion.time_to_complete
      const newCount = existing.completion_count + 1
      const newAverage = totalTime / newCount

      updatedData = {
        ...existing,
        average_completion_time: newAverage,
        completion_count: newCount,
        quick_win_score: getQuickWinScore(newAverage),
        last_updated: formatTimestamp(new Date())
      }

      existingData[habitIndex] = updatedData
    } else {
      // Create new data entry
      updatedData = {
        habit_id: completion.habit_id,
        average_completion_time: completion.time_to_complete,
        completion_count: 1,
        quick_win_score: getQuickWinScore(completion.time_to_complete),
        last_updated: formatTimestamp(new Date())
      }

      existingData.push(updatedData)
    }

    // Save to localStorage
    const saveResult = saveSequencingData(existingData)
    if (!saveResult.success) {
      return { success: false, error: saveResult.error }
    }

    return { success: true, data: updatedData }
  } catch (error) {
    return {
      success: false,
      error: `Failed to track completion time: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Gets average completion time for a specific habit
 */
export function getAverageCompletionTime(habitId: string): number | null {
  try {
    const data = getSequencingDataArray()
    const habitData = data.find(d => d.habit_id === habitId)
    return habitData?.average_completion_time ?? null
  } catch {
    return null
  }
}

/**
 * Calculates quick win score based on completion time
 * Score ranges from 0 (slow) to 1 (very fast)
 */
export function getQuickWinScore(completionTimeMs: number): number {
  if (completionTimeMs <= 0) return 1.0

  // Quick win thresholds (in milliseconds)
  const VERY_FAST = 30000    // 30 seconds = 1.0 score
  const FAST = 60000         // 1 minute = 0.8 score  
  const MEDIUM = 120000      // 2 minutes = 0.4 score
  const SLOW = 300000        // 5 minutes = 0.0 score

  if (completionTimeMs <= VERY_FAST) {
    return 1.0
  } else if (completionTimeMs <= FAST) {
    // Linear interpolation between 1.0 and 0.8
    return 1.0 - (0.2 * (completionTimeMs - VERY_FAST) / (FAST - VERY_FAST))
  } else if (completionTimeMs <= MEDIUM) {
    // Linear interpolation between 0.8 and 0.4
    return 0.8 - (0.4 * (completionTimeMs - FAST) / (MEDIUM - FAST))
  } else if (completionTimeMs <= SLOW) {
    // Linear interpolation between 0.4 and 0.0
    return 0.4 - (0.4 * (completionTimeMs - MEDIUM) / (SLOW - MEDIUM))
  } else {
    return 0.0
  }
}

/**
 * Updates or creates sequencing data entry
 */
export function updateSequencingData(data: SequencingData): StorageResult<boolean> {
  try {
    const existingData = getSequencingDataArray()
    const habitIndex = existingData.findIndex(d => d.habit_id === data.habit_id)

    if (habitIndex >= 0) {
      existingData[habitIndex] = data
    } else {
      existingData.push(data)
    }

    return saveSequencingData(existingData)
  } catch (error) {
    return {
      success: false,
      error: `Failed to update sequencing data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Gets all sequencing data
 */
export function getSequencingData(): StorageResult<SequencingData[]> {
  try {
    const data = getSequencingDataArray()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: `Failed to get sequencing data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Calculates momentum score based on completion patterns
 * Higher scores indicate better momentum builders
 */
export function calculateMomentumScore(data: SequencingData): number {
  const quickWinWeight = 0.6
  const consistencyWeight = 0.4

  // Quick win component (already 0-1 scale)
  const quickWinComponent = data.quick_win_score

  // Consistency component based on completion count
  // More completions = more reliable data = higher consistency
  const maxCompletions = 20 // After 20 completions, consider it fully consistent
  const consistencyComponent = Math.min(data.completion_count / maxCompletions, 1.0)

  return (quickWinWeight * quickWinComponent) + (consistencyWeight * consistencyComponent)
}

// Private helper functions

function getSequencingDataArray(): SequencingData[] {
  try {
    const stored = localStorage.getItem('shutdown_sequencing_data')
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSequencingData(data: SequencingData[]): StorageResult<boolean> {
  try {
    localStorage.setItem('shutdown_sequencing_data', JSON.stringify(data))
    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: `Failed to save to storage: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}