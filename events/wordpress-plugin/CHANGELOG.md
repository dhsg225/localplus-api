# Changelog

All notable changes to the LocalPlus Event Engine WordPress Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.9.0] - 2025-12-06

### Added
- **Calendar Views**: Four new calendar display methods inspired by EventON
  - **Daily View** (`display_method="daily"`): Large focus date block, scrollable days strip, events listed below
    - Parameters: `daily_focus_date`, `daily_days_strip`
  - **Weekly View** (`display_method="weekly"`): 7-day week grid (Sun-Sat) with month navigator
    - Parameters: `weekly_start_date`, `weekly_style` (1-3)
  - **Table Week View** (`display_method="table-week"`): Compact table format with days as columns
    - Parameters: `table_week_start_date`, `table_week_style` (1-2)
  - **Yearly View** (`display_method="yearly"`): Full year calendar with 12 month grids
    - Parameters: `yearly_year`, `yearly_style` (1-2)
  - All calendar views support URL parameters for navigation (date, week_start, year)
  - All calendar views integrate with lightbox for event details
  - Responsive design for all calendar views
  - JavaScript navigation for all views (prev/next day/week/month/year, today button)

## [1.2.8.7] - 2025-12-05

### Added
- **Gridview Display Method**: New tile/grid layout inspired by EventON
  - `display_method="gridview"` - Shows events as large tiles with background images or colors
  - `grid_count` parameter (1-4): Number of tiles per row (default: 3)
  - `grid_height` parameter: Height of tiles in pixels (default: 250)
  - `grid_bg` parameter (0-1): Use event image (1) or event color (0) as background (default: 1)
  - `grid_style` parameter (1-4): Four different style variants:
    - Style 1: Full details overlay with title, subtitle, time, location
    - Style 2: Title and subtitle overlay
    - Style 3: Details right of date
    - Style 4: Bare minimal - just title overlay
  - Tiles open in lightbox modal when clicked
  - Fully responsive - adapts to screen size
  - Example: `[localplus_events display_method="gridview" grid_count="3" grid_height="250" grid_bg="1" grid_style="1"]`

## [1.2.8.6] - 2025-12-05

### Changed
- **Renamed Display Method**: "eventcard" renamed to "slide-down" for clarity
  - Old name "eventcard" still supported for backward compatibility
  - Function renamed: `initEventCard()` → `initSlideDown()`
  - Updated all documentation and examples

### Fixed
- **Duplicate Event Handlers**: Fixed issue where event handlers were attached multiple times
  - Added initialization flags (`data-lightbox-initialized`, `data-slideDown-initialized`, `data-tooltip-initialized`)
  - Prevents duplicate click/hover handlers when multiple shortcodes on same page
  - Removed card cloning that was losing data attributes
- **Tooltip Positioning**: Changed tooltip from `position: absolute` to `position: fixed` for proper mouse following
- **Slide-Down Panel Scoping**: Fixed panel closing to only affect cards in the same container

## [1.2.8.5] - 2025-12-05

### Added
- **Columns Parameter**: New `columns` parameter to control grid layout
  - `columns="0"` (default): Auto/responsive columns based on available space
  - `columns="1"` to `columns="6"`: Fixed number of columns
  - Always shows 1 column on mobile devices regardless of setting
  - Example: `[localplus_events columns="3"]` shows exactly 3 columns

## [1.2.8.4] - 2025-12-05

### Fixed
- **Lightbox Not Working with Multiple Shortcodes**: Fixed lightbox initialization when multiple shortcodes with different display methods are on the same page
  - JavaScript now initializes ALL containers independently (not just the first one)
  - Modal is created only once and shared across all lightbox instances
  - Each container's event cards are properly scoped to their container
  - Prevents duplicate modals and event handler conflicts
  - Updated initLightbox(), initEventCard(), and initTooltip() to accept container parameter

## [1.2.8.3] - 2025-12-05

### Fixed
- **Organizer Data Extraction**: Improved organizer data extraction from Supabase metadata
  - Explicitly extracts `metadata.organizer_name` before sanitization
  - Includes full `metadata` object in sanitized event data for JavaScript access
  - Sets both `organizer` and `organizer_name` fields for compatibility
  - Hides organizer section if no organizer data is available

## [1.2.8.2] - 2025-12-05

### Fixed
- **Organizer Data Not Displaying**: Fixed organizer field showing "Not specified" when data exists in Supabase
  - Updated sanitization to check `metadata.organizer_name` field from API response
  - Updated JavaScript to check `event.metadata.organizer_name` when populating modal
  - Organizer name now correctly displays from Supabase metadata

## [1.2.8.1] - 2025-12-05

