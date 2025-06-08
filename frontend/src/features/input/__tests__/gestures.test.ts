/**
 * Gesture Input Tests
 * Tests for touch gesture recognition and shortcuts
 */

import { describe, it, expect, vi } from 'vitest'
import { 
  createGestureDetector,
  detectGesture,
  detectDoubleTap,
  applyGestureAction,
  getDefaultGestureConfig
} from '../api/gestures'
import type { GestureConfig } from '../../../types/data'

// Mock touch events that properly simulate real TouchEvent behavior
const createMockTouchEvent = (
  type: string,
  touches: { clientX: number; clientY: number; timestamp?: number }[]
): TouchEvent => {
  const touchObjects = touches.map(touch => ({
    clientX: touch.clientX,
    clientY: touch.clientY,
    // Remove timestamp from Touch object - real Touch objects don't have this
  }))

  return {
    type,
    // For touchstart events, touches contains the touch data
    // For touchend events, touches is empty and changedTouches contains the data
    touches: type === 'touchend' ? [] : touchObjects,
    changedTouches: type === 'touchend' ? touchObjects : [],
    // Use timeStamp on the TouchEvent (not timestamp on Touch)
    timeStamp: touches[0]?.timestamp || Date.now(),
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
  } as unknown as TouchEvent
}

describe('detectGesture', () => {
  it('should detect swipe up gesture', () => {
    const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])
    const touchEnd = createMockTouchEvent('touchend', [{ clientX: 100, clientY: 100 }])
    
    const result = detectGesture(touchStart, touchEnd)
    
    expect(result).toBe('swipe-up')
  })

  it('should detect swipe down gesture', () => {
    const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
    const touchEnd = createMockTouchEvent('touchend', [{ clientX: 100, clientY: 200 }])
    
    const result = detectGesture(touchStart, touchEnd)
    
    expect(result).toBe('swipe-down')
  })

  it('should detect double-tap gesture', () => {
    const now = Date.now()
    const tap1 = createMockTouchEvent('touchend', [{ clientX: 100, clientY: 100, timestamp: now }])
    const tap2 = createMockTouchEvent('touchend', [{ clientX: 105, clientY: 105, timestamp: now + 200 }])
    
    // Test double-tap detection separately since it's handled differently
    const result = detectDoubleTap(tap1, tap2, 300, 50)
    
    expect(result).toBe(true)
  })

  it('should detect long-press gesture', () => {
    const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 100, timestamp: Date.now() }])
    const touchEnd = createMockTouchEvent('touchend', [{ clientX: 100, clientY: 100, timestamp: Date.now() + 600 }])
    
    const result = detectGesture(touchStart, touchEnd, 500) // 500ms long-press threshold
    
    expect(result).toBe('long-press')
  })

  it('should return null for insufficient movement', () => {
    const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
    const touchEnd = createMockTouchEvent('touchend', [{ clientX: 105, clientY: 105 }])
    
    const result = detectGesture(touchStart, touchEnd)
    
    expect(result).toBe(null)
  })

  it('should prioritize horizontal swipes over vertical', () => {
    // Diagonal swipe that goes more horizontal than vertical
    const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 150 }])
    const touchEnd = createMockTouchEvent('touchend', [{ clientX: 250, clientY: 200 }]) // 150px right, 50px down
    
    const result = detectGesture(touchStart, touchEnd)
    
    // This should be detected as horizontal movement (though we don't support left/right yet)
    expect(result).toBe(null) // Or whatever horizontal gesture you implement
  })

  it('should handle missing touch data gracefully', () => {
    const touchStart = createMockTouchEvent('touchstart', [])
    const touchEnd = createMockTouchEvent('touchend', [])
    
    const result = detectGesture(touchStart, touchEnd)
    
    expect(result).toBe(null)
  })

  it('should correctly handle real touchend events with empty touches array', () => {
    const now = Date.now()
    const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 100, timestamp: now }])
    // Need enough distance for a swipe (minimum 50px)
    const touchEnd = createMockTouchEvent('touchend', [{ clientX: 100, clientY: 200, timestamp: now + 100 }])
    
    // touchEnd should have empty touches array and data in changedTouches
    expect(touchEnd.touches).toHaveLength(0)
    expect(touchEnd.changedTouches).toHaveLength(1)
    
    const result = detectGesture(touchStart, touchEnd)
    
    expect(result).toBe('swipe-down')
  })

  it('should use TouchEvent.timeStamp instead of non-existent Touch.timestamp', () => {
    const startTime = 1000
    const endTime = 1600 // 600ms later
    
    const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 100, timestamp: startTime }])
    const touchEnd = createMockTouchEvent('touchend', [{ clientX: 102, clientY: 102, timestamp: endTime }])
    
    // Verify the TouchEvent has timeStamp property
    expect(touchStart.timeStamp).toBe(startTime)
    expect(touchEnd.timeStamp).toBe(endTime)
    
    // Should detect long-press due to 600ms duration
    const result = detectGesture(touchStart, touchEnd, 500)
    expect(result).toBe('long-press')
  })

  it('should handle double-tap with both touchend events', () => {
    const now = Date.now()
    const tap1 = createMockTouchEvent('touchend', [{ clientX: 100, clientY: 100, timestamp: now }])
    const tap2 = createMockTouchEvent('touchend', [{ clientX: 105, clientY: 105, timestamp: now + 200 }])
    
    // Both events should have empty touches and data in changedTouches
    expect(tap1.touches).toHaveLength(0)
    expect(tap1.changedTouches).toHaveLength(1)
    expect(tap2.touches).toHaveLength(0)
    expect(tap2.changedTouches).toHaveLength(1)
    
    const result = detectDoubleTap(tap1, tap2, 300, 50)
    expect(result).toBe(true)
  })
})

