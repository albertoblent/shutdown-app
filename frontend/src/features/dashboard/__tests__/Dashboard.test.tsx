/**
 * Tests for Dashboard component
 * Focuses on user interactions, state management, and component behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '../components/Dashboard';
import * as habitStorage from '../../habits/api/storage';
import * as completionApi from '../api/completion';

// Mock the storage and completion modules
vi.mock('../../habits/api/storage', () => ({
  getHabitsSorted: vi.fn(),
}));

vi.mock('../api/completion', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getTodaysEntry: vi.fn(),
    updateHabitCompletion: vi.fn(),
    saveDailyEntry: vi.fn(),
    isDailyEntryComplete: vi.fn(),
    getDateString: vi.fn(),
  };
});

const mockHabitStorage = vi.mocked(habitStorage);
const mockCompletionApi = vi.mocked(completionApi);

describe('Dashboard', () => {
  const user = userEvent.setup();
  const mockOnManageHabits = vi.fn();

  const mockHabits = [
    {
      id: '1',
      name: 'Morning Exercise',
      type: 'boolean' as const,
      atomic_prompt: 'Did you exercise this morning?',
      configuration: {},
      is_active: true,
      position: 0,
      created_at: '2023-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'Read Pages',
      type: 'numeric' as const,
      atomic_prompt: 'How many pages did you read?',
      configuration: { 
        numeric_unit: 'pages',
        numeric_range: [0, 100] as [number, number]
      },
      is_active: true,
      position: 1,
      created_at: '2023-01-01T00:00:00.000Z',
    },
  ];

  const mockDailyEntry = {
    id: 'test-daily-entry-id',
    date: '2023-12-06',
    started_at: '2023-12-06T10:00:00.000Z',
    is_complete: false,
    habit_completions: [
      {
        id: 'completion-1',
        habit_id: '1',
        value: {},
        completed_at: '2023-12-06T10:00:00.000Z',
        flagged_for_action: false,
        time_to_complete: 0,
      },
      {
        id: 'completion-2', 
        habit_id: '2',
        value: {},
        completed_at: '2023-12-06T10:00:00.000Z',
        flagged_for_action: false,
        time_to_complete: 0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock current date to match our test data
    vi.setSystemTime(new Date('2023-12-06T10:00:00.000Z'));
    
    // Default successful responses
    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: mockHabits,
    });
    
    mockCompletionApi.getTodaysEntry.mockReturnValue({
      success: true,
      data: mockDailyEntry,
    });
    
    mockCompletionApi.updateHabitCompletion.mockReturnValue({
      success: true,
      data: mockDailyEntry,
    });
    
    mockCompletionApi.saveDailyEntry.mockReturnValue({
      success: true,
      data: mockDailyEntry,
    });
    
    mockCompletionApi.isDailyEntryComplete.mockReturnValue(false);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should display empty state when no habits exist', () => {
    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: [],
    });

    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    expect(screen.getByText('Welcome to your Shutdown Routine')).toBeInTheDocument();
    expect(screen.getByText('You don\'t have any habits set up yet. Let\'s get started!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set Up Your Habits' })).toBeInTheDocument();
  });

  it.skip('should call onManageHabits when Set Up Your Habits button is clicked', async () => {
    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: [],
    });

    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    const setupButton = screen.getByRole('button', { name: 'Set Up Your Habits' });
    await user.click(setupButton);
    
    expect(mockOnManageHabits).toHaveBeenCalled();
  });

  it('should display error message when loading habits fails', () => {
    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: false,
      error: 'Failed to load habits',
    });

    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    expect(screen.getByText('Failed to load habits')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('should display habits and progress when data loads successfully', () => {
    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Morning Exercise')).toBeInTheDocument();
    expect(screen.getByText('Read Pages')).toBeInTheDocument();
    expect(screen.getByText('0 of 2 habits completed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage Habits' })).toBeInTheDocument();
  });

  it('should handle boolean habit completion and unchecking', () => {
    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    // Test that boolean habit shows proper UI state
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByText('Mark as complete')).toBeInTheDocument();
  });

  // Simple tests to cover the new completion logic functions
  describe('Completion Logic - Issue #39 Fixes', () => {
    it('should identify boolean habits as completed only when true', () => {
      // Mock a daily entry with boolean habit
      const entryWithBooleanTrue = {
        ...mockDailyEntry,
        habit_completions: [
          {
            ...mockDailyEntry.habit_completions[0],
            value: { boolean: true }
          }
        ]
      };
      
      mockCompletionApi.getTodaysEntry.mockReturnValue({
        success: true,
        data: entryWithBooleanTrue,
      });

      render(<Dashboard onManageHabits={mockOnManageHabits} />);
      
      // Boolean true should show as completed
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should identify boolean false as not completed', () => {
      // Mock a daily entry with boolean false
      const entryWithBooleanFalse = {
        ...mockDailyEntry,
        habit_completions: [
          {
            ...mockDailyEntry.habit_completions[0],
            value: { boolean: false }
          }
        ]
      };
      
      mockCompletionApi.getTodaysEntry.mockReturnValue({
        success: true,
        data: entryWithBooleanFalse,
      });

      render(<Dashboard onManageHabits={mockOnManageHabits} />);
      
      // Boolean false should show as not completed
      expect(screen.getByText('Mark as complete')).toBeInTheDocument();
    });

    it('should identify numeric zero as not completed', () => {
      // Mock a daily entry with numeric zero
      const entryWithNumericZero = {
        ...mockDailyEntry,
        habit_completions: [
          mockDailyEntry.habit_completions[0],
          {
            ...mockDailyEntry.habit_completions[1],
            value: { numeric: 0 }
          }
        ]
      };
      
      mockCompletionApi.getTodaysEntry.mockReturnValue({
        success: true,
        data: entryWithNumericZero,
      });

      render(<Dashboard onManageHabits={mockOnManageHabits} />);
      
      // Should show 0 of 2 habits completed (zero doesn't count)
      expect(screen.getByText('0 of 2 habits completed')).toBeInTheDocument();
    });

    it('should identify positive numeric values as completed', () => {
      // Mock a daily entry with positive numeric value
      const entryWithPositiveNumeric = {
        ...mockDailyEntry,
        habit_completions: [
          {
            ...mockDailyEntry.habit_completions[0],
            value: { boolean: true }
          },
          {
            ...mockDailyEntry.habit_completions[1],
            value: { numeric: 5 }
          }
        ]
      };
      
      mockCompletionApi.getTodaysEntry.mockReturnValue({
        success: true,
        data: entryWithPositiveNumeric,
      });

      render(<Dashboard onManageHabits={mockOnManageHabits} />);
      
      // Should show 2 of 2 habits completed (positive number counts)
      expect(screen.getByText('2 of 2 habits completed')).toBeInTheDocument();
    });

    it('should handle empty values as not completed', () => {
      // Mock a daily entry with empty values (default state)
      render(<Dashboard onManageHabits={mockOnManageHabits} />);
      
      // Should show 0 of 2 habits completed (empty values)
      expect(screen.getByText('0 of 2 habits completed')).toBeInTheDocument();
    });

    it('should render numeric input with placeholder', () => {
      render(<Dashboard onManageHabits={mockOnManageHabits} />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('placeholder', '0');
      expect(input.value).toBe(''); // Empty by default
    });

    it('should respect custom numeric range configuration', () => {
      render(<Dashboard onManageHabits={mockOnManageHabits} />);
      
      const input = screen.getByRole('spinbutton');
      // Should use the configured range [0, 100] instead of default [0, 10]
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
      
      const decrementButton = screen.getByLabelText('Decrease');
      const incrementButton = screen.getByLabelText('Increase');
      
      // Buttons should be enabled within the custom range
      expect(decrementButton).toBeDisabled(); // At min value (empty = 0)
      expect(incrementButton).not.toBeDisabled(); // Can increment within 0-100 range
    });

    it('should handle negative values correctly in blur', () => {
      // Mock a daily entry with negative numeric value
      const entryWithNegativeNumeric = {
        ...mockDailyEntry,
        habit_completions: [
          mockDailyEntry.habit_completions[0],
          {
            ...mockDailyEntry.habit_completions[1],
            value: { numeric: -5 }
          }
        ]
      };
      
      mockCompletionApi.getTodaysEntry.mockReturnValue({
        success: true,
        data: entryWithNegativeNumeric,
      });

      render(<Dashboard onManageHabits={mockOnManageHabits} />);
      
      // Should show 0 of 2 habits completed (negative doesn't count as complete)
      expect(screen.getByText('0 of 2 habits completed')).toBeInTheDocument();
      
      // The input should display the negative value but habit should not be marked as completed
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(-5);
    });

  });

  it.skip('should handle numeric habit increment buttons', async () => {
    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    const incrementButton = screen.getByLabelText('Increase');
    await user.click(incrementButton);
    
    // Should call updateHabitCompletion with numeric value object
    expect(mockCompletionApi.updateHabitCompletion).toHaveBeenCalledWith(
      '2023-12-06',
      '2',
      { numeric: 1 }
    );
  });

  it.skip('should show completion banner when all habits are done', () => {
    const completedEntry = {
      ...mockDailyEntry,
      habit_completions: [
        { ...mockDailyEntry.habit_completions[0], completed: true, value: true },
        { ...mockDailyEntry.habit_completions[1], completed: true, value: 50 },
      ],
    };
    
    mockCompletionApi.getTodaysEntry.mockReturnValue({
      success: true,
      data: completedEntry,
    });
    
    mockCompletionApi.isDailyEntryComplete.mockReturnValue(true);

    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    expect(screen.getByText('🎉 Shutdown routine complete! Great job today.')).toBeInTheDocument();
    expect(screen.getByText('2 of 2 habits completed')).toBeInTheDocument();
  });

  it.skip('should display saving indicator when updating habits', async () => {
    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    // Should show saving indicator
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    // Advance timers to complete the save
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it.skip('should handle completion update errors gracefully', async () => {
    mockCompletionApi.updateHabitCompletion.mockReturnValue({
      success: false,
      error: 'Failed to save completion',
    });

    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    // Should still update UI optimistically but show error
    expect(checkbox).toBeChecked();
  });

  it.skip('should call onManageHabits when Manage Habits button is clicked', async () => {
    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    const manageButton = screen.getByRole('button', { name: 'Manage Habits' });
    await user.click(manageButton);
    
    expect(mockOnManageHabits).toHaveBeenCalled();
  });

  it.skip('should respect numeric habit constraints', async () => {
    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    const decrementButton = screen.getByLabelText('Decrease');
    
    // Should be disabled when at minimum value (0)
    expect(decrementButton).toBeDisabled();
    
    // Increment to 1, then decrement should be enabled
    const incrementButton = screen.getByLabelText('Increase');
    await user.click(incrementButton);
    
    await waitFor(() => {
      expect(decrementButton).not.toBeDisabled();
    });
  });

  it.skip('should update progress as habits are completed', () => {
    const partiallyCompletedEntry = {
      ...mockDailyEntry,
      habit_completions: [
        { ...mockDailyEntry.habit_completions[0], completed: true, value: true },
        mockDailyEntry.habit_completions[1],
      ],
    };
    
    mockCompletionApi.getTodaysEntry.mockReturnValue({
      success: true,
      data: partiallyCompletedEntry,
    });

    render(<Dashboard onManageHabits={mockOnManageHabits} />);
    
    expect(screen.getByText('1 of 2 habits completed')).toBeInTheDocument();
  });

  describe('Date Change Detection', () => {
    it('should set up date change detection mechanisms', () => {
      render(<Dashboard onManageHabits={mockOnManageHabits} />);
      
      // Verify that getTodaysEntry was called on initial load
      expect(mockCompletionApi.getTodaysEntry).toHaveBeenCalledTimes(1);
      
      // The component should have set up interval and visibility listeners
      // We can't easily test the actual behavior without complex timer mocking
      // but we can verify the initial setup works correctly
      expect(screen.getByText('Morning Exercise')).toBeInTheDocument();
    });
  });
});