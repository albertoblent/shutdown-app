/**
 * CSS Regression Tests for Mobile Drag-and-Drop
 * These tests prevent accidental removal of critical mobile CSS properties
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('HabitManager CSS Mobile Requirements', () => {
  const cssFilePath = resolve(__dirname, '../components/HabitManager.module.css');
  const cssContent = readFileSync(cssFilePath, 'utf8');

  it('should have touch-action: none on drag handles to prevent mobile scroll hijacking', () => {
    // This is the CRITICAL fix for mobile drag-and-drop
    // Without this, mobile browsers hijack touch events for scrolling
    expect(cssContent).toMatch(/\.dragHandle\s*\{[^}]*touch-action:\s*none/);
  });

  it('should have touch-action: auto on input fields to allow text input', () => {
    // Input fields need touch-action: auto to work properly on mobile
    expect(cssContent).toMatch(/\.editInput[^}]*touch-action:\s*auto/);
    expect(cssContent).toMatch(/\.editTextarea[^}]*touch-action:\s*auto/);
  });

  it('should have touch-action: auto on buttons to allow tap interactions', () => {
    // Buttons need touch-action: auto for normal mobile interaction
    expect(cssContent).toMatch(/\.saveButton, \.cancelButton\s*\{[^}]*touch-action:\s*auto/);
  });

  it('should ensure drag handles have minimum 48px width for mobile accessibility', () => {
    // Mobile accessibility requires minimum 48px touch targets
    expect(cssContent).toMatch(/\.dragHandle\s*\{[^}]*min-width:\s*48px/);
  });

  it('should have proper cursor styles for drag handles', () => {
    // Visual feedback for drag interaction
    expect(cssContent).toMatch(/\.dragHandle\s*\{[^}]*cursor:\s*grab/);
    expect(cssContent).toMatch(/\.dragHandle:active\s*\{[^}]*cursor:\s*grabbing/);
  });

  it('should not have conflicting touch-action rules', () => {
    // Ensure we don't have contradictory rules that could break mobile
    const touchActionRules = cssContent.match(/touch-action:\s*[^;]+/g) || [];
    
    // Should have exactly the touch-action rules we expect
    expect(touchActionRules.length).toBeGreaterThan(0);
    
    // Should not have touch-action: pan-y or pan-x on drag handles
    expect(cssContent).not.toMatch(/\.dragHandle[^}]*touch-action:\s*pan-[xy]/);
    expect(cssContent).not.toMatch(/\.dragHandle[^}]*touch-action:\s*manipulation/);
  });
});