describe('applyGestureAction', () => {
  const mockGestureConfig: GestureConfig[] = [
    { gesture: 'swipe-up', action: 'increment', value: 1 },
    { gesture: 'swipe-down', action: 'decrement', value: 1 },
    { gesture: 'double-tap', action: 'complete' },
    { gesture: 'long-press', action: 'reset' }
  ]

  it('should increment value on swipe up', () => {
    const result = applyGestureAction('swipe-up', 5, mockGestureConfig)
    
    expect(result.action).toBe('increment')
    expect(result.newValue).toBe(6)
  })

  it('should decrement value on swipe down', () => {
    const result = applyGestureAction('swipe-down', 5, mockGestureConfig)
    
    expect(result.action).toBe('decrement')
    expect(result.newValue).toBe(4)
  })

  it('should not decrement below zero', () => {
    const result = applyGestureAction('swipe-down', 0, mockGestureConfig)
    
    expect(result.action).toBe('decrement')
    expect(result.newValue).toBe(0) // Should stay at 0
  })

  it('should complete on double-tap', () => {
    const result = applyGestureAction('double-tap', 5, mockGestureConfig)
    
    expect(result.action).toBe('complete')
    expect(result.newValue).toBe(5) // Value unchanged, just marked complete
  })

  it('should reset on long-press', () => {
    const result = applyGestureAction('long-press', 5, mockGestureConfig)
    
    expect(result.action).toBe('reset')
    expect(result.newValue).toBe(0)
  })

  it('should handle unknown gestures', () => {
    // @ts-expect-error - testing unknown gesture handling
    const result = applyGestureAction('unknown-gesture', 5, mockGestureConfig)
    
    expect(result.action).toBe('none')
    expect(result.newValue).toBe(5)
  })

  it('should respect custom increment values', () => {
    const customConfig: GestureConfig[] = [
      { gesture: 'swipe-up', action: 'increment', value: 0.5 }
    ]
    
    const result = applyGestureAction('swipe-up', 2, customConfig)
    
    expect(result.newValue).toBe(2.5)
  })
})

describe('getDefaultGestureConfig', () => {
  it('should return default configuration for numeric habits', () => {
    const config = getDefaultGestureConfig('numeric')
    
    expect(config).toHaveLength(4)
    expect(config.find(c => c.gesture === 'swipe-up')).toBeDefined()
    expect(config.find(c => c.gesture === 'swipe-down')).toBeDefined()
    expect(config.find(c => c.gesture === 'double-tap')).toBeDefined()
    expect(config.find(c => c.gesture === 'long-press')).toBeDefined()
  })

  it('should return simplified configuration for boolean habits', () => {
    const config = getDefaultGestureConfig('boolean')
    
    expect(config.length).toBeGreaterThan(0)
    // Boolean habits should have completion gestures but not increment/decrement
    const hasComplete = config.some(c => c.action === 'complete')
    expect(hasComplete).toBe(true)
  })

  it('should handle choice habits', () => {
    const config = getDefaultGestureConfig('choice')
    
    expect(config.length).toBeGreaterThan(0)
  })
})

describe('createGestureDetector', () => {
  it('should create a detector with event handlers', () => {
    const onGesture = vi.fn()
    const detector = createGestureDetector(onGesture)
    
    expect(detector).toHaveProperty('onTouchStart')
    expect(detector).toHaveProperty('onTouchEnd')
    expect(detector).toHaveProperty('onTouchMove')
    expect(typeof detector.onTouchStart).toBe('function')
    expect(typeof detector.onTouchEnd).toBe('function')
    expect(typeof detector.onTouchMove).toBe('function')
  })

  it('should detect and report gestures', () => {
    const onGesture = vi.fn()
    const detector = createGestureDetector(onGesture)
    
    // Simulate swipe up - touchend events use changedTouches
    const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])
    const touchEnd = {
      type: 'touchend',
      touches: [],
      changedTouches: [{ clientX: 100, clientY: 100 }],
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as TouchEvent
    
    detector.onTouchStart(touchStart)
    detector.onTouchEnd(touchEnd)
    
    expect(onGesture).toHaveBeenCalledWith('swipe-up')
  })

  it('should handle multiple touch points', () => {
    const onGesture = vi.fn()
    const detector = createGestureDetector(onGesture)
    
    // Multi-touch should be ignored for now
    const multiTouch = createMockTouchEvent('touchstart', [
      { clientX: 100, clientY: 100 },
      { clientX: 200, clientY: 200 }
    ])
    
    detector.onTouchStart(multiTouch)
    
    // Should not crash or trigger gestures with multi-touch
    expect(onGesture).not.toHaveBeenCalled()
  })

  it('should prevent default behavior for recognized gestures', () => {
    const onGesture = vi.fn()
    const detector = createGestureDetector(onGesture)
    
    const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])
    const touchEnd = {
      type: 'touchend',
      touches: [],
      changedTouches: [{ clientX: 100, clientY: 100 }],
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as TouchEvent
    
    detector.onTouchStart(touchStart)
    detector.onTouchEnd(touchEnd)
    
    // Should prevent default to avoid scrolling on swipe gestures
    expect(touchEnd.preventDefault).toHaveBeenCalled()
  })
})