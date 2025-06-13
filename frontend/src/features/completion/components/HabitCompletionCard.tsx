import { useState } from 'react'
import Switch from 'react-switch'
import type { Habit } from '../../../types/data'
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
    // Toggle between completed and incomplete
    onComplete(habit.id, !isCompleted)
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
        <div className={styles.switchContainer}>
          <label htmlFor={`switch-${habit.id}`} id={`switch-label-${habit.id}`} className={styles.switchLabel}>
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </label>
          <Switch
            id={`switch-${habit.id}`}
            checked={isCompleted}
            onChange={handleBooleanComplete}
            onColor="#4ade80"
            offColor="#6b7280"
            onHandleColor="#ffffff"
            offHandleColor="#ffffff"
            handleDiameter={24}
            uncheckedIcon={
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: 14,
                  color: "#ffffff",
                  paddingRight: 2
                }}
              >
                ✕
              </div>
            }
            checkedIcon={
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: 14,
                  color: "#ffffff",
                  paddingLeft: 2
                }}
              >
                ✓
              </div>
            }
            height={32}
            width={64}
            className={styles.switch}
            aria-label={isCompleted ? `Mark ${habit.name} as incomplete` : `Complete ${habit.name}`}
          />
        </div>
      )
    }

    if (habit.type === 'numeric') {
      if (isCompleted && typeof completedValue === 'number') {
        return (
          <button
            className={styles.resetButton}
            onClick={() => onComplete(habit.id, 0)}
            aria-label={`Reset ${habit.name} (currently ${completedValue})`}
          >
            {completedValue} (click to reset)
          </button>
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