<?php
/**
 * Event Data Formatter and Sanitizer
 * 
 * Handles data cleaning, formatting, and sanitization for events
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

class LocalPlus_Event_Formatter {
    
    /**
     * Sanitize event title
     * 
     * @param string $title Event title
     * @return string Cleaned title
     */
    public static function sanitize_title($title) {
        if (empty($title)) {
            return '';
        }
        
        // Decode HTML entities
        $title = html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        // Strip HTML tags
        $title = wp_strip_all_tags($title);
        
        // Fix common encoding issues
        $title = self::fix_encoding($title);
        
        // Trim whitespace
        $title = trim($title);
        
        return $title;
    }
    
    /**
     * Sanitize event description
     * 
     * @param string $description Event description
     * @param int $max_length Maximum length (0 for no limit)
     * @return string Cleaned description
     */
    public static function sanitize_description($description, $max_length = 0) {
        if (empty($description)) {
            return '';
        }
        
        // Decode HTML entities
        $description = html_entity_decode($description, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        // Strip HTML tags but preserve line breaks
        $description = wp_strip_all_tags($description);
        
        // Fix common encoding issues
        $description = self::fix_encoding($description);
        
        // Clean up multiple spaces and line breaks
        $description = preg_replace('/\s+/', ' ', $description);
        $description = trim($description);
        
        // Truncate if needed
        if ($max_length > 0 && mb_strlen($description) > $max_length) {
            $description = mb_substr($description, 0, $max_length) . '...';
        }
        
        return $description;
    }
    
    /**
     * Format event date/time
     * 
     * @param string $start_time Start time (ISO 8601)
     * @param string $end_time End time (ISO 8601)
     * @param string $timezone Timezone (optional)
     * @return array Formatted date strings
     */
    public static function format_datetime($start_time, $end_time, $timezone = null) {
        try {
            // Use WordPress timezone if not provided
            if (!$timezone) {
                $timezone = wp_timezone_string();
            }
            
            // Create DateTime objects with timezone
            $start = new DateTime($start_time, new DateTimeZone('UTC'));
            $end = new DateTime($end_time, new DateTimeZone('UTC'));
            
            // Convert to site timezone
            $wp_timezone = new DateTimeZone($timezone);
            $start->setTimezone($wp_timezone);
            $end->setTimezone($wp_timezone);
            
            // Check if same day
            $same_day = $start->format('Y-m-d') === $end->format('Y-m-d');
            
            if ($same_day) {
                // Same day: "January 15, 2025 6:00 PM - 8:00 PM"
                $date_format = 'F j, Y';
                $time_format = 'g:i A';
                return array(
                    'date' => $start->format($date_format),
                    'time' => $start->format($time_format) . ' - ' . $end->format($time_format),
                    'full' => $start->format($date_format) . ' ' . $start->format($time_format) . ' - ' . $end->format($time_format),
                    'start' => $start,
                    'end' => $end
                );
            } else {
                // Different days: "January 15, 2025 6:00 PM - January 16, 2025 8:00 PM"
                $date_format = 'F j, Y';
                $time_format = 'g:i A';
                return array(
                    'date' => $start->format($date_format) . ' - ' . $end->format($date_format),
                    'time' => $start->format($time_format) . ' - ' . $end->format($time_format),
                    'full' => $start->format($date_format) . ' ' . $start->format($time_format) . ' - ' . $end->format($date_format) . ' ' . $end->format($time_format),
                    'start' => $start,
                    'end' => $end
                );
            }
        } catch (Exception $e) {
            // Fallback to simple format
            return array(
                'date' => date('F j, Y', strtotime($start_time)),
                'time' => date('g:i A', strtotime($start_time)) . ' - ' . date('g:i A', strtotime($end_time)),
                'full' => date('F j, Y g:i A', strtotime($start_time)) . ' - ' . date('F j, Y g:i A', strtotime($end_time)),
                'start' => new DateTime($start_time),
                'end' => new DateTime($end_time)
            );
        }
    }
    
    /**
     * Get image URL with fallback
     * 
     * @param string $image_url Image URL
     * @param string $fallback_type Type of fallback ('placeholder', 'none')
     * @return string Image URL or placeholder
     */
    public static function get_image_url($image_url, $fallback_type = 'placeholder') {
        if (!empty($image_url) && filter_var($image_url, FILTER_VALIDATE_URL)) {
            return $image_url;
        }
        
        if ($fallback_type === 'placeholder') {
            // Return a placeholder image URL (you can customize this)
            return 'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14" fill="#999">No Image Available</text></svg>');
        }
        
        return '';
    }
    
    /**
     * Fix common encoding issues
     * 
     * @param string $text Text to fix
     * @return string Fixed text
     */
    private static function fix_encoding($text) {
        // Fix common HTML entity issues
        $text = str_replace('&nbsp;', ' ', $text);
        $text = str_replace('&amp;', '&', $text);
        $text = str_replace('&quot;', '"', $text);
        $text = str_replace('&#39;', "'", $text);
        
        // Fix corrupted text patterns (like ?????????)
        $text = preg_replace('/\?{3,}/', '', $text);
        
        // Remove HTML tags that might have been missed
        $text = preg_replace('/<[^>]+>/', '', $text);
        
        // Fix double-encoded entities
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        return $text;
    }
    
    /**
     * Sanitize location string
     * 
     * @param string $location Location string
     * @return string Cleaned location
     */
    public static function sanitize_location($location) {
        if (empty($location)) {
            return '';
        }
        
        $location = html_entity_decode($location, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $location = wp_strip_all_tags($location);
        $location = self::fix_encoding($location);
        $location = trim($location);
        
        return $location;
    }
    
    /**
     * Check if event is upcoming
     * 
     * @param string $start_time Event start time
     * @return bool True if event is in the future
     */
    public static function is_upcoming($start_time) {
        try {
            $event_time = new DateTime($start_time);
            $now = new DateTime('now', wp_timezone());
            return $event_time > $now;
        } catch (Exception $e) {
            return false;
        }
    }
}

