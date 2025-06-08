/**
 * Gesture Input Area Component
 * Provides touch gesture recognition for rapid value input
 */

import { useRef, useEffect } from 'react'
import { createGestureDetector, applyGestureAction, getDefaultGestureConfig } from '../api/gestures'
import type { GestureType, GestureConfig } from '../../../types/data'
import styles from './GestureInputArea.module.css'

interface GestureInputAreaProps {
  habitType: 'boolean' | 'numeric' | 'choice'
  currentValue: number
  onValueChange: (newValue: number) => void
  onComplete?: () => void
  gestureConfig?: GestureConfig[]
  className?: string
  children: React.ReactNode
}

export function GestureInputArea({
  habitType,
  currentValue,
  onValueChange,
  onComplete,
  gestureConfig,
  className = '',
  children
}: GestureInputAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const config = gestureConfig || getDefaultGestureConfig(habitType)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleGesture = (gesture: GestureType) => {
      const result = applyGestureAction(gesture, currentValue, config)
      
      switch (result.action) {
        case 'increment':
        case 'decrement':
        case 'reset':
          onValueChange(result.newValue)
          break
        case 'complete':
          onComplete?.()
          break
      }
    }

    const detector = createGestureDetector(handleGesture)

    // Add event listeners
    container.addEventListener('touchstart', detector.onTouchStart, { passive: false })
    container.addEventListener('touchend', detector.onTouchEnd, { passive: false })
    container.addEventListener('touchmove', detector.onTouchMove, { passive: false })

    return () => {
      container.removeEventListener('touchstart', detector.onTouchStart)
      container.removeEventListener('touchend', detector.onTouchEnd)
      container.removeEventListener('touchmove', detector.onTouchMove)
    }
  }, [currentValue, config, onValueChange, onComplete])

  return (
    <div 
      ref={containerRef}
      className={`${styles.gestureArea} ${className}`}
      role="region"
      aria-label="Gesture input area"
      data-testid="gesture-input-area"
    >
      {children}
      
      <div className={styles.gestureHints} aria-hidden="true">
        {habitType === 'numeric' && (
          <>
            <div className={styles.hint}>
              <span className={styles.hintIcon}>⬆️</span>
              <span className={styles.hintText}>Swipe up: +1</span>
            </div>
            <div className={styles.hint}>
              <span className={styles.hintIcon}>⬇️</span>
              <span className={styles.hintText}>Swipe down: -1</span>
            </div>
          </>
        )}
        <div className={styles.hint}>
          <span className={styles.hintIcon}>👆👆</span>
          <span className={styles.hintText}>Double-tap: Complete</span>
        </div>
        <div className={styles.hint}>
          <span className={styles.hintIcon}>📱</span>
          <span className={styles.hintText}>Long press: Reset</span>
        </div>
      </div>
    </div>
  )
}