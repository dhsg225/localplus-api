<?php
/**
 * Default Events List Template
 * 
 * This template can be overridden in your theme:
 * /themes/yourtheme/localplus/events-list.php
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract events from template variables
$events = isset($events) ? $events : array();
$atts = isset($atts) ? $atts : array();
$display_style = isset($atts['display']) ? $atts['display'] : 'grid';
$display_method = isset($atts['display_method']) ? $atts['display_method'] : 'slide-down';
$columns = isset($atts['columns']) ? intval($atts['columns']) : 0; // 0 = auto (responsive)

// Gridview parameters
$grid_count = isset($atts['grid_count']) ? max(1, min(4, intval($atts['grid_count']))) : 3; // 1-4 tiles per row
$grid_height = isset($atts['grid_height']) ? intval($atts['grid_height']) : 250; // Tile height in pixels
$grid_bg = isset($atts['grid_bg']) ? intval($atts['grid_bg']) : 1; // 1 = image, 0 = color
$grid_style = isset($atts['grid_style']) ? max(1, min(4, intval($atts['grid_style']))) : 1; // Style 1-4

// Backward compatibility
if (isset($atts['modal']) && $atts['modal'] === 'false' && $display_method === 'slide-down') {
    $display_method = 'none';
} elseif (isset($atts['modal']) && $atts['modal'] === 'true' && $display_method === 'slide-down') {
    $display_method = 'lightbox';
}
// Support old 'eventcard' name for backward compatibility
if ($display_method === 'eventcard') {
    $display_method = 'slide-down';
}

// Load formatter
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-event-formatter.php';
?>

<div class="localplus-events-list localplus-events-<?php echo esc_attr($display_style); ?><?php if ($display_method === 'gridview'): ?> localplus-events-gridview localplus-gridview-style-<?php echo esc_attr($grid_style); ?><?php endif; ?>"
    data-display-method="<?php echo esc_attr($display_method); ?>" <?php if ($columns > 0): ?>
        data-columns="<?php echo esc_attr($columns); ?>" style="--localplus-columns: <?php echo esc_attr($columns); ?>;"
    <?php endif; ?> <?php if ($display_method === 'gridview'): ?> data-grid-count="<?php echo esc_attr($grid_count); ?>"
        data-grid-height="<?php echo esc_attr($grid_height); ?>" data-grid-bg="<?php echo esc_attr($grid_bg); ?>"
        style="--localplus-grid-count: <?php echo esc_attr($grid_count); ?>; --localplus-grid-height: <?php echo esc_attr($grid_height); ?>px;"
    <?php endif; ?>>
    <?php if (empty($events)): ?>
        <div class="localplus-events-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p><?php esc_html_e('No events found.', 'localplus-events'); ?></p>
        </div>
    <?php else: ?>
        <div class="localplus-events-container">
            <?php foreach ($events as $event):
                // Format date/time
                $datetime = LocalPlus_Event_Formatter::format_datetime(
                    $event['start_time'],
                    $event['end_time'],
                    $event['timezone_id'] ?? null
                );

                // Check if upcoming
                $is_upcoming = LocalPlus_Event_Formatter::is_upcoming($event['start_time']);

                // Get location
                $location = !empty($event['venue_area']) ? $event['venue_area'] : ($event['location'] ?? '');

                // Store full event data for interactions
                $event_json = htmlspecialchars(json_encode($event), ENT_QUOTES, 'UTF-8');

                // Determine click behavior class
                $click_class = '';
                if ($display_method === 'lightbox' || $display_method === 'gridview') {
                    $click_class = 'localplus-event-lightbox';
                } elseif ($display_method === 'slide-down' || $display_method === 'eventcard') {
                    $click_class = 'localplus-event-card-toggle';
                } elseif ($display_method === 'tooltip') {
                    $click_class = 'localplus-event-tooltip-trigger';
                } elseif ($display_method === 'singlepage') {
                    $click_class = 'localplus-event-link';
                }

                // Get event color (fallback to default colors) - only needed for gridview
                $event_color = '#6B7280'; // Default gray
                if ($display_method === 'gridview') {
                    $event_colors = array(
                        'music' => '#8B5CF6',
                        'sports' => '#10B981',
                        'food' => '#F59E0B',
                        'art' => '#EC4899',
                        'business' => '#3B82F6',
                        'general' => '#6B7280'
                    );
                    $event_type = isset($event['event_type']) ? $event['event_type'] : 'general';
                    $event_color = isset($event_colors[$event_type]) ? $event_colors[$event_type] : $event_colors['general'];
                }
                ?>
                <?php if ($display_method === 'gridview'): ?>
                    <!-- Gridview Tile -->
                    <article class="localplus-gridview-tile <?php echo esc_attr($click_class); ?>"
                        data-event-id="<?php echo esc_attr($event['id']); ?>"
                        data-status="<?php echo esc_attr($event['status']); ?>"
                        data-event-data="<?php echo esc_attr($event_json); ?>"
                        style="background-color: <?php echo esc_attr($event_color); ?>;">
                        <?php if ($grid_bg == 1 && !empty($event['hero_image_url'])): ?>
                            <div class="localplus-gridview-tile-bg"
                                style="background-image: url('<?php echo esc_url($event['hero_image_url']); ?>');"></div>
                        <?php endif; ?>

                        <div class="localplus-gridview-tile-content">
                            <div class="localplus-gridview-tile-date">
                                <?php
                                // Format date based on event duration
                                try {
                                    if (!empty($event['start_time']) && !empty($event['end_time'])) {
                                        $start_date = new DateTime($event['start_time']);
                                        $end_date = new DateTime($event['end_time']);
                                        $start_day = $start_date->format('d');
                                        $start_month = $start_date->format('M');
                                        $end_day = $end_date->format('d');

                                        if ($start_date->format('Y-m') === $end_date->format('Y-m')) {
                                            if ($start_day === $end_day) {
                                                echo esc_html($start_day . ' ' . strtoupper($start_month));
                                            } else {
                                                echo esc_html($start_day . ' - ' . $end_day . ' ' . strtoupper($start_month));
                                            }
                                        } else {
                                            echo esc_html(strtoupper($start_month));
                                        }
                                    } else {
                                        // Fallback if dates are missing
                                        echo esc_html(date('d M', time()));
                                    }
                                } catch (Exception $e) {
                                    // Fallback if date parsing fails
                                    if (!empty($event['start_time'])) {
                                        echo esc_html(date('d M', strtotime($event['start_time'])));
                                    } else {
                                        echo esc_html(date('d M', time()));
                                    }
                                }
                                ?>
                            </div>

                            <?php if ($grid_style == 1 || $grid_style == 2): ?>
                                <!-- Style 1 & 2: Title and details overlay -->
                                <div class="localplus-gridview-tile-overlay">
                                    <h3 class="localplus-gridview-tile-title"><?php echo esc_html($event['title']); ?></h3>
                                    <?php if (!empty($event['subtitle']) && $grid_style == 1): ?>
                                        <p class="localplus-gridview-tile-subtitle"><?php echo esc_html($event['subtitle']); ?></p>
                                    <?php endif; ?>

                                    <?php if ($grid_style == 1): ?>
                                        <div class="localplus-gridview-tile-meta">
                                            <div class="localplus-gridview-meta-item">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    stroke-width="2">
                                                    <path
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span><?php echo esc_html($datetime['time']); ?></span>
                                            </div>
                                            <?php if (!empty($location)): ?>
                                                <div class="localplus-gridview-meta-item">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                        stroke-width="2">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                        <circle cx="12" cy="10" r="3" />
                                                    </svg>
                                                    <span><?php echo esc_html($location); ?></span>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            <?php elseif ($grid_style == 3): ?>
                                <!-- Style 3: Details right of date -->
                                <div class="localplus-gridview-tile-details-right">
                                    <h3 class="localplus-gridview-tile-title"><?php echo esc_html($event['title']); ?></h3>
                                    <div class="localplus-gridview-tile-meta">
                                        <div class="localplus-gridview-meta-item">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                stroke-width="2">
                                                <path
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span><?php echo esc_html($datetime['time']); ?></span>
                                        </div>
                                        <?php if (!empty($location)): ?>
                                            <div class="localplus-gridview-meta-item">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    stroke-width="2">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                    <circle cx="12" cy="10" r="3" />
                                                </svg>
                                                <span><?php echo esc_html($location); ?></span>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php elseif ($grid_style == 4): ?>
                                <!-- Style 4: Bare minimal - just title overlay -->
                                <div class="localplus-gridview-tile-overlay-minimal">
                                    <h3 class="localplus-gridview-tile-title"><?php echo esc_html($event['title']); ?></h3>
                                </div>
                            <?php endif; ?>
                        </div>
                    </article>
                <?php else: ?>
                    <!-- Standard Card -->
                    <article class="localplus-event-card <?php echo esc_attr($click_class); ?>"
                        data-event-id="<?php echo esc_attr($event['id']); ?>"
                        data-status="<?php echo esc_attr($event['status']); ?>"
                        data-event-data="<?php echo esc_attr($event_json); ?>">

                        <div class="localplus-event-image-wrapper">
                            <?php if (!empty($event['hero_image_url'])): ?>
                                <img src="<?php echo esc_url($event['hero_image_url']); ?>"
                                    alt="<?php echo esc_attr($event['title']); ?>" class="localplus-event-image" loading="lazy"
                                    onerror="this.onerror=null; this.src='data:image/svg+xml;base64,<?php echo base64_encode('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"200\" viewBox=\"0 0 400 200\"><rect width=\"400\" height=\"200\" fill=\"#f0f0f0\"/><text x=\"50%\" y=\"50%\" text-anchor=\"middle\" dy=\".3em\" font-family=\"Arial\" font-size=\"14\" fill=\"#999\">No Image</text></svg>'); ?>';">
                            <?php else: ?>
                                <div class="localplus-event-image-placeholder">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            <?php endif; ?>

                            <?php if ($is_upcoming): ?>
                                <span class="localplus-event-badge localplus-event-badge-upcoming">
                                    <?php esc_html_e('Upcoming', 'localplus-events'); ?>
                                </span>
                            <?php endif; ?>

                            <?php
                            // [2025-12-06] - Display category names if available, otherwise use event_type
                            $category_display = '';
                            if (!empty($event['event_type_names'])) {
                                $category_display = $event['event_type_names'];
                            } elseif (!empty($event['event_type']) && $event['event_type'] !== 'general') {
                                // If event_type looks like IDs (contains numbers and commas), don't display
                                if (preg_match('/^\d+[,\d\s]*$/', $event['event_type'])) {
                                    $category_display = ''; // Hide if it's just IDs
                                } else {
                                    $category_display = ucfirst($event['event_type']);
                                }
                            }
                            if (!empty($category_display)): ?>
                                <span class="localplus-event-badge localplus-event-badge-category">
                                    <?php echo esc_html($category_display); ?>
                                </span>
                            <?php endif; ?>
                        </div>

                        <div class="localplus-event-content">
                            <header class="localplus-event-header">
                                <h3 class="localplus-event-title">
                                    <?php if ($display_method === 'singlepage'): ?>
                                        <a href="<?php echo esc_url(get_permalink() . '?event_id=' . $event['id']); ?>"
                                            class="localplus-event-title-link">
                                            <?php echo esc_html($event['title']); ?>
                                        </a>
                                    <?php else: ?>
                                        <?php echo esc_html($event['title']); ?>
                                    <?php endif; ?>
                                </h3>

                                <?php if (!empty($event['subtitle']) && $display_style !== 'compact'): ?>
                                    <p class="localplus-event-subtitle">
                                        <?php echo esc_html($event['subtitle']); ?>
                                    </p>
                                <?php endif; ?>
                            </header>

                            <!-- Compact inline meta layout -->
                            <div class="localplus-event-meta-compact">
                                <span class="localplus-meta-inline">
                                    <svg class="localplus-icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2">
                                        <path
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span><?php echo esc_html($datetime['date']); ?> •
                                        <?php echo esc_html($datetime['time']); ?></span>
                                </span>
                                <?php if (!empty($location)): ?>
                                    <span class="localplus-meta-inline">
                                        <svg class="localplus-icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span><?php echo esc_html($location); ?></span>
                                    </span>
                                <?php endif; ?>
                            </div>

                            <?php if (!empty($event['description']) && $display_style !== 'compact'): ?>
                                <div class="localplus-event-description">
                                    <?php echo esc_html(wp_trim_words($event['description'], 20)); ?>
                                </div>
                            <?php endif; ?>

                            <?php if ($display_method === 'slide-down' || $display_method === 'eventcard'): ?>
                                <div class="localplus-event-more">
                                    <span><?php esc_html_e('View Details', 'localplus-events'); ?> ↓</span>
                                </div>
                            <?php elseif ($display_method === 'lightbox'): ?>
                                <div class="localplus-event-more">
                                    <span><?php esc_html_e('View Details', 'localplus-events'); ?> →</span>
                                </div>
                            <?php endif; ?>
                        </div>

                        <!-- Slide-down panel -->
                        <?php if ($display_method === 'slide-down' || $display_method === 'eventcard'): ?>
                            <div class="localplus-event-details-panel">
                                <div class="localplus-event-details-content">
                                    <?php if (!empty($event['hero_image_url'])): ?>
                                        <div class="localplus-event-details-image">
                                            <img src="<?php echo esc_url($event['hero_image_url']); ?>"
                                                alt="<?php echo esc_attr($event['title']); ?>">
                                        </div>
                                    <?php endif; ?>
                                    <div class="localplus-event-details-info">
                                        <div class="localplus-event-details-meta">
                                            <div>
                                                <strong><?php esc_html_e('Date:', 'localplus-events'); ?></strong>
                                                <?php echo esc_html($datetime['date']); ?>
                                            </div>
                                            <div>
                                                <strong><?php esc_html_e('Time:', 'localplus-events'); ?></strong>
                                                <?php echo esc_html($datetime['time']); ?>
                                            </div>
                                            <?php if (!empty($location)): ?>
                                                <div>
                                                    <strong><?php esc_html_e('Location:', 'localplus-events'); ?></strong>
                                                    <?php echo esc_html($location); ?>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                        <?php if (!empty($event['description'])): ?>
                                            <div class="localplus-event-details-description">
                                                <?php echo esc_html($event['description']); ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>
                    </article>
                <?php endif; // End if ($display_method === 'gridview') / else ?>
            <?php endforeach; ?>
        </div>

        <!-- Tooltip -->
        <?php if ($display_method === 'tooltip'): ?>
            <div class="localplus-event-tooltip" id="localplus-event-tooltip"></div>
        <?php endif; ?>
    <?php endif; ?>
</div>

<style>
    /* [2025-01-06] - Multiple display methods with fixed modal */
    .localplus-events-list {
        margin: 30px 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }

    /* Grid Display (Default) */
    .localplus-events-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
        margin-top: 20px;
    }

    /* [2025-12-05] - Fixed columns support */
    .localplus-events-list[data-columns] .localplus-events-container {
        grid-template-columns: repeat(var(--localplus-columns, auto-fill), minmax(320px, 1fr));
    }

    /* Specific column counts */
    .localplus-events-list[data-columns="1"] .localplus-events-container {
        grid-template-columns: 1fr;
    }

    .localplus-events-list[data-columns="2"] .localplus-events-container {
        grid-template-columns: repeat(2, 1fr);
    }

    .localplus-events-list[data-columns="3"] .localplus-events-container {
        grid-template-columns: repeat(3, 1fr);
    }

    .localplus-events-list[data-columns="4"] .localplus-events-container {
        grid-template-columns: repeat(4, 1fr);
    }

    .localplus-events-list[data-columns="5"] .localplus-events-container {
        grid-template-columns: repeat(5, 1fr);
    }

    .localplus-events-list[data-columns="6"] .localplus-events-container {
        grid-template-columns: repeat(6, 1fr);
    }

    /* Responsive: columns parameter still respects mobile breakpoint */
    @media (max-width: 768px) {
        .localplus-events-list[data-columns] .localplus-events-container {
            grid-template-columns: 1fr;
        }
    }

    /* List Display */
    .localplus-events-list .localplus-events-list .localplus-events-container {
        grid-template-columns: 1fr;
    }

    .localplus-events-list .localplus-events-list .localplus-event-card {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 20px;
    }

    .localplus-events-list .localplus-events-list .localplus-event-image-wrapper {
        height: 150px;
    }

    /* Compact Display */
    .localplus-events-compact .localplus-events-container {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
    }

    .localplus-events-compact .localplus-event-image-wrapper {
        height: 160px;
    }

    .localplus-events-compact .localplus-event-content {
        padding: 16px;
    }

    .localplus-events-compact .localplus-event-title {
        font-size: 1.1em;
        margin-bottom: 8px;
    }

    /* Detailed Display */
    .localplus-events-detailed .localplus-events-container {
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    }

    .localplus-events-detailed .localplus-event-image-wrapper {
        height: 260px;
    }

    @media (max-width: 768px) {
        .localplus-events-container {
            grid-template-columns: 1fr;
            gap: 20px;
        }

        .localplus-events-list .localplus-events-list .localplus-event-card {
            grid-template-columns: 1fr;
        }
    }

    .localplus-event-card {
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .localplus-event-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .localplus-event-lightbox,
    .localplus-event-card-toggle {
        cursor: pointer;
    }

    .localplus-event-image-wrapper {
        position: relative;
        width: 100%;
        height: 220px;
        overflow: hidden;
        background: #f5f5f5;
    }

    .localplus-event-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .localplus-event-card:hover .localplus-event-image {
        transform: scale(1.05);
    }

    .localplus-event-image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        color: #999;
    }

    .localplus-event-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        z-index: 2;
    }

    .localplus-event-badge-upcoming {
        background: #10b981;
        color: #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .localplus-event-badge-category {
        background: rgba(0, 115, 170, 0.9);
        color: #ffffff;
        backdrop-filter: blur(4px);
        top: auto;
        bottom: 12px;
        right: 12px;
    }

    .localplus-event-content {
        padding: 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .localplus-event-header {
        margin-bottom: 12px;
    }

    .localplus-event-title {
        margin: 0 0 8px 0;
        font-size: 1.25em;
        font-weight: 700;
        line-height: 1.4;
        color: #1a1a1a;
    }

    .localplus-event-title-link {
        color: inherit;
        text-decoration: none;
    }

    .localplus-event-title-link:hover {
        color: #0073aa;
    }

    .localplus-event-subtitle {
        margin: 0;
        font-size: 0.9em;
        color: #666;
        font-weight: 400;
    }

    /* Compact inline meta layout */
    .localplus-event-meta-compact {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 16px;
        margin: 12px 0;
        font-size: 0.85em;
        color: #666;
    }

    .localplus-meta-inline {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .localplus-icon-inline {
        flex-shrink: 0;
        color: #0073aa;
        opacity: 0.7;
    }

    .localplus-event-description {
        margin-top: 12px;
        padding-top: 12px;
        font-size: 0.9em;
        line-height: 1.6;
        color: #555;
        border-top: 1px solid #f0f0f0;
    }

    .localplus-event-more {
        margin-top: auto;
        padding-top: 12px;
        font-size: 0.9em;
        color: #0073aa;
        font-weight: 500;
        border-top: 1px solid #f0f0f0;
    }

    .localplus-event-more span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    /* Slide-down panel */
    .localplus-event-details-panel {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
        background: #f9f9f9;
    }

    .localplus-event-card.active .localplus-event-details-panel {
        max-height: 1000px;
    }

    .localplus-event-details-content {
        padding: 20px;
    }

    .localplus-event-details-image {
        margin-bottom: 20px;
        border-radius: 8px;
        overflow: hidden;
    }

    .localplus-event-details-image img {
        width: 100%;
        height: auto;
        display: block;
    }

    .localplus-event-details-meta {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
        font-size: 0.95em;
    }

    .localplus-event-details-description {
        line-height: 1.7;
        color: #444;
    }

    /* Lightbox Modal and Tooltip styles moved to frontend.css */

    @media (max-width: 768px) {
        /* ============================================
   GRIDVIEW (Tile View) Styles
   ============================================ */

        /* Gridview Container */
        .localplus-events-gridview .localplus-events-container {
            display: grid;
            grid-template-columns: repeat(var(--localplus-grid-count, 3), 1fr);
            gap: 20px;
            margin-top: 20px;
        }

        /* Gridview Tile */
        .localplus-gridview-tile {
            position: relative;
            height: var(--localplus-grid-height, 250px);
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .localplus-gridview-tile:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        /* Background Image */
        .localplus-gridview-tile-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            z-index: 1;
        }

        /* Content Container */
        .localplus-gridview-tile-content {
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 20px;
            color: #ffffff;
        }

        /* Date Badge */
        .localplus-gridview-tile-date {
            background: rgba(0, 0, 0, 0.6);
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: auto;
            backdrop-filter: blur(4px);
        }

        /* Overlay Styles (Style 1 & 2) */
        .localplus-gridview-tile-overlay {
            margin-top: auto;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
            padding: 20px;
            margin-left: -20px;
            margin-right: -20px;
            margin-bottom: -20px;
            border-radius: 0 0 12px 12px;
        }

        .localplus-gridview-tile-title {
            margin: 0 0 8px 0;
            font-size: 1.4em;
            font-weight: 700;
            line-height: 1.3;
            color: #ffffff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .localplus-gridview-tile-subtitle {
            margin: 0 0 12px 0;
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.9);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .localplus-gridview-tile-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 0.85em;
        }

        .localplus-gridview-meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.9);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .localplus-gridview-meta-item svg {
            flex-shrink: 0;
            opacity: 0.9;
        }

        /* Style 3: Details Right of Date */
        .localplus-gridview-tile-details-right {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .localplus-gridview-tile-details-right .localplus-gridview-tile-title {
            font-size: 1.2em;
            margin-bottom: 0;
        }

        .localplus-gridview-tile-details-right .localplus-gridview-tile-meta {
            gap: 6px;
        }

        /* Style 4: Bare Minimal */
        .localplus-gridview-tile-overlay-minimal {
            margin-top: auto;
            padding: 0;
        }

        .localplus-gridview-tile-overlay-minimal .localplus-gridview-tile-title {
            font-size: 1.1em;
            margin: 0;
        }

        /* Responsive Gridview */
        @media (max-width: 1024px) {
            .localplus-events-gridview[data-grid-count="4"] .localplus-events-container {
                grid-template-columns: repeat(3, 1fr);
            }
        }

        @media (max-width: 768px) {
            .localplus-events-gridview .localplus-events-container {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }

            .localplus-gridview-tile {
                height: calc(var(--localplus-grid-height, 250px) * 0.9);
            }
        }

        @media (max-width: 480px) {
            .localplus-events-gridview .localplus-events-container {
                grid-template-columns: 1fr;
            }

            .localplus-gridview-tile {
                height: 200px;
            }

            .localplus-gridview-tile-title {
                font-size: 1.1em;
            }
        }
</style>