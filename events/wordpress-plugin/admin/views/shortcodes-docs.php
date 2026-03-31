<?php
/**
 * Shortcodes Documentation View
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1><?php _e('LocalPlus Events - Shortcodes', 'localplus-events'); ?></h1>
    <p class="description">
        <strong><?php _e('Plugin Version:', 'localplus-events'); ?></strong> <?php echo esc_html(LOCALPLUS_EVENTS_VERSION); ?>
        <?php if (is_network_admin()) : ?>
            | <a href="<?php echo esc_url(network_admin_url('admin.php?page=localplus-events-network')); ?>"><?php _e('← Back to Network Settings', 'localplus-events'); ?></a>
        <?php else : ?>
            | <a href="<?php echo esc_url(admin_url('admin.php?page=localplus-events-settings')); ?>"><?php _e('← Back to Settings', 'localplus-events'); ?></a>
        <?php endif; ?>
    </p>
    
    <div class="localplus-docs-wrapper" style="display: flex; gap: 20px; margin-top: 20px;">
        <!-- Sidebar Navigation -->
        <div class="localplus-docs-sidebar" style="width: 220px; flex-shrink: 0;">
            <nav class="localplus-docs-nav" style="background: #fff; border: 1px solid #ccd0d4; border-radius: 4px; padding: 10px 0;">
                <a href="#quick-start" class="localplus-docs-nav-item active" data-section="quick-start">
                    <?php _e('Quick Start', 'localplus-events'); ?>
                </a>
                <a href="#basic-usage" class="localplus-docs-nav-item" data-section="basic-usage">
                    <?php _e('Basic Usage', 'localplus-events'); ?>
                </a>
                <a href="#parameters" class="localplus-docs-nav-item" data-section="parameters">
                    <?php _e('Parameters', 'localplus-events'); ?>
                </a>
                <a href="#display-methods" class="localplus-docs-nav-item" data-section="display-methods">
                    <?php _e('Display Methods', 'localplus-events'); ?>
                </a>
                <a href="#examples" class="localplus-docs-nav-item" data-section="examples">
                    <?php _e('Examples', 'localplus-events'); ?>
                </a>
                <a href="#template-customization" class="localplus-docs-nav-item" data-section="template-customization">
                    <?php _e('Template Customization', 'localplus-events'); ?>
                </a>
            </nav>
        </div>
        
        <!-- Main Content Area -->
        <div class="localplus-docs-content" style="flex: 1; max-width: 900px;">
            
            <!-- Quick Start Section -->
            <div id="quick-start" class="localplus-docs-section active" style="background: #fff; padding: 30px; margin-bottom: 20px; border: 1px solid #ccd0d4; border-radius: 4px;">
                <h2 style="margin-top: 0;"><?php _e('Quick Start', 'localplus-events'); ?></h2>
                <ol style="margin-left: 20px; line-height: 1.8;">
                    <li><?php _e('Edit any page or post in WordPress', 'localplus-events'); ?></li>
                    <li><?php _e('Add the shortcode:', 'localplus-events'); ?> <code>[localplus_events]</code></li>
                    <li><?php _e('Publish or update the page', 'localplus-events'); ?></li>
                    <li><?php _e('Events will automatically display from your Supabase API', 'localplus-events'); ?></li>
                </ol>
                <div style="background: #e7f5ff; padding: 15px; border-left: 4px solid #0073aa; margin-top: 20px; border-radius: 4px;">
                    <strong><?php _e('Default Behavior:', 'localplus-events'); ?></strong>
                    <p style="margin: 5px 0 0 0;"><?php _e('Shows 10 published events in a grid layout. Click any card to slide down and view full details.', 'localplus-events'); ?></p>
                </div>
            </div>
            
            <!-- Basic Usage Section -->
            <div id="basic-usage" class="localplus-docs-section" style="display: none; background: #fff; padding: 30px; margin-bottom: 20px; border: 1px solid #ccd0d4; border-radius: 4px;">
                <h2 style="margin-top: 0;"><?php _e('Basic Usage', 'localplus-events'); ?></h2>
                <p><?php _e('Display events on any page or post using the shortcode:', 'localplus-events'); ?></p>
                <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin: 15px 0; border-radius: 4px;">
                    <code style="font-size: 14px;">[localplus_events]</code>
                </div>
                <p><?php _e('This will display 10 published events by default in a grid layout.', 'localplus-events'); ?></p>
                
                <h3 style="margin-top: 30px;"><?php _e('Simple Variations', 'localplus-events'); ?></h3>
                <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin: 15px 0; border-radius: 4px;">
                    <code style="font-size: 14px; display: block; margin-bottom: 10px;">[localplus_events limit="5"]</code>
                    <code style="font-size: 14px; display: block; margin-bottom: 10px;">[localplus_events upcoming="true"]</code>
                    <code style="font-size: 14px; display: block;">[localplus_events display="compact"]</code>
                </div>
            </div>
            
            <!-- Parameters Section -->
            <div id="parameters" class="localplus-docs-section" style="display: none; background: #fff; padding: 30px; margin-bottom: 20px; border: 1px solid #ccd0d4; border-radius: 4px;">
                <h2 style="margin-top: 0;"><?php _e('Available Parameters', 'localplus-events'); ?></h2>
                
                <table class="wp-list-table widefat fixed striped" style="margin-top: 15px;">
                    <thead>
                        <tr>
                            <th style="width: 20%;"><?php _e('Parameter', 'localplus-events'); ?></th>
                            <th style="width: 25%;"><?php _e('Values', 'localplus-events'); ?></th>
                            <th style="width: 15%;"><?php _e('Default', 'localplus-events'); ?></th>
                            <th><?php _e('Description', 'localplus-events'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>limit</code></td>
                            <td><?php _e('Number', 'localplus-events'); ?></td>
                            <td><code>10</code></td>
                            <td><?php _e('Number of events to display', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>status</code></td>
                            <td><code>published</code>, <code>draft</code>, <code>cancelled</code></td>
                            <td><code>published</code></td>
                            <td><?php _e('Filter by event status', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>category</code></td>
                            <td><code>music</code>, <code>festival</code>, <code>wellness</code>, <code>food</code>, <code>sports</code>, <code>general</code></td>
                            <td><?php _e('(all)', 'localplus-events'); ?></td>
                            <td><?php _e('Filter by event type/category', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>business_type</code></td>
                            <td><code>event_organiser</code>, <code>restaurant</code>, <code>hotel</code>, etc.</td>
                            <td><?php _e('(all)', 'localplus-events'); ?></td>
                            <td><?php _e('Filter by business type', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>upcoming</code></td>
                            <td><code>true</code>, <code>false</code></td>
                            <td><code>false</code></td>
                            <td><?php _e('Show only upcoming events (from today onwards)', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>days_back</code></td>
                            <td><?php _e('Number', 'localplus-events'); ?></td>
                            <td><?php _e('(none)', 'localplus-events'); ?></td>
                            <td><?php _e('Show events from last N days (e.g., 30 for last month)', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>start_date</code></td>
                            <td><code>YYYY-MM-DD</code> <?php _e('or', 'localplus-events'); ?> <code>ISO 8601</code></td>
                            <td><?php _e('(none)', 'localplus-events'); ?></td>
                            <td><?php _e('Show events starting from this date', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>end_date</code></td>
                            <td><code>YYYY-MM-DD</code> <?php _e('or', 'localplus-events'); ?> <code>ISO 8601</code></td>
                            <td><?php _e('(none)', 'localplus-events'); ?></td>
                            <td><?php _e('Show events up to this date', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>location</code></td>
                            <td><?php _e('Text string', 'localplus-events'); ?></td>
                            <td><?php _e('(all)', 'localplus-events'); ?></td>
                            <td><?php _e('Filter by location/venue area (partial match)', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>organizer</code></td>
                            <td><?php _e('Text string', 'localplus-events'); ?></td>
                            <td><?php _e('(all)', 'localplus-events'); ?></td>
                            <td><?php _e('Filter by organizer name (partial match)', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>offset</code></td>
                            <td><?php _e('Number', 'localplus-events'); ?></td>
                            <td><code>0</code></td>
                            <td><?php _e('Pagination offset (skip N events)', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>sort_by</code></td>
                            <td><code>start_time</code>, <code>title</code>, <code>event_type</code>, <code>status</code>, <code>location</code>, <code>created_at</code></td>
                            <td><code>start_time</code></td>
                            <td><?php _e('Column to sort by', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>sort_order</code></td>
                            <td><code>asc</code>, <code>desc</code></td>
                            <td><code>asc</code></td>
                            <td><?php _e('Sort direction (ascending or descending)', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>display</code></td>
                            <td><code>grid</code>, <code>list</code>, <code>compact</code>, <code>detailed</code></td>
                            <td><code>grid</code></td>
                            <td><?php _e('Display style: grid (cards), list (vertical), compact (smaller cards), detailed (larger cards)', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>display_method</code></td>
                            <td><code>slide-down</code>, <code>lightbox</code>, <code>gridview</code>, <code>daily</code>, <code>weekly</code>, <code>table-week</code>, <code>yearly</code>, <code>tooltip</code>, <code>singlepage</code>, <code>map</code>, <code>slider</code></td>
                            <td><code>slide-down</code></td>
                            <td><?php _e('How events are displayed: slide-down (panel expands), lightbox (modal popup), gridview (tile layout), daily (daily calendar), weekly (weekly grid), table-week (table format), yearly (year calendar), tooltip (hover preview), singlepage (WordPress page), map/slider (require addons).', 'localplus-events'); ?></td>
                        </tr>
                        <tr>
                            <td><code>columns</code></td>
                            <td><code>0</code> (auto), <code>1</code>-<code>6</code></td>
                            <td><code>0</code></td>
                            <td><?php _e('Number of columns in grid layout. 0 = auto/responsive (default), 1-6 = fixed number of columns. On mobile, always shows 1 column regardless of setting.', 'localplus-events'); ?></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Display Methods Section -->
            <div id="display-methods" class="localplus-docs-section" style="display: none; background: #fff; padding: 30px; margin-bottom: 20px; border: 1px solid #ccd0d4; border-radius: 4px;">
                <h2 style="margin-top: 0;"><?php _e('Display Methods', 'localplus-events'); ?></h2>
                <p><?php _e('Control how event details are shown when users interact with event cards:', 'localplus-events'); ?></p>
                
                <div style="margin-top: 25px;">
                    <h3 style="color: #0073aa; margin-bottom: 15px;"><?php _e('Slide-Down (Default)', 'localplus-events'); ?></h3>
                    <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin-bottom: 20px; border-radius: 4px;">
                        <code>[localplus_events display_method="slide-down"]</code>
                    </div>
                    <p><?php _e('Click any event card to slide down a panel showing full event details. This is the default behavior. The panel expands below the card with a smooth animation.', 'localplus-events'); ?></p>
                </div>
                
                <div style="margin-top: 25px;">
                    <h3 style="color: #0073aa; margin-bottom: 15px;"><?php _e('Gridview (Tile View)', 'localplus-events'); ?></h3>
                    <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin-bottom: 20px; border-radius: 4px;">
                        <code>[localplus_events display_method="gridview" grid_count="3" grid_height="250" grid_bg="1" grid_style="1"]</code>
                    </div>
                    <p><?php _e('Displays events in a tile/grid layout with large background images or colors. Perfect for visual event showcases. Tiles open in a lightbox modal when clicked.', 'localplus-events'); ?></p>
                    <ul style="margin: 15px 0; padding-left: 25px;">
                        <li><strong>grid_count</strong>: Number of tiles per row (1-4, default: 3)</li>
                        <li><strong>grid_height</strong>: Height of tiles in pixels (default: 250)</li>
                        <li><strong>grid_bg</strong>: Background type (1 = use event image, 0 = use event color, default: 1)</li>
                        <li><strong>grid_style</strong>: Style variant (1-4, default: 1)
                            <ul style="margin-top: 8px; padding-left: 20px;">
                                <li>Style 1: Full details overlay with title, subtitle, time, location</li>
                                <li>Style 2: Title and subtitle overlay</li>
                                <li>Style 3: Details right of date</li>
                                <li>Style 4: Bare minimal - just title overlay</li>
                            </ul>
                        </li>
                    </ul>
                </div>
                
                <div style="margin-top: 25px;">
                    <h3 style="color: #0073aa; margin-bottom: 15px;"><?php _e('Lightbox Popup', 'localplus-events'); ?></h3>
                    <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin-bottom: 20px; border-radius: 4px;">
                        <code>[localplus_events display_method="lightbox"]</code>
                    </div>
                    <p><?php _e('Click any event card to open a scrollable modal popup with full event details. No dark overlay background.', 'localplus-events'); ?></p>
                </div>
                
                <div style="margin-top: 25px;">
                    <h3 style="color: #0073aa; margin-bottom: 15px;"><?php _e('Tooltip Preview', 'localplus-events'); ?></h3>
                    <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin-bottom: 20px; border-radius: 4px;">
                        <code>[localplus_events display_method="tooltip"]</code>
                    </div>
                    <p><?php _e('Hover over any event card to see a quick preview tooltip with basic event information.', 'localplus-events'); ?></p>
                </div>
                
                <div style="margin-top: 25px;">
                    <h3 style="color: #0073aa; margin-bottom: 15px;"><?php _e('Single Event Page', 'localplus-events'); ?></h3>
                    <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin-bottom: 20px; border-radius: 4px;">
                        <code>[localplus_events display_method="singlepage"]</code>
                    </div>
                    <p><?php _e('Click the event title to navigate to a WordPress single event page. Requires custom page template setup.', 'localplus-events'); ?></p>
                </div>
                
                <div style="margin-top: 25px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                    <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px;"><?php _e('Addon Methods (Require Addons)', 'localplus-events'); ?></h3>
                    <p style="margin-bottom: 10px;"><strong><?php _e('Tiles:', 'localplus-events'); ?></strong> <code>display_method="tiles"</code> - <?php _e('Tile layout with card/lightbox on click (Requires Tiles Addon)', 'localplus-events'); ?></p>
                    <p style="margin-bottom: 10px;"><strong><?php _e('Map:', 'localplus-events'); ?></strong> <code>display_method="map"</code> - <?php _e('Interactive map with clickable pins (Requires Maps Addon)', 'localplus-events'); ?></p>
                    <p><strong><?php _e('Slider:', 'localplus-events'); ?></strong> <code>display_method="slider"</code> - <?php _e('Carousel slider with card/lightbox on click (Requires Slider Addon)', 'localplus-events'); ?></p>
                </div>
            </div>
            
            <!-- Examples Section -->
            <div id="examples" class="localplus-docs-section" style="display: none; background: #fff; padding: 30px; margin-bottom: 20px; border: 1px solid #ccd0d4; border-radius: 4px;">
                <h2 style="margin-top: 0;"><?php _e('Usage Examples', 'localplus-events'); ?></h2>
                
                <h3 style="margin-top: 25px;"><?php _e('Filtering Examples', 'localplus-events'); ?></h3>
                <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin: 15px 0; border-radius: 4px;">
                    <code style="font-size: 14px; display: block; margin-bottom: 10px;">[localplus_events business_type="event_organiser"]</code>
                    <code style="font-size: 14px; display: block; margin-bottom: 10px;">[localplus_events category="music" limit="5"]</code>
                    <code style="font-size: 14px; display: block;">[localplus_events upcoming="true" status="published"]</code>
                    <p style="margin: 5px 0 0 0;"><?php _e('Shows only upcoming published events.', 'localplus-events'); ?></p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: #0073aa; margin-bottom: 10px;"><?php _e('Example: Events from Last 30 Days', 'localplus-events'); ?></h4>
                    <code style="font-size: 14px; display: block;">[localplus_events days_back="30" status="published"]</code>
                    <p style="margin: 5px 0 0 0;"><?php _e('Shows published events from the last 30 days.', 'localplus-events'); ?></p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: #0073aa; margin-bottom: 10px;"><?php _e('Example: Date Range', 'localplus-events'); ?></h4>
                    <code style="font-size: 14px; display: block;">[localplus_events start_date="2025-12-01" end_date="2025-12-31"]</code>
                    <p style="margin: 5px 0 0 0;"><?php _e('Shows events in December 2025.', 'localplus-events'); ?></p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: #0073aa; margin-bottom: 10px;"><?php _e('Example: Filter by Location', 'localplus-events'); ?></h4>
                    <code style="font-size: 14px; display: block;">[localplus_events location="Hua Hin" limit="20"]</code>
                    <p style="margin: 5px 0 0 0;"><?php _e('Shows up to 20 events in Hua Hin area.', 'localplus-events'); ?></p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: #0073aa; margin-bottom: 10px;"><?php _e('Example: Filter by Organizer', 'localplus-events'); ?></h4>
                    <code style="font-size: 14px; display: block;">[localplus_events organizer="Italasia" upcoming="true"]</code>
                    <p style="margin: 5px 0 0 0;"><?php _e('Shows upcoming events organized by Italasia.', 'localplus-events'); ?></p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: #0073aa; margin-bottom: 10px;"><?php _e('Example: Combined Filters', 'localplus-events'); ?></h4>
                    <code style="font-size: 14px; display: block;">[localplus_events upcoming="true" status="published"]</code>
                </div>
                
                <h3 style="margin-top: 25px;"><?php _e('Sorting Examples', 'localplus-events'); ?></h3>
                <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin: 15px 0; border-radius: 4px;">
                    <code style="font-size: 14px; display: block; margin-bottom: 10px;">[localplus_events sort_by="start_time" sort_order="asc"]</code>
                    <code style="font-size: 14px; display: block;">[localplus_events sort_by="title" sort_order="desc"]</code>
                </div>
                
                <h3 style="margin-top: 25px;"><?php _e('Display Style Examples', 'localplus-events'); ?></h3>
                <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin: 15px 0; border-radius: 4px;">
                    <code style="font-size: 14px; display: block; margin-bottom: 10px;">[localplus_events display="grid"]</code>
                    <code style="font-size: 14px; display: block; margin-bottom: 10px;">[localplus_events display="list"]</code>
                    <code style="font-size: 14px; display: block; margin-bottom: 10px;">[localplus_events display="compact"]</code>
                    <code style="font-size: 14px; display: block;">[localplus_events display="detailed"]</code>
                </div>
                
                <h3 style="margin-top: 25px;"><?php _e('Combined Example', 'localplus-events'); ?></h3>
                <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin: 15px 0; border-radius: 4px;">
                    <code style="font-size: 14px; display: block; white-space: pre-wrap;">[localplus_events limit="10" status="published" upcoming="true" sort_by="start_time" sort_order="asc" display="grid" display_method="lightbox" columns="3"]</code>
                </div>
                
                <h3 style="margin-top: 25px;"><?php _e('Columns Examples', 'localplus-events'); ?></h3>
                <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #0073aa; margin: 15px 0; border-radius: 4px;">
                    <code style="font-size: 14px; display: block; margin-bottom: 10px;">[localplus_events columns="3"]</code>
                    <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;"><?php _e('Shows exactly 3 columns. Use 1-6 for fixed columns, or 0 (default) for auto/responsive layout.', 'localplus-events'); ?></p>
                </div>
            </div>
            
            <!-- Template Customization Section -->
            <div id="template-customization" class="localplus-docs-section" style="display: none; background: #fff; padding: 30px; margin-bottom: 20px; border: 1px solid #ccd0d4; border-radius: 4px;">
                <h2 style="margin-top: 0;"><?php _e('Template Customization', 'localplus-events'); ?></h2>
                <p><?php _e('You can override the default event display template in your theme:', 'localplus-events'); ?></p>
                <ol style="margin-left: 20px; margin-top: 15px; line-height: 1.8;">
                    <li><?php _e('Create directory:', 'localplus-events'); ?> <code>/themes/yourtheme/localplus/</code></li>
                    <li><?php _e('Copy template file:', 'localplus-events'); ?> <code>events-list.php</code></li>
                    <li><?php _e('Customize the HTML/CSS as needed', 'localplus-events'); ?></li>
                </ol>
                <div style="background: #e7f5ff; padding: 15px; border-left: 4px solid #0073aa; margin-top: 20px; border-radius: 4px;">
                    <strong><?php _e('Note:', 'localplus-events'); ?></strong>
                    <p style="margin: 5px 0 0 0;"><?php _e('The plugin will automatically use your theme template if it exists. This allows you to fully customize the event display to match your theme design.', 'localplus-events'); ?></p>
                </div>
            </div>
            
        </div>
    </div>
</div>

<style>
.localplus-docs-nav {
    position: sticky;
    top: 32px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
}

.localplus-docs-nav-item {
    display: block;
    padding: 12px 20px;
    color: #50575e;
    text-decoration: none;
    border-left: 3px solid transparent;
    transition: all 0.2s ease;
}

.localplus-docs-nav-item:hover {
    background: #f6f7f7;
    color: #2271b1;
    border-left-color: #2271b1;
}

.localplus-docs-nav-item.active {
    background: #f0f6fc;
    color: #2271b1;
    border-left-color: #2271b1;
    font-weight: 600;
}

.localplus-docs-section {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.localplus-docs-content code {
    background: #f0f0f1;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
}

.localplus-docs-content h2 {
    margin-top: 0;
    padding-bottom: 10px;
    border-bottom: 2px solid #f0f0f1;
}

.localplus-docs-content h3 {
    margin-top: 25px;
    color: #0073aa;
}

@media (max-width: 782px) {
    .localplus-docs-wrapper {
        flex-direction: column;
    }
    
    .localplus-docs-sidebar {
        width: 100%;
    }
    
    .localplus-docs-nav {
        position: relative;
        top: 0;
        display: flex;
        overflow-x: auto;
        max-height: none;
    }
    
    .localplus-docs-nav-item {
        white-space: nowrap;
        border-left: none;
        border-bottom: 3px solid transparent;
    }
    
    .localplus-docs-nav-item.active {
        border-left: none;
        border-bottom-color: #2271b1;
    }
}
</style>

<script>
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        const navItems = document.querySelectorAll('.localplus-docs-nav-item');
        const sections = document.querySelectorAll('.localplus-docs-section');
        
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetSection = this.dataset.section;
                
                // Update nav
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
                
                // Update sections
                sections.forEach(section => {
                    section.style.display = 'none';
                    section.classList.remove('active');
                });
                
                const target = document.getElementById(targetSection);
                if (target) {
                    target.style.display = 'block';
                    target.classList.add('active');
                    
                    // Scroll to top of content
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    });
})();
</script>
