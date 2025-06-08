/**
 * Main Dashboard Component
 * The primary interface for daily habit completion
 */

import { useState, useEffect, useCallback } from 'react';
import type { Habit, DailyEntry, HabitCompletion } from '../../../types/data';
import { getHabitsSorted } from '../../habits/api/storage';
import {
  getTodaysEntry,
  updateHabitCompletion,
  isDailyEntryComplete,
  isToday,
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

  // Load habits and daily entry
  const loadData = useCallback(async () => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error loading data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Get completion value for a habit
  const getCompletionValue = (habitId: string): HabitCompletion['value'] => {
    if (!dailyEntry) return {};
    
    const completion = dailyEntry.habit_completions.find(c => c.habit_id === habitId);
    return completion?.value || {};
  };

  // Check if habit is completed
  const isHabitCompleted = (habitId: string): boolean => {
    const value = getCompletionValue(habitId);
    return Object.keys(value).length > 0 && (
      value.boolean !== undefined ||
      value.numeric !== undefined ||
      value.choice !== undefined
    );
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
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            completionValue={getCompletionValue(habit.id)}
            isCompleted={isHabitCompleted(habit.id)}
            onComplete={(value) => handleHabitCompletion(habit.id, value)}
            disabled={isSaving}
          />
        ))}
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
  const handleBooleanChange = (checked: boolean) => {
    // When unchecked, pass empty object to clear the completion
    onComplete(checked ? { boolean: true } : {});
  };

  const handleNumericChange = (value: number) => {
    onComplete({ numeric: value });
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
        const currentValue = completionValue.numeric || 0;
        
        return (
          <div className={styles.numericInput}>
            <label htmlFor={`habit-${habit.id}`}>
              {habit.configuration.numeric_unit || 'Value'}:
            </label>
            <div className={styles.numericControls}>
              <button
                type="button"
                onClick={() => handleNumericChange(Math.max(min, currentValue - 1))}
                disabled={disabled || currentValue <= min}
                aria-label="Decrease"
              >
                -
              </button>
              <input
                type="number"
                id={`habit-${habit.id}`}
                value={currentValue}
                onChange={(e) => handleNumericChange(Number(e.target.value))}
                min={min}
                max={max}
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => handleNumericChange(Math.min(max, currentValue + 1))}
                disabled={disabled || currentValue >= max}
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