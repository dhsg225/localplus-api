# Display Methods Testing & Bug Fixes

**Date**: 2025-12-05  
**Status**: Testing & Bug Fixes

---

## Display Methods Overview

### 1. **slide-down** (formerly "eventcard")
- **Behavior**: Click card → Panel slides down below the card
- **Visual Indicator**: "View Details ↓"
- **Implementation**: 
  - CSS: `.localplus-event-card.active .localplus-event-details-panel` expands
  - JS: `initSlideDown()` adds `.active` class on click
  - Panel contains full event details

### 2. **lightbox**
- **Behavior**: Click card → Full-screen modal overlay appears
- **Visual Indicator**: "View Details →"
- **Implementation**:
  - Modal with overlay background
  - JS: `initLightbox()` opens modal on click
  - Modal contains full event details

### 3. **tooltip**
- **Behavior**: Hover over card → Small tooltip follows mouse
- **Visual Indicator**: None (hover only)
- **Implementation**:
  - Small floating tooltip box
  - JS: `initTooltip()` shows tooltip on hover
  - Tooltip shows basic info only (title, date, time, location)

### 4. **singlepage**
- **Behavior**: Click card → Navigate to WordPress single event page
- **Visual Indicator**: Title is a link
- **Implementation**: Standard WordPress link navigation

---

## Potential Bugs Found

### Bug 1: Event Handlers May Be Attached Multiple Times
**Location**: `frontend.js` - `initLightbox()`, `initSlideDown()`, `initTooltip()`

**Issue**: When multiple shortcodes are on the same page, event handlers might be attached multiple times to the same elements.

**Fix Applied**: 
- Clone and replace cards to remove existing listeners before adding new ones
- Use `dataset.initialized` flag to prevent duplicate modal setup

### Bug 2: Slide-Down Panel May Not Expand Properly
**Location**: CSS selector `.localplus-event-card.active .localplus-event-details-panel`

**Issue**: The card has class `localplus-event-card-toggle` but CSS looks for `.localplus-event-card.active`

**Status**: ✅ Fixed - Card has both classes: `localplus-event-card` AND `localplus-event-card-toggle`

### Bug 3: Tooltip May Not Show on Mobile
**Location**: `initTooltip()` - hover events don't work on touch devices

**Status**: ⚠️ Known limitation - tooltips don't work on mobile (touch devices)

### Bug 4: Multiple Modals Created
**Location**: Template - Each shortcode with `display_method="lightbox"` creates a modal

**Status**: ✅ Fixed - Modal is created only once using `$GLOBALS['localplus_event_modal_created']` flag

---

## Testing Checklist

### Test 1: Slide-Down Method
- [ ] Click event card
- [ ] Panel should slide down below card
- [ ] Panel should show full event details
- [ ] Clicking another card should close previous panel
- [ ] Clicking same card again should close panel
- [ ] Panel should have smooth animation

### Test 2: Lightbox Method
- [ ] Click event card
- [ ] Modal should appear as overlay
- [ ] Modal should show full event details
- [ ] Close button should work
- [ ] Clicking overlay should close modal
- [ ] Escape key should close modal
- [ ] Body scroll should be locked when modal is open

### Test 3: Tooltip Method
- [ ] Hover over event card
- [ ] Tooltip should appear near mouse cursor
- [ ] Tooltip should show title, date, time, location
- [ ] Tooltip should follow mouse movement
- [ ] Moving mouse away should hide tooltip
- [ ] Tooltip should not interfere with clicking

### Test 4: Multiple Shortcodes on Same Page
- [ ] Create page with multiple shortcodes using different display methods
- [ ] Each should work independently
- [ ] No JavaScript errors in console
- [ ] No duplicate modals
- [ ] Event handlers should not conflict

### Test 5: Backward Compatibility
- [ ] Old `display_method="eventcard"` should still work
- [ ] Should automatically convert to `slide-down`
- [ ] No breaking changes for existing shortcodes

---

## Code Changes Made

### 1. Renamed "eventcard" to "slide-down"
- Updated default value in shortcode handler
- Updated function name: `initEventCard()` → `initSlideDown()`
- Updated documentation
- Added backward compatibility for "eventcard"

### 2. Fixed Multiple Shortcodes Issue
- JavaScript now loops through ALL containers
- Each container initialized independently
- Modal created only once and shared
- Event handlers scoped to their container

### 3. Improved Event Handler Management
- Clone and replace cards to remove old listeners
- Use flags to prevent duplicate initialization
- Better error handling and logging

---

## Known Limitations

1. **Tooltip on Mobile**: Hover events don't work on touch devices - tooltip won't show
2. **Panel Animation**: Uses `max-height` which may cause slight jump if content is very tall
3. **Modal Positioning**: May be affected by parent container CSS (overflow, position)

---

## Next Steps

1. Test each display method manually
2. Fix any bugs found during testing
3. Update version and deploy

