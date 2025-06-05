import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'

// Mock crypto.randomUUID for tests
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
    },
    writable: true
  })
}

// jsdom provides localStorage, so we don't need to mock it
// Just ensure it's cleared before each test
beforeEach(() => {
  localStorage.clear()
})