# WordPress Plugin Version - Event Engine

**Date:** January 6, 2025  
**Status:** ✅ **ARCHITECTURE DECIDED** - API-First, Supabase as source of truth

---

## ✅ **FINAL ARCHITECTURE DECISION**

**Decision:** **API-First Architecture - Supabase is the source of truth**

### **Core Principles:**
- ✅ Events live in Supabase
- ✅ WordPress is only a consumer + admin interface via API
- ✅ No syncing between systems for MVP
- ✅ WordPress is NOT the source of truth
- ✅ System flow: `Partner App → Supabase → WordPress`

### **What WordPress Does:**
- ✅ Reads + writes events via API only
- ✅ Provides admin UI (event list, filters, edits)
- ✅ Uses shortcode to display events in posts/pages
- ✅ Allows template overriding (standard WP pattern)

### **What WordPress Does NOT Do:**
- ❌ Store full events as custom post type
- ❌ Sync taxonomies, image uploads, or metadata into WP
- ❌ Become the primary data layer
- ❌ Duplicate event data

### **Caching Strategy:**
- Lightweight JSON caching allowed for performance
- No full custom post types
- Cache can be cleared/refreshed on demand

---

## 🏗️ **Architecture Approach**

### **1. Plugin Structure**

```
localplus-event-engine/
├── localplus-event-engine.php (main plugin file)
├── includes/
│   ├── class-api-client.php (Supabase API client)
│   ├── class-event-manager.php (CRUD operations)
│   ├── class-sync-manager.php (optional sync logic)
│   └── class-admin-ui.php (WordPress admin interface)
├── admin/
│   ├── views/
│   │   ├── events-list.php
│   │   ├── event-edit.php
│   │   └── settings.php
│   └── assets/
│       ├── css/admin.css
│       └── js/admin.js
├── public/
│   ├── shortcodes/
│   │   └── events-list.php
│   ├── templates/
│   │   └── event-card.php
│   └── assets/
│       ├── css/frontend.css
│       └── js/frontend.js
└── uninstall.php
```

### **2. WordPress Integration Points**

#### **Custom Post Type (Optional)**
- Create `localplus_event` custom post type
- Use post meta to store Supabase event ID
- Allows WordPress-native features (search, categories, etc.)
- **Note:** If using API-first, this is just a "mirror" for WordPress features

#### **REST API Endpoints**
```php
// WordPress REST API endpoints
/wp-json/localplus/v1/events          // List events
/wp-json/localplus/v1/events/{id}     // Get single event
/wp-json/localplus/v1/events/sync     // Trigger sync (admin only)
```

#### **WordPress Hooks to Leverage**
- `save_post` - Sync when WordPress post is saved
- `wp_insert_post` - Create event in Supabase
- `delete_post` - Delete event from Supabase
- `rest_api_init` - Register custom REST endpoints
- `admin_menu` - Add admin menu items
- `admin_enqueue_scripts` - Load admin assets

---

## 📊 **Data Model (API-Only)**

### **No WordPress Storage - All Data from API**

Events are fetched from Supabase API and displayed directly. No mapping to WordPress tables.

**Data Structure (from API):**
```json
{
  "id": "uuid",
  "title": "Event Title",
  "description": "Event description",
  "start_time": "2025-01-15T18:00:00Z",
  "end_time": "2025-01-15T20:00:00Z",
  "status": "published|draft|cancelled|completed",
  "event_type": "music|festival|wellness|food|sports|general",
  "location": "Venue Name",
  "venue_area": "Hua Hin",
  "venue_latitude": 12.5684,
  "venue_longitude": 99.9578,
  "hero_image_url": "https://...",
  "metadata": {
    "organizer_name": "...",
    "organizer_address": "..."
  }
}
```

### **Optional Lightweight Cache**
- Store JSON in WordPress transients (5-15 min TTL)
- Cache key: `localplus_events_{hash_of_filters}`
- Clear cache on admin actions (create/update/delete)

---

## 🔌 **API Integration**

### **Authentication Strategy (Finalized)**

**Server-Side API Key + Tokens**
- WordPress uses server-side API key (stored in plugin settings)
- All API calls use service account or API key
- Partners in Partner App use Supabase Auth (separate system)
- No sync needed between WP users and partners
- **Future:** Optional "Login with LocalPlus Partner" feature

### **API Client Implementation**

```php
class LocalPlus_API_Client {
    private $supabase_url;
    private $supabase_key;
    
    public function get_events($filters = []) {
        // Call GET /api/events with filters
    }
    
    public function create_event($event_data) {
        // Call POST /api/events
    }
    
    public function update_event($event_id, $updates) {
        // Call PUT /api/events/{id}
    }
    
    public function delete_event($event_id) {
        // Call DELETE /api/events/{id}
    }
}
```

---

## 🎨 **Admin UI Integration**

### **WordPress Admin Menu**

```
LocalPlus Events
├── All Events (list view with filters)
├── Add New Event (creates via API)
├── Settings (API configuration)
```

### **List View Features**
- Table similar to SuperuserEventsDashboard
- Clickable column headers for sorting (Title, Date & Time, Category, Status, Location, Organizer, Created)
- Filters: Status, Category, Business Type, Date Range
- Bulk actions: Publish, Draft, Delete (via API)
- Quick edit inline
- All data fetched from API in real-time

