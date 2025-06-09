/**
 * Gesture Input API
 * Handles touch gesture recognition and mapping to habit completion actions
 */

import type { GestureType, GestureConfig } from '../../../types/data'

export interface GestureResult {
  action: 'increment' | 'decrement' | 'complete' | 'reset' | 'none'
  newValue: number
}

export interface GestureDetector {
  onTouchStart: (event: TouchEvent) => void
  onTouchEnd: (event: TouchEvent) => void
  onTouchMove: (event: TouchEvent) => void
}

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

/**
 * Detect gesture type from touch events
 */
export const detectGesture = (
  startEvent: TouchEvent, 
  endEvent: TouchEvent, 
  timeThreshold: number = 500
): GestureType | null => {
  // Handle missing touch data - for touchend events, touches are in changedTouches
  if (!startEvent.touches?.length || 
      (!endEvent.touches?.length && !endEvent.changedTouches?.length)) {
    return null
  }

  const start: TouchPoint = {
    x: startEvent.touches[0].clientX,
    y: startEvent.touches[0].clientY,
    timestamp: startEvent.timeStamp
  }

  // For touchend events, use changedTouches instead of touches
  const endTouch = endEvent.touches?.length > 0 
    ? endEvent.touches[0] 
    : endEvent.changedTouches[0]

  const end: TouchPoint = {
    x: endTouch.clientX,
    y: endTouch.clientY,
    timestamp: endEvent.timeStamp
  }

  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  const deltaTime = end.timestamp - start.timestamp
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  // Minimum movement threshold to prevent accidental gestures
  const MIN_SWIPE_DISTANCE = 50
  const LONG_PRESS_THRESHOLD = timeThreshold

  // Check for long press (minimal movement, long duration)
  if (distance < 20 && deltaTime > LONG_PRESS_THRESHOLD) {
    return 'long-press'
  }

  // Check for swipes (significant movement)
  if (distance > MIN_SWIPE_DISTANCE) {
    // Determine primary direction
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // Vertical swipe
      return deltaY < 0 ? 'swipe-up' : 'swipe-down'
    } else {
      // Horizontal swipe - not implemented yet, but could add swipe-left/right
      return null
    }
  }

  return null
}

/**
 * Detect double-tap from two consecutive touch events
 */
export const detectDoubleTap = (
  firstTap: TouchEvent,
  secondTap: TouchEvent,
  timeThreshold: number = 300,
  distanceThreshold: number = 50
): boolean => {
  // Handle missing touch data - for touchend events, touches are in changedTouches
  if ((!firstTap.touches?.length && !firstTap.changedTouches?.length) || 
      (!secondTap.touches?.length && !secondTap.changedTouches?.length)) {
    return false
  }

  // For touchend events, use changedTouches instead of touches
  const firstTouch = firstTap.touches?.length > 0 
    ? firstTap.touches[0] 
    : firstTap.changedTouches[0]
    
  const secondTouch = secondTap.touches?.length > 0 
    ? secondTap.touches[0] 
    : secondTap.changedTouches[0]

  const first = {
    x: firstTouch.clientX,
    y: firstTouch.clientY,
    timestamp: firstTap.timeStamp
  }

  const second = {
    x: secondTouch.clientX,
    y: secondTouch.clientY,
    timestamp: secondTap.timeStamp
  }

  const deltaTime = second.timestamp - first.timestamp
  const distance = Math.sqrt(
    Math.pow(second.x - first.x, 2) + Math.pow(second.y - first.y, 2)
  )

  return deltaTime < timeThreshold && distance < distanceThreshold
}

/**
 * Apply gesture action to a value
 */
export const applyGestureAction = (
  gesture: GestureType,
  currentValue: number,
  gestureConfig: GestureConfig[]
): GestureResult => {
  const config = gestureConfig.find(c => c.gesture === gesture)
  
  if (!config) {
    return { action: 'none', newValue: currentValue }
  }

  let newValue = currentValue

  switch (config.action) {
    case 'increment':
      newValue = currentValue + (config.value || 1)
      break
    case 'decrement':
      newValue = Math.max(0, currentValue - (config.value || 1))
      break
    case 'complete':
      // Value stays the same, just marks as complete
      newValue = currentValue
      break
    case 'reset':
      newValue = 0
      break
    default:
      return { action: 'none', newValue: currentValue }
  }

  return { action: config.action, newValue }
}

/**
 * Get default gesture configuration for a habit type
 */
export const getDefaultGestureConfig = (habitType: 'boolean' | 'numeric' | 'choice'): GestureConfig[] => {
  const baseConfig: GestureConfig[] = [
    { gesture: 'double-tap', action: 'complete' },
    { gesture: 'long-press', action: 'reset' }
  ]

  if (habitType === 'numeric') {
    return [
      { gesture: 'swipe-up', action: 'increment', value: 1 },
      { gesture: 'swipe-down', action: 'decrement', value: 1 },
      ...baseConfig
    ]
  }

  if (habitType === 'boolean') {
    return [
      { gesture: 'double-tap', action: 'complete' }
    ]
  }

  if (habitType === 'choice') {
    return [
      { gesture: 'swipe-up', action: 'increment', value: 1 }, // Next choice
      { gesture: 'swipe-down', action: 'decrement', value: 1 }, // Previous choice
      ...baseConfig
    ]
  }

  return baseConfig
}

/**
 * Create a gesture detector for an element
 */
export const createGestureDetector = (
  onGesture: (gesture: GestureType) => void
): GestureDetector => {
  let touchStart: TouchEvent | null = null
  let lastTap: TouchEvent | null = null
  let lastTapTime = 0

  const onTouchStart = (event: TouchEvent) => {
    // Only handle single touch
    if (event.touches.length !== 1) {
      return
    }

    touchStart = event
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (!touchStart) {
      return
    }

    // TouchEnd events don't have touches, so we need to use changedTouches
    if (event.changedTouches?.length > 0 && touchStart.touches?.length > 0) {
      const now = Date.now()

      // Create a synthetic event for gesture detection
      const endEvent = {
        ...event,
        touches: [{
          clientX: event.changedTouches[0].clientX,
          clientY: event.changedTouches[0].clientY,
          timestamp: now
        } as unknown as Touch]
      } as unknown as TouchEvent

      // Check for double-tap first
      if (lastTap && now - lastTapTime < 300) {
        if (detectDoubleTap(lastTap, endEvent)) {
          onGesture('double-tap')
          event.preventDefault()
          lastTap = null
          lastTapTime = 0
          touchStart = null
          return
        }
      }

      // Check for other gestures
      const gesture = detectGesture(touchStart, endEvent)
      if (gesture) {
        onGesture(gesture)
        event.preventDefault()
      }

      // Store this tap for potential double-tap
      lastTap = endEvent
      lastTapTime = now
    }

    touchStart = null
  }

  const onTouchMove = (event: TouchEvent) => {
    // Prevent scrolling during gesture detection
    if (touchStart) {
      event.preventDefault()
    }
  }

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove
  }
}