/**
 * Habit Grouping Logic API
 * Intelligent habit grouping based on context, timing, and difficulty patterns
 */

import type { 
  Habit, 
  HabitGroup
} from '../../../types/data'
import { generateId, formatTimestamp } from '../../../types/data'

interface StorageResult<T> {
  success: boolean
  data?: T
  error?: string
}

interface GroupSuggestion {
  group: HabitGroup
  confidence: number
  reason: string
}

interface AutoGroupResult {
  groups: HabitGroup[]
  rationale: Array<{
    group_id: string
    reason: string
    confidence: number
  }>
}

/**
 * Creates a new habit group
 */
export function createHabitGroup(groupData: Omit<HabitGroup, 'id' | 'created_at'>): StorageResult<HabitGroup> {
  try {
    // Validate group data
    const validation = validateGroupConfiguration(groupData)
    if (!validation.success) {
      return { success: false, error: validation.error }
    }

    // Check for duplicate habit assignments
    const existingGroups = getHabitGroupsArray()
    const duplicateCheck = checkForDuplicateHabits(groupData.habit_ids, existingGroups)
    if (!duplicateCheck.success) {
      return { success: false, error: duplicateCheck.error }
    }

    const newGroup: HabitGroup = {
      id: generateId(),
      name: groupData.name,
      habit_ids: [...groupData.habit_ids],
      group_type: groupData.group_type,
      created_at: formatTimestamp(new Date())
    }

    const updatedGroups = [...existingGroups, newGroup]
    const saveResult = saveHabitGroups(updatedGroups)
    if (!saveResult.success) {
      return { success: false, error: saveResult.error }
    }

    return { success: true, data: newGroup }
  } catch (error) {
    return {
      success: false,
      error: `Failed to create habit group: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Updates an existing habit group
 */
export function updateHabitGroup(group: HabitGroup): StorageResult<HabitGroup> {
  try {
    const validation = validateGroupConfiguration(group)
    if (!validation.success) {
      return { success: false, error: validation.error }
    }

    const existingGroups = getHabitGroupsArray()
    const groupIndex = existingGroups.findIndex(g => g.id === group.id)

    if (groupIndex === -1) {
      return { success: false, error: 'Group not found' }
    }

    // Check for duplicate habit assignments (excluding current group)
    const otherGroups = existingGroups.filter(g => g.id !== group.id)
    const duplicateCheck = checkForDuplicateHabits(group.habit_ids, otherGroups)
    if (!duplicateCheck.success) {
      return { success: false, error: duplicateCheck.error }
    }

    existingGroups[groupIndex] = group
    const saveResult = saveHabitGroups(existingGroups)
    if (!saveResult.success) {
      return { success: false, error: saveResult.error }
    }

    return { success: true, data: group }
  } catch (error) {
    return {
      success: false,
      error: `Failed to update habit group: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Deletes a habit group
 */
export function deleteHabitGroup(groupId: string): StorageResult<boolean> {
  try {
    const existingGroups = getHabitGroupsArray()
    const groupIndex = existingGroups.findIndex(g => g.id === groupId)

    if (groupIndex === -1) {
      return { success: false, error: 'Group not found' }
    }

    existingGroups.splice(groupIndex, 1)
    const saveResult = saveHabitGroups(existingGroups)
    if (!saveResult.success) {
      return saveResult
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete habit group: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Gets all habit groups
 */
export function getHabitGroups(): StorageResult<HabitGroup[]> {
  try {
    const groups = getHabitGroupsArray()
    return { success: true, data: groups }
  } catch (error) {
    return {
      success: false,
      error: `Failed to get habit groups: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Adds a habit to an existing group
 */
export function addHabitToGroup(groupId: string, habitId: string): StorageResult<HabitGroup> {
  try {
    const existingGroups = getHabitGroupsArray()
    const groupIndex = existingGroups.findIndex(g => g.id === groupId)

    if (groupIndex === -1) {
      return { success: false, error: 'Group not found' }
    }

    // Check if habit is already in another group
    const duplicateCheck = checkForDuplicateHabits([habitId], existingGroups.filter(g => g.id !== groupId))
    if (!duplicateCheck.success) {
      return { success: false, error: duplicateCheck.error }
    }

    const group = existingGroups[groupIndex]
    if (group.habit_ids.includes(habitId)) {
      return { success: false, error: 'Habit already in this group' }
    }

    const updatedGroup = {
      ...group,
      habit_ids: [...group.habit_ids, habitId]
    }

    existingGroups[groupIndex] = updatedGroup
    const saveResult = saveHabitGroups(existingGroups)
    if (!saveResult.success) {
      return { success: false, error: saveResult.error }
    }

    return { success: true, data: updatedGroup }
  } catch (error) {
    return {
      success: false,
      error: `Failed to add habit to group: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Removes a habit from a group
 */
export function removeHabitFromGroup(groupId: string, habitId: string): StorageResult<HabitGroup> {
  try {
    const existingGroups = getHabitGroupsArray()
    const groupIndex = existingGroups.findIndex(g => g.id === groupId)

    if (groupIndex === -1) {
      return { success: false, error: 'Group not found' }
    }

    const group = existingGroups[groupIndex]
    const updatedHabitIds = group.habit_ids.filter(id => id !== habitId)

    if (updatedHabitIds.length === group.habit_ids.length) {
      return { success: false, error: 'Habit not found in group' }
    }

    const updatedGroup = {
      ...group,
      habit_ids: updatedHabitIds
    }

    existingGroups[groupIndex] = updatedGroup
    const saveResult = saveHabitGroups(existingGroups)
    if (!saveResult.success) {
      return { success: false, error: saveResult.error }
    }

    return { success: true, data: updatedGroup }
  } catch (error) {
    return {
      success: false,
      error: `Failed to remove habit from group: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Suggests groups for a habit based on similarity analysis
 */
export function suggestGroupsForHabit(habit: Habit): StorageResult<GroupSuggestion[]> {
  try {
    const existingGroups = getHabitGroupsArray()
    const suggestions: GroupSuggestion[] = []

    for (const group of existingGroups) {
      const similarity = calculateHabitGroupSimilarity(habit, group)
      if (similarity.confidence > 0.3) { // Only suggest if confidence > 30%
        suggestions.push({
          group,
          confidence: similarity.confidence,
          reason: similarity.reason
        })
      }
    }

    // Sort by confidence (highest first)
    suggestions.sort((a, b) => b.confidence - a.confidence)

    return { success: true, data: suggestions }
  } catch (error) {
    return {
      success: false,
      error: `Failed to suggest groups: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Automatically groups habits based on similarity patterns
 */
export function autoGroupHabits(habits: Habit[]): StorageResult<AutoGroupResult> {
  try {
    if (habits.length < 2) {
      return { 
        success: true, 
        data: { groups: [], rationale: [] } 
      }
    }

    const groups: HabitGroup[] = []
    const rationale: Array<{ group_id: string; reason: string; confidence: number }> = []

    // Group by contextual similarity (keywords in names)
    const contextualGroups = groupByContext(habits)
    groups.push(...contextualGroups.groups)
    rationale.push(...contextualGroups.rationale)

    // Group by type similarity (same habit types)
    const typeGroups = groupByType(habits, groups)
    groups.push(...typeGroups.groups)
    rationale.push(...typeGroups.rationale)

    return { success: true, data: { groups, rationale } }
  } catch (error) {
    return {
      success: false,
      error: `Failed to auto-group habits: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validates group configuration
 */
export function validateGroupConfiguration(group: Omit<HabitGroup, 'id' | 'created_at'>): StorageResult<boolean> {
  if (!group.name || group.name.trim().length === 0) {
    return { success: false, error: 'Group name is required' }
  }

  if (!group.habit_ids || group.habit_ids.length === 0) {
    return { success: false, error: 'Group must contain at least one habit' }
  }

  const validGroupTypes = ['contextual', 'temporal', 'difficulty', 'manual']
  if (!validGroupTypes.includes(group.group_type)) {
    return { success: false, error: 'Invalid group type' }
  }

  return { success: true, data: true }
}

// Private helper functions

function getHabitGroupsArray(): HabitGroup[] {
  try {
    const stored = localStorage.getItem('shutdown_habit_groups')
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHabitGroups(groups: HabitGroup[]): StorageResult<boolean> {
  try {
    localStorage.setItem('shutdown_habit_groups', JSON.stringify(groups))
    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: `Failed to save to storage: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

function checkForDuplicateHabits(habitIds: string[], existingGroups: HabitGroup[]): StorageResult<boolean> {
  for (const habitId of habitIds) {
    const existingGroup = existingGroups.find(group => group.habit_ids.includes(habitId))
    if (existingGroup) {
      return { 
        success: false, 
        error: `Habit ${habitId} is already assigned to group "${existingGroup.name}"` 
      }
    }
  }
  return { success: true, data: true }
}

function calculateHabitGroupSimilarity(habit: Habit, group: HabitGroup): { confidence: number; reason: string } {
  let confidence = 0
  const reasons: string[] = []

  // Check for keyword similarity in names
  const habitKeywords = extractKeywords(habit.name.toLowerCase())
  const groupKeywords = extractKeywords(group.name.toLowerCase())
  
  const keywordOverlap = habitKeywords.filter(k => groupKeywords.includes(k)).length
  if (keywordOverlap > 0) {
    confidence += 0.4 * (keywordOverlap / Math.max(habitKeywords.length, groupKeywords.length))
    reasons.push('similar keywords')
  }

  // Check for contextual similarity if group is contextual
  if (group.group_type === 'contextual') {
    const contextSimilarity = calculateContextSimilarity(habit.name, group.name)
    confidence += contextSimilarity
    if (contextSimilarity > 0.3) {
      reasons.push('contextual similarity')
    }
  }

  // Check for type similarity if group is temporal
  if (group.group_type === 'temporal') {
    // Get habits in the group to check type compatibility
    const habitType = habit.type
    // Boost confidence for boolean habits in temporal groups (quick tasks)
    if (habitType === 'boolean') {
      confidence += 0.5
      reasons.push('type compatibility')
    } else {
      confidence += 0.2
      reasons.push('type compatibility')
    }
  }

  return {
    confidence: Math.min(confidence, 1.0),
    reason: reasons.join(', ') || 'general compatibility'
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - split on common separators and filter short words
  return text
    .split(/[\s\-_,.!?]+/)
    .filter(word => word.length > 2)
    .map(word => word.toLowerCase())
}

function calculateContextSimilarity(habitName: string, groupName: string): number {
  const habitLower = habitName.toLowerCase()
  const groupLower = groupName.toLowerCase()

  // Check for technology/digital context
  const digitalKeywords = ['phone', 'laptop', 'computer', 'digital', 'screen', 'device', 'notification']
  const habitDigital = digitalKeywords.some(k => habitLower.includes(k))
  const groupDigital = digitalKeywords.some(k => groupLower.includes(k))

  if (habitDigital && groupDigital) return 0.8

  // Check for learning/reading context
  const learningKeywords = ['read', 'learn', 'study', 'book', 'journal', 'write']
  const habitLearning = learningKeywords.some(k => habitLower.includes(k))
  const groupLearning = learningKeywords.some(k => groupLower.includes(k))

  if (habitLearning && groupLearning) return 0.7

  return 0.0
}

function groupByContext(habits: Habit[]): { groups: HabitGroup[]; rationale: Array<{ group_id: string; reason: string; confidence: number }> } {
  const groups: HabitGroup[] = []
  const rationale: Array<{ group_id: string; reason: string; confidence: number }> = []

  // Look for digital/technology habits
  const digitalHabits = habits.filter(h => {
    const name = h.name.toLowerCase()
    return name.includes('phone') || name.includes('laptop') || name.includes('computer') || 
           name.includes('digital') || name.includes('screen') || name.includes('notification')
  })

  if (digitalHabits.length >= 2) {
    const groupId = generateId()
    groups.push({
      id: groupId,
      name: 'Digital Shutdown',
      habit_ids: digitalHabits.map(h => h.id),
      group_type: 'contextual',
      created_at: formatTimestamp(new Date())
    })

    rationale.push({
      group_id: groupId,
      reason: 'Habits related to digital devices and technology',
      confidence: 0.8
    })
  }

  return { groups, rationale }
}

function groupByType(habits: Habit[], existingGroups: HabitGroup[]): { groups: HabitGroup[]; rationale: Array<{ group_id: string; reason: string; confidence: number }> } {
  const groups: HabitGroup[] = []
  const rationale: Array<{ group_id: string; reason: string; confidence: number }> = []

  // Get habits not already grouped
  const groupedHabitIds = new Set(existingGroups.flatMap(g => g.habit_ids))
  const ungroupedHabits = habits.filter(h => !groupedHabitIds.has(h.id))

  // Group boolean habits (typically quick tasks)
  const booleanHabits = ungroupedHabits.filter(h => h.type === 'boolean')
  
  if (booleanHabits.length >= 2) {
    const groupId = generateId()
    groups.push({
      id: groupId,
      name: 'Quick Tasks',
      habit_ids: booleanHabits.map(h => h.id),
      group_type: 'temporal',
      created_at: formatTimestamp(new Date())
    })

    rationale.push({
      group_id: groupId,
      reason: 'Quick boolean tasks that work well together',
      confidence: 0.6
    })
  }

  return { groups, rationale }
}