### **Edit View Features**
- Custom form (not WordPress editor)
- Fields:
  - Title
  - Description (rich text)
  - Date/Time picker
  - Location (with map picker)
  - Event Type selector
  - Organizer details
  - Recurrence settings
- Save button → API call → Refresh list
- Delete button → API call → Remove from list

---

## 🎭 **Frontend Display**

### **Shortcodes**

```php
[localplus_events]                                    // List all events
[localplus_events business_type="event_organiser"]   // Filter by business type
[localplus_events limit="10"]                        // Limit results
[localplus_events category="music"]                   // Filter by category
[localplus_events upcoming="true"]                   // Upcoming only
[localplus_events status="published"]                // Published only
```

### **Template System**
- Standard WordPress template override pattern
- Override in theme: `/themes/yourtheme/localplus/events-list.php`
- Default template in plugin: `/templates/events-list.php`
- Template receives events array from API
- Theme can customize HTML/CSS completely

### **Business Types Support**
- Filter by business type: `business_type="event_organiser"`
- Only event organisers can create events (enforced in API)
- Business types: restaurant, hotel, event_organiser, service_provider, tourism_provider, retail, health_wellness, education, entertainment

---

## 🔄 **No Sync Strategy (API-First)**

### **Real-time API Calls**
- WordPress always reads from Supabase API
- No sync needed - Supabase is the source of truth
- All writes go directly to API

### **Caching Strategy (Optional Performance Optimization)**
```php
// Lightweight JSON cache (5-15 minutes)
$cache_key = 'localplus_events_' . md5(serialize($filters));
$events = get_transient($cache_key);
if (false === $events) {
    $events = $api_client->get_events($filters);
    set_transient($cache_key, $events, 5 * MINUTE_IN_SECONDS);
}
// Clear cache on create/update/delete
delete_transient($cache_key);
```

---

## 🔐 **Permissions & Security**

### **WordPress Capabilities**
- `manage_localplus_events` - Full access
- `edit_localplus_events` - Edit events
- `publish_localplus_events` - Publish events
- `delete_localplus_events` - Delete events

### **API Security**
- Encrypt Supabase keys in database
- Use WordPress nonces for admin actions
- Sanitize all user inputs
- Validate API responses

---

## 📱 **Mobile App Integration**

### **Current State**
- Mobile apps already use Supabase API
- No changes needed to mobile apps
- WordPress plugin just adds another interface

### **Future Enhancements**
- WordPress can trigger mobile push notifications
- WordPress can schedule social media posts
- WordPress can generate event QR codes

---

## 🚀 **Implementation Phases**

### **Phase 1: MVP (Current Focus)**
1. ✅ Plugin structure setup
2. ✅ API wrapper class (Supabase client)
3. ✅ Admin list view (read from API)
4. ✅ Admin edit view (create/update via API)
5. ✅ Basic shortcode `[localplus_events]`
6. ✅ Basic template renderer
7. ✅ Settings page (API configuration)

### **Phase 2: Enhanced Admin**
1. ✅ Clickable column headers for sorting
2. ✅ Advanced filters (Status, Category, Business Type)
3. ✅ Bulk actions (Publish, Draft, Delete)
4. ✅ Quick edit inline
5. ✅ Business type filtering

### **Phase 3: Frontend Enhancements**
1. ✅ Template override system
2. ✅ Multiple shortcode parameters
3. ✅ Event detail view
4. ✅ Calendar view (optional)
5. ✅ Search functionality

### **Phase 4: Performance & Polish**
1. ✅ Caching optimization
2. ✅ Loading states
3. ✅ Error handling
4. ✅ Documentation

---

## 🧪 **Testing Strategy**

### **Demo Page Setup**
- Create test WordPress site
- Install plugin
- Create test events via API
- Display events on demo page
- Test admin interface
- Test shortcodes

### **Test Scenarios**
1. Create event in WordPress → Verify in Supabase
2. Update event in WordPress → Verify in Supabase
3. Delete event in WordPress → Verify in Supabase
4. Create event in Supabase → Verify in WordPress (if sync)
5. Test filters and sorting
6. Test frontend display

---

## ✅ **Decisions Finalized**

1. ✅ **API-Only** - No custom post types, no WordPress storage
2. ✅ **Server-Side API Key** - Simple authentication for MVP
3. ✅ **Real-time API Calls** - No sync needed
4. ✅ **Lightweight Caching** - Optional JSON transients for performance
5. ✅ **Business Types** - Account for partner business types system
6. ✅ **Template Override** - Standard WordPress pattern

---

## 📝 **Next Steps (Implementation)**

1. ✅ **Create plugin skeleton** - Basic file structure
2. ✅ **Create API wrapper class** - Supabase client
3. ✅ **Render event list in admin** - Table view with API data
4. ✅ **Create shortcode** - `[localplus_events]` with parameters
5. ✅ **Basic template renderer** - Default template + override system
6. ✅ **Settings page** - API configuration
7. ✅ **Test with demo page** - Once shortcode works

---

## 🔗 **Related Files**

- `/events/schema.sql` - Database schema
- `/events/route.js` - API endpoints
- `/events/ARCHITECTURE_DECISION.md` - Current architecture
- `/events/all/route.js` - Superuser endpoints

---

**Ready for discussion!** 🎉

