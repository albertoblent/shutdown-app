/**
 * GestureInputArea Component Tests
 * Tests for touch gesture recognition wrapper with event handling and accessibility
 */

import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GestureInputArea } from '../GestureInputArea'
import * as gesturesApi from '../../api/gestures'
import type { GestureConfig } from '../../../../types/data'

// Mock the gestures API
vi.mock('../../api/gestures', () => ({
  createGestureDetector: vi.fn(),
  applyGestureAction: vi.fn(),
  getDefaultGestureConfig: vi.fn()
}))

const mockCreateGestureDetector = vi.mocked(gesturesApi.createGestureDetector)
const mockApplyGestureAction = vi.mocked(gesturesApi.applyGestureAction)
const mockGetDefaultGestureConfig = vi.mocked(gesturesApi.getDefaultGestureConfig)

// Mock gesture detector
const mockGestureDetector = {
  onTouchStart: vi.fn(),
  onTouchEnd: vi.fn(),
  onTouchMove: vi.fn()
}

// Mock gesture configs
const mockNumericConfig: GestureConfig[] = [
  { gesture: 'swipe-up', action: 'increment', value: 1 },
  { gesture: 'swipe-down', action: 'decrement', value: 1 },
  { gesture: 'double-tap', action: 'complete' },
  { gesture: 'long-press', action: 'reset' }
]

const mockBooleanConfig: GestureConfig[] = [
  { gesture: 'double-tap', action: 'complete' }
]

