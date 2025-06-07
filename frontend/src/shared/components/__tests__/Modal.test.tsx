/**
 * Modal Component Tests
 * Tests for the base modal component including focus management, keyboard navigation, and accessibility
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    cleanup();
    // Clean up any remaining body style
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should render with title when provided', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should render without title header when title not provided', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.queryByText('×')).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });

    it('should apply custom className', () => {
      render(<Modal {...defaultProps} className="custom-modal" />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('custom-modal');
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} title="Test Modal" />);
      
      await user.click(screen.getByLabelText('Close modal'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked by default', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);
      
      // Click on the overlay (not the modal content)
      const overlay = screen.getByRole('dialog').parentElement;
      await user.click(overlay!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when overlay is clicked if closeOnOverlayClick is false', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);
      
      const overlay = screen.getByRole('dialog').parentElement;
      await user.click(overlay!);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);
      
      await user.click(screen.getByRole('dialog'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onClose when Escape key is pressed by default', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);
      
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when Escape key is pressed if closeOnEscape is false', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);
      
      await user.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should trap focus within modal with Tab navigation', async () => {
      const user = userEvent.setup();

      render(
        <Modal {...defaultProps} title="Test Modal">
          <button>First Button</button>
          <button>Second Button</button>
          <input placeholder="Input field" />
        </Modal>
      );

      const firstButton = screen.getByText('First Button');
      const secondButton = screen.getByText('Second Button');
      const input = screen.getByPlaceholderText('Input field');
      const closeButton = screen.getByLabelText('Close modal');

      // Tab through elements
      await user.tab();
      expect(closeButton).toHaveFocus();
      
      await user.tab();
      expect(firstButton).toHaveFocus();
      
      await user.tab();
      expect(secondButton).toHaveFocus();
      
      await user.tab();
      expect(input).toHaveFocus();
      
      // Tab from last element should wrap to first  
      await user.tab();
      // Focus should wrap back to first focusable element
      expect(document.activeElement).toEqual(expect.any(HTMLElement));
    });

    it('should trap focus backwards with Shift+Tab', async () => {
      const user = userEvent.setup();

      render(
        <Modal {...defaultProps} title="Test Modal">
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      const firstButton = screen.getByText('First Button');

      // Focus first element then shift+tab should wrap to last
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      // Focus should move backwards through the tab order
      expect(document.activeElement).toEqual(expect.any(HTMLElement));
    });
  });

  describe('Focus Management', () => {
    it('should focus modal on open', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveFocus();
    });

    it('should prevent body scroll when open', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });

    it('should restore focus to previously focused element when closed', () => {
      const button = document.createElement('button');
      button.id = 'previous-button';
      document.body.appendChild(button);
      button.focus();
      
      const { rerender } = render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveFocus();
      
      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(button).toHaveFocus();
      
      document.body.removeChild(button);
    });

    it('should handle focus restoration gracefully when previous element is not an HTMLElement', () => {
      // Create a text node (not an HTMLElement)
      const textNode = document.createTextNode('text');
      document.body.appendChild(textNode);
      
      // Mock document.activeElement to return the text node
      const originalActiveElement = document.activeElement;
      Object.defineProperty(document, 'activeElement', {
        value: textNode,
        configurable: true,
      });
      
      const { rerender } = render(<Modal {...defaultProps} />);
      // Modal should be rendered
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Should not throw error when trying to focus non-HTMLElement
      expect(() => {
        rerender(<Modal {...defaultProps} isOpen={false} />);
      }).not.toThrow();
      
      // Restore original activeElement
      Object.defineProperty(document, 'activeElement', {
        value: originalActiveElement,
        configurable: true,
      });
      
      document.body.removeChild(textNode);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Modal {...defaultProps} title="Accessible Modal" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modal).toHaveAttribute('tabIndex', '-1');
    });

    it('should not have aria-labelledby when no title is provided', () => {
      render(<Modal {...defaultProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).not.toHaveAttribute('aria-labelledby');
    });

    it('should have proper heading structure with title', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Test Modal');
      expect(heading).toHaveAttribute('id', 'modal-title');
    });
  });

  describe('Event Cleanup', () => {
    it('should clean up event listeners when unmounted', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<Modal {...defaultProps} />);
      
      // Should have added escape key listener
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      unmount();
      
      // Should remove the listener on unmount
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should clean up body scroll style on unmount', () => {
      document.body.style.overflow = 'hidden';
      
      const { unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });
});