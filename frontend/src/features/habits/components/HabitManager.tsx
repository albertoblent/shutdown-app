/**
 * Habit Management Component
 * Provides CRUD operations for habits with templates and drag-and-drop reordering
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import type { Habit } from '../../../types/data';
import {
  addHabit,
  editHabit,
  deleteHabit,
  reorderHabits,
  clearAllHabits,
  getHabitsSorted,
  validateHabitLimit,
} from '../api/storage';
import {
  loadHabitTemplate,
  HABIT_TEMPLATES,
} from '../api/templates';
import { ConfirmModal } from '../../../shared/components';
import styles from './HabitManager.module.css';

interface HabitManagerProps {
  onHabitsChange?: () => void;
}

export function HabitManager({ onHabitsChange }: HabitManagerProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);


  // Configure dnd-kit sensors for touch and keyboard support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px movement for mouse to start drag
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay for 250ms, and move tolerance of 5px to distinguish from scrolling
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
    confirmText: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info',
    confirmText: 'Confirm',
  });

  const loadHabits = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = getHabitsSorted();
      if (result.success) {
        setHabits(result.data || []);
      } else {
        setError(result.error || 'Failed to load habits');
      }
    } catch {
      setError('Unexpected error loading habits');
    } finally {
      setIsLoading(false);
    }
  }, []);

    const handleLoadTemplate = useCallback(async (templateName: string) => {
    // Templates only show when habits.length === 0, so no confirmation needed
    // But we'll keep this logic for potential future changes

    setError(null);

    const result = loadHabitTemplate(templateName);

    if (result.success) {
      await loadHabits();
    } else {
      setError(result.error || 'Failed to load template');
    }
  }, [loadHabits]);

  // Load habits on mount
  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Notify parent when habits change
  useEffect(() => {
    onHabitsChange?.();
  }, [habits, onHabitsChange]);

  const handleAddHabit = async (habitData: Omit<Habit, 'id' | 'created_at' | 'position'>) => {
    setError(null);

    const result = addHabit(habitData);
    if (result.success) {
      await loadHabits();
      setIsAddingNew(false);
    } else {
      setError(result.error || 'Failed to add habit');
    }
  };

  const handleEditHabit = async (habitId: string, updates: Partial<Omit<Habit, 'id' | 'created_at'>>) => {
    setError(null);

    const result = editHabit(habitId, updates);
    if (result.success) {
      await loadHabits();
      setEditingId(null);
    } else {
      setError(result.error || 'Failed to edit habit');
    }
  };

    const handleDeleteHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    const habitName = habit?.name || 'this habit';

    setConfirmModal({
      isOpen: true,
      title: 'Delete Habit',
      message: `Are you sure you want to delete "${habitName}"? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setError(null);

        const result = deleteHabit(habitId);
        if (result.success) {
          await loadHabits();
        } else {
          setError(result.error || 'Failed to delete habit');
        }

        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

    const handleClearAll = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Habits',
      message: `Are you sure you want to delete ALL ${habits.length} habits? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete All',
      onConfirm: async () => {
        setError(null);

        const result = clearAllHabits();
        if (result.success) {
          await loadHabits();
        } else {
          setError(result.error || 'Failed to clear habits');
        }

        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handle drag end with dnd-kit
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = habits.findIndex(habit => habit.id === active.id);
    const newIndex = habits.findIndex(habit => habit.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const reorderedHabits = arrayMove(habits, oldIndex, newIndex);
    setHabits(reorderedHabits);

    // Persist to storage
    const habitIds = reorderedHabits.map(h => h.id);
    const result = reorderHabits(habitIds);

    if (!result.success) {
      setError(result.error || 'Failed to reorder habits');
      // Revert on error
      await loadHabits();
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading habits...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Habit Management</h2>
        <div className={styles.habitCount}>
          {habits.length}/7 habits
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {habits.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No habits yet</h3>
          <p>Get started by adding a habit or loading a template</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={habits.map(habit => habit.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.habitList}>
              {habits.map((habit) => (
                <SortableHabitItem
                  key={habit.id}
                  habit={habit}
                  isEditing={editingId === habit.id}
                  onEdit={() => setEditingId(habit.id)}
                  onSave={(updates) => handleEditHabit(habit.id, updates)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleDeleteHabit(habit.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className={styles.actions}>
        {validateHabitLimit(habits.length) && (
          <button
            className={styles.addButton}
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
          >
            Add New Habit
          </button>
        )}


        {habits.length > 0 && (
          <button
            className={styles.clearButton}
            onClick={handleClearAll}
          >
            Clear All
          </button>
        )}
      </div>

      {isAddingNew && (
        <HabitForm
          onSave={handleAddHabit}
          onCancel={() => setIsAddingNew(false)}
        />
      )}

      {habits.length === 0 && !isAddingNew && (
        <TemplateSelector onLoadTemplate={handleLoadTemplate} />
      )}

      <Suspense fallback={null}>
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          confirmText={confirmModal.confirmText}
        />
      </Suspense>
    </div>
  );
}

// Wrapper component for dnd-kit sortable functionality
interface SortableHabitItemProps {
  habit: Habit;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Omit<Habit, 'id' | 'created_at'>>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function SortableHabitItem(props: SortableHabitItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <HabitItem
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragged={isDragging}
      />
    </div>
  );
}

interface HabitItemProps {
  habit: Habit;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Omit<Habit, 'id' | 'created_at'>>) => void;
  onCancel: () => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
  isDragged?: boolean;
}

function HabitItem({
  habit,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  dragHandleProps = {},
  isDragged = false,
}: HabitItemProps) {
  const [editName, setEditName] = useState(habit.name);
  const [editPrompt, setEditPrompt] = useState(habit.atomic_prompt);

  useEffect(() => {
    if (isEditing) {
      setEditName(habit.name);
      setEditPrompt(habit.atomic_prompt);
    }
  }, [isEditing, habit.name, habit.atomic_prompt]);

  const handleSave = () => {
    if (!editName.trim() || !editPrompt.trim()) {
      return;
    }

    onSave({
      name: editName.trim(),
      atomic_prompt: editPrompt.trim(),
    });
  };

  const handleBlur = () => {
    // Auto-save on blur if both fields have valid content
    if (editName.trim() && editPrompt.trim()) {
      handleSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className={`${styles.habitItem} ${isDragged ? styles.dragged : ''}`}
    >
      <div
        className={styles.dragHandle}
        {...dragHandleProps}
      >
        ⋮⋮
      </div>

      <div className={styles.habitContent}>
        {isEditing ? (
          <div className={styles.editForm}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className={styles.editInput}
              placeholder="Habit name"
              autoFocus
            />
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className={styles.editTextarea}
              placeholder="Atomic prompt"
              rows={2}
            />
            <div className={styles.editActions}>
              <button onClick={handleSave} className={styles.saveButton}>
                Save
              </button>
              <button onClick={onCancel} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.habitInfo}>
            <h4 className={styles.habitName}>{habit.name}</h4>
            <p className={styles.habitPrompt}>{habit.atomic_prompt}</p>
            <div className={styles.habitMeta}>
              <span className={styles.habitType}>{habit.type}</span>
              {habit.configuration.numeric_unit && (
                <span className={styles.habitUnit}>({habit.configuration.numeric_unit})</span>
              )}
            </div>
          </div>
        )}
      </div>

      {!isEditing && (
        <div className={styles.habitActions}>
          <button onClick={onEdit} className={styles.editButton}>
            Edit
          </button>
          <button onClick={onDelete} className={styles.deleteButton}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

interface HabitFormProps {
  onSave: (habit: Omit<Habit, 'id' | 'created_at' | 'position'>) => void;
  onCancel: () => void;
}

function HabitForm({ onSave, onCancel }: HabitFormProps) {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'boolean' | 'numeric' | 'choice'>('boolean');
  const [numericUnit, setNumericUnit] = useState('');
  const [numericMin, setNumericMin] = useState(0);
  const [numericMax, setNumericMax] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !prompt.trim()) {
      return;
    }

    const configuration: Habit['configuration'] = {};

    if (type === 'numeric') {
      configuration.numeric_unit = numericUnit || undefined;
      configuration.numeric_range = [numericMin, numericMax];
    }

    onSave({
      name: name.trim(),
      type,
      atomic_prompt: prompt.trim(),
      configuration,
      is_active: true,
    });
  };

  return (
    <div className={styles.habitForm}>
      <h3>Add New Habit</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="habit-name">Habit Name</label>
          <input
            id="habit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Daily Exercise"
            required
            autoFocus
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="habit-prompt">Atomic Prompt</label>
          <textarea
            id="habit-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Did you exercise for at least 30 minutes today?"
            rows={3}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="habit-type">Type</label>
          <select
            id="habit-type"
            value={type}
            onChange={(e) => setType(e.target.value as 'boolean' | 'numeric' | 'choice')}
          >
            <option value="boolean">Yes/No (Boolean)</option>
            <option value="numeric">Number (Numeric)</option>
            <option value="choice">Multiple Choice</option>
          </select>
        </div>

        {type === 'numeric' && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="numeric-unit">Unit (optional)</label>
              <input
                id="numeric-unit"
                type="text"
                value={numericUnit}
                onChange={(e) => setNumericUnit(e.target.value)}
                placeholder="e.g., minutes, glasses, hours"
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="numeric-min">Min Value</label>
                <input
                  id="numeric-min"
                  type="number"
                  value={numericMin}
                  onChange={(e) => setNumericMin(Number(e.target.value))}
                  min="0"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="numeric-max">Max Value</label>
                <input
                  id="numeric-max"
                  type="number"
                  value={numericMax}
                  onChange={(e) => setNumericMax(Number(e.target.value))}
                  min={numericMin}
                />
              </div>
            </div>
          </>
        )}

        <div className={styles.formActions}>
          <button type="submit" className={styles.saveButton}>
            Add Habit
          </button>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

interface TemplateSelectorProps {
  onLoadTemplate: (templateName: string) => void;
}

function TemplateSelector({ onLoadTemplate }: TemplateSelectorProps) {
  return (
    <div className={styles.templateSelector}>
      <h3>Quick Start Templates</h3>
      <p>Choose a preset template to get started quickly:</p>

      <div className={styles.templateGrid}>
        {HABIT_TEMPLATES.map((template) => (
          <div key={template.name} className={styles.templateCard}>
            <h4>{template.name}</h4>
            <p>{template.description}</p>
            <div className={styles.templateHabits}>
              {template.habits.map((habit, index) => (
                <span key={index} className={styles.templateHabit}>
                  {habit.name}
                </span>
              ))}
            </div>
            <button
              onClick={() => onLoadTemplate(template.name)}
              className={styles.loadTemplateButton}
            >
              Load Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}