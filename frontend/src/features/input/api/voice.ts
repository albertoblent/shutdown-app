/**
 * Voice Input API
 * Handles speech recognition and voice-to-number conversion for rapid data entry
 */

import type { VoiceInputResult } from '../../../types/data'

/**
 * Check if voice input is supported in the current browser
 */
export const isVoiceInputSupported = (): boolean => {
  return !!(
    (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition || 
    (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  )
}

/**
 * Parse voice transcript to extract numeric value
 */
export const parseVoiceToNumber = (transcript: string): number | null => {
  if (!transcript || transcript.trim() === '') {
    return null
  }

  const text = transcript.toLowerCase().trim()

  // Word-to-number mapping
  const wordNumbers: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90, 'hundred': 100
  }

  // Try to find direct numeric matches first
  const numericMatch = text.match(/\d+(?:\.\d+)?/)
  if (numericMatch) {
    return parseFloat(numericMatch[0])
  }

  // Handle decimal expressions like "two point five" or "two point fifteen"
  const decimalMatch = text.match(/((?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|\d+))\s+(?:point|dot)\s+([\w\s]+)/)
  if (decimalMatch) {
    const wholePart = wordNumbers[decimalMatch[1]] ?? parseInt(decimalMatch[1], 10)
    const decimalText = decimalMatch[2].trim()
    
    // Parse the decimal part, which could be compound numbers like "twenty five"
    let decimalPart: number
    
    // Check for compound numbers in decimal part like "twenty five" = 25
    const compoundMatch = decimalText.match(/(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)/)
    if (compoundMatch) {
      const tens = wordNumbers[compoundMatch[1]]
      const ones = wordNumbers[compoundMatch[2]]
      decimalPart = tens + ones
    } else {
      // Try simple word number or numeric
      decimalPart = wordNumbers[decimalText] ?? parseInt(decimalText, 10)
    }
    
    if (!isNaN(wholePart) && !isNaN(decimalPart)) {
      // Fix: Calculate proper decimal divisor based on number of digits
      const decimalDigits = decimalPart.toString().length
      const divisor = Math.pow(10, decimalDigits)
      return wholePart + (decimalPart / divisor)
    }
  }

  // Handle "X hundred" patterns first (more specific)
  const hundredMatch = text.match(/((?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|\d+))\s+hundred/)
  if (hundredMatch) {
    const base = wordNumbers[hundredMatch[1]] ?? parseInt(hundredMatch[1], 10)
    if (!isNaN(base)) {
      return base * 100
    }
  }

  // Handle compound numbers like "twenty one"
  const compoundMatch = text.match(/(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)/)
  if (compoundMatch) {
    const tens = wordNumbers[compoundMatch[1]]
    const ones = wordNumbers[compoundMatch[2]]
    return tens + ones
  }

  // Handle "seven and a half" patterns
  const halfMatch = text.match(/((?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|\d+))\s+and\s+a\s+half/)
  if (halfMatch) {
    const base = wordNumbers[halfMatch[1]] ?? parseInt(halfMatch[1], 10)
    if (!isNaN(base)) {
      return base + 0.5
    }
  }

  // Try to find any word number in the text (order by value descending to prefer larger numbers)
  const sortedWordNumbers = Object.entries(wordNumbers).sort(([,a], [,b]) => b - a)
  for (const [word, number] of sortedWordNumbers) {
    const regex = new RegExp(`\\b${word}\\b`)
    if (regex.test(text)) {
      return number
    }
  }

  return null
}

/**
 * Start voice input and return promise with the result
 */
export const startVoiceInput = (timeoutMs = 5000): Promise<VoiceInputResult> => {
  return new Promise((resolve) => {
    if (!isVoiceInputSupported()) {
      resolve({
        success: false,
        error: 'Voice input not supported in this browser'
      })
      return
    }

    const SpeechRecognition = (window as Window & { SpeechRecognition?: new () => unknown }).SpeechRecognition || 
                            (window as Window & { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      resolve({
        success: false,
        error: 'Speech recognition not available'
      })
      return
    }

    const recognition = new SpeechRecognition() as unknown as {
      continuous: boolean
      interimResults: boolean
      lang: string
      onstart: ((event: Event) => void) | null
      onresult: ((event: Event) => void) | null
      onerror: ((event: Event) => void) | null
      onend: (() => void) | null
      start(): void
      abort(): void
    }
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    let resolved = false

    const resolveOnce = (result: VoiceInputResult) => {
      if (!resolved) {
        resolved = true
        cleanup()
        resolve(result)
      }
    }

    const timeoutId = window.setTimeout(() => {
      resolveOnce({
        success: false,
        error: 'Voice input timeout - please try again'
      })
    }, timeoutMs)

    const cleanup = () => {
      clearTimeout(timeoutId)
      try {
        recognition.abort()
      } catch {
        // Ignore cleanup errors
      }
    }


    recognition.onstart = () => {
      // Voice recognition started successfully
    }

    recognition.onresult = (event: Event) => {
      const speechEvent = event as unknown as { results: SpeechRecognitionResultList }
      const transcript = speechEvent.results[0][0].transcript
      const confidence = speechEvent.results[0][0].confidence

      const parsedValue = parseVoiceToNumber(transcript)
      
      if (parsedValue !== null) {
        resolveOnce({
          success: true,
          value: parsedValue,
          confidence
        })
      } else {
        resolveOnce({
          success: false,
          error: 'Could not extract a number from speech. Please try again.'
        })
      }
    }

    recognition.onerror = (event: Event) => {
      const errorEvent = event as unknown as { error: string }
      let errorMessage = 'Voice input error'
      
      switch (errorEvent.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          errorMessage = 'Permission denied. Please allow microphone access.'
          break
        case 'network':
          errorMessage = 'Network error. Please check your connection.'
          break
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.'
          break
        case 'aborted':
          errorMessage = 'Voice input was cancelled.'
          break
        default:
          errorMessage = `Voice input error: ${errorEvent.error}`
      }

      resolveOnce({
        success: false,
        error: errorMessage
      })
    }

    recognition.onend = () => {
      if (!resolved) {
        resolveOnce({
          success: false,
          error: 'Voice input ended without result. Please try again.'
        })
      }
    }

    try {
      recognition.start()
    } catch {
      resolveOnce({
        success: false,
        error: 'Failed to start voice recognition'
      })
    }
  })
}