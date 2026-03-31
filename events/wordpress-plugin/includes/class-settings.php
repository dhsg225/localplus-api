<?php
/**
 * Settings Page for LocalPlus Events
 * 
 * Handles plugin settings and API configuration
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

class LocalPlus_Settings {
    
    /**
     * Constructor
     */
    public function __construct() {
        // Network admin settings (multisite only)
        if (is_multisite()) {
            add_action('network_admin_menu', array($this, 'add_network_settings_page'));
            add_action('network_admin_edit_localplus_events_network_settings', array($this, 'save_network_settings'));
        }
        
        // Site-level settings
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * Add settings page
     */
    public function add_settings_page() {
        add_submenu_page(
            'localplus-events',
            __('Settings', 'localplus-events'),
            __('Settings', 'localplus-events'),
            'manage_options',
            'localplus-events-settings',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Add network settings page (multisite only)
     */
    public function add_network_settings_page() {
        add_menu_page(
            __('LocalPlus Events', 'localplus-events'),
            __('LocalPlus Events', 'localplus-events'),
            'manage_network_options',
            'localplus-events-network',
            array($this, 'render_network_settings_page'),
            'dashicons-calendar-alt',
            30
        );
        
        // Add Shortcodes submenu to network admin
        add_submenu_page(
            'localplus-events-network',
            __('Shortcodes', 'localplus-events'),
            __('Shortcodes', 'localplus-events'),
            'manage_network_options',
            'localplus-events-shortcodes',
            array($this, 'render_shortcodes_docs')
        );
    }
    
    /**
     * Render shortcodes documentation page (for network admin)
     */
    public function render_shortcodes_docs() {
        include LOCALPLUS_EVENTS_PLUGIN_DIR . 'admin/views/shortcodes-docs.php';
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        // Only register per-site settings if not using network settings
        if (!is_multisite() || !get_site_option('localplus_events_use_network_settings', false)) {
            register_setting('localplus_events_settings', 'localplus_events_api_url');
            register_setting('localplus_events_settings', 'localplus_events_api_key');
            register_setting('localplus_events_settings', 'localplus_events_cache_enabled');
            register_setting('localplus_events_settings', 'localplus_events_cache_duration');
        }
    }
    
    /**
     * Render network settings page
     */
    public function render_network_settings_page() {
        if (isset($_POST['localplus_network_settings_submit'])) {
            check_admin_referer('localplus_network_settings');
            
            update_site_option('localplus_events_api_url', sanitize_text_field($_POST['localplus_events_api_url']));
            update_site_option('localplus_events_api_key', sanitize_text_field($_POST['localplus_events_api_key']));
            update_site_option('localplus_events_cache_enabled', isset($_POST['localplus_events_cache_enabled']) ? 1 : 0);
            update_site_option('localplus_events_cache_duration', intval($_POST['localplus_events_cache_duration']));
            update_site_option('localplus_events_use_network_settings', isset($_POST['localplus_events_use_network_settings']) ? 1 : 0);
            
            echo '<div class="notice notice-success"><p>' . __('Network settings saved.', 'localplus-events') . '</p></div>';
        }
        
        $use_network = get_site_option('localplus_events_use_network_settings', false);
        ?>
        <div class="wrap">
            <h1><?php _e('LocalPlus Events Network Settings', 'localplus-events'); ?></h1>
            <p class="description">
                <?php _e('Configure API settings for all sites in the network. Individual sites can override these settings if "Use Network Settings" is disabled.', 'localplus-events'); ?>
                <br>
                <strong><?php _e('Plugin Version:', 'localplus-events'); ?></strong> <?php echo esc_html(LOCALPLUS_EVENTS_VERSION); ?>
                | <a href="<?php echo esc_url(network_admin_url('admin.php?page=localplus-events-shortcodes')); ?>"><?php _e('View Shortcodes Documentation', 'localplus-events'); ?></a>
            </p>
            
            <form method="post" action="">
                <?php wp_nonce_field('localplus_network_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="localplus_events_use_network_settings"><?php _e('Use Network Settings', 'localplus-events'); ?></label>
                        </th>
                        <td>
                            <input type="checkbox" 
                                   id="localplus_events_use_network_settings" 
                                   name="localplus_events_use_network_settings" 
                                   value="1" 
                                   <?php checked($use_network, 1); ?>>
                            <p class="description"><?php _e('If enabled, all sites will use these network settings. If disabled, each site can configure its own settings.', 'localplus-events'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="localplus_events_api_url"><?php _e('API URL', 'localplus-events'); ?></label>
                        </th>
                        <td>
                            <input type="url" 
                                   id="localplus_events_api_url" 
                                   name="localplus_events_api_url" 
                                   value="<?php echo esc_attr(get_site_option('localplus_events_api_url', 'https://api.localplus.city')); ?>" 
                                   class="regular-text" 
                                   required>
                            <p class="description"><?php _e('Base URL for LocalPlus API (e.g., https://api.localplus.city)', 'localplus-events'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="localplus_events_api_key"><?php _e('API Key', 'localplus-events'); ?></label>
                        </th>
                        <td>
                            <input type="password" 
                                   id="localplus_events_api_key" 
                                   name="localplus_events_api_key" 
                                   value="<?php echo esc_attr(get_site_option('localplus_events_api_key', '')); ?>" 
                                   class="regular-text" 
                                   required>
                            <p class="description"><?php _e('API key for authenticating with LocalPlus API', 'localplus-events'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="localplus_events_cache_enabled"><?php _e('Enable Caching', 'localplus-events'); ?></label>
                        </th>
                        <td>
                            <input type="checkbox" 
                                   id="localplus_events_cache_enabled" 
                                   name="localplus_events_cache_enabled" 
                                   value="1" 
                                   <?php checked(get_site_option('localplus_events_cache_enabled', true), 1); ?>>
                            <p class="description"><?php _e('Cache events for better performance', 'localplus-events'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="localplus_events_cache_duration"><?php _e('Cache Duration (seconds)', 'localplus-events'); ?></label>
                        </th>
                        <td>
                            <input type="number" 
                                   id="localplus_events_cache_duration" 
                                   name="localplus_events_cache_duration" 
                                   value="<?php echo esc_attr(get_site_option('localplus_events_cache_duration', 300)); ?>" 
                                   min="60" 
                                   step="60" 
                                   class="small-text">
                            <p class="description"><?php _e('How long to cache events (default: 300 seconds / 5 minutes)', 'localplus-events'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(__('Save Network Settings', 'localplus-events'), 'primary', 'localplus_network_settings_submit'); ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Save network settings (handled in render_network_settings_page for simplicity)
     */
    public function save_network_settings() {
        // Handled inline in render_network_settings_page
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        $use_network = is_multisite() && get_site_option('localplus_events_use_network_settings', false);
        
        if ($use_network) {
            ?>
            <div class="wrap">
                <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
                <p class="description">
                    <strong><?php _e('Plugin Version:', 'localplus-events'); ?></strong> <?php echo esc_html(LOCALPLUS_EVENTS_VERSION); ?>
                    | <a href="<?php echo esc_url(admin_url('admin.php?page=localplus-events-shortcodes')); ?>"><?php _e('View Shortcodes Documentation', 'localplus-events'); ?></a>
                </p>
                <div class="notice notice-info">
                    <p><?php _e('This site is using network-wide settings. To change settings, contact your network administrator or go to Network Admin > LocalPlus Events.', 'localplus-events'); ?></p>
                </div>
                <p>
                    <strong><?php _e('Current Network Settings:', 'localplus-events'); ?></strong><br>
                    <?php _e('API URL:', 'localplus-events'); ?> <?php echo esc_html(get_site_option('localplus_events_api_url', 'https://api.localplus.city')); ?><br>
                    <?php _e('Caching:', 'localplus-events'); ?> <?php echo get_site_option('localplus_events_cache_enabled', true) ? __('Enabled', 'localplus-events') : __('Disabled', 'localplus-events'); ?>
                </p>
            </div>
            <?php
            return;
        }
        
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <p class="description">
                <strong><?php _e('Plugin Version:', 'localplus-events'); ?></strong> <?php echo esc_html(LOCALPLUS_EVENTS_VERSION); ?>
                | <a href="<?php echo esc_url(admin_url('admin.php?page=localplus-events-shortcodes')); ?>"><?php _e('View Shortcodes Documentation', 'localplus-events'); ?></a>
            </p>
            
            <?php if (is_multisite()) : ?>
                <div class="notice notice-warning">
                    <p><?php _e('Note: Network settings are available. You can configure site-specific settings here, or use network settings in Network Admin.', 'localplus-events'); ?></p>
                </div>
            <?php endif; ?>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('localplus_events_settings');
                do_settings_sections('localplus_events_settings');
                ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="localplus_events_api_url"><?php _e('API URL', 'localplus-events'); ?></label>
                        </th>
                        <td>
                            <input type="url" 
                                   id="localplus_events_api_url" 
                                   name="localplus_events_api_url" 
                                   value="<?php echo esc_attr(get_option('localplus_events_api_url', 'https://api.localplus.city')); ?>" 
                                   class="regular-text" 
                                   required>
                            <p class="description"><?php _e('Base URL for LocalPlus API (e.g., https://api.localplus.city)', 'localplus-events'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="localplus_events_api_key"><?php _e('API Key', 'localplus-events'); ?></label>
                        </th>
                        <td>
                            <input type="password" 
                                   id="localplus_events_api_key" 
                                   name="localplus_events_api_key" 
                                   value="<?php echo esc_attr(get_option('localplus_events_api_key', '')); ?>" 
                                   class="regular-text" 
                                   required>
                            <p class="description"><?php _e('API key for authenticating with LocalPlus API', 'localplus-events'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="localplus_events_cache_enabled"><?php _e('Enable Caching', 'localplus-events'); ?></label>
                        </th>
                        <td>
                            <input type="checkbox" 
                                   id="localplus_events_cache_enabled" 
                                   name="localplus_events_cache_enabled" 
                                   value="1" 
                                   <?php checked(get_option('localplus_events_cache_enabled', true), 1); ?>>
                            <p class="description"><?php _e('Cache events for better performance', 'localplus-events'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="localplus_events_cache_duration"><?php _e('Cache Duration (seconds)', 'localplus-events'); ?></label>
                        </th>
                        <td>
                            <input type="number" 
                                   id="localplus_events_cache_duration" 
                                   name="localplus_events_cache_duration" 
                                   value="<?php echo esc_attr(get_option('localplus_events_cache_duration', 300)); ?>" 
                                   min="60" 
                                   step="60" 
                                   class="small-text">
                            <p class="description"><?php _e('How long to cache events (default: 300 seconds / 5 minutes)', 'localplus-events'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <hr>
            
            <h2><?php _e('Clear Cache', 'localplus-events'); ?></h2>
            <p><?php _e('Clear all cached events data.', 'localplus-events'); ?></p>
            <form method="post" action="">
                <?php wp_nonce_field('localplus_clear_cache'); ?>
                <input type="hidden" name="localplus_action" value="clear_cache">
                <?php submit_button(__('Clear Cache', 'localplus-events'), 'secondary'); ?>
            </form>
        </div>
        <?php
        
        // Handle cache clear
        if (isset($_POST['localplus_action']) && $_POST['localplus_action'] === 'clear_cache') {
            check_admin_referer('localplus_clear_cache');
            $api_client = new LocalPlus_API_Client();
            $api_client->clear_cache();
            echo '<div class="notice notice-success"><p>' . __('Cache cleared successfully.', 'localplus-events') . '</p></div>';
        }
    }
}

