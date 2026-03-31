<?php
/**
 * Shortcode Handler for LocalPlus Events
 * 
 * Handles [localplus_events] shortcode
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

class LocalPlus_Shortcode
{

    private $api_client;
    private $template_renderer;
    private static $assets_enqueued = false;

    /**
     * Constructor
     */
    public function __construct($api_client)
    {
        $this->api_client = $api_client;
        $this->template_renderer = new LocalPlus_Template_Renderer();

        add_shortcode('localplus_events', array($this, 'render_shortcode'));
    }

    /**
     * Enqueue frontend assets (called from render_shortcode)
     */
    private function enqueue_frontend_assets($atts = array())
    {
        if (self::$assets_enqueued) {
            return;
        }

        wp_enqueue_style(
            'localplus-events-frontend',
            LOCALPLUS_EVENTS_PLUGIN_URL . 'public/assets/css/frontend.css',
            array(),
            LOCALPLUS_EVENTS_VERSION
        );

        wp_enqueue_script(
            'localplus-events-frontend',
            LOCALPLUS_EVENTS_PLUGIN_URL . 'public/assets/js/frontend.js',
            array('jquery'),
            LOCALPLUS_EVENTS_VERSION,
            true
        );

        // [2025-12-06] - Enqueue calendar view scripts if needed
        $display_method = isset($atts['display_method']) ? $atts['display_method'] : 'slide-down';
        $calendar_views = array('daily', 'weekly', 'table-week', 'yearly');
        if (in_array($display_method, $calendar_views)) {
            wp_enqueue_script(
                'localplus-events-calendar-' . $display_method,
                LOCALPLUS_EVENTS_PLUGIN_URL . 'public/assets/js/calendar-' . $display_method . '.js',
                array('jquery', 'localplus-events-frontend'),
                LOCALPLUS_EVENTS_VERSION,
                true
            );
        }

        self::$assets_enqueued = true;
    }

    /**
     * Render shortcode
     * 
     * @param array $atts Shortcode attributes
     * @return string Rendered HTML
     */
    public function render_shortcode($atts)
    {
        // [2025-12-06] - Get date parameters from URL for calendar views
        if (isset($_GET['date']) && !empty($_GET['date'])) {
            $atts['daily_focus_date'] = sanitize_text_field($_GET['date']);
        }
        if (isset($_GET['week_start']) && !empty($_GET['week_start'])) {
            $atts['weekly_start_date'] = sanitize_text_field($_GET['week_start']);
            $atts['table_week_start_date'] = sanitize_text_field($_GET['week_start']);
        }
        if (isset($_GET['table_week_start']) && !empty($_GET['table_week_start'])) {
            $atts['table_week_start_date'] = sanitize_text_field($_GET['table_week_start']);
        }
        if (isset($_GET['year']) && !empty($_GET['year'])) {
            $atts['yearly_year'] = intval($_GET['year']);
        }

        // Parse attributes
        $atts = shortcode_atts(array(
            'limit' => 10,
            'status' => 'published',
            'category' => '',
            'business_type' => '',
            'upcoming' => 'false',
            'days_back' => '', // Show events from last N days
            'start_date' => '', // Specific start date (YYYY-MM-DD or ISO 8601)
            'end_date' => '', // Specific end date (YYYY-MM-DD or ISO 8601)
            'location' => '', // Filter by location/venue area
            'organizer' => '', // Filter by organizer name
            'offset' => 0, // Pagination offset
            'sort_by' => 'start_time',
            'sort_order' => 'asc',
            'display' => 'grid', // grid, list, compact, detailed
            'display_method' => 'slide-down', // slide-down, lightbox, tooltip, singlepage, gridview, daily, weekly, table-week, yearly, map, slider
            'columns' => 0, // Number of columns (0 = auto/responsive, 1-12 = fixed columns)
            'grid_count' => 3, // Gridview: Number of tiles per row (1-4, default 3)
            'grid_height' => 250, // Gridview: Height of tiles in pixels (default 250)
            'grid_bg' => 1, // Gridview: Background type (1 = use event image, 0 = use event color, default 1)
            'grid_style' => 1, // Gridview: Style variant (1-4, default 1)
            'daily_focus_date' => '', // Daily View: Initial focus date (YYYY-MM-DD, default: today)
            'daily_days_strip' => 14, // Daily View: Number of days in strip (default: 14)
            'weekly_start_date' => '', // Weekly View: Start date for week (YYYY-MM-DD, default: current week)
            'weekly_style' => 1, // Weekly View: Style variant (1-3, default: 1)
            'table_week_start_date' => '', // Table Week View: Start date for week (YYYY-MM-DD, default: current week)
            'table_week_style' => 1, // Table Week View: Style variant (1-2, default: 1)
            'yearly_year' => '', // Yearly View: Year to display (default: current year)
            'yearly_style' => 1, // Yearly View: Style variant (1-2, default: 1)
            'today' => 'false', // Show events for today only
            'modal' => 'true', // Deprecated - use display_method instead
        ), $atts, 'localplus_events');

        // Backward compatibility: convert modal to display_method
        if ($atts['modal'] === 'false' && $atts['display_method'] === 'slide-down') {
            $atts['display_method'] = 'none';
        } elseif ($atts['modal'] === 'true' && $atts['display_method'] === 'slide-down') {
            $atts['display_method'] = 'lightbox';
        }
        // Also support old 'eventcard' name for backward compatibility
        if ($atts['display_method'] === 'eventcard') {
            $atts['display_method'] = 'slide-down';
        }

        // Build filters
        $filters = array();

        if (!empty($atts['status'])) {
            $filters['status'] = $atts['status'];
        }

        if (!empty($atts['category'])) {
            $filters['eventType'] = $atts['category'];
        }

        if (!empty($atts['business_type'])) {
            $filters['businessType'] = $atts['business_type'];
        }

        if ($atts['upcoming'] === 'true') {
            $filters['onlyUpcoming'] = true;
            $filters['startDate'] = date('c'); // Current date
        }

        // [2026-02-01] - Today filter
        if ($atts['today'] === 'true') {
            $today = wp_date('Y-m-d');
            $filters['startDate'] = $today . 'T00:00:00';
            $filters['endDate'] = $today . 'T23:59:59';
        }

        // [2025-12-05] - Date range filters (if not already set by 'today')
        if (empty($filters['startDate']) && !empty($atts['days_back'])) {
            // Show events from last N days
            $days = intval($atts['days_back']);
            $start_date = new DateTime();
            $start_date->modify("-{$days} days");
            $filters['startDate'] = $start_date->format('c');
        } elseif (empty($filters['startDate']) && !empty($atts['start_date'])) {
            // Specific start date
            $start_date = new DateTime($atts['start_date']);
            $filters['startDate'] = $start_date->format('c');
        }

        if (empty($filters['endDate']) && !empty($atts['end_date'])) {
            // Specific end date
            $end_date = new DateTime($atts['end_date']);
            $filters['endDate'] = $end_date->format('c');
        }

        // [2025-12-05] - Location filter (client-side filtering if API doesn't support)
        if (!empty($atts['location'])) {
            $filters['location'] = sanitize_text_field($atts['location']);
        }

        // [2025-12-05] - Organizer filter (client-side filtering if API doesn't support)
        if (!empty($atts['organizer'])) {
            $filters['organizer'] = sanitize_text_field($atts['organizer']);
        }

        if (!empty($atts['limit'])) {
            $filters['limit'] = intval($atts['limit']);
        }

        if (!empty($atts['offset'])) {
            $filters['offset'] = intval($atts['offset']);
        }

        if (!empty($atts['sort_by'])) {
            $filters['sortBy'] = $atts['sort_by'];
        }

        if (!empty($atts['sort_order'])) {
            $filters['sortOrder'] = $atts['sort_order'];
        }

        // Add loading state wrapper
        $loading_html = '<div class="localplus-events-loading" style="text-align: center; padding: 40px;">
            <div class="localplus-spinner" style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0073aa; border-radius: 50%; animation: localplus-spin 1s linear infinite;"></div>
            <p style="margin-top: 15px; color: #666;">' . __('Loading events...', 'localplus-events') . '</p>
        </div>';

        // [2025-12-06] - Set date range for calendar views (before API call)
        $display_method = isset($atts['display_method']) ? $atts['display_method'] : 'slide-down';
        if ($display_method === 'daily') {
            $focus_date = isset($atts['daily_focus_date']) && !empty($atts['daily_focus_date'])
                ? $atts['daily_focus_date']
                : date('Y-m-d');
            if (empty($filters['startDate'])) {
                $filters['startDate'] = (new DateTime($focus_date))->format('c');
                $filters['endDate'] = (new DateTime($focus_date))->modify('+1 day')->format('c');
            }
        } elseif ($display_method === 'weekly' || $display_method === 'table-week') {
            $week_start = isset($atts['weekly_start_date']) && !empty($atts['weekly_start_date'])
                ? $atts['weekly_start_date']
                : (isset($atts['table_week_start_date']) && !empty($atts['table_week_start_date'])
                    ? $atts['table_week_start_date']
                    : date('Y-m-d'));
            try {
                $week_start_date = new DateTime($week_start);
                // Allow specific start day or default to Sunday (0)
                $day_of_week = (int) $week_start_date->format('w');
                $week_start_date->modify('-' . $day_of_week . ' days');
                $week_end_date = clone $week_start_date;
                $week_end_date->modify('+7 days'); // End of week (exclusive)

                // Only override if not already fixed by attributes
                if (empty($filters['startDate'])) {
                    $filters['startDate'] = $week_start_date->format('c');
                    $filters['endDate'] = $week_end_date->format('c');
                }
            } catch (Exception $e) {
                // Fallback to current week
                if (empty($filters['startDate'])) {
                    $filters['startDate'] = (new DateTime())->format('c');
                    $filters['endDate'] = (new DateTime())->modify('+7 days')->format('c');
                }
            }
        } elseif ($display_method === 'yearly') {
            $year = isset($atts['yearly_year']) && !empty($atts['yearly_year'])
                ? intval($atts['yearly_year'])
                : (int) date('Y');
            if (empty($filters['startDate'])) {
                $filters['startDate'] = (new DateTime($year . '-01-01'))->format('c');
                $filters['endDate'] = (new DateTime($year . '-12-31'))->modify('+1 day')->format('c');
            }
        }

        // Get events from API
        $events = $this->api_client->get_events($filters);

        // [2025-12-05] - Client-side filtering for location and organizer (if API doesn't support)
        if (!is_wp_error($events) && !empty($events)) {
            if (!empty($filters['location'])) {
                $location_filter = strtolower($filters['location']);
                $events = array_filter($events, function ($event) use ($location_filter) {
                    $event_location = strtolower($event['venue_area'] ?? $event['location'] ?? '');
                    return strpos($event_location, $location_filter) !== false;
                });
                $events = array_values($events); // Re-index array
            }

            if (!empty($filters['organizer'])) {
                $organizer_filter = strtolower($filters['organizer']);
                $events = array_filter($events, function ($event) use ($organizer_filter) {
                    $event_organizer = strtolower($event['metadata']['organizer_name'] ?? $event['organizer_name'] ?? $event['created_by_name'] ?? '');
                    return strpos($event_organizer, $organizer_filter) !== false;
                });
                $events = array_values($events); // Re-index array
            }
        }

        // Handle errors with better messaging
        if (is_wp_error($events)) {
            $error_message = $events->get_error_message();
            $user_message = __('Unable to load events at this time.', 'localplus-events');

            // [2025-01-XX] - Provide more specific error messages including timeout handling
            if (strpos($error_message, '401') !== false || strpos($error_message, 'Unauthorized') !== false) {
                $user_message = __('API authentication failed. Please check your API settings.', 'localplus-events');
            } elseif (strpos($error_message, 'timeout') !== false || strpos($error_message, 'timed out') !== false || strpos($error_message, 'api_timeout') !== false) {
                $user_message = __('The request timed out. This may happen when processing many events. Please try again or reduce the date range.', 'localplus-events');
            } elseif (strpos($error_message, 'connection') !== false) {
                $user_message = __('Unable to connect to the events server. Please check your API URL and try again.', 'localplus-events');
            }

            return '<div class="localplus-events-error" style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 20px 0;">
                <strong>' . __('Error:', 'localplus-events') . '</strong> ' . esc_html($user_message) . '
                <br><small style="color: #666; margin-top: 5px; display: block;">' . esc_html($error_message) . '</small>
            </div>';
        }

        // Enqueue frontend assets
        $this->enqueue_frontend_assets($atts);

        // [2026-02-07] - If it's a calendar view, we MUST render the template even if empty
        // so the user can see the calendar shell and navigate (next/prev week).
        $display_method = isset($atts['display_method']) ? $atts['display_method'] : 'slide-down';
        $calendar_views = array('daily', 'weekly', 'table-week', 'yearly');

        if (empty($events) && !in_array($display_method, $calendar_views)) {
            return '<div class="localplus-events-empty" style="text-align: center; padding: 60px 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0;">
                <svg style="width: 64px; height: 64px; margin: 0 auto 20px; opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p style="font-size: 18px; color: #666; margin: 0;">' . __('No events found.', 'localplus-events') . '</p>
                <p style="font-size: 14px; color: #999; margin: 10px 0 0 0;">' . __('Try adjusting your filters or check back later.', 'localplus-events') . '</p>
            </div>';
        }

        // Sanitize all event data before rendering
        $sanitized_events = array();
        foreach ($events as $event) {
            $sanitized_events[] = $this->sanitize_event_data($event);
        }

        // Render template
        ob_start();
        $this->template_renderer->render_events_list($sanitized_events, $atts);

        // [2026-02-07] - Unified Modal Rendering
        // Always attempt to render the modal if not already created, 
        // as many display methods now rely on it.
        $this->template_renderer->render_modal();

        $output = ob_get_clean();

        // Add spinner animation CSS
        $output .= '<style>
            @keyframes localplus-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>';

        return $output;
    }

    /**
     * Sanitize event data
     * 
     * @param array $event Raw event data
     * @return array Sanitized event data
     */
    private function sanitize_event_data($event)
    {
        require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-event-formatter.php';

        // [2025-12-05] - Extract organizer from metadata if available
        $organizer_name = '';
        if (isset($event['metadata']['organizer_name']) && !empty($event['metadata']['organizer_name'])) {
            $organizer_name = sanitize_text_field($event['metadata']['organizer_name']);
        } elseif (isset($event['organizer_name']) && !empty($event['organizer_name'])) {
            $organizer_name = sanitize_text_field($event['organizer_name']);
        } elseif (isset($event['organizer']) && !empty($event['organizer'])) {
            $organizer_name = sanitize_text_field($event['organizer']);
        } elseif (isset($event['created_by_name']) && !empty($event['created_by_name'])) {
            $organizer_name = sanitize_text_field($event['created_by_name']);
        }

        return array(
            'id' => isset($event['id']) ? sanitize_text_field($event['id']) : '',
            'title' => LocalPlus_Event_Formatter::sanitize_title($event['title'] ?? ''),
            'subtitle' => LocalPlus_Event_Formatter::sanitize_title($event['subtitle'] ?? ''),
            'description' => LocalPlus_Event_Formatter::sanitize_description($event['description'] ?? '', 150),
            'full_description' => LocalPlus_Event_Formatter::sanitize_description($event['description'] ?? '', 0),
            'start_time' => $event['start_time'] ?? '',
            'end_time' => $event['end_time'] ?? '',
            'location' => LocalPlus_Event_Formatter::sanitize_location($event['location'] ?? ''),
            'venue_area' => LocalPlus_Event_Formatter::sanitize_location($event['venue_area'] ?? ''),
            'hero_image_url' => LocalPlus_Event_Formatter::get_image_url($event['hero_image_url'] ?? ''),
            'event_type' => sanitize_text_field($event['event_type'] ?? 'general'),
            'event_type_names' => isset($event['event_type_names']) ? sanitize_text_field($event['event_type_names']) : null, // [2025-12-06] - Resolved category names from API
            'status' => sanitize_text_field($event['status'] ?? 'published'),
            'timezone_id' => $event['timezone_id'] ?? null,
            'organizer' => $organizer_name,
            'organizer_name' => $organizer_name, // [2025-12-05] - Also include as organizer_name for JavaScript compatibility
            'metadata' => isset($event['metadata']) ? $event['metadata'] : array(), // [2025-12-05] - Include metadata for JavaScript access
            'venue_latitude' => isset($event['venue_latitude']) ? floatval($event['venue_latitude']) : (isset($event['latitude']) ? floatval($event['latitude']) : null),
            'venue_longitude' => isset($event['venue_longitude']) ? floatval($event['venue_longitude']) : (isset($event['longitude']) ? floatval($event['longitude']) : (isset($event['lng']) ? floatval($event['lng']) : null)),
        );
    }
}

