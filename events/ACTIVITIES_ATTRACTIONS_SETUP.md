# Activities & Attractions Business Types Setup

## Overview
Added two new business types to support DMO (Destination Marketing Organization) management:
- **Activities**: Tourism activities (tours, water sports, adventure activities) - typically have business entities
- **Attractions**: Tourist attractions (beaches, parks, viewpoints) - may NOT have business entities (DMO managed)

## What Was Added

### 1. Business Types
- `activities` - Tourism activities with business entities
- `attractions` - Tourist attractions managed by DMO (may not have business entities)

### 2. Menu Items

#### Activities Menus:
- **Activities Management** (`/activities`) - Manage tourism activities and experiences
- **Bookings** (`/activity-bookings`) - View and manage activity bookings
- **Packages** (`/activity-packages`) - Create and manage activity packages
- **Availability** (`/activity-availability`) - Manage activity schedules

#### Attractions Menus:
- **DMO Dashboard** (`/dmo-dashboard`) - Destination Marketing Organization overview
- **Attractions Management** (`/attractions`) - Manage tourist attractions and landmarks
- **Content** (`/attractions-content`) - Manage attraction descriptions, photos, and content
- **Locations** (`/attractions-locations`) - Manage attraction locations and maps
- Also includes: Events, Venues, Locations, Taxonomy, Admin (for DMO management)

### 3. Business Type Tags (Sub-types)

#### Activities Tags:
- Water Sports (snorkeling, diving, kayaking, paddleboarding)
- Adventure (hiking, zip-lining, rock climbing, ATV tours)
- Tours (city tours, cultural tours, food tours)
- Experiences (cooking classes, workshops, cultural experiences)

#### Attractions Tags:
- Beaches (beaches and coastal areas)
- Parks (national parks, nature parks, gardens)
- Viewpoints (scenic viewpoints and observation points)
- Landmarks (historical landmarks and monuments)
- Natural (waterfalls, caves, etc.)
- Cultural (cultural sites and heritage locations)

## Setup Instructions

1. **Run the SQL script in Supabase SQL Editor:**
   ```sql
   -- File: localplus-api/events/add-activities-attractions-business-types.sql
   ```

2. **Verify the setup:**
   ```sql
   -- Check business types were added
   SELECT key, name, icon, color FROM business_types 
   WHERE key IN ('activities', 'attractions');
   
   -- Check menu items were added
   SELECT key, label, route FROM menu_items 
   WHERE key LIKE 'activity%' OR key LIKE 'attraction%' OR key = 'dmo-dashboard';
   
   -- Check menu mappings
   SELECT bt.name, mi.label, btm.is_required
   FROM business_type_menus btm
   JOIN business_types bt ON bt.id = btm.business_type_id
   JOIN menu_items mi ON mi.id = btm.menu_item_id
   WHERE bt.key IN ('activities', 'attractions')
   ORDER BY bt.name, btm.sort_order;
   ```

## DMO Use Case

The **Attractions** business type is designed for DMO management where:
- Attractions may not have business entities (e.g., public beaches, parks)
- DMO staff can manage content, locations, and events for attractions
- Attractions can be linked to events, venues, and locations
- Taxonomy system allows categorization of attractions

## Next Steps

1. **Create frontend pages for:**
   - `/activities` - Activities management dashboard
   - `/attractions` - Attractions management dashboard
   - `/dmo-dashboard` - DMO overview dashboard
   - `/activity-bookings`, `/activity-packages`, `/activity-availability`
   - `/attractions-content`, `/attractions-locations`

2. **Consider creating database tables:**
   - `activities` table (similar to `events` table)
   - `attractions` table (for DMO-managed attractions without business entities)

3. **Update Navigation component** to handle new menu items

4. **Assign business types to partners:**
   - Assign `activities` to activity providers
   - Assign `attractions` to DMO accounts

## Notes

- Attractions can exist without business entities (DMO managed)
- Activities typically have business entities (activity providers)
- Both can use the events, venues, and locations system
- Taxonomy system supports categorization for both

