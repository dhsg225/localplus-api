<?php
/**
 * Weekly View Template - Premium Redesign
 * 
 * Support Styles:
 * Style 1: Premium Weekly Grid (Screenshot 1)
 * Style 2: Daily List Selector (Screenshot 2)
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract events from template variables
$events = isset($events) ? $events : array();
$atts = isset($atts) ? $atts : array();

// Weekly view parameters
$start_date = isset($atts['weekly_start_date']) && !empty($atts['weekly_start_date'])
    ? $atts['weekly_start_date']
    : date('Y-m-d');
$weekly_style = isset($atts['weekly_style']) ? max(1, min(3, intval($atts['weekly_style']))) : 1;

// Calculate week start (Sunday)
try {
    $week_start = new DateTime($start_date);
    $day_of_week = (int) $week_start->format('w'); // 0 = Sunday, 6 = Saturday
    $week_start->modify('-' . $day_of_week . ' days');
} catch (Exception $e) {
    $week_start = new DateTime();
    $day_of_week = (int) $week_start->format('w');
    $week_start->modify('-' . $day_of_week . ' days');
}

$week_start_str = $week_start->format('Y-m-d');
$week_end = clone $week_start;
$week_end->modify('+6 days');
$week_end_str = $week_end->format('Y-m-d');

// Generate week days
$week_days = array();
for ($i = 0; $i < 7; $i++) {
    $day = clone $week_start;
    $day->modify('+' . $i . ' days');
    $week_days[] = $day;
}

// [2026-02-07] - Correct Date Definition
$today_str = wp_date('Y-m-d');
$active_day = $today_str;

// Group events by day
$events_by_day = array();
foreach ($week_days as $day) {
    $day_str = $day->format('Y-m-d');
    $events_by_day[$day_str] = array();

    foreach ($events as $event) {
        $event_start = new DateTime($event['start_time']);
        $event_date = $event_start->format('Y-m-d');
        if ($event_date === $day_str) {
            $events_by_day[$day_str][] = $event;
        }
    }
}

// Ensure $active_day has events if today doesn't
if (empty($events_by_day[$active_day])) {
    foreach ($week_days as $day) {
        $ds = $day->format('Y-m-d');
        if (!empty($events_by_day[$ds])) {
            $active_day = $ds;
            break;
        }
    }
}

// Load formatter
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-event-formatter.php';
?>

<div class="localplus-calendar-weekly localplus-events-list localplus-weekly-style-<?php echo esc_attr($weekly_style); ?>"
    data-display-method="lightbox" data-week-start="<?php echo esc_attr($week_start_str); ?>"
    data-week-style="<?php echo esc_attr($weekly_style); ?>" data-today="<?php echo esc_attr($today_str); ?>"
    data-active-day="<?php echo esc_attr($active_day); ?>">

    <!-- Top Action Bar (Filters, Sort, Search) -->
    <div class="localplus-action-bar">
        <div class="localplus-action-buttons">
            <div class="localplus-action-btn" title="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
            </div>
            <div class="localplus-action-btn" title="Filter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-3h6m2 5h6" />
                </svg>
            </div>
            <div class="localplus-action-btn" title="Sort">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="m3 16 4 4 4-4m-4 4V4m14 12-4 4-4-4m4 4V4" />
                </svg>
            </div>
        </div>
    </div>

    <!-- Week Navigator/Header -->
    <div class="localplus-weekly-nav-header">
        <div class="localplus-nav-left">
            <button class="localplus-nav-arrow localplus-nav-prev-week" data-action="prev-week">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
        </div>

        <div class="localplus-nav-center">
            <div class="localplus-week-range-selector">
                <div class="localplus-current-week-label">
                    <?php echo strtoupper($week_start->format('M j')); ?> -
                    <?php echo strtoupper($week_end->format('M j, Y')); ?>
                </div>
                <div class="localplus-speed-scroller-trigger" data-action="toggle-scroller">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5H7z" />
                    </svg>
                </div>

                <!-- Speed Scroller Dropdown -->
                <div class="localplus-speed-scroller-dropdown">
                    <?php
                    for ($i = -2; $i < 6; $i++):
                        $option_start = clone $week_start;
                        $option_start->modify(($i * 7) . ' days');
                        $option_end = clone $option_start;
                        $option_end->modify('+6 days');
                        $is_current = ($i === 0);
                        ?>
                        <div class="localplus-scroller-item <?php echo $is_current ? 'active' : ''; ?>"
                            data-date="<?php echo $option_start->format('Y-m-d'); ?>">
                            <?php echo $option_start->format('M j'); ?> - <?php echo $option_end->format('M j, Y'); ?>
                        </div>
                    <?php endfor; ?>
                </div>
            </div>
        </div>

        <div class="localplus-nav-right">
            <button class="localplus-nav-arrow localplus-nav-next-week" data-action="next-week">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </button>
        </div>
    </div>

    <!-- Day Cards Row -->
    <div class="localplus-weekly-day-cards <?php echo $weekly_style == 1 ? 'grid-attached' : ''; ?>">
        <?php foreach ($week_days as $day):
            $day_str = $day->format('Y-m-d');
            $day_name = strtoupper($day->format('D'));
            $day_num = $day->format('j');
            $is_today = $day_str === $today_str;
            $is_active = $day_str === $active_day;
            $day_events = $events_by_day[$day_str];

            // Get unique colors for this day
            $day_colors = array();
            foreach ($day_events as $event) {
                $day_colors[] = $event['theme_color_hex'] ?? '#0073aa';
                if (count($day_colors) >= 3)
                    break;
            }
            ?>
            <div class="localplus-day-card <?php echo $is_today ? 'is-today' : ''; ?> <?php echo $is_active ? 'active' : ''; ?>"
                data-date="<?php echo esc_attr($day_str); ?>">
                <div class="localplus-day-name"><?php echo esc_html($day_name); ?></div>
                <div class="localplus-day-num-box">
                    <?php echo esc_html($day_num); ?>
                </div>
                <div class="localplus-day-indicators">
                    <?php foreach ($day_colors as $color): ?>
                        <span class="localplus-indicator-dot" style="background-color: <?php echo esc_attr($color); ?>;"></span>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>

    <!-- View Content Area -->
    <div class="localplus-weekly-content-area">
        <?php if ($weekly_style == 1): ?>
            <!-- STYLE 1: 7-Column Grid View -->
            <div class="localplus-grid-layout">
                <?php foreach ($week_days as $day):
                    $day_str = $day->format('Y-m-d');
                    $day_events = $events_by_day[$day_str];
                    ?>
                    <div class="localplus-grid-column" data-date="<?php echo esc_attr($day_str); ?>">
                        <div class="localplus-column-events">
                            <?php foreach ($day_events as $event):
                                $datetime = LocalPlus_Event_Formatter::format_datetime($event['start_time'], $event['end_time']);
                                $event_color = $event['theme_color_hex'] ?? '#0073aa';
                                ?>
                                <div class="localplus-grid-event-card localplus-event-lightbox"
                                    data-event-id="<?php echo esc_attr($event['id']); ?>"
                                    data-event-data="<?php echo esc_attr(json_encode($event)); ?>"
                                    style="border-top: 3px solid <?php echo esc_attr($event_color); ?>;">
                                    <div class="localplus-mini-time"><?php echo esc_html($datetime['time']); ?></div>
                                    <div class="localplus-mini-title"><?php echo esc_html($event['title']); ?></div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <!-- STYLE 2: List Selector View (All events for week shown) -->
            <div class="localplus-list-layout">
                <?php
                $has_any_events = false;
                foreach ($week_days as $day):
                    $day_str = $day->format('Y-m-d');
                    $day_events = $events_by_day[$day_str];
                    if (empty($day_events))
                        continue;
                    $has_any_events = true;
                    ?>
                    <div class="localplus-day-list-section" data-date="<?php echo esc_attr($day_str); ?>"
                        id="lp-day-<?php echo esc_attr($day_str); ?>">
                        <?php foreach ($day_events as $event):
                            $datetime = LocalPlus_Event_Formatter::format_datetime($event['start_time'], $event['end_time']);
                            $event_color = $event['theme_color_hex'] ?? '#0073aa';
                            $metadata = $event['metadata'] ?? array();
                            ?>
                            <div class="localplus-vibrant-event-card localplus-event-lightbox"
                                data-event-id="<?php echo esc_attr($event['id']); ?>"
                                data-event-data="<?php echo esc_attr(json_encode($event)); ?>"
                                style="background-color: <?php echo esc_attr($event_color); ?>;">

                                <div class="localplus-vibrant-header">
                                    <div class="localplus-vibrant-date">
                                        <span class="v-num"><?php echo $day->format('j'); ?></span>
                                        <span class="v-month"><?php echo strtoupper($day->format('M')); ?></span>
                                    </div>
                                    <div class="localplus-vibrant-main">
                                        <h3 class="localplus-v-title"><?php echo esc_html(strtoupper($event['title'] ?? '')); ?>
                                        </h3>
                                        <?php if (!empty($event['subtitle'])): ?>
                                            <div class="localplus-v-subtitle">Event Tags: <?php echo esc_html($event['subtitle']); ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>

                                <div class="localplus-vibrant-details">
                                    <div class="localplus-v-info">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            stroke-width="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                        <?php echo esc_html($datetime['time']); ?>
                                        (<?php echo esc_html($event['timezone_id'] ?? 'GMT+07:00'); ?>)
                                    </div>
                                    <?php if (!empty($event['location'])): ?>
                                        <div class="localplus-v-info">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                stroke-width="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            <?php echo esc_html($event['location']); ?>
                                        </div>
                                    <?php endif; ?>
                                    <?php if (!empty($metadata['organizer_name'])): ?>
                                        <div class="localplus-v-info">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                stroke-width="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            Event Organized By <?php echo esc_html($metadata['organizer_name']); ?>
                                        </div>
                                    <?php endif; ?>
                                    <?php if (!empty($event['event_type'])): ?>
                                        <div class="localplus-v-info">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                stroke-width="2">
                                                <path
                                                    d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                                <line x1="7" y1="7" x2="7.01" y2="7" />
                                            </svg>
                                            Event Type <?php echo esc_html($event['event_type']); ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endforeach; ?>

                <?php if (!$has_any_events): ?>
                    <div class="localplus-no-events">No events scheduled for this week</div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>

</div>

<style>
    :root {
        --lp-primary: #0073aa;
        --lp-grey-light: #f7f7f7;
        --lp-grey-border: #e0e0e0;
        --lp-text-dark: #333;
        --lp-text-grey: #808080;
        --lp-event-selected: #ff6b6b;
    }

    .localplus-calendar-weekly {
        max-width: 900px;
        margin: 0 auto;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: var(--lp-text-dark);
    }

    /* Action Bar */
    .localplus-action-bar {
        padding: 5px 0 15px;
    }

    .localplus-action-buttons {
        display: flex;
        gap: 8px;
    }

    .localplus-action-btn {
        width: 32px;
        height: 32px;
        background: #666;
        color: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
    }

    .localplus-action-btn:hover {
        background: #444;
    }

    /* Nav Header */
    .localplus-weekly-nav-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
    }

    .localplus-nav-arrow {
        width: 36px;
        height: 36px;
        border: 2px solid var(--lp-grey-border);
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #555;
    }

    .localplus-week-range-selector {
        background: var(--lp-grey-light);
        border-radius: 20px;
        padding: 6px 15px;
        display: flex;
        align-items: center;
        gap: 10px;
        position: relative;
    }

    .localplus-current-week-label {
        font-weight: 700;
        font-size: 14px;
        color: #444;
    }

    .localplus-speed-scroller-trigger {
        background: #00a0e9;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    /* Day Cards */
    .localplus-weekly-day-cards {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 10px;
        margin-bottom: 25px;
    }

    .localplus-weekly-day-cards.grid-attached {
        gap: 0;
        margin-bottom: 0;
        border: 1px solid var(--lp-grey-border);
        border-bottom: none;
        border-radius: 12px 12px 0 0;
        background: #fdfdfd;
    }

    .localplus-day-card {
        background: var(--lp-grey-light);
        border-radius: 12px;
        padding: 12px 5px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
    }

    .localplus-weekly-day-cards.grid-attached .localplus-day-card {
        background: transparent;
        border-radius: 0;
        border: none;
        border-right: 1px solid var(--lp-grey-border);
    }

    .localplus-weekly-day-cards.grid-attached .localplus-day-card:last-child {
        border-right: none;
    }

    .localplus-day-name {
        font-size: 11px;
        font-weight: 700;
        color: var(--lp-text-grey);
        margin-bottom: 10px;
    }

    .localplus-day-num-box {
        width: 32px;
        height: 32px;
        background: white;
        border-radius: 8px;
        margin: 0 auto 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 18px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .localplus-day-card.active .localplus-day-num-box {
        background: var(--lp-event-selected);
        color: white;
    }

    .localplus-day-indicators {
        display: flex;
        justify-content: center;
        gap: 3px;
        min-height: 8px;
    }

    .localplus-indicator-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
    }

    /* Grid Layout (Style 1) */
    .localplus-grid-layout {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border: 1px solid var(--lp-grey-border);
        border-radius: 0 0 12px 12px;
        background: white;
        min-height: 400px;
    }

    .localplus-grid-column {
        border-right: 1px solid var(--lp-grey-border);
        padding: 15px 5px;
    }

    .localplus-grid-column:last-child {
        border-right: none;
    }

    .localplus-grid-event-card {
        padding: 10px 5px;
        margin-bottom: 15px;
        cursor: pointer;
    }

    .localplus-mini-time {
        font-size: 10px;
        color: #888;
        font-weight: 600;
    }

    .localplus-mini-title {
        font-size: 12px;
        font-weight: 700;
        line-height: 1.2;
        text-transform: uppercase;
        margin-top: 4px;
    }

    /* List Layout (Style 2) */
    .localplus-vibrant-event-card {
        border-radius: 12px;
        color: white;
        padding: 25px;
        margin-bottom: 20px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: transform 0.2s;
    }

    .localplus-vibrant-event-card:hover {
        transform: translateY(-3px);
    }

    .localplus-vibrant-header {
        display: flex;
        gap: 20px;
        align-items: flex-start;
        margin-bottom: 15px;
    }

    .localplus-vibrant-date {
        text-align: center;
        line-height: 1;
    }

    .v-num {
        display: block;
        font-size: 32px;
        font-weight: 800;
    }

    .v-month {
        display: block;
        font-size: 14px;
        font-weight: 700;
        opacity: 0.9;
    }

    .localplus-v-title {
        font-size: 24px;
        font-weight: 800;
        margin: 0;
        line-height: 1.1;
    }

    .localplus-v-subtitle {
        font-size: 13px;
        font-weight: 600;
        margin-top: 8px;
        opacity: 0.9;
    }

    .localplus-vibrant-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .localplus-v-info {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        font-weight: 600;
        opacity: 0.95;
    }

    .localplus-v-info svg {
        opacity: 0.8;
    }

    .localplus-no-events {
        padding: 40px;
        text-align: center;
        color: #999;
        font-style: italic;
        background: #fafafa;
        border-radius: 12px;
    }

    /* Speed Scroller */
    .localplus-speed-scroller-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        display: none;
        z-index: 100;
        margin-top: 10px;
    }

    .localplus-speed-scroller-dropdown.active {
        display: block;
    }

    .localplus-scroller-item {
        padding: 10px 15px;
        font-size: 13px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
    }

    .localplus-scroller-item:hover {
        background: #f0f0f0;
    }

    @media (max-width: 600px) {
        .localplus-grid-layout {
            grid-template-columns: 1fr;
        }

        .localplus-grid-column {
            border-right: none;
            border-bottom: 1px solid #eee;
        }

        .localplus-weekly-day-cards {
            overflow-x: auto;
            display: flex;
            padding-bottom: 10px;
        }

        .localplus-day-card {
            flex: 0 0 60px;
        }
    }
</style>