# LocalPlus Events v1.2.10 - Premium Weekly View Update

## 🎉 What's New

### 1. **Today Filter** (`today="true"`)
Beta tester feedback requested a way to show only today's events. We've implemented:

**Shortcode Usage:**
```
[localplus_events today="true"]
```

**How it works:**
- Automatically sets `startDate` to today at 00:00:00
- Sets `endDate` to today at 23:59:59
- Uses WordPress site's local timezone (via `wp_date()`)
- Shows events that started this morning, even if they've already finished

**Example Use Cases:**
- "What's On Today" sidebar widgets
- Daily event digest pages
- Homepage "Today's Events" sections

---

### 2. **Ascending/Descending Sort Order**
The API now properly respects the `sortOrder` parameter:

**API Changes:**
- `sortOrder=asc` (default) - Events sorted earliest to latest
- `sortOrder=desc` - Events sorted latest to earliest

**Shortcode Usage:**
```
[localplus_events sort_order="asc"]
[localplus_events sort_order="desc"]
```

---

### 3. **Premium Weekly View** (EventOn-Inspired)

We've completely redesigned the weekly calendar view to match EventOn's premium aesthetic:

#### **Speed Scroller Dropdown**
- Click the dropdown icon next to the week range
- Jump to any week instantly (shows 8 weeks: 2 past, current, 5 future)
- Smooth scrolling with header/footer arrows
- Active week is highlighted

#### **Quick Glance Indicators**
- Up to 3 colored dots appear under each day in the header
- Dots match the `theme_color_hex` of events on that day
- Gives users a visual "heat map" of event activity

#### **Premium Header Design**
- Vibrant gradient background (purple/blue)
- Glassmorphism effects with backdrop blur
- Large, bold week range display
- Smooth hover animations on navigation buttons

#### **Colorful Event Cards**
- Each event card has a colored left border matching its `theme_color_hex`
- Hover effects with smooth transitions
- Clean, modern typography
- Time displayed in uppercase with event color

#### **Responsive Design**
- Desktop: 7-column grid
- Mobile: Stacked single-column with date headers
- Smooth transitions between breakpoints

---

## 📦 Deployment Status

### WordPress Plugin (v1.2.10)
- ✅ Deployed to `/var/www/localplus.city/wp-content/plugins/localplus-event-engine/`
- ⚠️ **Action Required**: Deactivate and reactivate the plugin in WordPress Admin to load the new version
- Files updated:
  - `localplus-event-engine.php` (version bump)
  - `includes/class-shortcode.php` (today filter logic)
  - `public/templates/weekly-view.php` (premium redesign)
  - `public/assets/js/calendar-weekly.js` (speed scroller functionality)

### API Backend
- ✅ Deployed to `api.localplus.city`
- Updated `events/route.js` to respect `sortOrder` parameter
- Improved sorting logic with direction multiplier

---

## 🎨 Design Highlights

### Color Palette
- **Primary Gradient**: `#667eea` → `#764ba2` (Purple/Blue)
- **Today Highlight**: `#1976d2` (Material Blue)
- **Event Colors**: Dynamic based on `theme_color_hex` field

### Typography
- **Font Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Week Range**: 1.3em, 700 weight
- **Day Numbers**: 1.8em, 800 weight
- **Event Titles**: 0.9em, 600 weight

### Animations
- Button hover: `scale(1.05)` with 0.3s ease
- Event card hover: `translateX(4px)` with shadow expansion
- Dropdown: Smooth opacity fade-in

---

## 🧪 Testing Recommendations

### Test the Today Filter
1. Create events for yesterday, today, and tomorrow
2. Use `[localplus_events today="true"]` on a test page
3. Verify only today's events appear
4. Check that events are sorted in ascending order by default

### Test the Weekly View
1. Navigate to a page with `[localplus_events display_method="weekly"]`
2. Click the speed scroller dropdown icon
3. Select different weeks and verify smooth navigation
4. Check that the colored dots appear under days with events
5. Hover over event cards to see the smooth animations
6. Test on mobile to verify responsive layout

### Test Sort Order
1. Use `[localplus_events sort_order="desc"]` on a test page
2. Verify events appear in reverse chronological order
3. Test with `sort_order="asc"` to confirm default behavior

---

## 📝 Shortcode Examples

### Today's Events (Ascending)
```
[localplus_events today="true"]
```

### This Week (Premium View)
```
[localplus_events display_method="weekly"]
```

### Upcoming Events (Descending)
```
[localplus_events upcoming="true" sort_order="desc" limit="10"]
```

### Today's Events by Category
```
[localplus_events today="true" category="Music"]
```

---

## 🐛 Known Issues

### Lint Warnings (Non-Critical)
The IDE is reporting "unknown function" warnings for WordPress core functions like `esc_attr()`, `esc_html()`, etc. These are false positives because the linter doesn't have WordPress core loaded. These functions are available at runtime and the code will work correctly.

### Permission Warnings (Deployment)
The deploy script shows "Operation not permitted" warnings when setting file permissions. This is expected on shared hosting environments. The files are deployed successfully, but you may need to manually set permissions via cPanel or SSH if needed.

---

## 🚀 Next Steps

1. **Activate the Plugin**: Go to WordPress Admin → Plugins → Deactivate → Reactivate "LocalPlus Event Engine"
2. **Clear Cache**: If using a caching plugin, clear the cache
3. **Test the Features**: Try the shortcode examples above
4. **Gather Feedback**: Share with beta testers and collect feedback on the new weekly view

---

## 💡 Future Enhancements

Based on EventOn's feature set, we could add:
- **Month View**: Similar premium treatment for monthly calendar
- **List View Filters**: Interactive filter buttons for categories/types
- **Event Search**: Real-time search within the calendar
- **Export Options**: iCal/Google Calendar export buttons
- **AJAX Navigation**: Load new weeks without page refresh
- **Animation Presets**: Different animation styles for event cards

---

**Version**: 1.2.10  
**Release Date**: February 2, 2026  
**Author**: LocalPlus Development Team
