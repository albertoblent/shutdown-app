# Manual Testing Guide for Habit Management System

This guide provides step-by-step testing instructions for the habit management system implemented in Issue #5. Follow these tests to verify all functionality works correctly across different devices and browsers.

**Issue #5 Scope**: Habit CRUD operations with 7-habit limit, preset templates, inline editing with auto-save, and drag-and-drop reordering.

## Prerequisites

1. **Start the Development Server**

   ```bash
   cd frontend
   npm run dev
   ```

   Open <http://localhost:5173> in your browser

2. **Clear Previous Data** (for fresh testing)
   - Open browser DevTools (F12)
   - Go to Application tab → Storage → Local Storage
   - Delete all items to start with clean state

## Test Scenarios

### 1. Initial State and Empty State Display

**Expected Behavior**: When no habits exist, user should see template options and empty state

**Steps:**

1. Load the application
2. Verify you see "Habit Management" header with "0/7 habits" counter
3. Confirm "No habits yet" message appears
4. Verify "Get started by adding a habit or loading a template" text is visible
5. Check that three template cards are displayed:
   - **Productivity Focus**: "Deep work, financial awareness, and physical health"
   - **Health & Wellness**: "Physical health tracking and wellness metrics"
   - **Work-Life Balance**: "Personal relationships, growth, and mindfulness"

**✅ Pass Criteria**: Empty state displays correctly with template options

### 2. Template Loading - Productivity Focus

**Expected Behavior**: Loading a template should add 3 habits with proper validation

**Steps:**

1. Click "Load Template" button on **Productivity Focus** card
2. Template loads immediately (no confirmation dialog for empty state)
3. Check that 3 habits are added:
   - **Deep Work Hours** (numeric, 0-12 hours)
   - **Budget Reviewed** (boolean)
   - **Exercise Completed** (boolean)
4. Verify habit counter shows "3/7 habits"
5. Confirm template selector disappears (only shows when habits.length === 0)

**✅ Pass Criteria**: 3 productivity habits loaded correctly with proper types and prompts

### 3. Template Loading - Health & Wellness

**Expected Behavior**: Template should load additional habits without replacing existing ones

**Steps:**

1. With 3 existing habits, click "Add New Habit" to access templates (they only show in empty state)
2. Alternatively, test by clearing all habits first, then load **Health & Wellness** template
3. Verify 3 habits are added:
   - **Daily Steps** (numeric, 0-30000 steps)
   - **Water Intake** (numeric, 0-15 glasses)
   - **Sleep Hours** (numeric, 0-12 hours)
4. Check habit counter shows "3/7 habits"
5. Verify all habits are displayed in the list

**Note**: Template selector only appears when no habits exist. To test multiple templates, either test separately or use the storage API directly.

**✅ Pass Criteria**: Health & Wellness template loads correctly with proper numeric configurations

### 4. Habit Limit Enforcement

**Expected Behavior**: System should prevent adding more than 7 habits total

**Steps:**

1. **Test Template Limit**: Load **Productivity Focus** template (3 habits), then **Health & Wellness** template (3 habits) = 6 total
2. Note: Since templates only show in empty state, test templates separately or manually add 4 individual habits to reach 6 total
3. Try to load **Work-Life Balance** template (3 habits) when you have 6 existing
4. **Since templates don't show with existing habits**, test by manually adding individual habits until you reach 7
5. Create individual habits until counter shows "7/7 habits"
6. Verify "Add New Habit" button disappears (due to `validateHabitLimit` check)
7. **Test storage-level limit**: If you could access templates with existing habits, verify error message: "Cannot load template: would exceed 7 habit limit"

**Note**: Due to current UI design, template selector is hidden when habits exist, so testing the template limit requires either clearing habits between tests or direct storage manipulation.

**✅ Pass Criteria**: 7-habit limit enforced correctly with proper UI updates, Add New Habit button disappears at limit

### 5. Manual Habit Creation - Boolean Type

**Expected Behavior**: Users can create custom boolean habits

**Steps:**

1. Clear all habits first: Click "Clear All" → Confirm deletion
2. Click "Add New Habit" button
3. Fill out the form:
   - **Habit Name**: "Morning Meditation"
   - **Atomic Prompt**: "Did you meditate for at least 10 minutes this morning?"
   - **Type**: "Yes/No (Boolean)" (should be default)
4. Click "Add Habit"
5. Verify habit appears in list with:
   - Correct name and prompt displayed
   - Type shows as "boolean"
   - Edit and Delete buttons visible
   - Drag handle (⋮⋮) visible on left

**✅ Pass Criteria**: Boolean habit created successfully with all expected elements

### 6. Manual Habit Creation - Numeric Type

**Expected Behavior**: Users can create custom numeric habits with units and ranges

