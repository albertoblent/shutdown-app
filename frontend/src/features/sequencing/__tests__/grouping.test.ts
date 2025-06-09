/**
 * Habit Grouping Logic Tests
 * Tests for intelligent habit grouping based on context, timing, and difficulty
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createHabitGroup,
  updateHabitGroup,
  deleteHabitGroup,
  getHabitGroups,
  addHabitToGroup,
  removeHabitFromGroup,
  suggestGroupsForHabit,
  autoGroupHabits,
  validateGroupConfiguration
} from '../api/grouping'
import type { Habit, HabitGroup } from '../../../types/data'

const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    name: 'Read for 30 minutes',
    type: 'numeric',
    atomic_prompt: 'Read a book or article',
    configuration: { numeric_unit: 'minutes', numeric_range: [5, 120] },
    position: 0,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'habit-2', 
    name: 'Write journal entry',
    type: 'boolean',
    atomic_prompt: 'Write thoughts in journal',
    configuration: {},
    position: 1,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'habit-3',
    name: 'Close laptop',
    type: 'boolean', 
    atomic_prompt: 'Shut down and close laptop',
    configuration: {},
    position: 2,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'habit-4',
    name: 'Set phone to Do Not Disturb',
    type: 'boolean',
    atomic_prompt: 'Enable DND mode on phone',
    configuration: {},
    position: 3,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z'
  }
]

describe('Habit Grouping Logic', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('createHabitGroup', () => {
    it('should create a new habit group', () => {
      const groupData = {
        name: 'Digital Shutdown',
        habit_ids: ['habit-3', 'habit-4'],
        group_type: 'contextual' as const
      }

      const result = createHabitGroup(groupData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe('Digital Shutdown')
      expect(result.data?.habit_ids).toEqual(['habit-3', 'habit-4'])
      expect(result.data?.group_type).toBe('contextual')
      expect(result.data?.id).toBeDefined()
      expect(result.data?.created_at).toBeDefined()
    })

    it('should validate group data before creating', () => {
      const invalidGroup = {
        name: '', // Empty name should fail
        habit_ids: ['habit-1'],
        group_type: 'contextual' as const
      }

      const result = createHabitGroup(invalidGroup)

      expect(result.success).toBe(false)
      expect(result.error).toContain('name is required')
    })

    it('should prevent duplicate habit assignments across groups', () => {
      const group1 = {
        name: 'Learning Group',
        habit_ids: ['habit-1'],
        group_type: 'contextual' as const
      }

      const group2 = {
        name: 'Another Group',
        habit_ids: ['habit-1'], // Same habit ID
        group_type: 'temporal' as const
      }

      createHabitGroup(group1)
      const result = createHabitGroup(group2)

      expect(result.success).toBe(false)
      expect(result.error).toContain('already assigned to group')
    })
  })

  describe('updateHabitGroup', () => {
    it('should update existing habit group', () => {
      const originalGroup = {
        name: 'Original Group',
        habit_ids: ['habit-1'],
        group_type: 'contextual' as const
      }

      const createResult = createHabitGroup(originalGroup)
      expect(createResult.success).toBe(true)

      const updatedGroup: HabitGroup = {
        ...createResult.data!,
        name: 'Updated Group Name',
        habit_ids: ['habit-1', 'habit-2']
      }

      const result = updateHabitGroup(updatedGroup)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Updated Group Name')
      expect(result.data?.habit_ids).toEqual(['habit-1', 'habit-2'])
    })

    it('should validate updated group data', () => {
      const group = {
        name: 'Test Group',
        habit_ids: ['habit-1'],
        group_type: 'contextual' as const
      }

      const createResult = createHabitGroup(group)
      const invalidUpdate: HabitGroup = {
        ...createResult.data!,
        habit_ids: [] // Empty habits array should fail
      }

      const result = updateHabitGroup(invalidUpdate)

      expect(result.success).toBe(false)
      expect(result.error).toContain('at least one habit')
    })
  })

  describe('deleteHabitGroup', () => {
    it('should delete existing habit group', () => {
      const group = {
        name: 'Test Group',
        habit_ids: ['habit-1'],
        group_type: 'contextual' as const
      }

      const createResult = createHabitGroup(group)
      const groupId = createResult.data!.id

      const result = deleteHabitGroup(groupId)

      expect(result.success).toBe(true)

      const groups = getHabitGroups()
      expect(groups.data).toHaveLength(0)
    })

    it('should handle deletion of non-existent group', () => {
      const result = deleteHabitGroup('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Group not found')
    })
  })

  describe('addHabitToGroup and removeHabitFromGroup', () => {
    it('should add habit to existing group', () => {
      const group = {
        name: 'Test Group',
        habit_ids: ['habit-1'],
        group_type: 'contextual' as const
      }

      const createResult = createHabitGroup(group)
      const groupId = createResult.data!.id

      const result = addHabitToGroup(groupId, 'habit-2')

      expect(result.success).toBe(true)
      expect(result.data?.habit_ids).toContain('habit-2')
    })

    it('should remove habit from group', () => {
      const group = {
        name: 'Test Group',
        habit_ids: ['habit-1', 'habit-2'],
        group_type: 'contextual' as const
      }

      const createResult = createHabitGroup(group)
      const groupId = createResult.data!.id

      const result = removeHabitFromGroup(groupId, 'habit-2')

      expect(result.success).toBe(true)
      expect(result.data?.habit_ids).not.toContain('habit-2')
      expect(result.data?.habit_ids).toContain('habit-1')
    })

    it('should prevent adding habit that is already in another group', () => {
      const group1 = {
        name: 'Group 1',
        habit_ids: ['habit-1'],
        group_type: 'contextual' as const
      }

      const group2 = {
        name: 'Group 2', 
        habit_ids: ['habit-2'],
        group_type: 'temporal' as const
      }

      createHabitGroup(group1)
      const result2 = createHabitGroup(group2)

      const addResult = addHabitToGroup(result2.data!.id, 'habit-1')

      expect(addResult.success).toBe(false)
      expect(addResult.error).toContain('already assigned to group')
    })
  })

  describe('suggestGroupsForHabit', () => {
    it('should suggest contextual groups based on habit name similarity', () => {
      // Create some existing groups
      createHabitGroup({
        name: 'Digital Habits',
        habit_ids: ['habit-3'],
        group_type: 'contextual'
      })

      createHabitGroup({
        name: 'Learning Habits', 
        habit_ids: ['habit-1'],
        group_type: 'contextual'
      })

      const digitalHabit: Habit = {
        id: 'habit-new',
        name: 'Turn off notifications',
        type: 'boolean',
        atomic_prompt: 'Disable phone notifications',
        configuration: {},
        position: 4,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z'
      }

      const suggestions = suggestGroupsForHabit(digitalHabit)

      expect(suggestions.success).toBe(true)
      expect(suggestions.data).toBeDefined()
      expect(suggestions.data!.length).toBeGreaterThan(0)
      
      // Should suggest "Digital Habits" group due to contextual similarity
      const digitalGroupSuggestion = suggestions.data!.find(s => s.group.name === 'Digital Habits')
      expect(digitalGroupSuggestion).toBeDefined()
      expect(digitalGroupSuggestion!.confidence).toBeGreaterThan(0.5)
    })

    it('should suggest temporal groups based on habit type patterns', () => {
      // Create groups with type patterns
      createHabitGroup({
        name: 'Quick Tasks',
        habit_ids: ['habit-3', 'habit-4'], // Both boolean types
        group_type: 'temporal'
      })

      const quickHabit: Habit = {
        id: 'habit-new',
        name: 'Lock doors',
        type: 'boolean', // Same type as existing group
        atomic_prompt: 'Check and lock all doors',
        configuration: {},
        position: 5,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z'
      }

      const suggestions = suggestGroupsForHabit(quickHabit)

      expect(suggestions.success).toBe(true)
      const quickTasksSuggestion = suggestions.data!.find(s => s.group.name === 'Quick Tasks')
      expect(quickTasksSuggestion).toBeDefined()
    })
  })

  describe('autoGroupHabits', () => {
    it('should automatically group habits based on similarity', () => {
      const result = autoGroupHabits(mockHabits)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.groups.length).toBeGreaterThan(0)

      // Should create at least one group for digital/tech habits
      const digitalGroup = result.data!.groups.find(g => 
        g.habit_ids.includes('habit-3') && g.habit_ids.includes('habit-4')
      )
      expect(digitalGroup).toBeDefined()
      expect(digitalGroup!.group_type).toBe('contextual')
    })

    it('should provide grouping rationale', () => {
      const result = autoGroupHabits(mockHabits)

      expect(result.success).toBe(true)
      expect(result.data?.rationale).toBeDefined()
      expect(result.data!.rationale.length).toBeGreaterThan(0)
      
      // Should explain why habits were grouped together
      const rationale = result.data!.rationale[0]
      expect(rationale.group_id).toBeDefined()
      expect(rationale.reason).toBeDefined()
      expect(rationale.confidence).toBeGreaterThan(0)
    })

    it('should handle edge cases gracefully', () => {
      // Test with single habit
      const singleHabit = [mockHabits[0]]
      const result = autoGroupHabits(singleHabit)

      expect(result.success).toBe(true)
      expect(result.data!.groups.length).toBe(0) // No groups created for single habit
    })
  })

  describe('validateGroupConfiguration', () => {
    it('should validate group has required fields', () => {
      const validGroup = {
        name: 'Valid Group',
        habit_ids: ['habit-1'],
        group_type: 'contextual' as const
      }

      const result = validateGroupConfiguration(validGroup)
      expect(result.success).toBe(true)
    })

    it('should reject groups with invalid data', () => {
      const invalidGroup = {
        name: '',
        habit_ids: [],
        group_type: 'invalid' as 'contextual' | 'temporal' | 'difficulty' | 'manual'
      }

      const result = validateGroupConfiguration(invalidGroup)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate group type is allowed', () => {
      const invalidTypeGroup = {
        name: 'Test Group',
        habit_ids: ['habit-1'],
        group_type: 'invalid-type' as 'contextual' | 'temporal' | 'difficulty' | 'manual'
      }

      const result = validateGroupConfiguration(invalidTypeGroup)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid group type')
    })
  })

  describe('Integration with localStorage', () => {
    it('should persist groups across sessions', () => {
      const group = {
        name: 'Persistent Group',
        habit_ids: ['habit-1'],
        group_type: 'contextual' as const
      }

      createHabitGroup(group)

      // Simulate new session by reading from storage
      const groups = getHabitGroups()
      expect(groups.success).toBe(true)
      expect(groups.data).toHaveLength(1)
      expect(groups.data![0].name).toBe('Persistent Group')
    })

    it('should handle storage errors gracefully', () => {
      // Mock localStorage to simulate quota exceeded
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem')
      mockSetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const group = {
        name: 'Test Group',
        habit_ids: ['habit-1'],
        group_type: 'contextual' as const
      }

      const result = createHabitGroup(group)

      expect(result.success).toBe(false)
      expect(result.error).toContain('storage')

      mockSetItem.mockRestore()
    })
  })
})