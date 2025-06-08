import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressIndicator } from '../ProgressIndicator'

describe('ProgressIndicator', () => {
  it('should display completion percentage correctly', () => {
    render(<ProgressIndicator completed={3} total={5} />)
    
    expect(screen.getByText('3 of 5 completed')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('should show 100% when all habits completed', () => {
    render(<ProgressIndicator completed={5} total={5} />)
    
    expect(screen.getByText('5 of 5 completed')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('should show 0% when no habits completed', () => {
    render(<ProgressIndicator completed={0} total={5} />)
    
    expect(screen.getByText('0 of 5 completed')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('should handle edge case of zero total habits', () => {
    render(<ProgressIndicator completed={0} total={0} />)
    
    expect(screen.getByText('0 of 0 completed')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('should update progress bar width based on percentage', () => {
    render(<ProgressIndicator completed={2} total={4} />)
    
    // 2/4 = 50% completion
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('should use proper ARIA labels for accessibility', () => {
    render(<ProgressIndicator completed={3} total={5} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-label', 'Habit completion progress')
  })

  it('should show motivational message for high completion', () => {
    render(<ProgressIndicator completed={4} total={5} />)
    
    // 80% completion should show encouraging message
    expect(screen.getByText('Almost there!')).toBeInTheDocument()
  })

  it('should show completion celebration for 100%', () => {
    render(<ProgressIndicator completed={5} total={5} />)
    
    expect(screen.getByText('Perfect day! 🎉')).toBeInTheDocument()
  })

  it('should use semantic HTML for progress indication', () => {
    render(<ProgressIndicator completed={3} total={5} />)
    
    // Should use proper progress element
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    
    // Should have descriptive text
    expect(screen.getByText(/completed/)).toBeInTheDocument()
  })
})