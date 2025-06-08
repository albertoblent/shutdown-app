import type { Habit } from '../../types/data'
import { HabitCompletionCard } from './HabitCompletionCard'
import { ProgressIndicator } from './ProgressIndicator'
import styles from './DailyHabitList.module.css'

interface DailyHabitListProps {
  habits: Habit[]
  completions: Map<string, boolean | number>
  onHabitComplete: (habitId: string, value: boolean | number) => void
}

export function DailyHabitList({ 
  habits, 
  completions, 
  onHabitComplete 
}: DailyHabitListProps) {
  // Calculate completion progress
  const completedCount = habits.filter(habit => completions.has(habit.id)).length
  const totalCount = habits.length

  // Format current date for display
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  if (habits.length === 0) {
    return (
      <section className={styles.container} role="region" aria-label="Daily habits">
        <div className={styles.header}>
          <h2 className={styles.title}>Today's Shutdown Ritual</h2>
          <p className={styles.subtitle}>{today}</p>
        </div>
        
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3 className={styles.emptyTitle}>No habits configured</h3>
          <p className={styles.emptyMessage}>
            Add some habits to get started!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.container} role="region" aria-label="Daily habits">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Today's Shutdown Ritual</h2>
          <p className={styles.subtitle}>{today}</p>
        </div>
      </div>

      <div className={styles.progressSection}>
        <ProgressIndicator completed={completedCount} total={totalCount} />
      </div>

      <div className={styles.habitList}>
        {habits.map((habit) => {
          const isCompleted = completions.has(habit.id)
          const completedValue = completions.get(habit.id)
          
          return (
            <HabitCompletionCard
              key={habit.id}
              habit={habit}
              isCompleted={isCompleted}
              completedValue={completedValue}
              onComplete={onHabitComplete}
            />
          )
        })}
      </div>
    </section>
  )
}