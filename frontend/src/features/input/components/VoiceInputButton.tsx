/**
 * Voice Input Button Component
 * Provides speech-to-text input for numeric habits
 */

import { useState } from 'react'
import { startVoiceInput, isVoiceInputSupported } from '../api/voice'
import styles from './VoiceInputButton.module.css'

interface VoiceInputButtonProps {
  onValueReceived: (value: number) => void
  disabled?: boolean
  className?: string
}

export function VoiceInputButton({ 
  onValueReceived, 
  disabled = false, 
  className = '' 
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = isVoiceInputSupported()

  const handleVoiceInput = async () => {
    if (!isSupported || disabled || isListening) {
      return
    }

    setIsListening(true)
    setError(null)

    try {
      const result = await startVoiceInput()
      
      if (result.success && result.value !== undefined) {
        onValueReceived(result.value)
      } else {
        setError(result.error || 'Voice input failed')
      }
    } catch {
      setError('Voice input error')
    } finally {
      setIsListening(false)
    }
  }

  if (!isSupported) {
    return null // Don't render if voice input not supported
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <button
        type="button"
        className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}
        onClick={handleVoiceInput}
        disabled={disabled || isListening}
        aria-label={isListening ? 'Listening...' : 'Voice input'}
        title={isListening ? 'Listening for voice input...' : 'Tap to speak a number'}
      >
        <svg 
          className={styles.micIcon} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
          aria-hidden="true"
        >
          {isListening ? (
            // Listening animation - pulsing circle
            <>
              <circle cx="12" cy="12" r="8" className={styles.pulse} />
              <circle cx="12" cy="12" r="4" />
            </>
          ) : (
            // Microphone icon
            <>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </>
          )}
        </svg>
        <span className={styles.buttonText}>
          {isListening ? 'Listening...' : 'Voice'}
        </span>
      </button>
      
      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
    </div>
  )
}