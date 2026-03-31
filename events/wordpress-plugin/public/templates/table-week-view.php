<?php
/**
 * Table Week View Template
 * 
 * Displays events in a table format with days as columns
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract events from template variables
$events = isset($events) ? $events : array();
$atts = isset($atts) ? $atts : array();

// Table week parameters
$start_date = isset($atts['table_week_start_date']) && !empty($atts['table_week_start_date'])
    ? $atts['table_week_start_date']
    : date('Y-m-d');
$table_style = isset($atts['table_week_style']) ? max(1, min(2, intval($atts['table_week_style']))) : 1;

// Calculate week start (Sunday)
try {
    $week_start = new DateTime($start_date);
    $day_of_week = (int) $week_start->format('w');
    $week_start->modify('-' . $day_of_week . ' days');
} catch (Exception $e) {
    $week_start = new DateTime();
    $day_of_week = (int) $week_start->format('w');
    $week_start->modify('-' . $day_of_week . ' days');
}

$week_start_str = $week_start->format('Y-m-d');
$week_end = clone $week_start;
$week_end->modify('+6 days');

// Generate week days
$week_days = array();
for ($i = 0; $i < 7; $i++) {
    $day = clone $week_start;
    $day->modify('+' . $i . ' days');
    $week_days[] = $day;
}

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

// Load formatter
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-event-formatter.php';
?>

<div class="localplus-calendar-table-week localplus-table-week-style-<?php echo esc_attr($table_style); ?>"
    data-week-start="<?php echo esc_attr($week_start_str); ?>" data-table-style="<?php echo esc_attr($table_style); ?>">

    <!-- Week Navigator -->
    <div class="localplus-table-week-navigator">
        <button class="localplus-nav-btn localplus-nav-prev-week" data-action="prev-week">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </button>
        <div class="localplus-table-week-range">
            <?php echo esc_html($week_start->format('M j')); ?> - <?php echo esc_html($week_end->format('M j, Y')); ?>
        </div>
        <button class="localplus-nav-btn localplus-nav-next-week" data-action="next-week">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
            </svg>
        </button>
    </div>

    <!-- Table -->
    <div class="localplus-table-week-container">
        <table class="localplus-table-week-table">
            <thead>
                <tr>
                    <?php foreach ($week_days as $day):
                        $day_name = $day->format('D');
                        $day_num = $day->format('d');
                        $is_today = $day->format('Y-m-d') === date('Y-m-d');
                        ?>
                        <th class="localplus-table-week-header <?php echo $is_today ? 'today' : ''; ?>">
                            <div class="localplus-table-day-name"><?php echo esc_html($day_name); ?></div>
                            <div class="localplus-table-day-number"><?php echo esc_html($day_num); ?></div>
                        </th>
                    <?php endforeach; ?>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <?php foreach ($week_days as $day):
                        $day_str = $day->format('Y-m-d');
                        $day_events = $events_by_day[$day_str];
                        $is_today = $day_str === date('Y-m-d');
                        ?>
                        <td class="localplus-table-week-cell <?php echo $is_today ? 'today' : ''; ?>"
                            data-date="<?php echo esc_attr($day_str); ?>">
                            <?php if (empty($day_events)): ?>
                                <div class="localplus-table-no-events">—</div>
                            <?php else: ?>
                                <div class="localplus-table-events">
                                    <?php foreach ($day_events as $event):
                                        $datetime = LocalPlus_Event_Formatter::format_datetime(
                                            $event['start_time'],
                                            $event['end_time'],
                                            $event['timezone_id'] ?? null
                                        );
                                        $location = !empty($event['venue_area']) ? $event['venue_area'] : ($event['location'] ?? '');
                                        $event_json = htmlspecialchars(json_encode($event), ENT_QUOTES, 'UTF-8');
                                        ?>
                                        <div class="localplus-table-event-item localplus-event-lightbox"
                                            data-event-id="<?php echo esc_attr($event['id']); ?>"
                                            data-event-data="<?php echo esc_attr($event_json); ?>">
                                            <div class="localplus-table-event-time"><?php echo esc_html($datetime['time']); ?></div>
                                            <div class="localplus-table-event-title"><?php echo esc_html($event['title']); ?></div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                        </td>
                    <?php endforeach; ?>
                </tr>
            </tbody>
        </table>
    </div>

</div>

<style>
    /* Table Week View Styles */
    .localplus-calendar-table-week {
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
    }

    .localplus-table-week-navigator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-bottom: 30px;
        padding: 15px;
        background: #f9f9f9;
        border-radius: 12px;
    }

    .localplus-table-week-range {
        font-size: 1.2em;
        font-weight: 600;
        color: #1a1a1a;
    }

    .localplus-table-week-container {
        overflow-x: auto;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
    }

    .localplus-table-week-table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
    }

    .localplus-table-week-header {
        padding: 15px 10px;
        text-align: center;
        background: #f5f5f5;
        border-right: 1px solid #e0e0e0;
        font-weight: 600;
    }

    .localplus-table-week-header:last-child {
        border-right: none;
    }

    .localplus-table-week-header.today {
        background: #e3f2fd;
        color: #1976d2;
    }

    .localplus-table-day-name {
        font-size: 0.85em;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 5px;
        color: #666;
    }

    .localplus-table-week-header.today .localplus-table-day-name {
        color: #1976d2;
        font-weight: 700;
    }

    .localplus-table-day-number {
        font-size: 1.3em;
        font-weight: 700;
        color: #1a1a1a;
    }

    .localplus-table-week-header.today .localplus-table-day-number {
        color: #1976d2;
    }

    .localplus-table-week-cell {
        padding: 15px 10px;
        vertical-align: top;
        border-right: 1px solid #e0e0e0;
        border-bottom: 1px solid #e0e0e0;
        min-height: 300px;
        background: #fff;
    }

    .localplus-table-week-cell:last-child {
        border-right: none;
    }

    .localplus-table-week-cell.today {
        background: #f0f8ff;
        border-left: 3px solid #1976d2;
    }

    .localplus-table-no-events {
        color: #999;
        text-align: center;
        padding: 20px 0;
        font-size: 0.9em;
    }

    .localplus-table-events {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .localplus-table-event-item {
        background: #0073aa;
        color: #fff;
        padding: 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .localplus-table-event-item:hover {
        background: #005a87;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 115, 170, 0.3);
    }

    .localplus-table-event-time {
        font-size: 0.85em;
        font-weight: 600;
        margin-bottom: 6px;
        opacity: 0.9;
    }

    .localplus-table-event-title {
        font-weight: 600;
        line-height: 1.3;
        font-size: 0.95em;
    }

    /* Style 2: Compact */
    .localplus-table-week-style-2 .localplus-table-event-item {
        padding: 8px;
        font-size: 0.85em;
    }

    .localplus-table-week-style-2 .localplus-table-week-cell {
        padding: 10px 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .localplus-table-week-table {
            display: block;
        }

        .localplus-table-week-header,
        .localplus-table-week-cell {
            display: block;
            width: 100%;
            border-right: none;
            border-bottom: 2px solid #e0e0e0;
        }

        .localplus-table-week-header::before {
            content: attr(data-date);
            display: block;
            font-weight: 700;
            margin-bottom: 10px;
        }
    }
</style>