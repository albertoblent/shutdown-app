/**
 * Smart Predictions API
 * Analyzes input patterns and generates intelligent value suggestions
 */

import type { Habit, InputPrediction } from '../../../types/data'
import { getInputHistory } from './defaults'

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable' | 'cyclical' | 'random' | 'insufficient'
  strength: number // 0-1, how strong the trend is
  nextPrediction: number
}

export interface PatternAnalysis {
  hasWeeklyPattern: boolean
  weekdayAverage: number
  weekendAverage: number
  consistency: number // 0-1, how consistent the values are
  commonValues: number[]
}

/**
 * Calculate trend from a series of values
 */
export const calculateTrend = (values: number[]): TrendAnalysis => {
  if (values.length < 2) {
    return {
      direction: 'insufficient',
      strength: 0,
      nextPrediction: values[0] || 0
    }
  }

  if (values.length < 3) {
    const diff = values[1] - values[0]
    return {
      direction: diff > 0 ? 'increasing' : diff < 0 ? 'decreasing' : 'stable',
      strength: Math.abs(diff) > 0.1 ? 0.5 : 1,
      nextPrediction: values[1] + diff
    }
  }

  // Check for stable pattern (all values similar)
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  if (stdDev < 0.5) {
    return {
      direction: 'stable',
      strength: 1,
      nextPrediction: mean
    }
  }

  // Check for cyclical pattern (alternating values)
  if (values.length >= 4) {
    const evenValues = values.filter((_, i) => i % 2 === 0)
    const oddValues = values.filter((_, i) => i % 2 === 1)
    
    const evenMean = evenValues.reduce((sum, val) => sum + val, 0) / evenValues.length
    const oddMean = oddValues.reduce((sum, val) => sum + val, 0) / oddValues.length
    
    const evenVariance = evenValues.reduce((sum, val) => sum + Math.pow(val - evenMean, 2), 0) / evenValues.length
    const oddVariance = oddValues.reduce((sum, val) => sum + Math.pow(val - oddMean, 2), 0) / oddValues.length
    
    if (Math.sqrt(evenVariance) < 0.5 && Math.sqrt(oddVariance) < 0.5 && Math.abs(evenMean - oddMean) > 0.5) {
      return {
        direction: 'cyclical',
        strength: 0.8,
        nextPrediction: values.length % 2 === 0 ? evenMean : oddMean
      }
    }
  }

  // Calculate linear trend
  const n = values.length
  const sumX = (n * (n - 1)) / 2 // Sum of indices 0,1,2...n-1
  const sumY = values.reduce((sum, val) => sum + val, 0)
  const sumXY = values.reduce((sum, val, i) => sum + val * i, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6 // Sum of squares 0²+1²+2²...

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate correlation coefficient to determine trend strength
  const meanX = sumX / n
  const meanY = sumY / n
  
  let numerator = 0
  let denomX = 0
  let denomY = 0
  
  values.forEach((val, i) => {
    numerator += (i - meanX) * (val - meanY)
    denomX += Math.pow(i - meanX, 2)
    denomY += Math.pow(val - meanY, 2)
  })
  
  const correlation = Math.abs(numerator / Math.sqrt(denomX * denomY))
  
  if (correlation < 0.3) {
    return {
      direction: 'random',
      strength: correlation,
      nextPrediction: mean
    }
  }

  const nextPrediction = slope * n + intercept
  
  return {
    direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
    strength: correlation,
    nextPrediction: Math.max(0, nextPrediction) // Ensure non-negative
  }
}

/**
 * Analyze input patterns for a habit
 */
export const analyzeInputPatterns = (habitId: string): PatternAnalysis => {
  const history = getInputHistory(habitId)
  
  if (!history || history.recent_values.length === 0) {
    return {
      hasWeeklyPattern: false,
      weekdayAverage: 0,
      weekendAverage: 0,
      consistency: 0,
      commonValues: []
    }
  }

  const values = history.recent_values
  
  // Calculate consistency (inverse of coefficient of variation)
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  const consistency = mean > 0 ? Math.max(0, 1 - (stdDev / mean)) : 1

  // For simplicity, assume weekly patterns would require more complex date tracking
  // This is a placeholder that could be enhanced with actual date-based analysis
  const hasWeeklyPattern = false
  const weekdayAverage = mean
  const weekendAverage = mean

  // Find common values (values that appear multiple times)
  const valueCounts: Record<number, number> = {}
  values.forEach(val => {
    valueCounts[val] = (valueCounts[val] || 0) + 1
  })
  
  const commonValues = Object.entries(valueCounts)
    .filter(([, count]) => count > 1)
    .map(([val]) => parseFloat(val))
    .sort((a, b) => valueCounts[b] - valueCounts[a])

  return {
    hasWeeklyPattern,
    weekdayAverage,
    weekendAverage,
    consistency,
    commonValues: commonValues.slice(0, 3) // Top 3 most common
  }
}

/**
 * Calculate confidence for a prediction value
 */
export const getPredictionConfidence = (habitId: string, value: number): number => {
  const history = getInputHistory(habitId)
  
  if (!history || history.recent_values.length === 0) {
    return 0.1 // Very low confidence without history
  }

  const values = history.recent_values
  const patterns = analyzeInputPatterns(habitId)
  
  // Base confidence on amount of data
  let confidence = Math.min(0.8, values.length / 10 * 0.8)
  
  // Boost confidence for consistent patterns
  confidence *= (0.3 + 0.7 * patterns.consistency)
  
  // Boost confidence if value is close to historical values
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)
  
  if (stdDev > 0) {
    const zScore = Math.abs(value - mean) / stdDev
    const proximityFactor = Math.max(0.1, 1 - (zScore / 3)) // Decrease confidence for outliers
    confidence *= proximityFactor
  }
  
  // Boost confidence for common values
  if (patterns.commonValues.includes(value)) {
    confidence *= 1.2
  }
  
  return Math.min(1, Math.max(0, confidence))
}

