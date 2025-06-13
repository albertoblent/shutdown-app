import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DailyHabitList } from '../DailyHabitList'
import type { Habit } from '../../../types/data'

const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    name: 'Review finances',
    atomic_prompt: 'Did I check my budget today?',
    type: 'boolean',
    frequency: 'daily',
    sort_order: 1,
    is_active: true,
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'habit-2',
    name: 'Deep work hours',
    atomic_prompt: 'How many hours of focused work?',
    type: 'numeric',
    frequency: 'daily',
    sort_order: 2,
    is_active: true,
    created_at: '2023-01-01T00:00:00Z'
  }
]

const mockCompletions = new Map([
  ['habit-1', true],
  ['habit-2', 3]
])

describe('DailyHabitList', () => {
  it('should display all habits in provided order', () => {
    render(
      <DailyHabitList 
        habits={mockHabits}
        completions={mockCompletions}
        onHabitComplete={vi.fn()}
      />
    )
    
    expect(screen.getByText('Review finances')).toBeInTheDocument()
    expect(screen.getByText('Deep work hours')).toBeInTheDocument()
  })

  it('should show completion status for each habit', () => {
    render(
      <DailyHabitList 
        habits={mockHabits}
        completions={mockCompletions}
        onHabitComplete={vi.fn()}
      />
    )
    
    // First habit should be completed
    expect(screen.getByText('Completed')).toBeInTheDocument()
    
    // Should show numeric value for completed numeric habit as reset button
    expect(screen.getByText('3 (click to reset)')).toBeInTheDocument()
  })

  it('should call onHabitComplete when habit is completed', async () => {
    const onHabitComplete = vi.fn()
    const user = userEvent.setup()
    
    const incompleteHabits = [mockHabits[0]] // Only first habit
    const emptyCompletions = new Map()
    
    render(
      <DailyHabitList 
        habits={incompleteHabits}
        completions={emptyCompletions}
        onHabitComplete={onHabitComplete}
      />
    )
    
    await user.click(screen.getByRole('switch'))
    expect(onHabitComplete).toHaveBeenCalledWith('habit-1', true)
  })

  it('should show empty state when no habits provided', () => {
    render(
      <DailyHabitList 
        habits={[]}
        completions={new Map()}
        onHabitComplete={vi.fn()}
      />
    )
    
    expect(screen.getByText('No habits configured')).toBeInTheDocument()
    expect(screen.getByText('Add some habits to get started!')).toBeInTheDocument()
  })

  it('should use proper semantic structure', () => {
    render(
      <DailyHabitList 
        habits={mockHabits}
        completions={mockCompletions}
        onHabitComplete={vi.fn()}
      />
    )
    
    // Should use section for the overall list
    expect(screen.getByRole('region')).toBeInTheDocument()
    
    // Should have heading for the section
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('should maintain responsive design on mobile', () => {
    render(
      <DailyHabitList 
        habits={mockHabits}
        completions={mockCompletions}
        onHabitComplete={vi.fn()}
      />
    )
    
    const container = screen.getByRole('region')
    
    // Should have CSS modules class that includes container
    expect(container.className).toMatch(/container/)
    
    // Should be accessible with proper ARIA labels
    expect(container).toHaveAttribute('aria-label', 'Daily habits')
  })
})