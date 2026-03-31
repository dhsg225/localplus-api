<?php
/**
 * Plugin Name: LocalPlus Event Engine
 * Plugin URI: https://localplus.city
 * Description: WordPress interface for LocalPlus Event Engine. Reads and writes events via Supabase API.
 * Version: 1.2.25
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: LocalPlus
 * Author URI: https://localplus.city
 * License: MIT
 * Text Domain: localplus-events
 * Domain Path: /languages
 *
 * @package LocalPlus_Event_Engine
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('LOCALPLUS_EVENTS_VERSION', '1.2.25');
define('LOCALPLUS_EVENTS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LOCALPLUS_EVENTS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('LOCALPLUS_EVENTS_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Autoload classes
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-api-client.php';
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-event-formatter.php';
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-admin-ui.php';
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-shortcode.php';
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-template-renderer.php';
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-settings.php';

/**
 * Main plugin class
 */
class LocalPlus_Event_Engine
{

    private static $instance = null;
    private $api_client;
    private $admin_ui;
    private $shortcode;
    private $template_renderer;
    private $settings;

    /**
     * Get singleton instance
     */
    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct()
    {
        $this->init();
    }

    /**
     * Initialize plugin
     */
    private function init()
    {
        // Check for version updates
        $this->check_version_update();

        // Initialize API client
        $this->api_client = new LocalPlus_API_Client();

        // Initialize admin UI
        if (is_admin()) {
            $this->admin_ui = new LocalPlus_Admin_UI($this->api_client);
            $this->settings = new LocalPlus_Settings();
        }

        // Initialize shortcode
        $this->shortcode = new LocalPlus_Shortcode($this->api_client);

        // Initialize template renderer
        $this->template_renderer = new LocalPlus_Template_Renderer();

        // Hooks
        add_action('plugins_loaded', array($this, 'load_textdomain'));
        register_activation_hook(__FILE__, array(__CLASS__, 'activate'));
        register_deactivation_hook(__FILE__, array(__CLASS__, 'deactivate'));
    }

    /**
     * Check for version updates and run migrations if needed
     */
    private function check_version_update()
    {
        $installed_version = get_option('localplus_events_version', '0.0.0');
        $current_version = LOCALPLUS_EVENTS_VERSION;

        if (version_compare($installed_version, $current_version, '<')) {
            // Run update routines
            $this->run_version_update($installed_version, $current_version);

            // Update stored version
            update_option('localplus_events_version', $current_version);

            // For multisite, also update network option if needed
            if (is_multisite() && is_network_admin()) {
                update_site_option('localplus_events_version', $current_version);
            }
        }
    }

    /**
     * Run version-specific update routines
     * 
     * @param string $old_version Previous version
     * @param string $new_version New version
     */
    private function run_version_update($old_version, $new_version)
    {
        // Clear cache on major/minor version updates
        if (version_compare($old_version, '1.1.0', '<')) {
            // Version 1.1.0 update: Clear all caches due to template changes
            if (class_exists('LocalPlus_API_Client')) {
                $api_client = new LocalPlus_API_Client();
                $api_client->clear_cache();
            }
        }

        // Add more version-specific update routines here as needed
        // Example:
        // if (version_compare($old_version, '2.0.0', '<')) {
        //     // Run 2.0.0 migration
        // }
    }

    /**
     * Load plugin textdomain
     */
    public function load_textdomain()
    {
        load_plugin_textdomain(
            'localplus-events',
            false,
            dirname(LOCALPLUS_EVENTS_PLUGIN_BASENAME) . '/languages'
        );
    }

    /**
     * Plugin activation
     * 
     * @param bool $network_wide Whether network-wide activation
     */
    public static function activate($network_wide = false)
    {
        if (is_multisite() && $network_wide) {
            // Network activation
            if (!get_site_option('localplus_events_api_url')) {
                update_site_option('localplus_events_api_url', 'https://api.localplus.city');
            }
            // Set default to use network settings
            update_site_option('localplus_events_use_network_settings', true);
        } else {
            // Single site or per-site activation
            if (!get_option('localplus_events_api_url')) {
                // Use network defaults if multisite, otherwise use default
                $default_url = is_multisite()
                    ? get_site_option('localplus_events_api_url', 'https://api.localplus.city')
                    : 'https://api.localplus.city';
                update_option('localplus_events_api_url', $default_url);
            }
        }

        // Set initial version
        if (is_multisite() && $network_wide) {
            update_site_option('localplus_events_version', LOCALPLUS_EVENTS_VERSION);
        } else {
            update_option('localplus_events_version', LOCALPLUS_EVENTS_VERSION);
        }

        // Clear any existing transients
        self::clear_cache();
    }

    /**
     * Plugin deactivation
     */
    public static function deactivate()
    {
        // Clear cache
        self::clear_cache();
    }

    /**
     * Clear all cached events
     */
    private static function clear_cache()
    {
        global $wpdb;

        if (is_multisite()) {
            // Clear cache for all sites in network
            $sites = get_sites();
            foreach ($sites as $site) {
                switch_to_blog($site->blog_id);
                $wpdb->query(
                    "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_localplus_events_%'"
                );
                $wpdb->query(
                    "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_localplus_events_%'"
                );
                restore_current_blog();
            }
        } else {
            // Single site
            $wpdb->query(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_localplus_events_%'"
            );
            $wpdb->query(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_localplus_events_%'"
            );
        }
    }
}

// Initialize plugin
LocalPlus_Event_Engine::get_instance();

