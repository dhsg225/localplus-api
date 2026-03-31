<?php
/**
 * Admin UI for LocalPlus Events
 * 
 * Handles admin interface for managing events
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

class LocalPlus_Admin_UI {
    
    private $api_client;
    
    /**
     * Constructor
     */
    public function __construct($api_client) {
        $this->api_client = $api_client;
        
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('LocalPlus Events', 'localplus-events'),
            __('LocalPlus Events', 'localplus-events'),
            'manage_options',
            'localplus-events',
            array($this, 'render_events_list'),
            'dashicons-calendar-alt',
            30
        );
        
        add_submenu_page(
            'localplus-events',
            __('All Events', 'localplus-events'),
            __('All Events', 'localplus-events'),
            'manage_options',
            'localplus-events',
            array($this, 'render_events_list')
        );
        
        add_submenu_page(
            'localplus-events',
            __('Add New Event', 'localplus-events'),
            __('Add New', 'localplus-events'),
            'manage_options',
            'localplus-events-add',
            array($this, 'render_event_form')
        );
        
        add_submenu_page(
            'localplus-events',
            __('Shortcodes', 'localplus-events'),
            __('Shortcodes', 'localplus-events'),
            'manage_options',
            'localplus-events-shortcodes',
            array($this, 'render_shortcodes_docs')
        );
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'localplus-events') === false) {
            return;
        }
        
        wp_enqueue_style(
            'localplus-events-admin',
            LOCALPLUS_EVENTS_PLUGIN_URL . 'admin/assets/css/admin.css',
            array(),
            LOCALPLUS_EVENTS_VERSION
        );
        
        wp_enqueue_script(
            'localplus-events-admin',
            LOCALPLUS_EVENTS_PLUGIN_URL . 'admin/assets/js/admin.js',
            array('jquery'),
            LOCALPLUS_EVENTS_VERSION,
            true
        );
    }
    
    /**
     * Render events list page
     */
    public function render_events_list() {
        // Handle actions
        if (isset($_GET['action']) && isset($_GET['event_id'])) {
            $this->handle_event_action($_GET['action'], $_GET['event_id']);
        }
        
        // Get filters from URL
        $filters = array(
            'status' => isset($_GET['status']) ? sanitize_text_field($_GET['status']) : '',
            'eventType' => isset($_GET['event_type']) ? sanitize_text_field($_GET['event_type']) : '',
            'sortBy' => isset($_GET['sort_by']) ? sanitize_text_field($_GET['sort_by']) : 'start_time',
            'sortOrder' => isset($_GET['sort_order']) ? sanitize_text_field($_GET['sort_order']) : 'asc',
            'limit' => 50,
            'offset' => isset($_GET['paged']) ? (intval($_GET['paged']) - 1) * 50 : 0,
        );
        
        // Get events
        $events = $this->api_client->get_events($filters);
        
        // Include view
        include LOCALPLUS_EVENTS_PLUGIN_DIR . 'admin/views/events-list.php';
    }
    
    /**
     * Render event form (add/edit)
     */
    public function render_event_form() {
        $event_id = isset($_GET['event_id']) ? sanitize_text_field($_GET['event_id']) : null;
        $event = null;
        
        if ($event_id) {
            $event = $this->api_client->get_event($event_id);
            if (is_wp_error($event)) {
                wp_die($event->get_error_message());
            }
        }
        
        // Handle form submission
        if (isset($_POST['localplus_event_submit'])) {
            $this->handle_event_save($event_id);
        }
        
        include LOCALPLUS_EVENTS_PLUGIN_DIR . 'admin/views/event-form.php';
    }
    
    /**
     * Render shortcodes documentation page
     */
    public function render_shortcodes_docs() {
        include LOCALPLUS_EVENTS_PLUGIN_DIR . 'admin/views/shortcodes-docs.php';
    }
    
    /**
     * Handle event action (delete, etc.)
     */
    private function handle_event_action($action, $event_id) {
        check_admin_referer('localplus_event_action_' . $event_id);
        
        if ($action === 'delete') {
            $result = $this->api_client->delete_event($event_id);
            if (is_wp_error($result)) {
                add_settings_error('localplus_events', 'delete_error', $result->get_error_message(), 'error');
            } else {
                add_settings_error('localplus_events', 'delete_success', __('Event deleted successfully.', 'localplus-events'), 'success');
            }
        }
        
        wp_redirect(admin_url('admin.php?page=localplus-events'));
        exit;
    }
    
    /**
     * Handle event save
     */
    private function handle_event_save($event_id) {
        check_admin_referer('localplus_event_save');
        
        $event_data = array(
            'title' => sanitize_text_field($_POST['title']),
            'description' => wp_kses_post($_POST['description']),
            'start_time' => sanitize_text_field($_POST['start_time']),
            'end_time' => sanitize_text_field($_POST['end_time']),
            'status' => sanitize_text_field($_POST['status']),
            'event_type' => sanitize_text_field($_POST['event_type']),
            'location' => sanitize_text_field($_POST['location']),
            'venue_area' => sanitize_text_field($_POST['venue_area']),
            'venue_latitude' => isset($_POST['venue_latitude']) ? floatval($_POST['venue_latitude']) : null,
            'venue_longitude' => isset($_POST['venue_longitude']) ? floatval($_POST['venue_longitude']) : null,
        );
        
        if ($event_id) {
            $result = $this->api_client->update_event($event_id, $event_data);
        } else {
            $result = $this->api_client->create_event($event_data);
        }
        
        if (is_wp_error($result)) {
            add_settings_error('localplus_events', 'save_error', $result->get_error_message(), 'error');
        } else {
            $message = $event_id ? __('Event updated successfully.', 'localplus-events') : __('Event created successfully.', 'localplus-events');
            add_settings_error('localplus_events', 'save_success', $message, 'success');
            wp_redirect(admin_url('admin.php?page=localplus-events'));
            exit;
        }
    }
}

