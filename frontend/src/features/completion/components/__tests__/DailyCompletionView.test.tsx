import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DailyCompletionView } from '../DailyCompletionView'
import { getHabitsSorted } from '../../../habits/api/storage'
import type { Habit } from '../../../../types/data'

// Mock the habits storage API
vi.mock('../../../habits/api/storage', () => ({
  getHabitsSorted: vi.fn()
}))

const mockGetHabitsSorted = vi.mocked(getHabitsSorted)

// Sample test data
const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    name: 'Read for 30 minutes',
    type: 'boolean',
    atomic_prompt: 'Did you read for at least 30 minutes today?',
    configuration: {},
    position: 0,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'habit-2', 
    name: 'Exercise duration',
    type: 'numeric',
    atomic_prompt: 'How many hours did you exercise?',
    configuration: {
      numeric_unit: 'hours',
      numeric_range: [0, 3]
    },
    position: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'habit-3',
    name: 'Choose workout type',
    type: 'choice',
    atomic_prompt: 'What type of workout did you do?',
    configuration: {
      choices: ['cardio', 'strength', 'yoga', 'rest']
    },
    position: 2,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z'
  }
]

describe('DailyCompletionView', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading and Display', () => {
    it('should load and display habits on mount', async () => {
      mockGetHabitsSorted.mockReturnValue({
        success: true,
        data: mockHabits
      })

      render(<DailyCompletionView />)

      await waitFor(() => {
        expect(screen.getByText('Read for 30 minutes')).toBeInTheDocument()
        expect(screen.getByText('Exercise duration')).toBeInTheDocument()
        expect(screen.getByText('Choose workout type')).toBeInTheDocument()
      })

      expect(mockGetHabitsSorted).toHaveBeenCalledOnce()
    })

    it('should handle habits loading failure gracefully', async () => {
      mockGetHabitsSorted.mockReturnValue({
        success: false,
        error: 'Failed to load habits'
      })

      render(<DailyCompletionView />)

      // Should not crash and should call the API
      expect(mockGetHabitsSorted).toHaveBeenCalledOnce()
      
      // No habits should be displayed
      await waitFor(() => {
        expect(screen.queryByText('Read for 30 minutes')).not.toBeInTheDocument()
      })
    })

    it('should handle empty habits list', async () => {
      mockGetHabitsSorted.mockReturnValue({
        success: true,
        data: []
      })

      render(<DailyCompletionView />)

      expect(mockGetHabitsSorted).toHaveBeenCalledOnce()
      
      // Should render the DailyHabitList with empty data
      await waitFor(() => {
        expect(screen.queryByText('Read for 30 minutes')).not.toBeInTheDocument()
      })
    })

    it('should handle undefined habits data', async () => {
      mockGetHabitsSorted.mockReturnValue({
        success: true,
        data: undefined
      })

      render(<DailyCompletionView />)

      expect(mockGetHabitsSorted).toHaveBeenCalledOnce()
      
      // Should not crash with undefined data
      await waitFor(() => {
        expect(screen.queryByText('Read for 30 minutes')).not.toBeInTheDocument()
      })
    })
  })

  describe('Habit Completion Tracking', () => {
    beforeEach(() => {
      mockGetHabitsSorted.mockReturnValue({
        success: true,
        data: mockHabits
      })
    })

    it('should track boolean habit completion', async () => {
      render(<DailyCompletionView />)

      await waitFor(() => {
        expect(screen.getByText('Read for 30 minutes')).toBeInTheDocument()
      })

      // Find and click the boolean habit button
      const completeButton = screen.getByRole('button', { 
        name: /complete read for 30 minutes/i 
      })
      
      expect(completeButton).toHaveTextContent('Mark Complete')
      
      await user.click(completeButton)
      
      // After completion, the button text should change
      await waitFor(() => {
        expect(completeButton).toHaveTextContent('Completed')
      })
    })

    it('should track numeric habit completion', async () => {
      render(<DailyCompletionView />)

      await waitFor(() => {
        expect(screen.getByText('Exercise duration')).toBeInTheDocument()
      })

      // Find and interact with the numeric input
      const numericInput = screen.getByLabelText(/enter value for exercise duration/i)
      const submitButton = screen.getByRole('button', { 
        name: /submit value for exercise duration/i 
      })
      
      expect(submitButton).toBeDisabled()
      
      await user.type(numericInput, '2')
      expect(numericInput).toHaveValue(2)
      expect(submitButton).not.toBeDisabled()
      
      await user.click(submitButton)
      
      // After completion, should show reset button with value
      await waitFor(() => {
        const resetButton = screen.getByRole('button', { 
          name: /reset exercise duration.*currently 2/i 
        })
        expect(resetButton).toHaveTextContent('2 (click to reset)')
      })
    })

    it('should handle multiple habit completions', async () => {
      render(<DailyCompletionView />)

      await waitFor(() => {
        expect(screen.getByText('Read for 30 minutes')).toBeInTheDocument()
        expect(screen.getByText('Exercise duration')).toBeInTheDocument()
      })

      // Complete the boolean habit
      const completeButton = screen.getByRole('button', { 
        name: /complete read for 30 minutes/i 
      })
      await user.click(completeButton)
      
      await waitFor(() => {
        expect(completeButton).toHaveTextContent('Completed')
      })

      // Complete the numeric habit
      const numericInput = screen.getByLabelText(/enter value for exercise duration/i)
      const submitButton = screen.getByRole('button', { 
        name: /submit value for exercise duration/i 
      })
      
      await user.type(numericInput, '1.5')
      await user.click(submitButton)
      
      await waitFor(() => {
        const resetButton = screen.getByRole('button', { 
          name: /reset exercise duration.*currently 1.5/i 
        })
        expect(resetButton).toHaveTextContent('1.5 (click to reset)')
      })
    })

    it('should maintain completion state when component re-renders', async () => {
      const { rerender } = render(<DailyCompletionView />)

      await waitFor(() => {
        expect(screen.getByText('Read for 30 minutes')).toBeInTheDocument()
      })

      // Complete a habit
      const completeButton = screen.getByRole('button', { 
        name: /complete read for 30 minutes/i 
      })
      await user.click(completeButton)
      
      await waitFor(() => {
        expect(completeButton).toHaveTextContent('Completed')
      })

      // Re-render the component
      rerender(<DailyCompletionView />)

      // The completion state should be maintained
      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { 
          name: /mark read for 30 minutes as incomplete/i 
        })
        expect(updatedButton).toHaveTextContent('Completed')
      })
    })
  })

  describe('Integration with DailyHabitList', () => {
    beforeEach(() => {
      mockGetHabitsSorted.mockReturnValue({
        success: true,
        data: mockHabits
      })
    })

    it('should pass habits to DailyHabitList', async () => {
      render(<DailyCompletionView />)

      await waitFor(() => {
        // Verify all habits are passed through to the child component
        expect(screen.getByText('Read for 30 minutes')).toBeInTheDocument()
        expect(screen.getByText('Exercise duration')).toBeInTheDocument()
        expect(screen.getByText('Choose workout type')).toBeInTheDocument()
      })
    })

    it('should pass completion handler to DailyHabitList', async () => {
      render(<DailyCompletionView />)

      await waitFor(() => {
        expect(screen.getByText('Read for 30 minutes')).toBeInTheDocument()
      })

      // Verify the completion handler works by interacting with a habit
      const completeButton = screen.getByRole('button', { 
        name: /complete read for 30 minutes/i 
      })
      
      // This interaction should work without errors, proving the handler is passed correctly
      await user.click(completeButton)
      
      await waitFor(() => {
        expect(completeButton).toHaveTextContent('Completed')
      })
    })

    it('should pass completions map to DailyHabitList', async () => {
      render(<DailyCompletionView />)

      await waitFor(() => {
        expect(screen.getByText('Read for 30 minutes')).toBeInTheDocument()
      })

      // Complete a habit and verify the completion is tracked
      const completeButton = screen.getByRole('button', { 
        name: /complete read for 30 minutes/i 
      })
      await user.click(completeButton)
      
      // The fact that the button text changes proves the completions map is working
      await waitFor(() => {
        expect(completeButton).toHaveTextContent('Completed')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle storage API throwing an error', async () => {
      mockGetHabitsSorted.mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not crash when storage throws
      expect(() => render(<DailyCompletionView />)).not.toThrow()
      
      expect(mockGetHabitsSorted).toHaveBeenCalledOnce()
    })

    it('should handle malformed habit data', async () => {
      // Return malformed data that doesn't match Habit type
      mockGetHabitsSorted.mockReturnValue({
        success: true,
        data: [{ invalid: 'data' }] as unknown as Habit[]
      })

      // Should not crash with malformed data
      expect(() => render(<DailyCompletionView />)).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockGetHabitsSorted.mockReturnValue({
        success: true,
        data: mockHabits
      })
    })

    it('should have accessible form controls', async () => {
      render(<DailyCompletionView />)

      await waitFor(() => {
        // Verify button is accessible
        const completeButton = screen.getByRole('button', { 
          name: /complete read for 30 minutes/i 
        })
        expect(completeButton).toBeInTheDocument()

        // Verify numeric input is accessible
        const numericInput = screen.getByLabelText(/enter value for exercise duration/i)
        expect(numericInput).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      render(<DailyCompletionView />)

      await waitFor(() => {
        expect(screen.getByText('Read for 30 minutes')).toBeInTheDocument()
      })

      // Verify button can be activated with keyboard
      const completeButton = screen.getByRole('button', { 
        name: /complete read for 30 minutes/i 
      })
      
      completeButton.focus()
      await user.keyboard('[Space]')
      
      await waitFor(() => {
        expect(completeButton).toHaveTextContent('Completed')
      })
    })
  })
})