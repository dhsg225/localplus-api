<?php
/**
 * Yearly View Template
 * 
 * Displays events in a full year calendar grid (12 months)
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract events from template variables
$events = isset($events) ? $events : array();
$atts = isset($atts) ? $atts : array();

// Yearly view parameters
$year = isset($atts['yearly_year']) && !empty($atts['yearly_year'])
    ? intval($atts['yearly_year'])
    : (int) date('Y');
$yearly_style = isset($atts['yearly_style']) ? max(1, min(2, intval($atts['yearly_style']))) : 1;

// Generate months
$months = array();
for ($m = 1; $m <= 12; $m++) {
    $month_date = new DateTime($year . '-' . str_pad($m, 2, '0', STR_PAD_LEFT) . '-01');
    $months[] = $month_date;
}

// Group events by month and day
$events_by_month_day = array();
foreach ($months as $month) {
    $month_key = $month->format('Y-m');
    $events_by_month_day[$month_key] = array();

    foreach ($events as $event) {
        $event_start = new DateTime($event['start_time']);
        $event_month = $event_start->format('Y-m');
        if ($event_month === $month_key) {
            $event_day = $event_start->format('d');
            if (!isset($events_by_month_day[$month_key][$event_day])) {
                $events_by_month_day[$month_key][$event_day] = array();
            }
            $events_by_month_day[$month_key][$event_day][] = $event;
        }
    }
}

// Load formatter
require_once LOCALPLUS_EVENTS_PLUGIN_DIR . 'includes/class-event-formatter.php';
?>

<div class="localplus-calendar-yearly localplus-yearly-style-<?php echo esc_attr($yearly_style); ?> localplus-events-list"
    data-display-method="yearly" data-year="<?php echo esc_attr($year); ?>"
    data-yearly-style="<?php echo esc_attr($yearly_style); ?>">

    <!-- Year Navigator -->
    <div class="localplus-yearly-navigator">
        <button class="localplus-nav-btn localplus-nav-prev-year" data-action="prev-year">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </button>
        <div class="localplus-yearly-year">
            <?php echo esc_html($year); ?>
        </div>
        <button class="localplus-nav-btn localplus-nav-next-year" data-action="next-year">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
            </svg>
        </button>
        <button class="localplus-nav-btn localplus-nav-today" data-action="today">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                    d="M12 2v4M12 18v4M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20M12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6Z" />
            </svg>
        </button>
    </div>

    <!-- Year Grid (12 Months) -->
    <div class="localplus-yearly-grid">
        <?php foreach ($months as $month):
            $month_key = $month->format('Y-m');
            $month_name = $month->format('F');
            $month_short = $month->format('M');
            $days_in_month = (int) $month->format('t');
            $first_day_of_week = (int) $month->format('w'); // 0 = Sunday
        
            $month_events = isset($events_by_month_day[$month_key]) ? $events_by_month_day[$month_key] : array();
            ?>
            <div class="localplus-yearly-month" data-month="<?php echo esc_attr($month_key); ?>">
                <div class="localplus-yearly-month-header">
                    <h3 class="localplus-yearly-month-name"><?php echo esc_html($month_name); ?></h3>
                    <?php if (count($month_events) > 0):
                        $total_events = 0;
                        foreach ($month_events as $day_events) {
                            $total_events += count($day_events);
                        }
                        ?>
                        <span class="localplus-yearly-month-count"><?php echo $total_events; ?>
                            event<?php echo $total_events !== 1 ? 's' : ''; ?></span>
                    <?php endif; ?>
                </div>

                <div class="localplus-yearly-month-grid">
                    <!-- Day headers -->
                    <div class="localplus-yearly-weekdays">
                        <div class="localplus-yearly-weekday">S</div>
                        <div class="localplus-yearly-weekday">M</div>
                        <div class="localplus-yearly-weekday">T</div>
                        <div class="localplus-yearly-weekday">W</div>
                        <div class="localplus-yearly-weekday">T</div>
                        <div class="localplus-yearly-weekday">F</div>
                        <div class="localplus-yearly-weekday">S</div>
                    </div>

                    <!-- Days -->
                    <div class="localplus-yearly-days">
                        <!-- Empty cells for days before month starts -->
                        <?php for ($i = 0; $i < $first_day_of_week; $i++): ?>
                            <div class="localplus-yearly-day empty"></div>
                        <?php endfor; ?>

                        <!-- Days of the month -->
                        <?php for ($day = 1; $day <= $days_in_month; $day++):
                            $day_str = str_pad($day, 2, '0', STR_PAD_LEFT);
                            $full_date = $month_key . '-' . $day_str;
                            $day_events = isset($month_events[$day_str]) ? $month_events[$day_str] : array();
                            $is_today = $full_date === date('Y-m-d');
                            ?>
                            <div class="localplus-yearly-day <?php echo $is_today ? 'today' : ''; ?> <?php echo count($day_events) > 0 ? 'has-events' : ''; ?>"
                                data-date="<?php echo esc_attr($full_date); ?>"
                                title="<?php echo esc_attr(count($day_events) . ' event' . (count($day_events) !== 1 ? 's' : '')); ?>">
                                <div class="localplus-yearly-day-number"><?php echo $day; ?></div>
                                <?php if (count($day_events) > 0): ?>
                                    <div class="localplus-yearly-day-indicators">
                                        <?php
                                        $indicator_count = min(count($day_events), 3); // Max 3 indicators
                                        for ($i = 0; $i < $indicator_count; $i++):
                                            ?>
                                            <span class="localplus-yearly-indicator"></span>
                                        <?php endfor; ?>
                                        <?php if (count($day_events) > 3): ?>
                                            <span class="localplus-yearly-more">+<?php echo count($day_events) - 3; ?></span>
                                        <?php endif; ?>
                                    </div>
                                <?php endif; ?>
                            </div>
                        <?php endfor; ?>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>

</div>

<style>
    /* Yearly View Styles */
    .localplus-calendar-yearly {
        max-width: 1600px;
        margin: 0 auto;
        padding: 20px;
    }

    /* Year Navigator */
    .localplus-yearly-navigator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-bottom: 40px;
        padding: 20px;
        background: #f9f9f9;
        border-radius: 12px;
    }

    .localplus-yearly-year {
        font-size: 2em;
        font-weight: 700;
        color: #1a1a1a;
    }

    /* Year Grid */
    .localplus-yearly-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 30px;
    }

    /* Month Block */
    .localplus-yearly-month {
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .localplus-yearly-month-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #e0e0e0;
    }

    .localplus-yearly-month-name {
        font-size: 1.3em;
        font-weight: 700;
        margin: 0;
        color: #1a1a1a;
    }

    .localplus-yearly-month-count {
        font-size: 0.85em;
        color: #666;
        background: #f5f5f5;
        padding: 4px 12px;
        border-radius: 12px;
    }

    /* Month Grid */
    .localplus-yearly-month-grid {
        display: flex;
        flex-direction: column;
    }

    .localplus-yearly-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        margin-bottom: 5px;
    }

    .localplus-yearly-weekday {
        text-align: center;
        font-size: 0.75em;
        font-weight: 600;
        color: #999;
        padding: 5px 0;
        text-transform: uppercase;
    }

    .localplus-yearly-days {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
    }

    .localplus-yearly-day {
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        background: #fafafa;
    }

    .localplus-yearly-day:hover {
        background: #f0f0f0;
        transform: scale(1.05);
    }

    .localplus-yearly-day.today {
        background: #e3f2fd;
        border: 2px solid #1976d2;
    }

    .localplus-yearly-day.has-events {
        background: #fff5e6;
    }

    .localplus-yearly-day.has-events:hover {
        background: #ffe8cc;
    }

    .localplus-yearly-day.empty {
        background: transparent;
        cursor: default;
    }

    .localplus-yearly-day.empty:hover {
        transform: none;
    }

    .localplus-yearly-day-number {
        font-size: 0.9em;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 2px;
    }

    .localplus-yearly-day.today .localplus-yearly-day-number {
        color: #1976d2;
        font-weight: 700;
    }

    .localplus-yearly-day-indicators {
        display: flex;
        gap: 2px;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 2px;
    }

    .localplus-yearly-indicator {
        width: 4px;
        height: 4px;
        background: #0073aa;
        border-radius: 50%;
    }

    .localplus-yearly-day.today .localplus-yearly-indicator {
        background: #1976d2;
    }

    .localplus-yearly-more {
        font-size: 0.65em;
        color: #0073aa;
        font-weight: 600;
    }

    /* Style 2: Compact */
    .localplus-yearly-style-2 .localplus-yearly-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
    }

    .localplus-yearly-style-2 .localplus-yearly-month {
        padding: 15px;
    }

    .localplus-yearly-style-2 .localplus-yearly-day {
        padding: 2px;
    }

    .localplus-yearly-style-2 .localplus-yearly-day-number {
        font-size: 0.8em;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .localplus-yearly-grid {
            grid-template-columns: 1fr;
        }

        .localplus-yearly-year {
            font-size: 1.5em;
        }
    }
</style>