**Steps:**

1. Click "Add New Habit"
2. Fill out the form:
   - **Habit Name**: "Reading Time"
   - **Atomic Prompt**: "How many pages did you read today?"
   - **Type**: "Number (Numeric)"
   - **Unit**: "pages" (optional field)
   - **Min Value**: 0 (default)
   - **Max Value**: 100 (change from default 10)
3. Click "Add Habit"
4. Verify habit appears with:
   - Type shows as "numeric"
   - Unit "(pages)" displayed in habit meta

**✅ Pass Criteria**: Numeric habit created with proper unit display

### 6a. Manual Habit Creation - Choice Type (Beyond Issue #5 Scope)

**Expected Behavior**: Users can create choice-type habits (implemented beyond original scope)

**Steps:**

1. Click "Add New Habit"
2. Fill out the form:
   - **Habit Name**: "Mood Check"
   - **Atomic Prompt**: "How was your overall mood today?"
   - **Type**: "Multiple Choice"
3. Click "Add Habit"
4. Verify habit appears with:
   - Type shows as "choice"
   - No additional configuration fields visible

**✅ Pass Criteria**: Choice habit created successfully (note: this was implemented beyond Issue #5 scope)

### 7. Inline Editing with Auto-Save

**Expected Behavior**: Users can edit habits inline with auto-save on blur and keyboard shortcuts

**Steps:**

1. Click "Edit" button on any habit
2. Verify inline editing form appears with:
   - Name input field (focused and auto-selected)
   - Prompt textarea
   - Save and Cancel buttons
   - Drag handle is disabled during editing
3. **Test Auto-Save on Blur**:
   - Modify the habit name to "Auto-Saved Name"
   - Click outside the input field (or tab to prompt field)
   - Verify changes are automatically saved without clicking "Save"
   - Confirm editing UI disappears after auto-save
4. **Test Manual Save**:
   - Edit another habit
   - Make changes to both name and prompt
   - Click the "Save" button explicitly
   - Verify changes are saved and editing UI disappears
5. **Test Keyboard Shortcuts**:
   - Edit a habit and modify text
   - **Ctrl+Enter** (or Cmd+Enter on Mac): Should save changes
   - **Escape**: Should cancel editing (test on a different habit)
6. **Test Auto-Save Validation**:
   - Edit a habit and clear all text from name field
   - Tab to prompt field - verify auto-save doesn't trigger with invalid data
   - Return to name field, enter valid data, then blur - verify auto-save works

**✅ Pass Criteria**: Auto-save on blur works correctly with validation, manual save works, keyboard shortcuts function properly

### 8. Drag and Drop Reordering

**Expected Behavior**: Users can reorder habits using drag and drop

**Steps:**

1. Ensure you have at least 3 habits in the list
2. Note the current order of habits
3. **Desktop Testing**:
   - Click and hold the drag handle (⋮⋮) on the first habit
   - Drag it below the second habit
   - Release to drop
   - Verify the order changes immediately
   - Check that the change persists after page refresh
4. **Touch Device Testing** (if available):
   - Touch and hold the drag handle
   - Drag to new position
   - Release to drop
   - Verify reordering works on mobile

**✅ Pass Criteria**: Drag and drop reordering works on both desktop and touch devices

### 9. Habit Deletion with Confirmation

**Expected Behavior**: Users can delete habits with safety confirmation

**Steps:**

1. Click "Delete" button on any habit
2. Verify browser confirmation dialog appears: "Are you sure you want to delete this habit?"
3. Click "Cancel" and verify habit remains
4. Click "Delete" again and confirm with "OK"
5. Verify habit is removed immediately
6. Check that habit counter decreases appropriately
7. Confirm "Add New Habit" button reappears if under 7 habits

**✅ Pass Criteria**: Deletion requires confirmation and works correctly

### 10. Clear All Functionality

**Expected Behavior**: Users can clear all habits with strong confirmation

**Steps:**

1. Ensure you have multiple habits
2. Click "Clear All" button
3. Verify confirmation dialog: "Are you sure you want to delete ALL habits? This cannot be undone."
4. Click "Cancel" and verify all habits remain
5. Click "Clear All" again and confirm with "OK"
6. Verify all habits are deleted
7. Confirm counter shows "0/7 habits"
8. Check that template selector reappears
9. Verify "Add New Habit" button is available

**✅ Pass Criteria**: Clear all requires strong confirmation and fully resets state

### 11. Error Handling and Validation

**Expected Behavior**: System should handle invalid inputs gracefully

**Steps:**

1. Click "Add New Habit"
2. Try to submit empty form - verify form validation prevents submission
3. Enter only a name (no prompt) - verify validation fails
4. Enter only a prompt (no name) - verify validation fails
5. Try adding 8th habit (if at limit) - verify error message appears in red
6. Test template loading beyond limit - verify error message displays
7. Test inline editing with empty values - verify auto-save validation
8. Verify error messages are displayed prominently with proper styling

**✅ Pass Criteria**: Proper validation prevents invalid data entry, error messages are clear and visible

### 12. Data Persistence

**Expected Behavior**: Data should persist across browser sessions

**Steps:**

1. Create several habits with different types
2. Refresh the page (F5 or Ctrl+R)
3. Verify all habits are still present with correct:
   - Names and prompts
   - Types and configurations
   - Order/positioning
4. Close the browser tab completely
5. Open a new tab and navigate to the app
6. Verify data persistence across browser sessions

**✅ Pass Criteria**: All habit data persists across page refreshes and browser sessions

### 13. Responsive Design Testing

**Expected Behavior**: App should work well on different screen sizes

**Steps:**

1. **Desktop Testing** (1200px+ width):
   - Verify layout uses available space efficiently
   - Check that touch targets are appropriate
   - Confirm drag handles work with mouse
2. **Tablet Testing** (768px-1199px width):
   - Use browser DevTools to simulate tablet
   - Verify layout adapts appropriately
   - Test touch interactions if available
3. **Mobile Testing** (< 768px width):
   - Simulate mobile viewport in DevTools
   - Verify 48px minimum touch targets
   - Test that forms are usable on small screens
   - Confirm text remains readable

**✅ Pass Criteria**: App is fully functional and usable across all screen sizes

### 14. Performance and Loading States

**Expected Behavior**: App should provide feedback during operations

**Steps:**

1. Observe loading states when app first loads
2. Verify "Loading habits..." message appears briefly
3. Check that operations like template loading show immediate feedback
4. Verify no console errors in browser DevTools
5. Test app performance with maximum 7 habits loaded
6. Confirm smooth animations during drag and drop

**✅ Pass Criteria**: App feels responsive with appropriate loading feedback

## Test Results Checklist

Record your test results:

- [ ] **Initial State Display**: Empty state shows correctly with template options
- [ ] **Template Loading**: All 3 templates load properly (test individually due to UI design)
- [ ] **Habit Limit**: 7-habit limit enforced correctly, Add New Habit button disappears at limit
- [ ] **Manual Creation**: Boolean, numeric, and choice habits create successfully
- [ ] **Inline Editing**: Auto-save on blur and keyboard shortcuts work correctly with validation
- [ ] **Drag and Drop**: Reordering works on desktop and mobile, disabled during editing
- [ ] **Deletion**: Individual deletion with confirmation works
- [ ] **Clear All**: Bulk deletion with strong confirmation works
- [ ] **Error Handling**: Invalid inputs handled gracefully with visible error messages
- [ ] **Data Persistence**: Data survives page refreshes and browser sessions
- [ ] **Responsive Design**: Works well on desktop, tablet, and mobile
- [ ] **Performance**: App feels fast and responsive with proper loading states

## Browser Compatibility

Test on these browsers to ensure broad compatibility:

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (if on Mac)
- [ ] **Edge** (latest)
- [ ] **Mobile Safari** (iOS)
- [ ] **Chrome Mobile** (Android)

## Accessibility Testing

Basic accessibility checks:

- [ ] All interactive elements have 48px minimum touch targets
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Error messages are clearly visible with proper contrast
- [ ] Screen reader accessibility (test with built-in screen reader)
- [ ] Focus indicators are visible when tabbing through interface

## Bug Reporting

If you find issues during testing:

1. **Document the bug**: Include steps to reproduce, expected vs actual behavior
2. **Check browser console**: Include any error messages in DevTools
3. **Note environment**: Browser version, device type, screen size
4. **Create GitHub issue**: Use the bug report template with all details

## Testing Complete

✅ **All tests passing**: Habit management system is ready for production use
❌ **Issues found**: Document bugs and retest after fixes

---

## Summary

This testing guide covers the **Issue #5** implementation scope:
- ✅ **Core CRUD Operations**: Add, edit, delete, reorder habits
- ✅ **7-Habit Limit**: Enforced at storage level with UI updates
- ✅ **Preset Templates**: 3 templates available (Productivity, Health, Work-Life Balance)
- ✅ **Inline Editing**: Auto-save on blur with validation and keyboard shortcuts
- ✅ **Drag & Drop**: HTML5 drag API with touch support and visual feedback
- ✅ **Additional Features**: Choice type (beyond scope), Clear All functionality

**Key Implementation Notes**:
- Template selector only shows when no habits exist (empty state)
- Auto-save validates input before saving
- Drag handles are disabled during editing mode
- Add New Habit button disappears when 7-habit limit is reached

*This testing guide corresponds to Issue #5 implementation. Last updated: January 2025*
