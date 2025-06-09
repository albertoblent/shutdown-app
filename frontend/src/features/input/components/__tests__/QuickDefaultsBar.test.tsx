/**
 * QuickDefaultsBar Component Tests
 * Tests for smart prediction display with confidence-based sorting and selection
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { QuickDefaultsBar } from '../QuickDefaultsBar'
import type { InputPrediction } from '../../../../types/data'

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
    value: 15,
    confidence: 0.3,
    source: 'pattern',
    label: 'Predicted: 15'
  },
  {
    value: 35,
    confidence: 0.8,
    source: 'trending',
    label: 'Recent trend: 35'
  },
  {
    value: 20,
    confidence: 0.6,
    source: 'pattern',
    label: 'Predicted: 20'
  },
  {
    value: 40,
    confidence: 0.5,
    source: 'trending',
    label: 'Recent: 40'
  }
]

describe('QuickDefaultsBar', () => {
  const mockOnValueSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should not render when no predictions provided', () => {
      render(
        <QuickDefaultsBar 
          predictions={[]} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      expect(screen.queryByRole('group')).not.toBeInTheDocument()
    })

    it('should render with predictions', () => {
      render(
        <QuickDefaultsBar 
          predictions={mockPredictions} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      expect(screen.getByRole('group', { name: /quick value suggestions/i })).toBeInTheDocument()
      expect(screen.getByText('Tap for quick entry')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <QuickDefaultsBar 
          predictions={mockPredictions} 
          onValueSelect={mockOnValueSelect} 
          className="custom-class"
        />
      )

      const container = screen.getByRole('group', { name: /quick value suggestions/i })
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Prediction Sorting and Limiting', () => {
    it('should sort predictions by confidence (highest first)', () => {
      render(
        <QuickDefaultsBar 
          predictions={mockPredictions} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      const buttons = screen.getAllByRole('button')
      
      // Should be sorted: 30 (0.9), 35 (0.8), 25 (0.7), 20 (0.6), 40 (0.5)
      // But limited to top 5
      expect(buttons).toHaveLength(5)
      expect(buttons[0]).toHaveTextContent('30')  // Highest confidence (0.9)
      expect(buttons[1]).toHaveTextContent('35')  // Second highest (0.8)
      expect(buttons[2]).toHaveTextContent('25')  // Third highest (0.7)
      expect(buttons[3]).toHaveTextContent('20')  // Fourth highest (0.6)
      expect(buttons[4]).toHaveTextContent('40')  // Fifth highest (0.5)
    })

    it('should limit to top 5 predictions when more are provided', () => {
      // Add more predictions to test limiting
      const manyPredictions: InputPrediction[] = [
        ...mockPredictions,
        { value: 45, confidence: 0.2, source: 'pattern', label: 'Low: 45' },
        { value: 50, confidence: 0.1, source: 'pattern', label: 'Lower: 50' }
      ]

      render(
        <QuickDefaultsBar 
          predictions={manyPredictions} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(5) // Should be limited to 5

      // Lowest confidence predictions should not be shown
      expect(screen.queryByText('45')).not.toBeInTheDocument()
      expect(screen.queryByText('50')).not.toBeInTheDocument()
    })
  })

  describe('User Interaction', () => {
    beforeEach(() => {
      render(
        <QuickDefaultsBar 
          predictions={mockPredictions} 
          onValueSelect={mockOnValueSelect} 
        />
      )
    })

    it('should call onValueSelect when button is clicked', async () => {
      const user = userEvent.setup()
      
      const firstButton = screen.getByRole('button', { name: /select 30/i })
      await user.click(firstButton)

      expect(mockOnValueSelect).toHaveBeenCalledWith(30)
      expect(mockOnValueSelect).toHaveBeenCalledTimes(1)
    })

    it('should call onValueSelect with correct values for different buttons', async () => {
      const user = userEvent.setup()
      
      await user.click(screen.getByRole('button', { name: /select 35/i }))
      expect(mockOnValueSelect).toHaveBeenCalledWith(35)

      await user.click(screen.getByRole('button', { name: /select 25/i }))
      expect(mockOnValueSelect).toHaveBeenCalledWith(25)
    })

    it('should handle string values correctly', async () => {
      const stringPredictions: InputPrediction[] = [
        {
          value: 'option1',
          confidence: 0.9,
          source: 'choice',
          label: 'Choice: option1'
        }
      ]

      render(
        <QuickDefaultsBar 
          predictions={stringPredictions} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /select option1/i }))

      expect(mockOnValueSelect).toHaveBeenCalledWith('option1')
    })
  })

  describe('Selected State', () => {
    it('should disable button when value is currently selected', () => {
      render(
        <QuickDefaultsBar 
          predictions={mockPredictions} 
          onValueSelect={mockOnValueSelect} 
          currentValue={30}
        />
      )

      const selectedButton = screen.getByRole('button', { name: /select 30/i })
      expect(selectedButton).toBeDisabled()
      expect(selectedButton.className).toContain('selected')
    })

    it('should not disable other buttons when one is selected', () => {
      render(
        <QuickDefaultsBar 
          predictions={mockPredictions} 
          onValueSelect={mockOnValueSelect} 
          currentValue={30}
        />
      )

      const otherButtons = screen.getAllByRole('button').filter(btn => 
        !btn.getAttribute('aria-label')?.includes('30')
      )

      otherButtons.forEach(button => {
        expect(button).not.toBeDisabled()
        expect(button.className).not.toContain('selected')
      })
    })

    it('should handle string values for selection state', () => {
      const stringPredictions: InputPrediction[] = [
        {
          value: 'option1',
          confidence: 0.9,
          source: 'choice',
          label: 'Choice: option1'
        },
        {
          value: 'option2',
          confidence: 0.8,
          source: 'choice',
          label: 'Choice: option2'
        }
      ]

      render(
        <QuickDefaultsBar 
          predictions={stringPredictions} 
          onValueSelect={mockOnValueSelect} 
          currentValue="option1"
        />
      )

      const selectedButton = screen.getByRole('button', { name: /select option1/i })
      const unselectedButton = screen.getByRole('button', { name: /select option2/i })

      expect(selectedButton).toBeDisabled()
      expect(unselectedButton).not.toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      render(
        <QuickDefaultsBar 
          predictions={mockPredictions} 
          onValueSelect={mockOnValueSelect} 
        />
      )
    })

    it('should have proper ARIA labels', () => {
      const button = screen.getByRole('button', { name: /select 30/i })
      
      expect(button).toHaveAttribute('aria-label', 
        expect.stringContaining('Select 30 (yesterday, 90% confidence)')
      )
    })

    it('should have descriptive titles', () => {
      const button = screen.getByRole('button', { name: /select 30/i })
      
      expect(button).toHaveAttribute('title', 
        expect.stringContaining('Yesterday: 30 - 90% confidence')
      )
    })

    it('should have group role with descriptive label', () => {
      const group = screen.getByRole('group', { name: /quick value suggestions/i })
      expect(group).toBeInTheDocument()
    })

    it('should include confidence information in accessibility attributes', () => {
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach(button => {
        const ariaLabel = button.getAttribute('aria-label')
        const title = button.getAttribute('title')
        
        expect(ariaLabel).toMatch(/\d+% confidence/)
        expect(title).toMatch(/\d+% confidence/)
      })
    })
  })

  describe('Confidence Level Styling', () => {
    beforeEach(() => {
      render(
        <QuickDefaultsBar 
          predictions={mockPredictions} 
          onValueSelect={mockOnValueSelect} 
        />
      )
    })

    it('should apply high confidence class for confidence >= 0.7', () => {
      // Confidence 0.9 and 0.8 and 0.7 should be 'high'
      const highConfidenceButton1 = screen.getByRole('button', { name: /select 30/i }) // 0.9
      const highConfidenceButton2 = screen.getByRole('button', { name: /select 35/i }) // 0.8
      const highConfidenceButton3 = screen.getByRole('button', { name: /select 25/i }) // 0.7
      
      expect(highConfidenceButton1.className).toContain('high')
      expect(highConfidenceButton2.className).toContain('high')
      expect(highConfidenceButton3.className).toContain('high')
    })

    it('should apply medium confidence class for 0.4 <= confidence < 0.7', () => {
      // Confidence 0.6 and 0.5 should be 'medium'
      const mediumConfidenceButton1 = screen.getByRole('button', { name: /select 20/i }) // 0.6
      const mediumConfidenceButton2 = screen.getByRole('button', { name: /select 40/i }) // 0.5
      
      expect(mediumConfidenceButton1.className).toContain('medium')
      expect(mediumConfidenceButton2.className).toContain('medium')
    })

    it('should apply low confidence class for confidence < 0.4', () => {
      const lowConfidencePredictions: InputPrediction[] = [
        {
          value: 10,
          confidence: 0.3,
          source: 'pattern',
          label: 'Low confidence: 10'
        }
      ]

      render(
        <QuickDefaultsBar 
          predictions={lowConfidencePredictions} 
          onValueSelect={mockOnValueSelect} 
        />
      )

      const lowConfidenceButton = screen.getByRole('button', { name: /select 10/i })
      expect(lowConfidenceButton.className).toContain('low')
    })
  })

  describe('Visual Elements', () => {
    beforeEach(() => {
      render(
        <QuickDefaultsBar 
          predictions={mockPredictions} 
          onValueSelect={mockOnValueSelect} 
        />
      )
    })

    it('should display prediction values', () => {
      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('35')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('should display prediction labels', () => {
      expect(screen.getByText('Yesterday: 30')).toBeInTheDocument()
      expect(screen.getByText('Recent trend: 35')).toBeInTheDocument()
      expect(screen.getByText('Your average: 25')).toBeInTheDocument()
    })

    it('should include confidence bars with CSS custom properties', () => {
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach((button) => {
        const confidenceBar = button.querySelector('[style*="--confidence"]')
        expect(confidenceBar).toBeInTheDocument()
        
        // Check that CSS custom property is set
        const style = confidenceBar?.getAttribute('style')
        expect(style).toMatch(/--confidence:\s*0\.\d+/)
      })
    })
  })
})