### Fixed
- **Google Maps API Key Error**: Removed hardcoded invalid API key from map embeds
  - Changed from `maps/embed/v1/place?key=...` (requires API key) to public embed URL format
  - Now uses `maps?q=...&output=embed` which works without an API key
  - Maps will now display correctly without requiring Google Maps API key configuration

## [1.2.8.0] - 2025-12-05

### Added
- **New Shortcode Parameters** for enhanced event filtering:
  - `days_back` - Show events from last N days (e.g., `days_back="30"` for last month)
  - `start_date` - Filter by specific start date (YYYY-MM-DD or ISO 8601 format)
  - `end_date` - Filter by specific end date (YYYY-MM-DD or ISO 8601 format)
  - `location` - Filter by location/venue area (partial text match)
  - `organizer` - Filter by organizer name (partial text match)
  - `offset` - Pagination offset for skipping N events
- **Client-Side Filtering**: Location and organizer filters work via client-side filtering when API doesn't support them directly
- **Enhanced Documentation**: Added examples and usage instructions for all new parameters in Shortcodes documentation tab

### Examples
```php
// Show events from last 30 days
[localplus_events days_back="30" status="published"]

// Date range filter
[localplus_events start_date="2025-12-01" end_date="2025-12-31"]

// Location filter
[localplus_events location="Hua Hin" upcoming="true"]

// Combined filters
[localplus_events days_back="60" location="Hua Hin" category="music" limit="20"]
```

## [1.2.7.4] - 2025-01-06

### Changed
- **Map Display**: Changed from link-only to embedded Google Maps iframe
  - Map now displays as an interactive embedded map (300px height)
  - Still includes "Open in Google Maps" link below the map
  - Works with coordinates (preferred) or location search
  - Falls back gracefully if no location data available

## [1.2.7.3] - 2025-01-06

### Changed
- **Modal Body Content**: Removed duplicate date/location info from modal body (now only in blue header)
- **Added Organizer Section**: New organizer field displayed in modal body
- **Added Map Section**: New map section with Google Maps link (uses coordinates if available, or location search)
- Updated event data sanitization to include organizer and venue coordinates
- Improved modal layout with cleaner detail sections

## [1.2.7.2] - 2025-01-06

### Fixed
- **Scrollbar Positioning**: Adjusted scrollbar to match EventOn style
  - Scrollbar now appears on right side of scrollable content area (not entire modal)
  - Changed modal container and content overflow from `hidden` to `visible` to show scrollbar
  - Added custom scrollbar styling (8px width, rounded, hover effects)
  - Added padding-right to modal body to account for scrollbar space

## [1.2.7.1] - 2025-01-06

### Changed
- **Versioning Strategy**: Adopted patch versioning (1.2.7.x) for bug fixes going forward
  - Future bug fixes will use patch versions (1.2.7.2, 1.2.7.3, etc.)
  - Minor versions (1.2.8, 1.2.9) reserved for new features
  - Major versions (1.3.0, 2.0.0) reserved for breaking changes

## [1.2.7] - 2025-01-06

### Fixed
- **Modal Scrolling**: Fixed scrollable content area inside modal
  - Added `min-height: 0` to flex containers to allow proper scrolling
  - Fixed `.localplus-modal-content` and `.localplus-modal-scrollable` overflow settings
  - Ensured modal wrapper allows scrolling with `overflow: visible`
  - Modal content area now properly scrolls independently of body scroll lock

## [1.2.6] - 2025-01-06

### Fixed
- **Modal Visibility Issue**: Move modal to body level to avoid parent container clipping
  - Modal is now automatically moved to `document.body` on initialization
  - Prevents parent containers with `overflow: hidden` from clipping the modal
  - Added viewport visibility checking and parent element debugging
  - Enhanced debugging to check bounding rect and parent overflow/positioning

## [1.2.5] - 2025-01-06

### Fixed
- **Modal Display Debugging**: Added comprehensive debugging and forced inline styles
  - Added console logging to verify modal element exists and check computed styles
  - Force `display: block`, `opacity: 1`, `visibility: visible` via inline styles as fallback
  - Added z-index debugging to identify theme conflicts
  - Fixed description population to use `full_description` field

## [1.2.4] - 2025-01-06

### Fixed
- **Modal Display Issue**: Fixed CSS so `.show` class properly sets `display: block`
  - Removed redundant inline style setting
  - `.show` class now includes `display: block !important`
  - Simplified JavaScript to just add/remove `.show` class

## [1.2.3] - 2025-01-06

### Fixed
- **Lightbox Not Appearing**: Fixed modal display issue
  - Added `display: block` before adding `.show` class
  - Added console logging for debugging
  - Fixed event handlers with proper preventDefault/stopPropagation
  - Added overlay click to close functionality
  - Fixed Escape key handler to check for `.show` class

## [1.2.2] - 2025-01-06

