/**
 * Voice Input Tests
 * Tests for speech recognition and voice-to-number conversion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  parseVoiceToNumber, 
  startVoiceInput, 
  isVoiceInputSupported 
} from '../api/voice'

// Mock SpeechRecognition API
class MockSpeechRecognition {
  public continuous = false
  public interimResults = false
  public lang = 'en-US'
  public onstart: (() => void) | null = null
  public onresult: ((event: Event) => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  public onend: (() => void) | null = null

  start() {
    if (this.onstart) this.onstart()
  }

  stop() {
    if (this.onend) this.onend()
  }

  abort() {
    if (this.onend) this.onend()
  }

  // Helper to simulate speech result
  simulateResult(transcript: string, confidence = 0.9) {
    if (this.onresult) {
      const mockEvent = {
        results: [{
          0: { transcript, confidence },
          isFinal: true,
          length: 1
        }],
        resultIndex: 0
      } as unknown as Event
      this.onresult(mockEvent)
    }
  }

  // Helper to simulate error
  simulateError(error = 'network') {
    if (this.onerror) {
      this.onerror({ error } as unknown as Event)
    }
  }
}

// Setup global mocks
beforeEach(() => {
  // @ts-expect-error - Mock global SpeechRecognition
  global.SpeechRecognition = MockSpeechRecognition
  // @ts-expect-error - Mock webkitSpeechRecognition for Safari
  global.webkitSpeechRecognition = MockSpeechRecognition
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('parseVoiceToNumber', () => {
  it('should parse basic numbers', () => {
    expect(parseVoiceToNumber('three')).toBe(3)
    expect(parseVoiceToNumber('7')).toBe(7)
    expect(parseVoiceToNumber('fifteen')).toBe(15)
  })

  it('should parse decimal numbers', () => {
    expect(parseVoiceToNumber('two point five')).toBe(2.5)
    expect(parseVoiceToNumber('3.7')).toBe(3.7)
  })

  it('should parse time expressions', () => {
    expect(parseVoiceToNumber('three hours')).toBe(3)
    expect(parseVoiceToNumber('2 hours')).toBe(2)
    expect(parseVoiceToNumber('one hour')).toBe(1)
  })

  it('should parse complex expressions', () => {
    expect(parseVoiceToNumber('three hours of deep work')).toBe(3)
    expect(parseVoiceToNumber('I did 5 hours today')).toBe(5)
    expect(parseVoiceToNumber('about seven and a half')).toBe(7.5)
  })

  it('should handle invalid input', () => {
    expect(parseVoiceToNumber('no numbers here')).toBe(null)
    expect(parseVoiceToNumber('')).toBe(null)
    expect(parseVoiceToNumber('maybe some')).toBe(null)
  })

  it('should handle edge cases', () => {
    expect(parseVoiceToNumber('zero')).toBe(0)
    expect(parseVoiceToNumber('0')).toBe(0)
    expect(parseVoiceToNumber('twenty one')).toBe(21)
    expect(parseVoiceToNumber('one hundred')).toBe(100)
  })
})

describe('isVoiceInputSupported', () => {
  it('should return true when SpeechRecognition is available', () => {
    expect(isVoiceInputSupported()).toBe(true)
  })

  it('should return false when SpeechRecognition is not available', () => {
    // @ts-expect-error - Intentionally setting to undefined for test
    global.SpeechRecognition = undefined
    // @ts-expect-error - Intentionally setting to undefined for test
    global.webkitSpeechRecognition = undefined
    
    expect(isVoiceInputSupported()).toBe(false)
  })
})

describe('startVoiceInput', () => {
  let mockRecognition: MockSpeechRecognition

  beforeEach(() => {
    mockRecognition = new MockSpeechRecognition()
    vi.spyOn(global, 'SpeechRecognition').mockImplementation(() => mockRecognition)
  })

  it('should resolve with parsed number on successful recognition', async () => {
    const resultPromise = startVoiceInput()
    
    // Simulate successful speech recognition
    setTimeout(() => {
      mockRecognition.simulateResult('three hours')
    }, 10)

    const result = await resultPromise
    expect(result.success).toBe(true)
    expect(result.value).toBe(3)
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should handle speech recognition errors', async () => {
    const resultPromise = startVoiceInput()
    
    // Simulate error
    setTimeout(() => {
      mockRecognition.simulateError('not-allowed')
    }, 10)

    const result = await resultPromise
    expect(result.success).toBe(false)
    expect(result.error).toContain('Permission')
  })

  it('should handle unparseable speech', async () => {
    const resultPromise = startVoiceInput()
    
    // Simulate speech that doesn't contain numbers
    setTimeout(() => {
      mockRecognition.simulateResult('hello world')
    }, 10)

    const result = await resultPromise
    expect(result.success).toBe(false)
    expect(result.error).toContain('number')
  })

  it('should timeout after specified duration', async () => {
    const resultPromise = startVoiceInput(100) // 100ms timeout
    
    // Don't simulate any result - let it timeout
    const result = await resultPromise
    expect(result.success).toBe(false)
    expect(result.error).toContain('timeout')
  }, 200)

  it('should include confidence score in result', async () => {
    const resultPromise = startVoiceInput()
    
    const confidence = 0.85
    setTimeout(() => {
      mockRecognition.simulateResult('five', confidence)
    }, 10)

    const result = await resultPromise
    expect(result.success).toBe(true)
    expect(result.confidence).toBe(confidence)
  })
})