/**
 * Generate smart predictions based on historical patterns
 */
export const generateSmartPredictions = (habit: Habit): InputPrediction[] => {
  if (habit.type !== 'numeric') {
    return []
  }

  const predictions: InputPrediction[] = []
  const history = getInputHistory(habit.id)
  const patterns = analyzeInputPatterns(habit.id)
  
  // Add trend-based predictions
  if (history && history.recent_values.length >= 3) {
    const trend = calculateTrend(history.recent_values)
    
    if (trend.direction !== 'insufficient' && trend.strength > 0.4) {
      let predictedValue = trend.nextPrediction
      
      // Clamp to habit range if specified
      if (habit.configuration.numeric_range) {
        const [min, max] = habit.configuration.numeric_range
        predictedValue = Math.max(min, Math.min(max, predictedValue))
      }
      
      predictedValue = Math.round(predictedValue * 10) / 10 // Round to 1 decimal
      
      const confidence = getPredictionConfidence(habit.id, predictedValue) * trend.strength
      
      if (confidence > 0.3) {
        predictions.push({
          value: predictedValue,
          confidence,
          source: 'pattern',
          label: `${predictedValue} (${trend.direction})`
        })
      }
    }
  }

  // Add common values from history
  patterns.commonValues.forEach(commonValue => {
    const confidence = getPredictionConfidence(habit.id, commonValue)
    if (confidence > 0.4) {
      predictions.push({
        value: commonValue,
        confidence,
        source: 'pattern',
        label: `${commonValue} (common)`
      })
    }
  })

  // Add typical values based on habit configuration
  if (habit.configuration.numeric_range) {
    const [min, max] = habit.configuration.numeric_range
    const unit = habit.configuration.numeric_unit
    
    let typicalValues: number[] = []
    
    if (unit === 'hours') {
      typicalValues = [0, 0.5, 1, 2, 3, 4, 6, 8].filter(v => v >= min && v <= max)
    } else if (unit === 'minutes') {
      typicalValues = [0, 15, 30, 45, 60, 90, 120].filter(v => v >= min && v <= max)
    } else {
      // Generate quarter points for the range
      const range = max - min
      if (range <= 10) {
        typicalValues = Array.from({length: Math.min(6, range + 1)}, (_, i) => min + i)
      } else {
        typicalValues = [
          min,
          Math.round((min + (max - min) * 0.25) * 10) / 10,
          Math.round((min + (max - min) * 0.5) * 10) / 10,
          Math.round((min + (max - min) * 0.75) * 10) / 10,
          max
        ]
      }
    }
    
    typicalValues.forEach(value => {
      if (!predictions.find(p => p.value === value)) {
        const confidence = getPredictionConfidence(habit.id, value) || 0.2
        predictions.push({
          value,
          confidence,
          source: 'pattern',
          label: `${value}`
        })
      }
    })
  }

  // Sort by confidence descending and limit results
  return predictions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6) // Limit to 6 predictions
}