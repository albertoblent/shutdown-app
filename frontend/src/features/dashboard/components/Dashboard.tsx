/**
 * Main Dashboard Component
 * The primary interface for daily habit completion
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Habit, DailyEntry, HabitCompletion } from '../../../types/data';
import { getHabitsSorted } from '../../habits/api/storage';
import {
  getTodaysEntry,
  updateHabitCompletion,
  isDailyEntryComplete,
  isToday,
  getDateString,
} from '../api/completion';
import styles from './Dashboard.module.css';

interface DashboardProps {
  onManageHabits?: () => void;
}

export function Dashboard({ onManageHabits }: DashboardProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyEntry, setDailyEntry] = useState<DailyEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track current date for detecting date changes
  const currentDateRef = useRef<string>(getDateString());
  const dateCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load habits and daily entry
  const loadData = useCallback(async () => {
    console.log('📊 Loading dashboard data...');
    setIsLoading(true);
    setError(null);

    try {
      // Load habits
      const habitsResult = getHabitsSorted();
      if (!habitsResult.success) {
        throw new Error(habitsResult.error || 'Failed to load habits');
      }

      const loadedHabits = habitsResult.data || [];
      setHabits(loadedHabits);

      // Load or create today's entry
      const entryResult = getTodaysEntry(loadedHabits);
      if (!entryResult.success) {
        throw new Error(entryResult.error || 'Failed to load daily entry');
      }

      setDailyEntry(entryResult.data || null);
      
      // Update current date reference to match loaded data
      currentDateRef.current = getDateString();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error loading data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if date has changed and reload if necessary
  const checkDateChange = useCallback(() => {
    const currentDate = getDateString();
    console.log('🕐 Date check:', { 
      currentDate, 
      loadedDate: currentDateRef.current, 
      hasChanged: currentDate !== currentDateRef.current 
    });
    
    if (currentDate !== currentDateRef.current) {
      console.log('📅 DATE CHANGED! Reloading data...', {
        from: currentDateRef.current,
        to: currentDate
      });
      // Date has changed - update ref and reload data
      currentDateRef.current = currentDate;
      loadData();
    }
  }, [loadData]);

  // Handle page visibility changes (when user returns to tab)
  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      console.log('👁️ Page became visible - checking for date changes...');
      // Page became visible - check for date changes
      checkDateChange();
    }
  }, [checkDateChange]);

  // Load data on mount and set up date change detection
  useEffect(() => {
    console.log('⚡ Dashboard mounted - setting up date change detection...');
    loadData();

    // Set up interval to check for date changes every minute
    console.log('⏰ Setting up 60-second interval for date checks...');
    dateCheckIntervalRef.current = setInterval(checkDateChange, 60000);

    // Listen for page visibility changes
    console.log('👁️ Setting up page visibility listener...');
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up date change detection...');
      if (dateCheckIntervalRef.current) {
        clearInterval(dateCheckIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData, checkDateChange, handleVisibilityChange]);

  // Handle habit completion
  const handleHabitCompletion = useCallback(async (
    habitId: string,
    value: HabitCompletion['value']
  ) => {
    if (!dailyEntry) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = updateHabitCompletion(dailyEntry.date, habitId, value);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update habit completion');
      }

      // Reload the daily entry to get updated state
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save habit completion');
    } finally {
      setIsSaving(false);
    }
  }, [dailyEntry, loadData]);

  // Get completion value for a habit (memoized to prevent infinite re-renders)
  const getCompletionValue = useCallback((habitId: string): HabitCompletion['value'] => {
    if (!dailyEntry) return {};

    const completion = dailyEntry.habit_completions.find(c => c.habit_id === habitId);
    return completion?.value || {};
  }, [dailyEntry]);

  // Check if habit is completed (Issue #39: Zero values should never mark complete)
  const isHabitCompleted = (habitId: string): boolean => {
    const value = getCompletionValue(habitId);

    // Empty value = not completed
    if (Object.keys(value).length === 0) {
      return false;
    }

    // Boolean: only true is completed (false or undefined = not completed)
    if (value.boolean !== undefined) {
      return value.boolean === true;
    }

    // Numeric: only positive values are completed (zero or undefined = not completed)
    if (value.numeric !== undefined) {
      return value.numeric > 0;
    }

    // Choice: any defined choice is completed
    if (value.choice !== undefined) {
      return true;
    }

    return false;
  };

  // Calculate completion stats
  const completedCount = habits.filter(habit => isHabitCompleted(habit.id)).length;
  const totalCount = habits.length;
  const isComplete = dailyEntry ? isDailyEntryComplete(dailyEntry) : false;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your daily routine...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error} role="alert">
          {error}
          <button onClick={loadData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Welcome to your Shutdown Routine</h2>
          <p>You don't have any habits set up yet. Let's get started!</p>
          <button onClick={onManageHabits} className={styles.setupButton}>
            Set Up Your Habits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>
            {isToday(dailyEntry?.date || '') ? 'Today' : dailyEntry?.date}
          </h1>
          <button onClick={onManageHabits} className={styles.manageButton}>
            Manage Habits
          </button>
        </div>

        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className={styles.progressText}>
            {completedCount} of {totalCount} habits completed
          </div>
        </div>

        {isComplete && (
          <div className={styles.completionBanner}>
            🎉 Shutdown routine complete! Great job today.
          </div>
        )}
      </header>

      <main className={styles.habitList}>
        {habits.map((habit) => {
          const completionValue = getCompletionValue(habit.id);
          return (
            <HabitCard
              key={habit.id}
              habit={habit}
              completionValue={completionValue}
              isCompleted={isHabitCompleted(habit.id)}
              onComplete={(value) => handleHabitCompletion(habit.id, value)}
              disabled={isSaving}
            />
          );
        })}
      </main>

      {isSaving && (
        <div className={styles.savingIndicator}>
          Saving...
        </div>
      )}
    </div>
  );
}

interface HabitCardProps {
  habit: Habit;
  completionValue: HabitCompletion['value'];
  isCompleted: boolean;
  onComplete: (value: HabitCompletion['value']) => void;
  disabled?: boolean;
}

function HabitCard({
  habit,
  completionValue,
  isCompleted,
  onComplete,
  disabled = false
}: HabitCardProps) {
  const [localNumericValue, setLocalNumericValue] = useState<string>('');

  // Sync local state with completion value - use stable reference
  const numericValue = completionValue.numeric;
  useEffect(() => {
    if (habit.type === 'numeric') {
      const newValue = numericValue !== undefined ? String(numericValue) : '';
      setLocalNumericValue(newValue);
    }
  }, [numericValue, habit.type]);

  const handleBooleanChange = (checked: boolean) => {
    // When unchecked, pass empty object to clear the completion
    onComplete(checked ? { boolean: true } : {});
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only update visual state, don't trigger completion yet
    const newValue = e.target.value;
    setLocalNumericValue(newValue);
  };

  const handleNumericBlur = () => {
    // Intent-based completion: only mark complete on blur with value > 0
    const numericValue = localNumericValue === '' ? null : Number(localNumericValue);

    if (numericValue === null || numericValue <= 0 || isNaN(numericValue)) {
      // Empty, zero, negative, or invalid = clear completion
      onComplete({});
    } else {
      // Positive value = mark complete
      onComplete({ numeric: numericValue });
    }
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger blur to complete input
    }
  };

  const handleNumericFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text on focus to prevent leading zeros
    e.target.select();
  };

  const handleNumericButtonChange = (newValue: number) => {
    // For +/- buttons, update both local state and complete immediately
    const min = habit.configuration.numeric_range?.[0] || 0;
    const max = habit.configuration.numeric_range?.[1] || 10;
    const clampedValue = Math.max(min, Math.min(max, newValue));

    setLocalNumericValue(String(clampedValue));

    if (clampedValue > 0) {
      onComplete({ numeric: clampedValue });
    } else {
      onComplete({});
    }
  };

  const renderInput = () => {
    switch (habit.type) {
      case 'boolean':
        return (
          <div className={styles.booleanInput}>
            <input
              type="checkbox"
              id={`habit-${habit.id}`}
              checked={completionValue.boolean || false}
              onChange={(e) => handleBooleanChange(e.target.checked)}
              disabled={disabled}
            />
            <label htmlFor={`habit-${habit.id}`}>
              {completionValue.boolean ? 'Completed' : 'Mark as complete'}
            </label>
          </div>
        );

      case 'numeric': {
        const min = habit.configuration.numeric_range?.[0] || 0;
        const max = habit.configuration.numeric_range?.[1] || 10;
        const currentValue = localNumericValue === '' ? null : Number(localNumericValue);

        return (
          <div className={styles.numericInput}>
            <label htmlFor={`habit-${habit.id}`}>
              {habit.configuration.numeric_unit || 'Value'}:
            </label>
            <div className={styles.numericControls}>
              <button
                type="button"
                onClick={() => handleNumericButtonChange(Math.max(min, (currentValue || 0) - 1))}
                disabled={disabled || (currentValue || 0) <= min}
                aria-label="Decrease"
              >
                -
              </button>
              <input
                type="number"
                id={`habit-${habit.id}`}
                value={localNumericValue}
                onChange={handleNumericInputChange}
                onBlur={handleNumericBlur}
                onFocus={handleNumericFocus}
                onKeyDown={handleNumericKeyDown}
                min={min}
                max={max}
                placeholder="0"
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => handleNumericButtonChange(Math.min(max, (currentValue || 0) + 1))}
                disabled={disabled || (currentValue || 0) >= max}
                aria-label="Increase"
              >
                +
              </button>
            </div>
          </div>
        );
      }

      case 'choice':
        // TODO: Implement choice input when choice habits are added
        return (
          <div className={styles.choiceInput}>
            <p>Choice habits not yet implemented</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <article className={`${styles.habitCard} ${isCompleted ? styles.completed : ''}`}>
      <div className={styles.habitInfo}>
        <h3 className={styles.habitName}>{habit.name}</h3>
        <p className={styles.habitPrompt}>{habit.atomic_prompt}</p>
      </div>

      <div className={styles.habitInput}>
        {renderInput()}
      </div>

      {isCompleted && (
        <div className={styles.completionIndicator}>
          ✓
        </div>
      )}
    </article>
  );
}