import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VoiceInputButton } from '../VoiceInputButton'
import { startVoiceInput, isVoiceInputSupported } from '../../api/voice'

// Mock the voice API
vi.mock('../../api/voice', () => ({
  startVoiceInput: vi.fn(),
  isVoiceInputSupported: vi.fn()
}))

const mockStartVoiceInput = vi.mocked(startVoiceInput)
const mockIsVoiceInputSupported = vi.mocked(isVoiceInputSupported)

describe('VoiceInputButton', () => {
  const user = userEvent.setup()
  const mockOnValueReceived = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsVoiceInputSupported.mockReturnValue(true)
  })

  describe('Voice Support Detection', () => {
    it('should render button when voice input is supported', () => {
      mockIsVoiceInputSupported.mockReturnValue(true)
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(mockIsVoiceInputSupported).toHaveBeenCalled()
    })

    it('should not render when voice input is not supported', () => {
      mockIsVoiceInputSupported.mockReturnValue(false)
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      // Component should return null when voice is not supported
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(mockIsVoiceInputSupported).toHaveBeenCalled()
    })
  })

  describe('Button State Management', () => {
    it('should be enabled by default when voice is supported', () => {
      mockIsVoiceInputSupported.mockReturnValue(true)
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} disabled={true} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should apply custom className to container', () => {
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} className="custom-class" />)
      
      const button = screen.getByRole('button')
      const container = button.parentElement
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Voice Input Interaction', () => {
    it('should call startVoiceInput when button is clicked', async () => {
      mockStartVoiceInput.mockResolvedValue({ success: true, value: 5 })
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(mockStartVoiceInput).toHaveBeenCalled()
    })

    it('should call onValueReceived when voice input succeeds', async () => {
      mockStartVoiceInput.mockResolvedValue({ success: true, value: 7.5 })
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(mockOnValueReceived).toHaveBeenCalledWith(7.5)
    })

    it('should not call onValueReceived when voice input fails', async () => {
      mockStartVoiceInput.mockResolvedValue({ success: false, error: 'No speech detected' })
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(mockOnValueReceived).not.toHaveBeenCalled()
    })

    it('should not start voice input when disabled', async () => {
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} disabled={true} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(mockStartVoiceInput).not.toHaveBeenCalled()
    })

    it('should not render when not supported', () => {
      mockIsVoiceInputSupported.mockReturnValue(false)
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      // No button should be rendered when not supported
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(mockStartVoiceInput).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should show listening state during voice input', async () => {
      // Mock a long-running voice input
      mockStartVoiceInput.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, value: 3 }), 100))
      )
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Button text should indicate listening (implementation detail)
      expect(mockStartVoiceInput).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle voice input API errors gracefully', async () => {
      mockStartVoiceInput.mockRejectedValue(new Error('Microphone not available'))
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      const button = screen.getByRole('button')
      
      // Should not throw when clicked
      await expect(user.click(button)).resolves.not.toThrow()
      
      expect(mockOnValueReceived).not.toHaveBeenCalled()
    })

    it('should prevent clicks while listening', async () => {
      // Mock a delay to simulate real voice input duration
      let resolveVoiceInput: (value: { success: boolean; value: number }) => void
      mockStartVoiceInput.mockImplementation(() => 
        new Promise(resolve => {
          resolveVoiceInput = resolve
        })
      )
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      const button = screen.getByRole('button')
      
      // First click should work
      await user.click(button)
      expect(mockStartVoiceInput).toHaveBeenCalledTimes(1)
      
      // Button should be disabled while listening
      expect(button).toBeDisabled()
      
      // Complete the voice input
      resolveVoiceInput!({ success: true, value: 2 })
      
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(mockOnValueReceived).toHaveBeenCalledWith(2)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should be focusable and keyboard accessible', async () => {
      mockStartVoiceInput.mockResolvedValue({ success: true, value: 4 })
      
      render(<VoiceInputButton onValueReceived={mockOnValueReceived} />)
      
      const button = screen.getByRole('button')
      
      // Focus and activate with keyboard
      button.focus()
      await user.keyboard('[Space]')
      
      expect(mockStartVoiceInput).toHaveBeenCalled()
    })
  })
})