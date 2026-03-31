<?php
/**
 * Daily View Template
 * 
 * Displays events in a daily calendar view with:
 * - Large focus date block
 * - Horizontal scrollable days strip
 * - Events listed below
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract events from template variables
$events = isset($events) ? $events : array();
$atts = isset($atts) ? $atts : array();

// Daily view parameters
$focus_date = isset($atts['daily_focus_date']) && !empty($atts['daily_focus_date'])
    ? $atts['daily_focus_date']
    : date('Y-m-d');
$days_strip = isset($atts['daily_days_strip']) ? max(7, min(30, intval($atts['daily_days_strip']))) : 14;

// Parse focus date
try {
    $focus_datetime = new DateTime($focus_date);
} catch (Exception $e) {
    $focus_datetime = new DateTime();
}
$focus_date_str = $focus_datetime->format('Y-m-d');
$focus_day_name = $focus_datetime->format('l');
$focus_day_num = $focus_datetime->format('d');
$focus_month = $focus_datetime->format('F');
$focus_year = $focus_datetime->format('Y');

// Generate days strip (7 days before and after focus date)
$days_strip_start = clone $focus_datetime;
$days_strip_start->modify('-' . floor($days_strip / 2) . ' days');
$days_strip_dates = array();
for ($i = 0; $i < $days_strip; $i++) {
    $day = clone $days_strip_start;
    $day->modify('+' . $i . ' days');
    $days_strip_dates[] = $day;
}

// Filter events for focus date
$focus_date_events = array();
foreach ($events as $event) {
    $event_start = new DateTime($event['start_time']);
    $event_date = $event_start->format('Y-m-d');
    if ($event_date === $focus_date_str) {
        $focus_date_events[] = $event;
    }
}

// Load formatter
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-event-formatter.php';
?>

<div class="localplus-calendar-daily localplus-events-list" data-display-method="daily"
    data-focus-date="<?php echo esc_attr($focus_date_str); ?>" data-days-strip="<?php echo esc_attr($days_strip); ?>">
    <!-- Month/Year Navigator -->
    <div class="localplus-daily-navigator">
        <button class="localplus-nav-btn localplus-nav-prev-month" data-action="prev-month" aria-label="Previous month">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </button>
        <div class="localplus-daily-month-year">
            <span class="localplus-month"><?php echo esc_html($focus_month); ?></span>
            <span class="localplus-year"><?php echo esc_html($focus_year); ?></span>
        </div>
        <button class="localplus-nav-btn localplus-nav-next-month" data-action="next-month" aria-label="Next month">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
            </svg>
        </button>
    </div>

    <!-- Focus Date Block -->
    <div class="localplus-daily-focus-block">
        <button class="localplus-nav-btn localplus-nav-prev-day" data-action="prev-day" aria-label="Previous day">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </button>
        <div class="localplus-focus-date-content">
            <div class="localplus-focus-day-name"><?php echo esc_html($focus_day_name); ?></div>
            <div class="localplus-focus-day-number"><?php echo esc_html($focus_day_num); ?></div>
            <?php if (count($focus_date_events) > 0): ?>
                <div class="localplus-focus-event-count">
                    <span class="localplus-event-count-badge"><?php echo count($focus_date_events); ?></span>
                    <span
                        class="localplus-event-count-text"><?php echo count($focus_date_events) === 1 ? 'EVENT' : 'EVENTS'; ?></span>
                </div>
            <?php endif; ?>
        </div>
        <button class="localplus-nav-btn localplus-nav-next-day" data-action="next-day" aria-label="Next day">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
            </svg>
        </button>
    </div>

    <!-- Days Strip -->
    <div class="localplus-daily-days-strip">
        <div class="localplus-days-strip-scroll">
            <?php foreach ($days_strip_dates as $day):
                $day_date_str = $day->format('Y-m-d');
                $day_name = $day->format('D');
                $day_num = $day->format('d');
                $is_focus = $day_date_str === $focus_date_str;
                $is_today = $day_date_str === date('Y-m-d');

                // Count events for this day
                $day_events_count = 0;
                foreach ($events as $event) {
                    $event_start = new DateTime($event['start_time']);
                    if ($event_start->format('Y-m-d') === $day_date_str) {
                        $day_events_count++;
                    }
                }
                ?>
                <button
                    class="localplus-day-strip-item <?php echo $is_focus ? 'active' : ''; ?> <?php echo $is_today ? 'today' : ''; ?>"
                    data-date="<?php echo esc_attr($day_date_str); ?>"
                    aria-label="<?php echo esc_attr($day->format('F j, Y')); ?>">
                    <div class="localplus-day-strip-name"><?php echo esc_html($day_name); ?></div>
                    <div class="localplus-day-strip-number"><?php echo esc_html($day_num); ?></div>
                    <?php if ($day_events_count > 0): ?>
                        <div class="localplus-day-strip-indicator"
                            title="<?php echo esc_attr($day_events_count . ' event' . ($day_events_count > 1 ? 's' : '')); ?>">
                        </div>
                    <?php endif; ?>
                </button>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Events List for Focus Date -->
    <div class="localplus-daily-events">
        <?php if (empty($focus_date_events)): ?>
            <div class="localplus-daily-no-events">
                <p><?php esc_html_e('No events on this day.', 'localplus-events'); ?></p>
            </div>
        <?php else: ?>
            <div class="localplus-daily-events-list">
                <?php foreach ($focus_date_events as $event):
                    $datetime = LocalPlus_Event_Formatter::format_datetime(
                        $event['start_time'],
                        $event['end_time'],
                        $event['timezone_id'] ?? null
                    );
                    $location = !empty($event['venue_area']) ? $event['venue_area'] : ($event['location'] ?? '');
                    $event_json = htmlspecialchars(json_encode($event), ENT_QUOTES, 'UTF-8');
                    ?>
                    <article class="localplus-daily-event-card localplus-event-lightbox"
                        data-event-id="<?php echo esc_attr($event['id']); ?>"
                        data-event-data="<?php echo esc_attr($event_json); ?>">
                        <?php if (!empty($event['hero_image_url'])): ?>
                            <div class="localplus-daily-event-image">
                                <img src="<?php echo esc_url($event['hero_image_url']); ?>"
                                    alt="<?php echo esc_attr($event['title']); ?>" loading="lazy">
                            </div>
                        <?php endif; ?>
                        <div class="localplus-daily-event-content">
                            <h3 class="localplus-daily-event-title"><?php echo esc_html($event['title']); ?></h3>
                            <?php if (!empty($event['subtitle'])): ?>
                                <p class="localplus-daily-event-subtitle"><?php echo esc_html($event['subtitle']); ?></p>
                            <?php endif; ?>
                            <div class="localplus-daily-event-meta">
                                <div class="localplus-daily-meta-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2">
                                        <path
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span><?php echo esc_html($datetime['time']); ?></span>
                                </div>
                                <?php if (!empty($location)): ?>
                                    <div class="localplus-daily-meta-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            stroke-width="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span><?php echo esc_html($location); ?></span>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

</div>


<style>
    /* Daily View Styles */
    .localplus-calendar-daily {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    /* Navigator */
    .localplus-daily-navigator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-bottom: 30px;
    }

    .localplus-daily-month-year {
        font-size: 1.5em;
        font-weight: 700;
        color: #1a1a1a;
    }

    .localplus-month {
        margin-right: 8px;
    }

    .localplus-nav-btn {
        background: #f5f5f5;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #666;
    }

    .localplus-nav-btn:hover {
        background: #0073aa;
        color: #fff;
        transform: scale(1.05);
    }

    /* Focus Date Block */
    .localplus-daily-focus-block {
        background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%);
        border-radius: 16px;
        padding: 40px;
        margin-bottom: 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .localplus-focus-date-content {
        text-align: center;
        flex: 1;
        color: #fff;
    }

    .localplus-focus-day-name {
        font-size: 1.2em;
        font-weight: 600;
        margin-bottom: 10px;
        opacity: 0.95;
    }

    .localplus-focus-day-number {
        font-size: 5em;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 15px;
    }

    .localplus-focus-event-count {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .localplus-event-count-badge {
        background: rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(4px);
        border-radius: 20px;
        padding: 6px 16px;
        font-weight: 700;
        font-size: 1.1em;
    }

    .localplus-event-count-text {
        font-size: 0.9em;
        font-weight: 600;
        opacity: 0.9;
    }

    /* Days Strip */
    .localplus-daily-days-strip {
        margin-bottom: 30px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .localplus-days-strip-scroll {
        display: flex;
        gap: 12px;
        padding: 10px 0;
        min-width: max-content;
    }

    .localplus-day-strip-item {
        background: #fff;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        padding: 16px 20px;
        min-width: 80px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    }

    .localplus-day-strip-item:hover {
        border-color: #0073aa;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 115, 170, 0.2);
    }

    .localplus-day-strip-item.today {
        border-color: #10b981;
        background: #f0fdf4;
    }

    .localplus-day-strip-item.active {
        border-color: #ff8c00;
        background: #fff5e6;
        box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
    }

    .localplus-day-strip-name {
        font-size: 0.85em;
        font-weight: 600;
        color: #666;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .localplus-day-strip-item.active .localplus-day-strip-name,
    .localplus-day-strip-item.today .localplus-day-strip-name {
        color: #1a1a1a;
    }

    .localplus-day-strip-number {
        font-size: 1.8em;
        font-weight: 700;
        color: #1a1a1a;
        line-height: 1;
    }

    .localplus-day-strip-indicator {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 8px;
        height: 8px;
        background: #0073aa;
        border-radius: 50%;
    }

    .localplus-day-strip-item.active .localplus-day-strip-indicator {
        background: #ff8c00;
    }

    /* Events List */
    .localplus-daily-events {
        margin-top: 30px;
    }

    .localplus-daily-no-events {
        text-align: center;
        padding: 60px 20px;
        color: #999;
    }

    .localplus-daily-events-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .localplus-daily-event-card {
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
        display: flex;
        gap: 20px;
    }

    .localplus-daily-event-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .localplus-daily-event-image {
        width: 200px;
        min-width: 200px;
        height: 150px;
        overflow: hidden;
        background: #f5f5f5;
    }

    .localplus-daily-event-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .localplus-daily-event-content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .localplus-daily-event-title {
        font-size: 1.4em;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: #1a1a1a;
        line-height: 1.3;
    }

    .localplus-daily-event-subtitle {
        font-size: 1em;
        color: #666;
        margin: 0 0 16px 0;
    }

    .localplus-daily-event-meta {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .localplus-daily-meta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9em;
        color: #666;
    }

    .localplus-daily-meta-item svg {
        flex-shrink: 0;
        opacity: 0.7;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .localplus-daily-focus-block {
            padding: 30px 20px;
        }

        .localplus-focus-day-number {
            font-size: 4em;
        }

        .localplus-daily-event-card {
            flex-direction: column;
        }

        .localplus-daily-event-image {
            width: 100%;
            height: 200px;
        }

        .localplus-day-strip-item {
            min-width: 70px;
            padding: 12px 16px;
        }
    }
</style>