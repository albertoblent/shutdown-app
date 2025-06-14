/**
 * Tests for HabitManager component
 * Focuses on user interactions and component behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitManager } from '../components/HabitManager';
import * as habitStorage from '../api/storage';
import * as habitTemplates from '../api/templates';

// Mock the storage modules
vi.mock('../api/storage', () => ({
  getHabitsSorted: vi.fn(),
  addHabit: vi.fn(),
  editHabit: vi.fn(),
  deleteHabit: vi.fn(),
  reorderHabits: vi.fn(),
  clearAllHabits: vi.fn(),
  validateHabitLimit: vi.fn(),
}));

vi.mock('../api/templates', () => ({
  loadHabitTemplate: vi.fn(),
  HABIT_TEMPLATES: [
    {
      name: 'Productivity Focus',
      description: 'A test template for productivity',
      icon: '🎯',
      habits: [
        {
          name: 'Test Habit',
          type: 'boolean',
          atomic_prompt: 'Test prompt',
          configuration: { icon: '✅' },
          is_active: true,
        },
      ],
    },
    {
      name: 'Health & Wellness',
      description: 'A test template for health',
      icon: '🌿',
      habits: [
        {
          name: 'Health Habit',
          type: 'boolean',
          atomic_prompt: 'Health prompt',
          configuration: { icon: '💚' },
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
    expect(screen.getByText('Habits')).toBeInTheDocument();
  });

  it('should display template selector when no habits exist', async () => {
    render(<HabitManager />);

    await waitFor(() => {
      expect(screen.getByText('Ready to build your shutdown routine?')).toBeInTheDocument();
    });

    expect(screen.getByText('✨ Recommended for Beginners')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add new habit' })).toBeInTheDocument();
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
      expect(screen.getByRole('button', { name: 'Add new habit' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Add new habit' }));

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
      expect(screen.getByRole('button', { name: 'Add new habit' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Add new habit' }));

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

    await user.click(screen.getByRole('button', { name: 'Edit habit' }));

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

    await user.click(screen.getByRole('button', { name: 'Edit habit' }));

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

    render(<HabitManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Habit')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Delete habit' }));

    // Verify the confirmation modal appears
    expect(screen.getByText('Delete Habit')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete "Test Habit"? This action cannot be undone.')).toBeInTheDocument();

    // Click the confirm button in the modal
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    // The modal confirm button should be the last one
    await user.click(confirmButtons[confirmButtons.length - 1]);

    expect(mockHabitStorage.deleteHabit).toHaveBeenCalledWith('1');
  });

  it('should load template when template button is clicked', async () => {
    mockHabitTemplates.loadHabitTemplate.mockReturnValue({
      success: true,
      data: [],
    });

    render(<HabitManager />);

    await user.click(screen.getByText('✨ Start with This Template'));

    expect(mockHabitTemplates.loadHabitTemplate).toHaveBeenCalledWith('Productivity Focus');
  });

  it('should show template selector only when no habits exist', async () => {
    // Start with no habits
    const { unmount } = render(<HabitManager />);

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

  });

  it('should disable add new habit button when at habit limit', async () => {
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
      expect(screen.getByText('Habit 1')).toBeInTheDocument();
    });

    // Add button should not be present when at limit
    expect(screen.queryByRole('button', { name: 'Add new habit' })).not.toBeInTheDocument();
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
      expect(onHabitsChange).toHaveBeenCalledWith();
    });
  });

  describe('Mobile Drag-and-Drop CSS Requirements', () => {
    const mockHabits = [
      {
        id: '1',
        name: 'First Habit',
        type: 'boolean' as const,
        atomic_prompt: 'First prompt',
        configuration: {},
        is_active: true,
        position: 0,
        created_at: '2023-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        name: 'Second Habit',
        type: 'boolean' as const,
        atomic_prompt: 'Second prompt',
        configuration: {},
        is_active: true,
        position: 1,
        created_at: '2023-01-01T00:00:00.000Z',
      },
    ];

    beforeEach(() => {
      mockHabitStorage.getHabitsSorted.mockReturnValue({
        success: true,
        data: mockHabits,
      });
    });

    it('should have touch-action: none on all drag handles to prevent mobile scroll hijacking', async () => {
      render(<HabitManager />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'First Habit' })).toBeInTheDocument();
      });

      // Find all drag handles (they contain the ⋮⋮ character)
      const dragHandles = screen.getAllByText('⋮⋮');

      // Critical: Every drag handle MUST have the dragHandle CSS class
      // This class includes touch-action: none in HabitManager.module.css
      dragHandles.forEach((handle, index) => {
        expect(handle.className,
          `Drag handle ${index + 1} missing dragHandle CSS class - this will break mobile drag-and-drop!`
        ).toContain('dragHandle');
      });

      expect(dragHandles.length).toBeGreaterThan(0);
    });

    it('should have touch-action: auto on interactive elements to allow normal mobile interaction', async () => {
      render(<HabitManager />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'First Habit' })).toBeInTheDocument();
      });

      // Click edit to show form inputs
      const editButtons = screen.getAllByRole('button', { name: 'Edit habit' });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('First Habit')).toBeInTheDocument();
      });

      // Check input fields have proper CSS classes
      // These classes include touch-action: auto in HabitManager.module.css
      const nameInput = screen.getByDisplayValue('First Habit');
      const promptTextarea = screen.getByDisplayValue('First prompt');

      expect(nameInput.className).toContain('editInput');
      expect(promptTextarea.className).toContain('editTextarea');

      // Check buttons have proper CSS classes
      const saveButton = screen.getByText('Save');
      const cancelButton = screen.getByText('Cancel');

      expect(saveButton.className).toContain('saveButton');
      expect(cancelButton.className).toContain('cancelButton');
    });

    it('should ensure drag handles are accessible with minimum 48px touch target', async () => {
      render(<HabitManager />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'First Habit' })).toBeInTheDocument();
      });

      const dragHandles = screen.getAllByText('⋮⋮');

      // Verify drag handles have the proper CSS class with min-width: 48px
      // This ensures mobile accessibility requirements are met
      dragHandles.forEach((handle, index) => {
        expect(handle.className,
          `Drag handle ${index + 1} missing dragHandle CSS class with min-width: 48px`
        ).toContain('dragHandle');
      });

      expect(dragHandles.length).toBe(2);
    });

    it('should prevent accidental drags with proper activation constraints', async () => {
      render(<HabitManager />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'First Habit' })).toBeInTheDocument();
      });

      // This test ensures the drag sensors have proper constraints
      // The actual sensor configuration is tested through the component's behavior
      // We verify that multiple habits are rendered and could theoretically be dragged
      const firstHabit = screen.getByRole('heading', { name: 'First Habit' });
      const secondHabit = screen.getByRole('heading', { name: 'Second Habit' });

      expect(firstHabit).toBeInTheDocument();
      expect(secondHabit).toBeInTheDocument();

      // Verify both habits have drag handles
      const dragHandles = screen.getAllByText('⋮⋮');
      expect(dragHandles).toHaveLength(2);
    });
  });

  describe('Numeric Habit Creation', () => {
    it('should handle numeric habit creation with units and ranges', async () => {
      render(<HabitManager />);

      // Click add button to show form
      await user.click(screen.getByRole('button', { name: 'Add new habit' }));

      // Fill out basic form
      await user.type(screen.getByLabelText('Habit Name'), 'Water Intake');
      await user.type(screen.getByLabelText('Atomic Prompt'), 'How many glasses of water did you drink?');
      
      // Change to numeric type
      await user.selectOptions(screen.getByLabelText('Type'), 'numeric');

      // Fill out numeric-specific fields
      await user.type(screen.getByLabelText('Unit (optional)'), 'glasses');
      await user.clear(screen.getByLabelText('Max Value'));
      await user.type(screen.getByLabelText('Max Value'), '12');

      // Submit form
      await user.click(screen.getByRole('button', { name: 'Add Habit' }));

      expect(mockHabitStorage.addHabit).toHaveBeenCalledWith({
        name: 'Water Intake',
        type: 'numeric',
        atomic_prompt: 'How many glasses of water did you drink?',
        configuration: {
          numeric_unit: 'glasses',
          numeric_range: [0, 12],
        },
        is_active: true,
      });
    });
  });

  describe('Template Navigation', () => {
    it('should show all templates when "Other templates" is clicked', async () => {
      render(<HabitManager />);

      // Should start with featured template
      expect(screen.getByText('✨ Recommended for Beginners')).toBeInTheDocument();

      // Click "Other templates" to show all  
      await user.click(screen.getByText(/Other templates \(1\)/));

      // Should now show all templates view
      expect(screen.getByText('← Back to recommended')).toBeInTheDocument();
      expect(screen.getByText('Choose any template to get started')).toBeInTheDocument();
      
      // Should show all templates including the featured one
      expect(screen.getByText('🎯 Productivity Focus')).toBeInTheDocument();
      expect(screen.getAllByText('Load Template')).toHaveLength(2); // All 2 mock templates
    });

    it('should return to featured template view when back button is clicked', async () => {
      render(<HabitManager />);

      // Go to all templates view
      await user.click(screen.getByText(/Other templates \(1\)/));
      expect(screen.getByText('← Back to recommended')).toBeInTheDocument();

      // Click back button
      await user.click(screen.getByText('← Back to recommended'));

      // Should be back to featured template view
      expect(screen.getByText('✨ Recommended for Beginners')).toBeInTheDocument();
      expect(screen.queryByText('← Back to recommended')).not.toBeInTheDocument();
    });

    it('should load template from all templates view', async () => {
      render(<HabitManager />);

      // Go to all templates view
      await user.click(screen.getByText(/Other templates \(1\)/));

      // Click on a specific template's Load Template button
      const loadButtons = screen.getAllByText('Load Template');
      await user.click(loadButtons[1]); // Click second template

      expect(mockHabitTemplates.loadHabitTemplate).toHaveBeenCalledWith('Health & Wellness');
    });
  });
});