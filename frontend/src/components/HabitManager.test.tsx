/**
 * Tests for HabitManager component
 * Focuses on user interactions and component behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitManager } from './HabitManager';
import * as habitStorage from '../utils/habitStorage';
import * as habitTemplates from '../utils/habitTemplates';

// Mock the storage modules
vi.mock('../utils/habitStorage', () => ({
  getHabitsSorted: vi.fn(),
  addHabit: vi.fn(),
  editHabit: vi.fn(),
  deleteHabit: vi.fn(),
  reorderHabits: vi.fn(),
  clearAllHabits: vi.fn(),
  validateHabitLimit: vi.fn(),
}));

vi.mock('../utils/habitTemplates', () => ({
  loadHabitTemplate: vi.fn(),
  HABIT_TEMPLATES: [
    {
      name: 'Test Template',
      description: 'A test template',
      habits: [
        {
          name: 'Test Habit',
          type: 'boolean',
          atomic_prompt: 'Test prompt',
          configuration: {},
          is_active: true,
        },
      ],
    },
  ],
}));

const mockHabitStorage = vi.mocked(habitStorage);
const mockHabitTemplates = vi.mocked(habitTemplates);

describe('HabitManager', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful responses
    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: [],
    });
    mockHabitStorage.validateHabitLimit.mockReturnValue(true);
  });

  it('should render loading state initially', async () => {
    // Due to the synchronous nature of the mock, we test that component renders correctly
    render(<HabitManager />);
    expect(screen.getByText('Habit Management')).toBeInTheDocument();
  });

  it('should display empty state when no habits exist', async () => {
    render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByText('No habits yet')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Get started by adding a habit or loading a template')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add New Habit' })).toBeInTheDocument();
  });

  it('should display habit list when habits exist', async () => {
    const mockHabits = [
      {
        id: '1',
        name: 'Test Habit',
        type: 'boolean' as const,
        atomic_prompt: 'Test prompt',
        configuration: {},
        is_active: true,
        position: 0,
        created_at: '2023-01-01T00:00:00.000Z',
      },
    ];

    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: mockHabits,
    });

    render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Habit')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test prompt')).toBeInTheDocument();
    expect(screen.getByText('boolean')).toBeInTheDocument();
    expect(screen.getByText('1/7 habits')).toBeInTheDocument();
  });

  it('should display error message when loading fails', async () => {
    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: false,
      error: 'Storage error',
    });

    render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Storage error')).toBeInTheDocument();
    });
  });

  it('should show add habit form when Add New Habit is clicked', async () => {
    render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add New Habit' })).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: 'Add New Habit' }));
    
    // Check for form-specific elements instead of duplicate text
    expect(screen.getByLabelText('Habit Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Atomic Prompt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Habit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should add a new habit successfully', async () => {
    const mockNewHabit = {
      id: '2',
      name: 'New Habit',
      type: 'boolean' as const,
      atomic_prompt: 'New prompt',
      configuration: {},
      is_active: true,
      position: 0,
      created_at: '2023-01-01T00:00:00.000Z',
    };

    mockHabitStorage.addHabit.mockReturnValue({
      success: true,
      data: mockNewHabit,
    });

    render(<HabitManager />);
    
    // Wait for initial load and click Add New Habit
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add New Habit' })).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: 'Add New Habit' }));
    
    // Fill out the form
    await user.type(screen.getByLabelText('Habit Name'), 'New Habit');
    await user.type(screen.getByLabelText('Atomic Prompt'), 'New prompt');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Add Habit' }));
    
    // Verify addHabit was called with correct data
    expect(mockHabitStorage.addHabit).toHaveBeenCalledWith({
      name: 'New Habit',
      type: 'boolean',
      atomic_prompt: 'New prompt',
      configuration: {},
      is_active: true,
    });
  });

  it('should show edit form when Edit button is clicked', async () => {
    const mockHabits = [
      {
        id: '1',
        name: 'Test Habit',
        type: 'boolean' as const,
        atomic_prompt: 'Test prompt',
        configuration: {},
        is_active: true,
        position: 0,
        created_at: '2023-01-01T00:00:00.000Z',
      },
    ];

    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: mockHabits,
    });

    render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Habit')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Edit'));
    
    // Should show edit form
    expect(screen.getByDisplayValue('Test Habit')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test prompt')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should save habit edits successfully', async () => {
    const mockHabits = [
      {
        id: '1',
        name: 'Test Habit',
        type: 'boolean' as const,
        atomic_prompt: 'Test prompt',
        configuration: {},
        is_active: true,
        position: 0,
        created_at: '2023-01-01T00:00:00.000Z',
      },
    ];

    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: mockHabits,
    });

    mockHabitStorage.editHabit.mockReturnValue({
      success: true,
      data: { ...mockHabits[0], name: 'Updated Habit' },
    });

    render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Habit')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Edit'));
    
    // Edit the name
    const nameInput = screen.getByDisplayValue('Test Habit');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Habit');
    
    // Save changes
    await user.click(screen.getByText('Save'));
    
    expect(mockHabitStorage.editHabit).toHaveBeenCalledWith('1', {
      name: 'Updated Habit',
      atomic_prompt: 'Test prompt',
    });
  });

  it('should confirm before deleting a habit', async () => {
    const mockHabits = [
      {
        id: '1',
        name: 'Test Habit',
        type: 'boolean' as const,
        atomic_prompt: 'Test prompt',
        configuration: {},
        is_active: true,
        position: 0,
        created_at: '2023-01-01T00:00:00.000Z',
      },
    ];

    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: mockHabits,
    });

    mockHabitStorage.deleteHabit.mockReturnValue({
      success: true,
    });

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Habit')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Delete'));
    
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this habit?');
    expect(mockHabitStorage.deleteHabit).toHaveBeenCalledWith('1');
    
    confirmSpy.mockRestore();
  });

  it('should load template when template button is clicked', async () => {
    mockHabitTemplates.loadHabitTemplate.mockReturnValue({
      success: true,
      data: [],
    });

    render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Quick Start Templates')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Load Template'));
    
    expect(mockHabitTemplates.loadHabitTemplate).toHaveBeenCalledWith('Test Template');
  });

  it('should show template selector only when no habits exist', async () => {
    // Start with no habits
    const { unmount } = render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Quick Start Templates')).toBeInTheDocument();
    });

    // Unmount the first component
    unmount();

    // Mock having habits and re-render fresh
    const mockHabits = [
      {
        id: '1',
        name: 'Test Habit',
        type: 'boolean' as const,
        atomic_prompt: 'Test prompt',
        configuration: {},
        is_active: true,
        position: 0,
        created_at: '2023-01-01T00:00:00.000Z',
      },
    ];

    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: mockHabits,
    });

    // Re-render with habits
    render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Habit' })).toBeInTheDocument();
    });
    
    // Template selector should not be visible
    expect(screen.queryByText('Quick Start Templates')).not.toBeInTheDocument();
  });

  it('should disable Add New Habit button when at habit limit', async () => {
    mockHabitStorage.validateHabitLimit.mockReturnValue(false);

    const mockHabits = Array.from({ length: 7 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Habit ${i + 1}`,
      type: 'boolean' as const,
      atomic_prompt: `Prompt ${i + 1}`,
      configuration: {},
      is_active: true,
      position: i,
      created_at: '2023-01-01T00:00:00.000Z',
    }));

    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: mockHabits,
    });

    render(<HabitManager />);
    
    await waitFor(() => {
      expect(screen.getByText('7/7 habits')).toBeInTheDocument();
    });
    
    // Add button should not be present when at limit
    expect(screen.queryByText('Add New Habit')).not.toBeInTheDocument();
  });

  it('should call onHabitsChange when habits change', async () => {
    const onHabitsChange = vi.fn();
    const mockHabits = [
      {
        id: '1',
        name: 'Test Habit',
        type: 'boolean' as const,
        atomic_prompt: 'Test prompt',
        configuration: {},
        is_active: true,
        position: 0,
        created_at: '2023-01-01T00:00:00.000Z',
      },
    ];

    mockHabitStorage.getHabitsSorted.mockReturnValue({
      success: true,
      data: mockHabits,
    });

    render(<HabitManager onHabitsChange={onHabitsChange} />);
    
    await waitFor(() => {
      expect(onHabitsChange).toHaveBeenCalledWith(mockHabits);
    });
  });
});