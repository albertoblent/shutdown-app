/**
 * Quick Defaults Bar Component
 * Shows yesterday's values and smart predictions as quick-tap buttons
 */

import type { InputPrediction } from '../../../types/data'
import styles from './QuickDefaultsBar.module.css'

interface QuickDefaultsBarProps {
  predictions: InputPrediction[]
  onValueSelect: (value: number | string) => void
  currentValue?: number | string
  className?: string
}

export function QuickDefaultsBar({ 
  predictions, 
  onValueSelect, 
  currentValue,
  className = '' 
}: QuickDefaultsBarProps) {
  if (predictions.length === 0) {
    return null
  }

  // Sort predictions by confidence and take top 5
  const topPredictions = predictions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)

  return (
    <div className={`${styles.container} ${className}`} role="group" aria-label="Quick value suggestions">
      <div className={styles.scrollContainer}>
        {topPredictions.map((prediction, index) => {
          const isSelected = currentValue === prediction.value
          const confidenceLevel = getConfidenceLevel(prediction.confidence)
          
          return (
            <button
              key={`${prediction.value}-${prediction.source}-${index}`}
              type="button"
              className={`${styles.defaultButton} ${styles[confidenceLevel]} ${isSelected ? styles.selected : ''}`}
              onClick={() => onValueSelect(prediction.value)}
              disabled={isSelected}
              aria-label={`Select ${prediction.value} (${prediction.source}, ${Math.round(prediction.confidence * 100)}% confidence)`}
              title={`${prediction.label} - ${Math.round(prediction.confidence * 100)}% confidence`}
            >
              <span className={styles.value}>{prediction.value}</span>
              <span className={styles.label}>{prediction.label}</span>
              <div 
                className={styles.confidenceBar}
                style={{ '--confidence': prediction.confidence } as React.CSSProperties}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
      
      <div className={styles.legend}>
        <span className={styles.legendText}>Tap for quick entry</span>
      </div>
    </div>
  )
}

/**
 * Get confidence level for styling
 */
function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}