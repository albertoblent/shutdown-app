/**
 * Data Models for Shutdown Routine App
 * Based on Technical Architecture documentation
 * localStorage-optimized for MVP (single user, embedded relations)
 */

// Core data interfaces matching documented architecture

export interface Habit {
  id: string; // UUID
  name: string;
  type: 'boolean' | 'numeric' | 'choice';
  atomic_prompt: string;
  configuration: {
    numeric_unit?: string;
    numeric_range?: [number, number];
    choices?: string[];
    context_url?: string;
    icon?: string;
  };
  position: number;
  is_active: boolean;
  created_at: string; // ISO timestamp
}

export interface HabitCompletion {
  id: string; // UUID
  habit_id: string; // FK to Habit
  value: {
    boolean?: boolean;
    numeric?: number;
    choice?: string;
  };
  completed_at: string; // ISO timestamp
  flagged_for_action: boolean;
  action_note?: string;
  time_to_complete: number; // milliseconds
}

export interface DailyEntry {
  id: string; // UUID
  date: string; // YYYY-MM-DD
  started_at: string; // ISO timestamp
  completed_at?: string; // ISO timestamp
  is_complete: boolean;
  habit_completions: HabitCompletion[];
}

export interface Settings {
  theme: 'dark' | 'light' | 'auto';
  notifications: boolean;
  shutdown_time: string; // HH:mm format
  timezone: string;
  weekend_schedule?: {
    enabled: boolean;
    different_time?: string;
  };
  completion_ritual?: {
    enabled: boolean;
    message?: string;
    sound?: boolean;
  };
}

// Storage key constants
export const STORAGE_KEYS = {
  HABITS: 'shutdown_habits',
  ENTRY_PREFIX: 'shutdown_entries_', // + YYYY-MM-DD
  SETTINGS: 'shutdown_settings',
  LAST_EXPORT: 'shutdown_last_export',
} as const;

// Utility types
export type HabitType = Habit['type'];
export type ThemeOption = Settings['theme'];

// Storage utilities
export const getEntryKey = (date: string): string => {
  return `${STORAGE_KEYS.ENTRY_PREFIX}${date}`;
};

export const parseDateFromEntryKey = (key: string): string | null => {
  if (!key.startsWith(STORAGE_KEYS.ENTRY_PREFIX)) {
    return null;
  }
  return key.substring(STORAGE_KEYS.ENTRY_PREFIX.length);
};

// UUID generation helper with fallback for non-secure contexts
export const generateId = (): string => {
  // Use crypto.randomUUID() in secure contexts (HTTPS, localhost)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for non-secure contexts (HTTP development)
  // This generates a v4 UUID compatible string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Date utilities
export const formatDate = (date: Date): string => {
  // Use local date components instead of UTC to fix timezone bug
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTimestamp = (date: Date): string => {
  return date.toISOString();
};

export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Rapid Input Types for Issue #28
export interface VoiceInputResult {
  success: boolean;
  value?: number;
  confidence?: number;
  error?: string;
}

export interface InputPrediction {
  value: number | string;
  confidence: number;
  source: 'pattern' | 'average' | 'yesterday' | 'trending';
  label: string;
}

export type GestureType = 'swipe-up' | 'swipe-down' | 'double-tap' | 'long-press';

export interface GestureConfig {
  gesture: GestureType;
  action: 'increment' | 'decrement' | 'complete' | 'reset';
  value?: number;
}

// Storage for rapid input optimization
export interface InputHistory {
  habit_id: string;
  recent_values: number[];
  average_value: number;
  completion_times: number[]; // milliseconds
  last_updated: string; // ISO timestamp
}

// Smart Sequencing Types for Issue #29
export interface SequencingData {
  habit_id: string;
  average_completion_time: number; // milliseconds
  completion_count: number;
  group_id?: string;
  quick_win_score: number; // 0-1, higher = better quick win
  last_updated: string; // ISO timestamp
}

export interface HabitGroup {
  id: string;
  name: string;
  habit_ids: string[];
  group_type: 'contextual' | 'temporal' | 'difficulty' | 'manual';
  created_at: string; // ISO timestamp
}

export interface SequencingPreferences {
  manual_order?: string[]; // Override automatic ordering
  disabled_grouping: boolean;
  quick_wins_first: boolean;
  adapt_to_patterns: boolean;
  override_algorithm: boolean;
}

export interface OptimizedSequence {
  habit_id: string;
  position: number;
  group_id?: string;
  momentum_score: number; // 0-1 priority score
  reasoning: string; // Human-readable explanation
}

// Default values
export const createDefaultSettings = (): Settings => ({
  theme: 'dark',
  notifications: true,
  shutdown_time: '22:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  weekend_schedule: {
    enabled: false,
  },
  completion_ritual: {
    enabled: true,
    message: 'Great job completing your shutdown routine!',
    sound: false,
  },
});