describe('GestureInputArea', () => {
  const mockOnValueChange = vi.fn()
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateGestureDetector.mockReturnValue(mockGestureDetector)
    mockGetDefaultGestureConfig.mockImplementation((habitType) => {
      return habitType === 'numeric' ? mockNumericConfig : mockBooleanConfig
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render children content', () => {
      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      const gestureArea = screen.getByRole('region', { name: /gesture input area/i })
      expect(gestureArea).toBeInTheDocument()
      expect(gestureArea).toHaveAttribute('data-testid', 'gesture-input-area')
    })

    it('should apply custom className', () => {
      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
          className="custom-class"
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      const gestureArea = screen.getByTestId('gesture-input-area')
      expect(gestureArea).toHaveClass('custom-class')
    })
  })

  describe('Gesture Hints Display', () => {
    it('should show numeric gesture hints for numeric habits', () => {
      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      expect(screen.getByText('Swipe up: +1')).toBeInTheDocument()
      expect(screen.getByText('Swipe down: -1')).toBeInTheDocument()
      expect(screen.getByText('Double-tap: Complete')).toBeInTheDocument()
      expect(screen.getByText('Long press: Reset')).toBeInTheDocument()
    })

    it('should not show increment/decrement hints for boolean habits', () => {
      render(
        <GestureInputArea
          habitType="boolean"
          currentValue={0}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      expect(screen.queryByText('Swipe up: +1')).not.toBeInTheDocument()
      expect(screen.queryByText('Swipe down: -1')).not.toBeInTheDocument()
      expect(screen.getByText('Double-tap: Complete')).toBeInTheDocument()
      expect(screen.getByText('Long press: Reset')).toBeInTheDocument()
    })

    it('should not show increment/decrement hints for choice habits', () => {
      render(
        <GestureInputArea
          habitType="choice"
          currentValue={1}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      expect(screen.queryByText('Swipe up: +1')).not.toBeInTheDocument()
      expect(screen.queryByText('Swipe down: -1')).not.toBeInTheDocument()
      expect(screen.getByText('Double-tap: Complete')).toBeInTheDocument()
      expect(screen.getByText('Long press: Reset')).toBeInTheDocument()
    })
  })

  describe('Gesture Configuration', () => {
    it('should use default config when none provided', () => {
      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      expect(mockGetDefaultGestureConfig).toHaveBeenCalledWith('numeric')
    })

    it('should use custom config when provided', () => {
      const customConfig: GestureConfig[] = [
        { gesture: 'swipe-up', action: 'increment', value: 5 }
      ]

      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
          gestureConfig={customConfig}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      // Should not call getDefaultGestureConfig when custom config provided
      expect(mockGetDefaultGestureConfig).not.toHaveBeenCalled()
    })

    it('should recreate gesture detector when config changes', () => {
      const { rerender } = render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      expect(mockCreateGestureDetector).toHaveBeenCalledTimes(1)

      const customConfig: GestureConfig[] = [
        { gesture: 'swipe-up', action: 'increment', value: 5 }
      ]

      rerender(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
          gestureConfig={customConfig}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      expect(mockCreateGestureDetector).toHaveBeenCalledTimes(2)
    })
  })

  describe('Event Listener Management', () => {
    it('should set up touch event listeners on mount', () => {
      const addEventListenerSpy = vi.spyOn(Element.prototype, 'addEventListener')
      
      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', mockGestureDetector.onTouchStart, { passive: false })
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', mockGestureDetector.onTouchEnd, { passive: false })
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', mockGestureDetector.onTouchMove, { passive: false })

      addEventListenerSpy.mockRestore()
    })

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(Element.prototype, 'removeEventListener')
      
      const { unmount } = render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', mockGestureDetector.onTouchStart)
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', mockGestureDetector.onTouchEnd)
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', mockGestureDetector.onTouchMove)

      removeEventListenerSpy.mockRestore()
    })

    it('should recreate listeners when currentValue changes', () => {
      const addEventListenerSpy = vi.spyOn(Element.prototype, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(Element.prototype, 'removeEventListener')

      const { rerender } = render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      // Clear initial setup calls
      addEventListenerSpy.mockClear()
      removeEventListenerSpy.mockClear()

      rerender(
        <GestureInputArea
          habitType="numeric"
          currentValue={10}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      // Should remove old listeners and add new ones
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(3)
      expect(addEventListenerSpy).toHaveBeenCalledTimes(3)

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Gesture Action Handling', () => {
    let mockHandleGesture: (gesture: string) => void

    beforeEach(() => {
      mockCreateGestureDetector.mockImplementation((handleGesture) => {
        mockHandleGesture = handleGesture
        return mockGestureDetector
      })
    })

    it('should handle increment action correctly', () => {
      mockApplyGestureAction.mockReturnValue({
        action: 'increment',
        newValue: 6
      })

      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      // Simulate swipe-up gesture
      mockHandleGesture('swipe-up')

      expect(mockApplyGestureAction).toHaveBeenCalledWith('swipe-up', 5, mockNumericConfig)
      expect(mockOnValueChange).toHaveBeenCalledWith(6)
    })

    it('should handle decrement action correctly', () => {
      mockApplyGestureAction.mockReturnValue({
        action: 'decrement',
        newValue: 4
      })

      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      mockHandleGesture('swipe-down')

      expect(mockApplyGestureAction).toHaveBeenCalledWith('swipe-down', 5, mockNumericConfig)
      expect(mockOnValueChange).toHaveBeenCalledWith(4)
    })

    it('should handle reset action correctly', () => {
      mockApplyGestureAction.mockReturnValue({
        action: 'reset',
        newValue: 0
      })

      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      mockHandleGesture('long-press')

      expect(mockOnValueChange).toHaveBeenCalledWith(0)
    })

    it('should handle complete action correctly', () => {
      mockApplyGestureAction.mockReturnValue({
        action: 'complete',
        newValue: 5
      })

      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
          onComplete={mockOnComplete}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      mockHandleGesture('double-tap')

      expect(mockOnComplete).toHaveBeenCalled()
      expect(mockOnValueChange).not.toHaveBeenCalled() // Complete doesn't change value
    })

    it('should handle complete action when onComplete is not provided', () => {
      mockApplyGestureAction.mockReturnValue({
        action: 'complete',
        newValue: 5
      })

      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      // Should not throw when onComplete is undefined
      expect(() => mockHandleGesture('double-tap')).not.toThrow()
    })

    it('should handle unknown actions gracefully', () => {
      mockApplyGestureAction.mockReturnValue({
        action: 'none' as 'increment' | 'decrement' | 'complete' | 'reset' | 'none',
        newValue: 5
      })

      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      mockHandleGesture('unknown-gesture')

      expect(mockOnValueChange).not.toHaveBeenCalled()
      expect(mockOnComplete).not.toHaveBeenCalled()
    })
  })

  describe('Integration with Gesture API', () => {
    it('should create gesture detector with correct handler', () => {
      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      expect(mockCreateGestureDetector).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should pass correct parameters to applyGestureAction', () => {
      mockApplyGestureAction.mockReturnValue({
        action: 'increment',
        newValue: 6
      })

      let capturedHandler: (gesture: string) => void

      mockCreateGestureDetector.mockImplementation((handler) => {
        capturedHandler = handler
        return mockGestureDetector
      })

      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      capturedHandler!('swipe-up')

      expect(mockApplyGestureAction).toHaveBeenCalledWith('swipe-up', 5, mockNumericConfig)
    })
  })

  describe('Container Reference Handling', () => {
    it('should handle missing container ref gracefully', () => {
      // Mock useRef to return null initially
      vi.doMock('react', async () => {
        const actual = await vi.importActual('react')
        return {
          ...actual,
          useRef: vi.fn(() => ({ current: null }))
        }
      })

      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      // Should not attempt to add event listeners when container is null
      expect(mockCreateGestureDetector).toHaveBeenCalled()
    })
  })

  describe('Accessibility Features', () => {
    it('should mark hint areas as aria-hidden', () => {
      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      const hintsContainer = screen.getByText('Swipe up: +1').closest('div')?.parentElement
      expect(hintsContainer).toHaveAttribute('aria-hidden', 'true')
    })

    it('should have proper region role and label', () => {
      render(
        <GestureInputArea
          habitType="numeric"
          currentValue={5}
          onValueChange={mockOnValueChange}
        >
          <div>Test Content</div>
        </GestureInputArea>
      )

      const region = screen.getByRole('region', { name: /gesture input area/i })
      expect(region).toBeInTheDocument()
    })
  })
})