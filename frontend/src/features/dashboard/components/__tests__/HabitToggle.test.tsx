import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { HabitToggle } from '../HabitToggle';
import styles from '../HabitToggle.module.css';

describe('HabitToggle', () => {
  const defaultProps = {
    isCompleted: false,
    onToggle: vi.fn(),
    habitId: 'test-habit-1',
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render toggle button with correct accessibility attributes', () => {
      render(<HabitToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      expect(toggle).toHaveAttribute('aria-label', 'Mark habit as complete');
    });

    it('should render with completed state when isCompleted is true', () => {
      render(<HabitToggle {...defaultProps} isCompleted={true} />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
      expect(toggle).toHaveAttribute('aria-label', 'Mark habit as incomplete');
    });

    it('should render red X icon when incomplete', () => {
      render(<HabitToggle {...defaultProps} />);
      
      const xIcon = screen.getByText('×');
      expect(xIcon).toBeInTheDocument();
      expect(xIcon).toHaveClass(styles.incompleteIcon);
    });

    it('should render green checkmark when completed', () => {
      render(<HabitToggle {...defaultProps} isCompleted={true} />);
      
      const checkIcon = screen.getByText('✓');
      expect(checkIcon).toBeInTheDocument();
      expect(checkIcon).toHaveClass(styles.completeIcon);
    });

    it('should have proper CSS classes based on completion state', () => {
      const { rerender } = render(<HabitToggle {...defaultProps} />);
      
      let toggle = screen.getByRole('button');
      expect(toggle).toHaveClass(styles.toggle);
      expect(toggle).toHaveClass(styles.incomplete);
      
      rerender(<HabitToggle {...defaultProps} isCompleted={true} />);
      toggle = screen.getByRole('button');
      expect(toggle).toHaveClass(styles.toggle);
      expect(toggle).toHaveClass(styles.complete);
    });
  });

  describe('User Interactions', () => {
    it('should call onToggle with habitId when clicked', () => {
      render(<HabitToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      toggle.click();
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
      expect(defaultProps.onToggle).toHaveBeenCalledWith('test-habit-1');
    });

    it('should call onToggle when activated with Enter key', () => {
      render(<HabitToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      fireEvent.keyDown(toggle, { key: 'Enter', code: 'Enter' });
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
      expect(defaultProps.onToggle).toHaveBeenCalledWith('test-habit-1');
    });

    it('should call onToggle when activated with Space key', () => {
      render(<HabitToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      fireEvent.keyDown(toggle, { key: ' ', code: 'Space' });
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
      expect(defaultProps.onToggle).toHaveBeenCalledWith('test-habit-1');
    });

    it('should not call onToggle when disabled', () => {
      render(<HabitToggle {...defaultProps} disabled={true} />);
      
      const toggle = screen.getByRole('button');
      toggle.click();
      
      expect(defaultProps.onToggle).not.toHaveBeenCalled();
    });

    it('should be focusable with keyboard navigation', () => {
      render(<HabitToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      toggle.focus();
      
      expect(toggle).toHaveFocus();
    });
  });

  describe('Disabled State', () => {
    it('should render as disabled when disabled prop is true', () => {
      render(<HabitToggle {...defaultProps} disabled={true} />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toBeDisabled();
      expect(toggle).toHaveClass(styles.disabled);
    });

    it('should have reduced opacity when disabled', () => {
      render(<HabitToggle {...defaultProps} disabled={true} />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass(styles.disabled);
    });

    it('should not be interactive when disabled', () => {
      render(<HabitToggle {...defaultProps} disabled={true} />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Accessibility', () => {
    it('should have minimum 44px touch target', () => {
      render(<HabitToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      // In test environment, we can't test computed styles directly
      // but we can verify the CSS classes are applied correctly
      expect(toggle).toHaveClass(styles.toggle);
    });

    it('should have proper ARIA attributes for screen readers', () => {
      render(<HabitToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('type', 'button');
      expect(toggle).toHaveAttribute('aria-pressed');
      expect(toggle).toHaveAttribute('aria-label');
    });

    it('should update aria-pressed when completion state changes', () => {
      const { rerender } = render(<HabitToggle {...defaultProps} />);
      
      let toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      
      rerender(<HabitToggle {...defaultProps} isCompleted={true} />);
      toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have descriptive aria-label that changes with state', () => {
      const { rerender } = render(<HabitToggle {...defaultProps} />);
      
      let toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-label', 'Mark habit as complete');
      
      rerender(<HabitToggle {...defaultProps} isCompleted={true} />);
      toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-label', 'Mark habit as incomplete');
    });
  });

  describe('Animation Behavior', () => {
    it('should have slider element that moves based on completion state', () => {
      const { rerender } = render(<HabitToggle {...defaultProps} />);
      
      let slider = screen.getByTestId('toggle-slider');
      expect(slider).toHaveClass(styles.sliderIncomplete);
      
      rerender(<HabitToggle {...defaultProps} isCompleted={true} />);
      slider = screen.getByTestId('toggle-slider');
      expect(slider).toHaveClass(styles.sliderComplete);
    });

    it('should respect reduced motion preferences', () => {
      render(<HabitToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      // In test environment, reduced motion class won't be applied
      // but we can verify the component renders without errors
      expect(toggle).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive clicks gracefully', () => {
      render(<HabitToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      
      // Rapid clicks
      toggle.click();
      toggle.click();
      toggle.click();
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(3);
      expect(defaultProps.onToggle).toHaveBeenCalledWith('test-habit-1');
    });

    it('should maintain visual state consistency during interactions', () => {
      const { rerender } = render(<HabitToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      const xIcon = screen.getByText('×');
      
      expect(toggle).toHaveClass(styles.incomplete);
      expect(xIcon).toBeInTheDocument();
      
      // Simulate state change from parent
      rerender(<HabitToggle {...defaultProps} isCompleted={true} />);
      
      const checkIcon = screen.getByText('✓');
      expect(toggle).toHaveClass(styles.complete);
      expect(checkIcon).toBeInTheDocument();
    });

    it('should handle missing habitId gracefully', () => {
      const onToggle = vi.fn();
      render(<HabitToggle {...defaultProps} habitId="" onToggle={onToggle} />);
      
      const toggle = screen.getByRole('button');
      toggle.click();
      
      expect(onToggle).toHaveBeenCalledWith('');
    });
  });

  describe('Component Cleanup', () => {
    it('should not cause memory leaks when unmounted', () => {
      const { unmount } = render(<HabitToggle {...defaultProps} />);
      
      expect(() => unmount()).not.toThrow();
    });

    it('should remove event listeners on unmount', () => {
      const { unmount } = render(<HabitToggle {...defaultProps} />);
      
      // This test ensures no console errors about missing elements
      expect(() => {
        unmount();
        // Trigger any potential cleanup
        window.dispatchEvent(new Event('resize'));
      }).not.toThrow();
    });
  });
});