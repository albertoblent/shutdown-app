/**
 * SmartPredictionChips Component Tests
 * Tests for AI-powered prediction chips with async loading and user interaction
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { SmartPredictionChips } from '../SmartPredictionChips'
import * as predictionsApi from '../../api/predictions'
import type { Habit, InputPrediction } from '../../../../types/data'

// Mock the predictions API
vi.mock('../../api/predictions', () => ({
  generateSmartPredictions: vi.fn()
}))

const mockGenerateSmartPredictions = vi.mocked(predictionsApi.generateSmartPredictions)

const mockNumericHabit: Habit = {
  id: 'test-habit',
  name: 'Exercise',
  type: 'numeric',
  atomic_prompt: 'How many minutes did you exercise?',
  min_value: 0,
  max_value: 120,
  created_at: '2025-01-01T00:00:00Z'
}

const mockPredictions: InputPrediction[] = [
  {
    value: 30,
    confidence: 0.9,
    source: 'yesterday',
    label: 'Yesterday: 30'
  },
  {
    value: 25,
    confidence: 0.7,
    source: 'average',
    label: 'Your average: 25'
  },
  {
    value: 35,
    confidence: 0.8,
    source: 'trending',
    label: 'Recent trend: 35'
  }
]

describe('SmartPredictionChips', () => {
  const mockOnValueSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateSmartPredictions.mockReturnValue(mockPredictions)
  })

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      // Loading state shows container without role="group"
      expect(document.querySelector('[class*="container"]')).toBeInTheDocument()
    })

    it('should complete loading and show predictions', async () => {
      render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Smart Suggestions')).toBeInTheDocument()
      })

      expect(screen.getByText('Based on your patterns')).toBeInTheDocument()
    })
  })

  describe('Prediction Display', () => {
    beforeEach(async () => {
      render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Smart Suggestions')).toBeInTheDocument()
      })
    })

    it('should display prediction values correctly', () => {
      expect(screen.getByRole('button', { name: /select 30/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select 25/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select 35/i })).toBeInTheDocument()
    })

    it('should group predictions by source', () => {
      expect(screen.getByText('🕐 Yesterday')).toBeInTheDocument()
      expect(screen.getByText('📊 Average')).toBeInTheDocument()
      expect(screen.getByText('📈 Recent')).toBeInTheDocument()
    })

    it('should show high confidence badge for confident predictions', () => {
      // High confidence predictions (>0.8) should have star badge
      const yesterdayChip = screen.getByRole('button', { name: /select 30/i })
      
      // Only 30 has >0.8 confidence (0.9), so only it should have a star
      expect(yesterdayChip.querySelector('[aria-hidden="true"]')).toHaveTextContent('⭐')
    })

    it('should not show high confidence badge for lower confidence predictions', () => {
      const averageChip = screen.getByRole('button', { name: /select 25/i })
      const trendingChip = screen.getByRole('button', { name: /select 35/i })
      
      // 25 (0.7) and 35 (0.8) should not have badges (need >0.8)
      expect(averageChip.querySelector('[aria-hidden="true"]')).toBeNull()
      expect(trendingChip.querySelector('[aria-hidden="true"]')).toBeNull()
    })
  })

  describe('User Interaction', () => {
    beforeEach(async () => {
      render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Smart Suggestions')).toBeInTheDocument()
      })
    })

    it('should call onValueSelect when chip is clicked', async () => {
      const user = userEvent.setup()
      
      const chip = screen.getByRole('button', { name: /select 30/i })
      await user.click(chip)

      expect(mockOnValueSelect).toHaveBeenCalledWith(30)
    })

    it('should disable and style selected chip correctly', async () => {
      // Clean up any existing renders
      document.body.innerHTML = ''
      
      mockGenerateSmartPredictions.mockReturnValue(mockPredictions)
      
      render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
          currentValue={30}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Smart Suggestions')).toBeInTheDocument()
      })

      const selectedChip = screen.getByRole('button', { name: /select 30/i })
      expect(selectedChip).toBeDisabled()
      expect(selectedChip.className).toContain('selected')
    })

    it('should have proper accessibility attributes', async () => {
      const chip = screen.getByRole('button', { name: /select 30/i })
      
      expect(chip).toHaveAttribute('aria-label', expect.stringContaining('90% confidence'))
      expect(chip).toHaveAttribute('title', expect.stringContaining('90% confidence'))
    })
  })

  describe('Error Handling', () => {
    it('should handle prediction generation errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockGenerateSmartPredictions.mockImplementation(() => {
        throw new Error('Prediction failed')
      })

      render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      expect(consoleSpy).toHaveBeenCalledWith('Failed to generate predictions:', expect.any(Error))

      // Component should not render when no predictions
      expect(screen.queryByText('Smart Suggestions')).not.toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should not render when no predictions available', () => {
      mockGenerateSmartPredictions.mockReturnValue([])

      render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      expect(mockGenerateSmartPredictions).toHaveBeenCalled()
      expect(screen.queryByText('Smart Suggestions')).not.toBeInTheDocument()
    })
  })

  describe('Habit Type Handling', () => {
    it('should generate predictions based on habit data', () => {
      render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      expect(mockGenerateSmartPredictions).toHaveBeenCalledWith(mockNumericHabit)
    })

    it('should regenerate predictions when habit changes', () => {
      const { rerender } = render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      expect(mockGenerateSmartPredictions).toHaveBeenCalledTimes(1)

      const newHabit: Habit = { ...mockNumericHabit, id: 'different-habit' }
      rerender(
        <SmartPredictionChips 
          habit={newHabit} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      expect(mockGenerateSmartPredictions).toHaveBeenCalledTimes(2)
      expect(mockGenerateSmartPredictions).toHaveBeenLastCalledWith(newHabit)
    })
  })

  describe('Confidence Level Styling', () => {
    it('should apply correct CSS classes based on confidence levels', async () => {
      render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Smart Suggestions')).toBeInTheDocument()
      })

      // High confidence (0.9) - should have high class
      const highConfidenceChip = screen.getByRole('button', { name: /select 30/i })
      expect(highConfidenceChip.className).toContain('high')

      // Medium confidence (0.7) - should have high class (>= 0.7)
      const mediumHighChip = screen.getByRole('button', { name: /select 25/i })
      expect(mediumHighChip.className).toContain('high')
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', async () => {
      render(
        <SmartPredictionChips 
          habit={mockNumericHabit} 
          onValueSelect={mockOnValueSelect} 
          className="custom-class"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Smart Suggestions')).toBeInTheDocument()
      })

      const container = screen.getByRole('group', { name: /smart predictions/i })
      expect(container.className).toContain('custom-class')
    })
  })
})