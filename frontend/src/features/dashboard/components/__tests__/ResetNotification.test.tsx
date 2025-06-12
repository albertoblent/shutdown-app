/**
 * ResetNotification Component Tests
 * Tests for the daily reset notification including auto-hide timer, user interactions, and accessibility
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { ResetNotification } from '../ResetNotification';

describe('ResetNotification', () => {
  const defaultProps = {
    show: true,
    onClose: vi.fn(),
    previousDate: '2023-12-05',
    newDate: '2023-12-06',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should not render when show is false', () => {
      render(<ResetNotification {...defaultProps} show={false} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should render when show is true', () => {
      render(<ResetNotification {...defaultProps} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('New Day Started')).toBeInTheDocument();
    });

    it('should display the correct new date', () => {
      render(<ResetNotification {...defaultProps} />);
      expect(screen.getByText('Your habits have been reset for 2023-12-06.')).toBeInTheDocument();
    });

    it('should display the correct previous date', () => {
      render(<ResetNotification {...defaultProps} />);
      expect(screen.getByText("Previous day's data (2023-12-05) has been saved.")).toBeInTheDocument();
    });

    it('should render the sunrise emoji icon', () => {
      render(<ResetNotification {...defaultProps} />);
      expect(screen.getByText('🌅')).toBeInTheDocument();
    });

    it('should render close button with proper aria-label', () => {
      render(<ResetNotification {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close notification');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveTextContent('×');
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();

      render(<ResetNotification {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close notification');
      closeButton.click();
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when notification content is clicked', () => {
      const onClose = vi.fn();

      render(<ResetNotification {...defaultProps} onClose={onClose} />);
      
      const title = screen.getByText('New Day Started');
      title.click();
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Auto-hide Timer', () => {
    it('should call onClose after 5 seconds when show is true', () => {
      const onClose = vi.fn();
      render(<ResetNotification {...defaultProps} onClose={onClose} />);
      
      expect(onClose).not.toHaveBeenCalled();
      
      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not set timer when show is false', () => {
      const onClose = vi.fn();
      render(<ResetNotification {...defaultProps} show={false} onClose={onClose} />);
      
      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should clear timer when component unmounts', () => {
      const onClose = vi.fn();
      const { unmount } = render(<ResetNotification {...defaultProps} onClose={onClose} />);
      
      // Unmount before timer expires
      unmount();
      
      // Fast-forward time - should not call onClose after unmount
      vi.advanceTimersByTime(5000);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should reset timer when show prop changes from false to true', () => {
      const onClose = vi.fn();
      const { rerender } = render(<ResetNotification {...defaultProps} show={false} onClose={onClose} />);
      
      // Initially hidden - no timer
      vi.advanceTimersByTime(5000);
      expect(onClose).not.toHaveBeenCalled();
      
      // Show notification - timer should start
      rerender(<ResetNotification {...defaultProps} show={true} onClose={onClose} />);
      
      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should clear timer when show prop changes from true to false', () => {
      const onClose = vi.fn();
      const { rerender } = render(<ResetNotification {...defaultProps} show={true} onClose={onClose} />);
      
      // Hide notification before timer expires
      rerender(<ResetNotification {...defaultProps} show={false} onClose={onClose} />);
      
      // Fast-forward time - should not call onClose
      vi.advanceTimersByTime(5000);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should handle onClose prop changes correctly', () => {
      const onClose1 = vi.fn();
      const onClose2 = vi.fn();
      
      const { rerender } = render(<ResetNotification {...defaultProps} onClose={onClose1} />);
      
      // Change onClose prop
      rerender(<ResetNotification {...defaultProps} onClose={onClose2} />);
      
      // Timer should call the new onClose function
      vi.advanceTimersByTime(5000);
      
      expect(onClose1).not.toHaveBeenCalled();
      expect(onClose2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ResetNotification {...defaultProps} />);
      
      const notification = screen.getByRole('alert');
      expect(notification).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper heading structure', () => {
      render(<ResetNotification {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('New Day Started');
    });

    it('should have accessible close button', () => {
      render(<ResetNotification {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty date strings gracefully', () => {
      render(<ResetNotification {...defaultProps} previousDate="" newDate="" />);
      
      expect(screen.getByText('Your habits have been reset for .')).toBeInTheDocument();
      expect(screen.getByText("Previous day's data () has been saved.")).toBeInTheDocument();
    });

    it('should handle very long date strings', () => {
      const longDate = 'This is a very long date string that might cause layout issues';
      render(<ResetNotification {...defaultProps} previousDate={longDate} newDate={longDate} />);
      
      expect(screen.getByText(`Your habits have been reset for ${longDate}.`)).toBeInTheDocument();
      expect(screen.getByText(`Previous day's data (${longDate}) has been saved.`)).toBeInTheDocument();
    });

    it('should handle special characters in date strings', () => {
      const specialDate = '2023-12-06 <script>alert("xss")</script>';
      render(<ResetNotification {...defaultProps} previousDate={specialDate} newDate={specialDate} />);
      
      // Should render as text, not execute script
      expect(screen.getByText(`Your habits have been reset for ${specialDate}.`)).toBeInTheDocument();
      expect(screen.getByText(`Previous day's data (${specialDate}) has been saved.`)).toBeInTheDocument();
    });
  });

  describe('Component State Changes', () => {
    it('should handle rapid show/hide toggles', () => {
      const onClose = vi.fn();
      const { rerender } = render(<ResetNotification {...defaultProps} show={true} onClose={onClose} />);
      
      // Rapidly toggle show prop
      rerender(<ResetNotification {...defaultProps} show={false} onClose={onClose} />);
      rerender(<ResetNotification {...defaultProps} show={true} onClose={onClose} />);
      rerender(<ResetNotification {...defaultProps} show={false} onClose={onClose} />);
      rerender(<ResetNotification {...defaultProps} show={true} onClose={onClose} />);
      
      // Only the final timer should be active
      vi.advanceTimersByTime(5000);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should update content when date props change', () => {
      const { rerender } = render(<ResetNotification {...defaultProps} />);
      
      // Change date props
      rerender(<ResetNotification {...defaultProps} previousDate="2023-12-10" newDate="2023-12-11" />);
      
      expect(screen.getByText('Your habits have been reset for 2023-12-11.')).toBeInTheDocument();
      expect(screen.getByText("Previous day's data (2023-12-10) has been saved.")).toBeInTheDocument();
    });
  });

  describe('Event Cleanup', () => {
    it('should clean up timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const onClose = vi.fn();
      
      const { unmount } = render(<ResetNotification {...defaultProps} onClose={onClose} />);
      
      unmount();
      
      // Should have called clearTimeout when cleaning up
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });
});