### Fixed
- **Modal Positioning**: Completely redesigned modal to match EventOn structure
  - Fixed positioning with table-cell vertical centering
  - Light gray overlay background (rgba(210, 210, 210, 0.92))
  - Smooth fade-in animations (opacity + translateY)
  - Proper body scroll lock using class-based approach
  - Modal no longer scrolls with page background

### Changed
- **Modal Structure**: Rebuilt to match EventOn's nested wrapper pattern
- **Animation**: Added smooth 0.5s transitions matching EventOn style
- **Body Scroll Lock**: Changed from inline styles to class-based (`localplus-modal-open`)

## [1.2.1] - 2025-01-06

### Fixed
- **Modal Scrolling**: Fixed modal content scrolling - header stays fixed, body scrolls properly
- **Modal Overlay**: Removed dark background overlay for cleaner appearance

### Changed
- **Display Methods**: Replaced `modal="true/false"` with comprehensive `display_method` parameter
  - `eventcard` (default): Slide-down panel
  - `lightbox`: Scrollable modal popup (no overlay)
  - `tooltip`: Hover preview tooltip
  - `singlepage`: WordPress single event page
  - `tiles`, `map`, `slider`: Addon methods (structure ready)

### Added
- **Version Compatibility**: Added WordPress 5.8+ and PHP 7.4+ requirements to plugin header

## [1.2.0] - 2025-01-06

### Added
- **Modal Popup System**: Click any event card to view full details in a beautiful modal
  - Large event image display
  - Full description and all event details
  - Responsive design for mobile devices
  - Keyboard navigation (Escape to close)
  - Accessible with ARIA labels

- **Display Style Options**: New `display` shortcode parameter
  - `grid` (default): Card grid layout
  - `list`: Vertical list with side-by-side image
  - `compact`: Smaller cards with minimal spacing
  - `detailed`: Larger cards with more breathing room

- **Modal Toggle**: New `modal` shortcode parameter
  - `modal="true"` (default): Enables click-to-popup functionality
  - `modal="false"`: Disables modal, cards remain static

### Improved
- **Compact Inline Layout**: Date, time, and location now display inline
  - Reduced vertical space by ~60%
  - Format: "August 2, 2022 • 6:00 PM - 9:00 PM"
  - Location on same line with icon
  - Much more space-efficient card design

- **Event Card Interaction**: Cards are now clickable when modal is enabled
  - Visual "View Details" indicator
  - Smooth hover effects
  - Better user experience for exploring events

### Technical
- Enhanced JavaScript for modal functionality
- Improved CSS for multiple display styles
- Better mobile responsiveness for modal
- Updated shortcode documentation with new parameters

## [1.1.0] - 2025-01-06

### Added
- **Event Formatter Class**: New `LocalPlus_Event_Formatter` class for data sanitization and formatting
  - HTML tag stripping and encoding fixes
  - Timezone-aware date/time formatting
  - Image URL validation with fallback placeholders
  - Location and description sanitization

### Improved
- **Template Design**: Complete redesign of events list template
  - Modern card-based layout with hover effects
  - Responsive grid system (mobile-friendly)
  - Visual badges for "Upcoming" events and event types
  - SVG icons for date and location
  - Improved typography and spacing

- **Data Sanitization**: Comprehensive data cleaning
  - Strips HTML tags from all text fields
  - Fixes encoding issues (HTML entities, corrupted text)
  - Handles missing or invalid data gracefully

- **Date Formatting**: Enhanced date/time display
  - Proper timezone handling using WordPress timezone settings
  - Smart formatting for same-day vs. multi-day events
  - Clear, readable date and time display

- **Image Handling**: Better image fallback system
  - SVG placeholder for missing images
  - JavaScript `onerror` handler for broken image URLs
  - Lazy loading support in frontend JavaScript

- **Error Handling**: Improved error messages
  - Specific error messages for different failure types (401, timeout, connection)
  - User-friendly error display with proper styling
  - Helpful empty state messaging

- **Performance**: Optimization improvements
  - Loading spinner during API calls
  - Conditional asset loading (only when shortcode is used)
  - Lazy loading for images via IntersectionObserver
  - Existing caching system already in place

### Fixed
- **Asset Loading**: Fixed frontend CSS/JS enqueueing to only load when shortcode is used
- **Business Type Filter**: Added support for `businessType` filter in API client

### Technical
- Added frontend CSS and JavaScript files
- Improved code organization with dedicated formatter class
- Better separation of concerns

## [1.0.0] - 2025-01-05

### Added
- Initial release
- API-First architecture (reads/writes via Supabase API)
- Admin UI for event management
- `[localplus_events]` shortcode with multiple parameters
- Template override support (`/themes/yourtheme/localplus/events-list.php`)
- Multisite compatibility
- Settings page for API configuration
- Shortcode documentation page
- Basic event listing and filtering
- Caching system for API responses

