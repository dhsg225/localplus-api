# LocalPlus Events System - Complete Specification

**Status**: Authoritative specification for Events system  
**Architecture**: API-First with Supabase  
**Last Updated**: 2025-12-05

---

## 🚀 1. Architecture — MUST FOLLOW

### ✅ API-First Architecture (Events live in Supabase)

- WordPress **reads** events through the API (display only via shortcode)
- Partner App **creates/edits** events through the API
- No syncing complexities
- WordPress only needs:
  - Shortcodes (already done ✅)
  - Templates (already done ✅)
- **Supabase is the single source of truth**

---

## 📚 2. Core Tables

### `events`
Stores base event info:
- `id` (uuid)
- `title`
- `description`
- `start_time` (timestamptz)
- `end_time` (timestamptz)
- `timezone_id` (text, e.g., 'Asia/Bangkok')
- `location`
- `hero_image_url`
- `is_recurring` (boolean)
- `created_at`
- `updated_at`

### `recurrence_rules`
iCal-style recurrence definition:
- `id` (uuid)
- `event_id` (fk → events.id)
- `frequency` (daily, weekly, monthly, yearly)
- `interval` (every X units)
- `byweekday` (array of weekday ints: 0=Sun, 1=Mon, ..., 6=Sat)
- `bymonthday` (integer: day of month 1-31)
- `bysetpos` (1st, 2nd, 3rd, 4th, -1 for last)
- `until` (timestamp or null)
- `count` (integer or null)
- `exceptions` (array of dates to skip: DATE[])
- `additional_dates` (array of extra occurrences: DATE[])
- `timezone` (text)

**Important**: No occurrence rows stored. Occurrences generated on query.

---

## 🧠 3. Recurrence Rules (Inspired by EventON, but cleaner)

### Support:

#### ✔ Daily
- Every X days

#### ✔ Weekly
- Every X weeks
- Multi-weekday support (Mon, Wed, Fri)

#### ✔ Monthly
- By date (15th)
- By weekday rule (1st Monday)
- Interval support (every 3 months)

#### ✔ Yearly
- Optional, but easy to support

---

## ⏱ 4. End Conditions

Must support all three:

1. **Never ends** (`until` = null, `count` = null)
2. **Ends on date** (`until` = timestamp)
3. **Ends after X occurrences** (`count` = integer)

Internally:
- Use iCal RRULE fields `UNTIL` and `COUNT`
- Only one can be set (mutually exclusive)

---

## ⚡ 5. Recurrence Generation Logic

**Occurrences must not be stored, only generated when queried.**

### API receives:
```
GET /events?start=YYYY-MM-DD&end=YYYY-MM-DD
```

### Steps:
1. Fetch parent events in range
2. For recurring events:
   - Generate occurrences only between `start` and `end`
   - Apply:
     - `UNTIL` limit
     - `COUNT` limit
     - `exceptions`
     - `additional_dates`
3. Return merged results

### Returned occurrences must include:
- `occurrence_id` = `eventID + "-" + date`
- `parent_event` = `eventID`
- All parent event fields (title, description, etc.)
- Adjusted `start_time` and `end_time` for the occurrence

---

## 🏎 6. Performance Requirements

EventON is slow on large recurring events — we must be better.

### Rules:
- ✔ Generate only within requested window (e.g., one month)
- ✔ Cache generated occurrences
  - Cache key = `event_id + date_start + date_end`
- ✔ Rebuild cache when event or rule updates
  - Invalidate & regenerate
- ✔ Timezone-safe calculations
  - Use timezone-aware libraries

---

## 🖥 7. Partner App Event Management (NOT WordPress)

**WordPress is display-only. Event creation/editing happens in the Partner App.**

### Partner App Event Editor Requirements

#### Basic Fields:
- Title
- Description
- Start datetime
- End datetime
- Location
- Featured image
- Status (publish/draft)

#### Recurrence Section:
- `[ ] This event repeats`

When enabled:

**Step 1 — Frequency**
- Repeat: Daily | Weekly | Monthly | Yearly

**Step 2 — Interval**
- Every [ X ] days/weeks/months/years

**Step 3 — Rule Details**

**Weekly:**
- Repeat on: [Mon][Tue][Wed][Thu][Fri][Sat][Sun]

**Monthly:**
- Option A: (•) On day [ 15 ]
- Option B: ( ) On the [ First / Second / Third / Fourth / Last ] [Monday-Sunday]

**Step 4 — End Conditions**
- Ends: (•) Never
- ( ) On [date]
- ( ) After [ X ] occurrences

**Step 5 — Exceptions & Extra Dates**
- Exclude dates: [ multi-date picker ]
- Add additional dates: [ multi-date picker ]

---

## 🌐 8. WordPress Frontend Display

### Shortcode:
```
[localplus_events calendar="true" filters="true"]
```

### Filtering Options (for inspiration from EventON):
- Date
- Event type
- Location
- Keywords
- Partners/businesses
- Custom taxonomies (if needed later)

### View Modes:
- Calendar grid
- List view
- Card view
- Event popup modal
- Map view (later)

---

## 🏗 9. API Requirement Summary

### GET Events
```
GET /events?start=YYYY-MM-DD&end=YYYY-MM-DD
```
Returns expanded occurrences.

### GET Single Event
```
GET /events/{id}
```
Returns parent + rules.

### POST/PUT Event
All data synced from WordPress to Supabase.

### DELETE Event
Cascades recurrence rules.

---

## 🧩 10. Optional Future Enhancements

Cursor should design with these in mind:
- Partner-specific event limits
- Booking/ticketing integration
- Promotion/boost rules
- Multi-category filtering
- Embeddable calendar widget for partners

---

## 🟩 11. Implementation Priority

### Primary tasks:
1. ✅ Build Supabase schema for `events` + `recurrence_rules`
2. ✅ Create recurrence generation module (iCal-style)
3. ✅ Create GET /events API with recurrence expansion & caching
4. ⏳ Update Partner App Event Editor:
   - Add recurrence section to event form
   - Connect to POST/PUT /api/events with recurrence_rules
5. ⏳ WordPress plugin (display only):
   - Shortcode already works ✅
   - Optional: Read-only admin view (not required)

---

## 📌 Notes

- This document is the authoritative specification
- All implementations must follow this spec
- Deviations require explicit approval

