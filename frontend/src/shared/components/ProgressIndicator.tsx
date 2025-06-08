import styles from './ProgressIndicator.module.css'

interface ProgressIndicatorProps {
  completed: number
  total: number
}

export function ProgressIndicator({ completed, total }: ProgressIndicatorProps) {
  // Calculate percentage (handle edge case of zero total)
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
  
  // Determine styling and message based on progress
  const getProgressClass = () => {
    if (percentage === 100) return 'complete'
    if (percentage >= 80) return 'high'
    return 'default'
  }

  const getMotivationalMessage = () => {
    if (percentage === 100) return 'Perfect day! 🎉'
    if (percentage >= 80) return 'Almost there!'
    if (percentage >= 50) return 'Great progress!'
    if (percentage > 0) return 'Keep going!'
    return 'Ready to start your shutdown ritual?'
  }

  const getMessageClass = () => {
    if (percentage === 100) return 'celebration'
    if (percentage >= 80) return 'encouraging'
    return 'default'
  }

  const progressClass = getProgressClass()
  const message = getMotivationalMessage()
  const messageClass = getMessageClass()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.progressText}>
          {completed} of {total} completed
        </p>
        <p className={`${styles.percentage} ${styles[progressClass]}`}>
          {percentage}%
        </p>
      </div>

      <div 
        className={styles.progressBar}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Habit completion progress"
      >
        <div 
          className={`${styles.progressFill} ${styles[progressClass]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className={`${styles.message} ${styles[messageClass]}`}>
        {message}
      </p>
    </div>
  )
}