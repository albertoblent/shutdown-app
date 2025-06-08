/**
 * Smart Prediction Chips Component
 * Shows AI-powered predictions based on patterns and history
 */

import { useState, useEffect } from 'react'
import { generateSmartPredictions } from '../api/predictions'
import type { Habit, InputPrediction } from '../../../types/data'
import styles from './SmartPredictionChips.module.css'

interface SmartPredictionChipsProps {
  habit: Habit
  onValueSelect: (value: number | string) => void
  currentValue?: number | string
  className?: string
}

export function SmartPredictionChips({ 
  habit, 
  onValueSelect, 
  currentValue,
  className = '' 
}: SmartPredictionChipsProps) {
  const [predictions, setPredictions] = useState<InputPrediction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPredictions = async () => {
      setIsLoading(true)
      try {
        const smartPredictions = generateSmartPredictions(habit)
        setPredictions(smartPredictions)
      } catch (error) {
        console.warn('Failed to generate predictions:', error)
        setPredictions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPredictions()
  }, [habit])

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loadingState}>
          <div className={styles.loadingChip} />
          <div className={styles.loadingChip} />
          <div className={styles.loadingChip} />
        </div>
      </div>
    )
  }

  if (predictions.length === 0) {
    return null
  }

  // Group predictions by source for better UX
  const groupedPredictions = predictions.reduce((groups, prediction) => {
    const group = groups[prediction.source] || []
    group.push(prediction)
    groups[prediction.source] = group
    return groups
  }, {} as Record<string, InputPrediction[]>)

  return (
    <div className={`${styles.container} ${className}`} role="group" aria-label="Smart predictions">
      <div className={styles.header}>
        <span className={styles.title}>Smart Suggestions</span>
        <span className={styles.subtitle}>Based on your patterns</span>
      </div>
      
      <div className={styles.chipContainer}>
        {Object.entries(groupedPredictions).map(([source, sourcePredictions]) => (
          <div key={source} className={styles.sourceGroup}>
            <span className={styles.sourceLabel}>{getSourceLabel(source)}</span>
            <div className={styles.chips}>
              {sourcePredictions.slice(0, 3).map((prediction, index) => {
                const isSelected = currentValue === prediction.value
                const confidenceClass = getConfidenceClass(prediction.confidence)
                
                return (
                  <button
                    key={`${prediction.value}-${source}-${index}`}
                    type="button"
                    className={`${styles.chip} ${styles[confidenceClass]} ${isSelected ? styles.selected : ''}`}
                    onClick={() => onValueSelect(prediction.value)}
                    disabled={isSelected}
                    aria-label={`Select ${prediction.value} (${Math.round(prediction.confidence * 100)}% confidence)`}
                    title={`${prediction.label} - ${Math.round(prediction.confidence * 100)}% confidence`}
                  >
                    <span className={styles.chipValue}>{prediction.value}</span>
                    {prediction.confidence > 0.8 && (
                      <span className={styles.highConfidenceBadge} aria-hidden="true">⭐</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Get human-readable source label
 */
function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    'yesterday': '🕐 Yesterday',
    'average': '📊 Average',
    'trending': '📈 Recent',
    'pattern': '🧠 Predicted'
  }
  return labels[source] || source
}

/**
 * Get CSS class for confidence level
 */
function getConfidenceClass(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}