<?php
/**
 * API Client for LocalPlus Event Engine
 * 
 * Handles all communication with Supabase API
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

class LocalPlus_API_Client {
    
    private $api_url;
    private $api_key;
    private $cache_enabled;
    private $cache_duration;
    
    /**
     * Constructor
     */
    public function __construct() {
        // Check if multisite and network settings enabled
        $use_network_settings = is_multisite() && get_site_option('localplus_events_use_network_settings', false);
        
        if ($use_network_settings) {
            // Use network settings
            $this->api_url = get_site_option('localplus_events_api_url', 'https://api.localplus.city');
            $this->api_key = get_site_option('localplus_events_api_key', '');
            $this->cache_enabled = get_site_option('localplus_events_cache_enabled', true);
            $this->cache_duration = get_site_option('localplus_events_cache_duration', 300);
        } else {
            // Use per-site settings (or network defaults if multisite)
            $this->api_url = get_option('localplus_events_api_url', 
                is_multisite() ? get_site_option('localplus_events_api_url', 'https://api.localplus.city') : 'https://api.localplus.city');
            $this->api_key = get_option('localplus_events_api_key', 
                is_multisite() ? get_site_option('localplus_events_api_key', '') : '');
            $this->cache_enabled = get_option('localplus_events_cache_enabled', 
                is_multisite() ? get_site_option('localplus_events_cache_enabled', true) : true);
            $this->cache_duration = get_option('localplus_events_cache_duration', 
                is_multisite() ? get_site_option('localplus_events_cache_duration', 300) : 300);
        }
    }
    
    /**
     * Get events from API
     * 
     * @param array $filters Filter parameters
     * @return array|WP_Error Events array or error
     */
    public function get_events($filters = array()) {
        // Check cache first
        $cache_key = $this->get_cache_key($filters);
        if ($this->cache_enabled) {
            $cached = get_transient($cache_key);
            if (false !== $cached) {
                return $cached;
            }
        }
        
        // Build query string
        $query_params = array();
        if (!empty($filters['status'])) {
            $query_params['status'] = $filters['status'];
        }
        if (!empty($filters['eventType'])) {
            $query_params['eventType'] = $filters['eventType'];
        }
        if (!empty($filters['businessId'])) {
            $query_params['businessId'] = $filters['businessId'];
        }
        if (!empty($filters['businessType'])) {
            $query_params['businessType'] = $filters['businessType'];
        }
        if (!empty($filters['startDate'])) {
            $query_params['startDate'] = $filters['startDate'];
        }
        if (!empty($filters['endDate'])) {
            $query_params['endDate'] = $filters['endDate'];
        }
        if (!empty($filters['onlyUpcoming'])) {
            $query_params['onlyUpcoming'] = 'true';
        }
        if (!empty($filters['limit'])) {
            $query_params['limit'] = intval($filters['limit']);
        }
        if (!empty($filters['offset'])) {
            $query_params['offset'] = intval($filters['offset']);
        }
        if (!empty($filters['sortBy'])) {
            $query_params['sortBy'] = $filters['sortBy'];
        }
        if (!empty($filters['sortOrder'])) {
            $query_params['sortOrder'] = $filters['sortOrder'];
        }
        
        $query_string = !empty($query_params) ? '?' . http_build_query($query_params) : '';
        $url = $this->api_url . '/api/events' . $query_string;
        
        // [2025-01-XX] - Increased timeout to handle recurring event processing
        // Make API request
        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'timeout' => 30, // Increased from 15 to 30 seconds for recurring event processing
            'sslverify' => true,
        ));
        
        // Handle response
        if (is_wp_error($response)) {
            $error_code = $response->get_error_code();
            $error_message = $response->get_error_message();
            
            // [2025-01-XX] - Better error handling for timeout and connection issues
            if ($error_code === 'http_request_failed' || strpos($error_message, 'timeout') !== false) {
                return new WP_Error('api_timeout', 'API request timed out. The server may be processing many events. Please try again or reduce the date range.');
            }
            
            return $response;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (wp_remote_retrieve_response_code($response) !== 200) {
            $error_message = isset($data['error']) ? $data['error'] : 'API request failed';
            return new WP_Error('api_error', $error_message);
        }
        
        // Extract events from response
        $events = isset($data['data']) ? $data['data'] : (is_array($data) ? $data : array());
        
        // Cache the result
        if ($this->cache_enabled) {
            set_transient($cache_key, $events, $this->cache_duration);
        }
        
        return $events;
    }
    
    /**
     * Get single event by ID
     * 
     * @param string $event_id Event ID
     * @return array|WP_Error Event data or error
     */
    public function get_event($event_id) {
        $url = $this->api_url . '/api/events/' . $event_id;
        
        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'timeout' => 30, // [2025-01-XX] - Increased timeout for single event requests
            'sslverify' => true,
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (wp_remote_retrieve_response_code($response) !== 200) {
            $error_message = isset($data['error']) ? $data['error'] : 'API request failed';
            return new WP_Error('api_error', $error_message);
        }
        
        return isset($data['data']) ? $data['data'] : $data;
    }
    
    /**
     * Create new event
     * 
     * @param array $event_data Event data
     * @return array|WP_Error Created event or error
     */
    public function create_event($event_data) {
        $url = $this->api_url . '/api/events';
        
        $response = wp_remote_post($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($event_data),
            'timeout' => 30, // [2025-01-XX] - Increased timeout for event creation
            'sslverify' => true,
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (wp_remote_retrieve_response_code($response) !== 201 && wp_remote_retrieve_response_code($response) !== 200) {
            $error_message = isset($data['error']) ? $data['error'] : 'Failed to create event';
            return new WP_Error('api_error', $error_message);
        }
        
        // Clear cache
        $this->clear_cache();
        
        return isset($data['data']) ? $data['data'] : $data;
    }
    
    /**
     * Update event
     * 
     * @param string $event_id Event ID
     * @param array $updates Event updates
     * @return array|WP_Error Updated event or error
     */
    public function update_event($event_id, $updates) {
        $url = $this->api_url . '/api/events/' . $event_id;
        
        $response = wp_remote_request($url, array(
            'method' => 'PUT',
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($updates),
            'timeout' => 30, // [2025-01-XX] - Increased timeout for event updates
            'sslverify' => true,
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (wp_remote_retrieve_response_code($response) !== 200) {
            $error_message = isset($data['error']) ? $data['error'] : 'Failed to update event';
            return new WP_Error('api_error', $error_message);
        }
        
        // Clear cache
        $this->clear_cache();
        
        return isset($data['data']) ? $data['data'] : $data;
    }
    
    /**
     * Delete event
     * 
     * @param string $event_id Event ID
     * @return bool|WP_Error Success or error
     */
    public function delete_event($event_id) {
        $url = $this->api_url . '/api/events/' . $event_id;
        
        $response = wp_remote_request($url, array(
            'method' => 'DELETE',
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'timeout' => 30, // [2025-01-XX] - Increased timeout for event deletion
            'sslverify' => true,
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        if (wp_remote_retrieve_response_code($response) !== 200 && wp_remote_retrieve_response_code($response) !== 204) {
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            $error_message = isset($data['error']) ? $data['error'] : 'Failed to delete event';
            return new WP_Error('api_error', $error_message);
        }
        
        // Clear cache
        $this->clear_cache();
        
        return true;
    }
    
    /**
     * Get cache key for filters
     * 
     * @param array $filters Filter parameters
     * @return string Cache key
     */
    private function get_cache_key($filters) {
        return 'localplus_events_' . md5(serialize($filters));
    }
    
    /**
     * Clear all cached events
     */
    public function clear_cache() {
        global $wpdb;
        $wpdb->query(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_localplus_events_%'"
        );
        $wpdb->query(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_localplus_events_%'"
        );
    }
}

