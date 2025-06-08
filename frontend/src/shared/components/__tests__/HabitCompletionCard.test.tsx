import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitCompletionCard } from '../HabitCompletionCard'
import type { Habit } from '../../../types/data'

const mockBooleanHabit: Habit = {
  id: 'test-1',
  name: 'Review finances',
  atomic_prompt: 'Did I check my budget today?',
  type: 'boolean',
  frequency: 'daily',
  sort_order: 1,
  is_active: true,
  created_at: '2023-01-01T00:00:00Z'
}

const mockNumericHabit: Habit = {
  id: 'test-2', 
  name: 'Deep work hours',
  atomic_prompt: 'How many hours of focused work?',
  type: 'numeric',
  frequency: 'daily',
  sort_order: 2,
  is_active: true,
  created_at: '2023-01-01T00:00:00Z'
}

describe('HabitCompletionCard', () => {
  it('should display habit information correctly', () => {
    render(
      <HabitCompletionCard 
        habit={mockBooleanHabit}
        isCompleted={false}
        onComplete={vi.fn()}
      />
    )
    
    expect(screen.getByText('Review finances')).toBeInTheDocument()
    expect(screen.getByText('Did I check my budget today?')).toBeInTheDocument()
  })

  it('should show completion button for incomplete boolean habit', () => {
    render(
      <HabitCompletionCard 
        habit={mockBooleanHabit}
        isCompleted={false}
        onComplete={vi.fn()}
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Mark Complete')
    expect(button).not.toBeDisabled()
  })

  it('should show completed state for completed boolean habit', () => {
    render(
      <HabitCompletionCard 
        habit={mockBooleanHabit}
        isCompleted={true}
        onComplete={vi.fn()}
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Completed')
    expect(button).toBeEnabled() // Should be clickable to reset
  })

  it('should call onComplete when completion button clicked', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    
    render(
      <HabitCompletionCard 
        habit={mockBooleanHabit}
        isCompleted={false}
        onComplete={onComplete}
      />
    )
    
    await user.click(screen.getByRole('button'))
    expect(onComplete).toHaveBeenCalledWith(mockBooleanHabit.id, true)
  })

  it('should call onComplete with false when completed habit clicked', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    
    render(
      <HabitCompletionCard 
        habit={mockBooleanHabit}
        isCompleted={true}
        onComplete={onComplete}
      />
    )
    
    await user.click(screen.getByRole('button'))
    expect(onComplete).toHaveBeenCalledWith(mockBooleanHabit.id, false)
  })

  it('should show numeric input for numeric habits', () => {
    render(
      <HabitCompletionCard 
        habit={mockNumericHabit}
        isCompleted={false}
        onComplete={vi.fn()}
      />
    )
    
    expect(screen.getByDisplayValue('')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Complete')
  })

  it('should handle numeric input submission', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    
    render(
      <HabitCompletionCard 
        habit={mockNumericHabit}
        isCompleted={false}
        onComplete={onComplete}
      />
    )
    
    const input = screen.getByDisplayValue('')
    const button = screen.getByRole('button')
    
    await user.type(input, '3')
    await user.click(button)
    
    expect(onComplete).toHaveBeenCalledWith(mockNumericHabit.id, 3)
  })

  it('should show reset button for completed numeric habit', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    
    render(
      <HabitCompletionCard 
        habit={mockNumericHabit}
        isCompleted={true}
        completedValue={5}
        onComplete={onComplete}
      />
    )
    
    const resetButton = screen.getByRole('button')
    expect(resetButton).toHaveTextContent('5 (click to reset)')
    
    await user.click(resetButton)
    expect(onComplete).toHaveBeenCalledWith(mockNumericHabit.id, 0)
  })

  it('should have proper CSS classes for touch targets', () => {
    render(
      <HabitCompletionCard 
        habit={mockBooleanHabit}
        isCompleted={false}
        onComplete={vi.fn()}
      />
    )
    
    const button = screen.getByRole('button')
    
    // Should have CSS modules class that includes completeButton
    expect(button.className).toMatch(/completeButton/)
    
    // Verify button is accessible and interactive
    expect(button).toBeEnabled()
    expect(button).toHaveAttribute('aria-label')
  })

  it('should use semantic HTML structure', () => {
    render(
      <HabitCompletionCard 
        habit={mockBooleanHabit}
        isCompleted={false}
        onComplete={vi.fn()}
      />
    )
    
    // Should use article for semantic card structure
    expect(screen.getByRole('article')).toBeInTheDocument()
    
    // Should use heading for habit name
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
  })
})