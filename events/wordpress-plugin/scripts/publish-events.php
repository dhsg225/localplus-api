<?php
/**
 * Script to publish events from Dec 3, 2025 going back 30 days
 * 
 * Usage: wp eval-file publish-events.php
 * Or: php publish-events.php (if run from WordPress root)
 * 
 * @package LocalPlus_Event_Engine
 */

// Load WordPress
if (file_exists(__DIR__ . '/../../../../wp-load.php')) {
    require_once __DIR__ . '/../../../../wp-load.php';
} else {
    die('WordPress not found. Please run this from WordPress root or use: wp eval-file publish-events.php');
}

// Load plugin classes
require_once __DIR__ . '/../includes/class-api-client.php';

// Date range: Last 1 year from today
$end_date = new DateTime(); // Today
$start_date = new DateTime();
$start_date->modify('-1 year'); // 1 year ago

echo "Publishing events from the last 1 year ({$start_date->format('Y-m-d')} to {$end_date->format('Y-m-d')})...\n\n";

// Initialize API client
$api_client = new LocalPlus_API_Client();

// Get all events in date range
$filters = array(
    'startDate' => $start_date->format('c'), // ISO 8601 format
    'endDate' => $end_date->format('c'),
    'limit' => 1000, // Get all events
);

$events = $api_client->get_events($filters);

if (is_wp_error($events)) {
    die('Error fetching events: ' . $events->get_error_message() . "\n");
}

if (empty($events)) {
    echo "No events found in date range.\n";
    exit;
}

echo "Found " . count($events) . " events in date range.\n\n";

$published_count = 0;
$skipped_count = 0;
$error_count = 0;

foreach ($events as $event) {
    $event_id = $event['id'];
    $title = $event['title'] ?? 'Untitled';
    $status = $event['status'] ?? 'draft';
    $start_time = $event['start_time'] ?? '';
    
    // Skip if already published
    if ($status === 'published') {
        echo "✓ Skipping: {$title} (already published)\n";
        $skipped_count++;
        continue;
    }
    
    // Skip if cancelled
    if ($status === 'cancelled') {
        echo "⊘ Skipping: {$title} (cancelled, not publishing)\n";
        $skipped_count++;
        continue;
    }
    
    // Update to published
    echo "→ Publishing: {$title}... ";
    
    $result = $api_client->update_event($event_id, array(
        'status' => 'published'
    ));
    
    if (is_wp_error($result)) {
        echo "ERROR: " . $result->get_error_message() . "\n";
        $error_count++;
    } else {
        echo "DONE\n";
        $published_count++;
    }
}

echo "\n";
echo "========================================\n";
echo "Summary:\n";
echo "  Published: {$published_count}\n";
echo "  Skipped (already published): {$skipped_count}\n";
echo "  Errors: {$error_count}\n";
echo "  Total processed: " . count($events) . "\n";
echo "========================================\n";

