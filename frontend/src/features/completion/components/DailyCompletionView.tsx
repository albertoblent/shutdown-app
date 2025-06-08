import { useState, useEffect } from 'react'
import { DailyHabitList } from '../../../shared/components'
import { getHabitsSorted } from '../../habits/api/storage'
import type { Habit } from '../../../types/data'

export function DailyCompletionView() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Map<string, boolean | number>>(new Map())

  useEffect(() => {
    const habitsResult = getHabitsSorted()
    if (habitsResult.success && habitsResult.data) {
      setHabits(habitsResult.data)
    }
  }, [])

  const handleHabitComplete = (habitId: string, value: boolean | number) => {
    setCompletions(prev => {
      const newCompletions = new Map(prev)
      newCompletions.set(habitId, value)
      return newCompletions
    })
  }

  return (
    <DailyHabitList
      habits={habits}
      completions={completions}
      onHabitComplete={handleHabitComplete}
    />
  )
}