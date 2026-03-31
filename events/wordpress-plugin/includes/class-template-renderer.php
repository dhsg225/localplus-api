<?php
/**
 * Template Renderer for LocalPlus Events
 * 
 * Handles template loading with theme override support
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

class LocalPlus_Template_Renderer
{

    /**
     * Render events list
     * 
     * @param array $events Events array
     * @param array $atts Shortcode attributes
     */
    public function render_events_list($events, $atts = array())
    {
        $display_method = isset($atts['display_method']) ? $atts['display_method'] : 'slide-down';

        // [2025-12-06] - Calendar views use different templates
        $calendar_views = array('daily', 'weekly', 'table-week', 'yearly');
        if (in_array($display_method, $calendar_views)) {
            $template_name = $display_method . '-view.php';
            $template = $this->locate_template($template_name);

            if ($template) {
                include $template;
            } else {
                // Use default calendar template
                $default_template = LOCALPLUS_EVENTS_PLUGIN_DIR . 'public/templates/' . $template_name;
                if (file_exists($default_template)) {
                    include $default_template;
                } else {
                    // Fallback to regular list
                    $this->render_events_list($events, array_merge($atts, array('display_method' => 'slide-down')));
                }
            }
            return;
        }

        // Regular list view
        $template = $this->locate_template('events-list.php');

        if ($template) {
            include $template;
        } else {
            // Use default template
            include LOCALPLUS_EVENTS_PLUGIN_DIR . 'public/templates/events-list.php';
        }
    }

    /**
     * Render lightbox modal
     * [2026-02-07] - Unified modal rendering with override support
     */
    public function render_modal()
    {
        if (!isset($GLOBALS['localplus_event_modal_created'])) {
            $GLOBALS['localplus_event_modal_created'] = true;
            $template = $this->locate_template('lightbox-modal.php');
            if ($template) {
                include $template;
            } else {
                include LOCALPLUS_EVENTS_PLUGIN_DIR . 'public/templates/lightbox-modal.php';
            }
        }
    }

    /**
     * Render single event
     * 
     * @param array $event Event data
     */
    public function render_event($event)
    {
        // Look for theme override first
        $template = $this->locate_template('event-single.php');

        if ($template) {
            include $template;
        } else {
            // Use default template
            include LOCALPLUS_EVENTS_PLUGIN_DIR . 'public/templates/event-single.php';
        }
    }

    /**
     * Locate template file (with theme override support)
     * 
     * @param string $template_name Template filename
     * @return string|false Template path or false if not found
     */
    private function locate_template($template_name)
    {
        // Check theme directory first: /themes/yourtheme/localplus/
        $theme_template = locate_template(array(
            'localplus/' . $template_name,
            'localplus-events/' . $template_name,
        ));

        if ($theme_template) {
            return $theme_template;
        }

        // Check plugin templates
        $plugin_template = LOCALPLUS_EVENTS_PLUGIN_DIR . 'public/templates/' . $template_name;
        if (file_exists($plugin_template)) {
            return $plugin_template;
        }

        return false;
    }
}

