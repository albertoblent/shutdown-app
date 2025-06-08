/**
 * Yesterday's Defaults and Quick Input API
 * Provides quick-tap defaults based on previous day's values and historical patterns
 */

import type { Habit, DailyEntry, InputHistory, InputPrediction } from '../../../types/data'
import { formatDate, getEntryKey } from '../../../types/data'

/**
 * Get yesterday's completed values as quick defaults
 */
export const getYesterdayDefaults = (
  habits: Habit[], 
  currentDate: Date = new Date()
): Map<string, boolean | number> => {
  const defaults = new Map<string, boolean | number>()
  
  try {
    // Calculate yesterday's date
    const yesterday = new Date(currentDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = getEntryKey(formatDate(yesterday))
    
    // Get yesterday's entry from storage
    const yesterdayData = localStorage.getItem(yesterdayKey)
    if (!yesterdayData) {
      return defaults
    }
    
    const yesterdayEntry: DailyEntry = JSON.parse(yesterdayData)
    
    // Only use completed entries
    if (!yesterdayEntry.is_complete) {
      return defaults
    }
    
    // Create a map of habit IDs for quick lookup
    const habitIds = new Set(habits.map(h => h.id))
    
    // Extract values for relevant habits
    yesterdayEntry.habit_completions.forEach(completion => {
      if (habitIds.has(completion.habit_id)) {
        const value = completion.value.boolean ?? completion.value.numeric
        if (value !== undefined) {
          defaults.set(completion.habit_id, value)
        }
      }
    })
    
  } catch (error) {
    // Silently handle JSON parse errors or other issues
    console.warn('Failed to load yesterday defaults:', error)
  }
  
  return defaults
}

/**
 * Save input history for a habit to improve predictions
 */
export const saveInputHistory = (
  habitId: string, 
  value: number, 
  completionTimeMs: number
): void => {
  try {
    const key = `input_history_${habitId}`
    const existing = getInputHistory(habitId)
    
    const history: InputHistory = existing || {
      habit_id: habitId,
      recent_values: [],
      average_value: 0,
      completion_times: [],
      last_updated: new Date().toISOString()
    }
    
    // Add new value, keeping only last 10 entries
    history.recent_values.push(value)
    if (history.recent_values.length > 10) {
      history.recent_values = history.recent_values.slice(-10)
    }
    
    // Add completion time, keeping only last 10 entries
    history.completion_times.push(completionTimeMs)
    if (history.completion_times.length > 10) {
      history.completion_times = history.completion_times.slice(-10)
    }
    
    // Update average
    history.average_value = history.recent_values.reduce((sum, val) => sum + val, 0) / history.recent_values.length
    
    // Update timestamp
    history.last_updated = new Date().toISOString()
    
    localStorage.setItem(key, JSON.stringify(history))
  } catch (error) {
    console.warn('Failed to save input history:', error)
  }
}

/**
 * Get input history for a habit
 */
export const getInputHistory = (habitId: string): InputHistory | null => {
  try {
    const key = `input_history_${habitId}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.warn('Failed to load input history:', error)
    return null
  }
}

/**
 * Get smart predictions based on patterns and yesterday's values
 */
export const getQuickDefaults = (
  habits: Habit[], 
  currentDate: Date = new Date()
): InputPrediction[] => {
  const predictions: InputPrediction[] = []
  
  // Get yesterday's values
  const yesterdayDefaults = getYesterdayDefaults(habits, currentDate)
  
  habits.forEach(habit => {
    if (habit.type !== 'numeric') {
      return // Only handle numeric habits for now
    }
    
    const habitPredictions: InputPrediction[] = []
    
    // Add yesterday's value if available
    const yesterdayValue = yesterdayDefaults.get(habit.id)
    if (typeof yesterdayValue === 'number') {
      habitPredictions.push({
        value: yesterdayValue,
        confidence: 0.8,
        source: 'yesterday',
        label: `${yesterdayValue} (yesterday)`
      })
    }
    
    // Add historical average if available
    const history = getInputHistory(habit.id)
    if (history && history.recent_values.length > 0) {
      const avgValue = Math.round(history.average_value * 10) / 10 // Round to 1 decimal
      
      // Only add if different from yesterday's value
      if (avgValue !== yesterdayValue) {
        const confidence = Math.min(0.7, history.recent_values.length / 10 * 0.7)
        habitPredictions.push({
          value: avgValue,
          confidence,
          source: 'average',
          label: `${avgValue} (avg)`
        })
      }
      
      // Add trending value (most recent value if different)
      const recentValue = history.recent_values[history.recent_values.length - 1]
      if (recentValue !== yesterdayValue && recentValue !== avgValue) {
        habitPredictions.push({
          value: recentValue,
          confidence: 0.6,
          source: 'trending',
          label: `${recentValue} (recent)`
        })
      }
    }
    
    // Add common pattern values if habit has numeric range
    if (habit.configuration.numeric_range) {
      const [min, max] = habit.configuration.numeric_range
      const commonValues = generateCommonValues(min, max, habit.configuration.numeric_unit)
      
      commonValues.forEach(commonValue => {
        // Only add if not already suggested
        if (!habitPredictions.find(p => p.value === commonValue)) {
          habitPredictions.push({
            value: commonValue,
            confidence: 0.3,
            source: 'pattern',
            label: `${commonValue}`
          })
        }
      })
    }
    
    predictions.push(...habitPredictions)
  })
  
  // Sort by confidence descending
  return predictions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Generate common values based on habit type and range
 */
const generateCommonValues = (min: number, max: number, unit?: string): number[] => {
  const values: number[] = []
  
  if (unit === 'hours') {
    // Common hour values
    [0, 0.5, 1, 1.5, 2, 3, 4, 6, 8].forEach(val => {
      if (val >= min && val <= max) {
        values.push(val)
      }
    })
  } else if (unit === 'minutes') {
    // Common minute values
    [0, 15, 30, 45, 60, 90, 120].forEach(val => {
      if (val >= min && val <= max) {
        values.push(val)
      }
    })
  } else {
    // Generic common values
    const range = max - min
    if (range <= 10) {
      // Small range: suggest every integer
      for (let i = min; i <= max; i++) {
        values.push(i)
      }
    } else {
      // Larger range: suggest quarters
      const quarter = range / 4
      const suggestions = [min, min + quarter, min + 2 * quarter, min + 3 * quarter, max]
      suggestions.forEach(val => {
        const rounded = Math.round(val * 10) / 10
        if (!values.includes(rounded)) {
          values.push(rounded)
        }
      })
    }
  }
  
  return values.slice(0, 5) // Limit to 5 suggestions per habit
}