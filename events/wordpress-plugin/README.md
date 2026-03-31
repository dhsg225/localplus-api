# LocalPlus Event Engine WordPress Plugin

WordPress interface for LocalPlus Event Engine. Reads and writes events via Supabase API.

## Architecture

- **API-First**: Supabase is the source of truth
- **No Custom Post Types**: Events are not stored in WordPress
- **Lightweight Caching**: Optional JSON transients for performance
- **Template Override**: Standard WordPress pattern

## Installation

1. Copy the `wordpress-plugin` folder to your WordPress plugins directory:
   ```
   /wp-content/plugins/localplus-event-engine/
   ```

2. Activate the plugin in WordPress admin

3. Go to **LocalPlus Events > Settings** and configure:
   - API URL: `https://api.localplus.city`
   - API Key: Your Supabase API key

## Usage

### Shortcode

Display events on any page or post:

```
[localplus_events]
[localplus_events limit="10" status="published"]
[localplus_events business_type="event_organiser" category="music"]
[localplus_events upcoming="true" sort_by="start_time" sort_order="asc"]
```

**Parameters:**
- `limit` - Number of events to display (default: 10)
- `status` - Filter by status: published, draft, cancelled (default: published)
- `category` - Filter by event type: music, festival, wellness, food, sports, general
- `business_type` - Filter by business type: event_organiser, restaurant, hotel, etc.
- `upcoming` - Show only upcoming events: true/false (default: false)
- `sort_by` - Sort column: start_time, title, event_type, status, location, created_at
- `sort_order` - Sort direction: asc, desc (default: asc)

### Template Override

Override the default template in your theme:

1. Create directory: `/themes/yourtheme/localplus/`
2. Copy template: `events-list.php`
3. Customize as needed

The plugin will automatically use your theme template.

### Admin Interface

- **All Events**: View and manage events from Supabase
- **Add New**: Create new events (saved to Supabase)
- **Settings**: Configure API connection

## File Structure

```
localplus-event-engine/
├── localplus-event-engine.php (main plugin file)
├── includes/
│   ├── class-api-client.php (Supabase API client)
│   ├── class-admin-ui.php (Admin interface)
│   ├── class-shortcode.php (Shortcode handler)
│   ├── class-template-renderer.php (Template system)
│   └── class-settings.php (Settings page)
├── admin/
│   └── views/
│       ├── events-list.php (Admin list view)
│       └── event-form.php (Add/edit form)
└── public/
    └── templates/
        └── events-list.php (Default frontend template)
```

## Development

### Testing

1. Create a demo page in WordPress
2. Add shortcode: `[localplus_events]`
3. Verify events display correctly
4. Test admin interface for create/edit/delete

### API Endpoints Used

- `GET /api/events` - List events
- `GET /api/events/{id}` - Get single event
- `POST /api/events` - Create event
- `PUT /api/events/{id}` - Update event
- `DELETE /api/events/{id}` - Delete event

## Notes

- Events are stored in Supabase, not WordPress
- No custom post types are created
- Caching is optional and can be disabled
- All data comes from API in real-time

