import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Automatically clean up DOM after each test
afterEach(() => {
  cleanup()
})

// Mock window.scrollTo to prevent jsdom not implemented warnings
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn()
}
