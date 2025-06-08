import { useState } from 'react'
import type { Habit } from '../../types/data'
import styles from './HabitCompletionCard.module.css'

interface HabitCompletionCardProps {
  habit: Habit
  isCompleted: boolean
  completedValue?: boolean | number
  onComplete: (habitId: string, value: boolean | number) => void
}

export function HabitCompletionCard({ 
  habit, 
  isCompleted, 
  completedValue,
  onComplete 
}: HabitCompletionCardProps) {
  const [numericValue, setNumericValue] = useState<string>('')

  const handleBooleanComplete = () => {
    if (!isCompleted) {
      onComplete(habit.id, true)
    }
  }

  const handleNumericSubmit = () => {
    const value = parseFloat(numericValue)
    if (!isNaN(value) && value >= 0) {
      onComplete(habit.id, value)
      setNumericValue('')
    }
  }

  const handleNumericKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNumericSubmit()
    }
  }

  const renderCompletionControl = () => {
    if (habit.type === 'boolean') {
      return (
        <button 
          className={styles.completeButton}
          onClick={handleBooleanComplete}
          disabled={isCompleted}
          aria-label={isCompleted ? 'Habit completed' : `Complete ${habit.name}`}
        >
          {isCompleted ? 'Completed' : 'Mark Complete'}
        </button>
      )
    }

    if (habit.type === 'numeric') {
      if (isCompleted && typeof completedValue === 'number') {
        return (
          <div className={styles.completedValue}>
            {completedValue}
          </div>
        )
      }

      return (
        <div className={styles.completionSection}>
          <input
            type="number"
            min="0"
            step="any"
            value={numericValue}
            onChange={(e) => setNumericValue(e.target.value)}
            onKeyDown={handleNumericKeyDown}
            className={styles.numericInput}
            placeholder="0"
            aria-label={`Enter value for ${habit.name}`}
          />
          <button
            className={styles.submitButton}
            onClick={handleNumericSubmit}
            disabled={!numericValue || isCompleted}
            aria-label={`Submit value for ${habit.name}`}
          >
            Complete
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <article className={`${styles.card} ${isCompleted ? styles.completed : ''}`}>
      <h3 className={styles.habitName}>{habit.name}</h3>
      <p className={styles.habitPrompt}>{habit.atomic_prompt}</p>
      {renderCompletionControl()}
    </article>
  )
}