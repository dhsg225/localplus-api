# Calendar Views Implementation Plan

**Date**: 2025-12-06  
**Goal**: Add Daily, Weekly, Table Week, and Yearly calendar views similar to EventON

---

## Views to Implement

### 1. **Daily View** (`display_method="daily"`)
**Shortcode**: `[localplus_events display_method="daily"]`

**Features**:
- Large focus date block (selected day prominently displayed)
- Horizontal scrollable days strip below focus block
- Events listed below the days strip
- Navigation arrows to move between days
- Month/year navigator at top
- Event count badge on selected day

**Layout**:
```
[Month/Year Navigator with arrows]
[Large Focus Date Block - Selected Day]
[Horizontal Days Strip - Scrollable]
[Events List for Selected Day]
```

**Parameters**:
- `daily_focus_date` - Initial focus date (default: today)
- `daily_days_strip` - Number of days to show in strip (default: 14)

---

### 2. **Weekly View** (`display_method="weekly"`)
**Shortcode**: `[localplus_events display_method="weekly"]`

**Features**:
- Week grid showing 7 days (Sun-Sat)
- Month navigator/selector
- Events displayed in day cells
- Week navigation (previous/next week)
- Current week indicator
- Event dots/indicators on days with events

**Layout**:
```
[Month/Year Navigator]
[Week Navigation: < Week Range >]
[Week Grid: SUN MON TUE WED THU FRI SAT]
[Events in each day cell]
```

**Parameters**:
- `weekly_start_date` - Start date for week (default: current week)
- `weekly_style` - Style variant (1-3, default: 1)
- `weekly_show_month` - Show month navigator (default: true)

---

### 3. **Table Week View** (`display_method="table-week"`)
**Shortcode**: `[localplus_events display_method="table-week"]`

**Features**:
- Table format with days as columns
- Time slots as rows (optional)
- Events displayed in table cells
- Week navigation
- More compact than weekly view

**Layout**:
```
[Week Navigation]
[Table: Days as columns, events in cells]
```

**Parameters**:
- `table_week_start_date` - Start date for week
- `table_week_style` - Style variant (1-2, default: 1)
- `table_week_time_slots` - Show time slots (default: false)

---

### 4. **Yearly View** (`display_method="yearly"`)
**Shortcode**: `[localplus_events display_method="yearly"]`

**Features**:
- Full year calendar grid (12 months)
- Month blocks showing days
- Event indicators on days
- Year navigation
- Click month to filter/zoom

**Layout**:
```
[Year Navigator: < 2025 >]
[12 Month Grid: Jan Feb Mar ... Dec]
[Each month shows days with event indicators]
```

**Parameters**:
- `yearly_year` - Year to display (default: current year)
- `yearly_style` - Style variant (1-2, default: 1)

---

## Implementation Strategy

### Phase 1: Daily View (Priority 1)
1. Create `daily-view.php` template
2. Add JavaScript for day navigation
3. Add CSS for focus date block and days strip
4. Implement event filtering by selected date

### Phase 2: Weekly View (Priority 2)
1. Create `weekly-view.php` template
2. Add week calculation logic
3. Add month navigator component
4. Implement event grouping by day

### Phase 3: Table Week View (Priority 3)
1. Create `table-week-view.php` template
2. Reuse weekly logic with table layout
3. Add time slot support (optional)

### Phase 4: Yearly View (Priority 4)
1. Create `yearly-view.php` template
2. Add year calculation and month grid
3. Implement event aggregation by month/day
4. Add month click handler

---

## Technical Considerations

### Date Handling
- Use PHP `DateTime` for all date calculations
- Support timezone from event data
- Handle recurring events (show on all occurrences)

### Event Filtering
- Filter events by date range for each view
- Group events by day for weekly/daily views
- Aggregate events for yearly view

### Navigation
- URL parameters for date navigation (e.g., `?date=2025-12-10`)
- JavaScript for client-side navigation
- Preserve other shortcode parameters

### Performance
- Cache date calculations
- Lazy load events for visible dates only
- Paginate yearly view if needed

### Responsive Design
- Mobile: Stack days vertically
- Tablet: Adjust grid columns
- Desktop: Full calendar layout

---

## File Structure

```
wordpress-plugin/
├── public/
│   ├── templates/
│   │   ├── events-list.php (existing)
│   │   ├── daily-view.php (new)
│   │   ├── weekly-view.php (new)
│   │   ├── table-week-view.php (new)
│   │   └── yearly-view.php (new)
│   ├── assets/
│   │   ├── js/
│   │   │   ├── frontend.js (existing - extend)
│   │   │   ├── calendar-daily.js (new)
│   │   │   ├── calendar-weekly.js (new)
│   │   │   └── calendar-yearly.js (new)
│   │   └── css/
│   │       ├── frontend.css (existing - extend)
│   │       ├── calendar-daily.css (new)
│   │       ├── calendar-weekly.css (new)
│   │       └── calendar-yearly.css (new)
```

---

## API Considerations

### Date Range Queries
- Daily: Single day
- Weekly: 7 days
- Table Week: 7 days (same as weekly)
- Yearly: Full year (365 days)

### Event Expansion
- Recurring events need to be expanded for all views
- Cache expanded occurrences
- Filter by date range after expansion

---

## Example Shortcodes

```php
// Daily View
[localplus_events display_method="daily" daily_focus_date="2025-12-10"]

// Weekly View
[localplus_events display_method="weekly" weekly_start_date="2025-12-06"]

// Table Week View
[localplus_events display_method="table-week" table_week_start_date="2025-12-06"]

// Yearly View
[localplus_events display_method="yearly" yearly_year="2025"]
```

---

## Next Steps

1. ✅ Create implementation plan (this document)
2. ⏳ Start with Daily View (simplest, most requested)
3. ⏳ Add Weekly View
4. ⏳ Add Table Week View
5. ⏳ Add Yearly View
6. ⏳ Test all views
7. ⏳ Update documentation

---

## Questions to Resolve

1. Should these be separate shortcodes or display_method options?
   - **Decision**: Use `display_method` for consistency

2. How to handle recurring events in calendar views?
   - **Decision**: Expand occurrences, show on all relevant dates

3. Should calendar views support filtering (status, category, etc.)?
   - **Decision**: Yes, all existing filters should work

4. URL parameters for navigation?
   - **Decision**: Use query params, fallback to JavaScript state

