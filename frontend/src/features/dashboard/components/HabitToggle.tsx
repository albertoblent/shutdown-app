import { useEffect, useState } from 'react';
import styles from './HabitToggle.module.css';

interface HabitToggleProps {
  isCompleted: boolean;
  onToggle: (habitId: string) => void;
  habitId: string;
  disabled?: boolean;
}

export function HabitToggle({ isCompleted, onToggle, habitId, disabled = false }: HabitToggleProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if matchMedia is available (not in test environment)
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, []);

  const handleClick = () => {
    if (!disabled) {
      onToggle(habitId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onToggle(habitId);
    }
  };

  const toggleClasses = [
    styles.toggle,
    isCompleted ? styles.complete : styles.incomplete,
    disabled ? styles.disabled : '',
    prefersReducedMotion ? styles.reducedMotion : '',
  ].filter(Boolean).join(' ');

  const sliderClasses = [
    styles.slider,
    isCompleted ? styles.sliderComplete : styles.sliderIncomplete,
  ].join(' ');

  return (
    <button
      type="button"
      className={toggleClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-pressed={isCompleted}
      aria-label={isCompleted ? 'Mark habit as incomplete' : 'Mark habit as complete'}
      tabIndex={disabled ? -1 : 0}
    >
      <div className={styles.track}>
        <div className={sliderClasses} data-testid="toggle-slider">
          <span className={`${styles.icon} ${styles.incompleteIcon}`}>×</span>
          <span className={`${styles.icon} ${styles.completeIcon}`}>✓</span>
        </div>
      </div>
    </button>
  );
}