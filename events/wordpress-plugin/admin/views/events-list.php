<?php
/**
 * Admin Events List View
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

// Display settings errors
settings_errors('localplus_events');
?>

<div class="wrap">
    <h1 class="wp-heading-inline"><?php _e('LocalPlus Events', 'localplus-events'); ?></h1>
    <a href="<?php echo admin_url('admin.php?page=localplus-events-add'); ?>" class="page-title-action">
        <?php _e('Add New', 'localplus-events'); ?>
    </a>
    <hr class="wp-header-end">
    
    <?php if (is_wp_error($events)) : ?>
        <div class="notice notice-error">
            <p><?php echo esc_html($events->get_error_message()); ?></p>
        </div>
    <?php else : ?>
        <!-- Filters -->
        <div class="localplus-filters" style="margin: 20px 0; padding: 15px; background: #fff; border: 1px solid #ccd0d4;">
            <form method="get" action="">
                <input type="hidden" name="page" value="localplus-events">
                
                <select name="status" style="margin-right: 10px;">
                    <option value=""><?php _e('All Statuses', 'localplus-events'); ?></option>
                    <option value="published" <?php selected($filters['status'], 'published'); ?>><?php _e('Published', 'localplus-events'); ?></option>
                    <option value="draft" <?php selected($filters['status'], 'draft'); ?>><?php _e('Draft', 'localplus-events'); ?></option>
                    <option value="cancelled" <?php selected($filters['status'], 'cancelled'); ?>><?php _e('Cancelled', 'localplus-events'); ?></option>
                </select>
                
                <select name="event_type" style="margin-right: 10px;">
                    <option value=""><?php _e('All Categories', 'localplus-events'); ?></option>
                    <option value="music" <?php selected($filters['eventType'], 'music'); ?>><?php _e('Music', 'localplus-events'); ?></option>
                    <option value="festival" <?php selected($filters['eventType'], 'festival'); ?>><?php _e('Festival', 'localplus-events'); ?></option>
                    <option value="wellness" <?php selected($filters['eventType'], 'wellness'); ?>><?php _e('Wellness', 'localplus-events'); ?></option>
                    <option value="food" <?php selected($filters['eventType'], 'food'); ?>><?php _e('Food', 'localplus-events'); ?></option>
                    <option value="sports" <?php selected($filters['eventType'], 'sports'); ?>><?php _e('Sports', 'localplus-events'); ?></option>
                    <option value="general" <?php selected($filters['eventType'], 'general'); ?>><?php _e('General', 'localplus-events'); ?></option>
                </select>
                
                <select name="sort_by" style="margin-right: 10px;">
                    <option value="start_time" <?php selected($filters['sortBy'], 'start_time'); ?>><?php _e('Date & Time', 'localplus-events'); ?></option>
                    <option value="title" <?php selected($filters['sortBy'], 'title'); ?>><?php _e('Title', 'localplus-events'); ?></option>
                    <option value="event_type" <?php selected($filters['sortBy'], 'event_type'); ?>><?php _e('Category', 'localplus-events'); ?></option>
                    <option value="status" <?php selected($filters['sortBy'], 'status'); ?>><?php _e('Status', 'localplus-events'); ?></option>
                    <option value="location" <?php selected($filters['sortBy'], 'location'); ?>><?php _e('Location', 'localplus-events'); ?></option>
                    <option value="created_at" <?php selected($filters['sortBy'], 'created_at'); ?>><?php _e('Created', 'localplus-events'); ?></option>
                </select>
                
                <select name="sort_order" style="margin-right: 10px;">
                    <option value="asc" <?php selected($filters['sortOrder'], 'asc'); ?>><?php _e('Ascending', 'localplus-events'); ?></option>
                    <option value="desc" <?php selected($filters['sortOrder'], 'desc'); ?>><?php _e('Descending', 'localplus-events'); ?></option>
                </select>
                
                <input type="submit" class="button" value="<?php _e('Filter', 'localplus-events'); ?>">
            </form>
        </div>
        
        <!-- Events Table -->
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th scope="col" class="manage-column column-title"><?php _e('Title', 'localplus-events'); ?></th>
                    <th scope="col" class="manage-column"><?php _e('Date & Time', 'localplus-events'); ?></th>
                    <th scope="col" class="manage-column"><?php _e('Category', 'localplus-events'); ?></th>
                    <th scope="col" class="manage-column"><?php _e('Status', 'localplus-events'); ?></th>
                    <th scope="col" class="manage-column"><?php _e('Location', 'localplus-events'); ?></th>
                    <th scope="col" class="manage-column"><?php _e('Actions', 'localplus-events'); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($events)) : ?>
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px;">
                            <?php _e('No events found.', 'localplus-events'); ?>
                        </td>
                    </tr>
                <?php else : ?>
                    <?php foreach ($events as $event) : ?>
                        <tr>
                            <td class="title column-title">
                                <strong><?php echo esc_html($event['title']); ?></strong>
                            </td>
                            <td>
                                <?php 
                                $start = new DateTime($event['start_time']);
                                $end = new DateTime($event['end_time']);
                                echo esc_html($start->format('M j, Y g:i A'));
                                ?>
                            </td>
                            <td>
                                <span class="localplus-badge"><?php echo esc_html($event['event_type'] ?: 'general'); ?></span>
                            </td>
                            <td>
                                <span class="localplus-status localplus-status-<?php echo esc_attr($event['status']); ?>">
                                    <?php echo esc_html(ucfirst($event['status'])); ?>
                                </span>
                            </td>
                            <td>
                                <?php echo esc_html($event['venue_area'] ?: $event['location'] ?: '—'); ?>
                            </td>
                            <td>
                                <a href="<?php echo admin_url('admin.php?page=localplus-events-add&event_id=' . $event['id']); ?>" class="button button-small">
                                    <?php _e('Edit', 'localplus-events'); ?>
                                </a>
                                <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=localplus-events&action=delete&event_id=' . $event['id']), 'localplus_event_action_' . $event['id']); ?>" 
                                   class="button button-small button-link-delete"
                                   onclick="return confirm('<?php _e('Are you sure you want to delete this event?', 'localplus-events'); ?>');">
                                    <?php _e('Delete', 'localplus-events'); ?>
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>

<style>
.localplus-badge {
    display: inline-block;
    padding: 4px 8px;
    background: #0073aa;
    color: #fff;
    border-radius: 4px;
    font-size: 12px;
}

.localplus-status {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
}

.localplus-status-published {
    background: #d4edda;
    color: #155724;
}

.localplus-status-draft {
    background: #fff3cd;
    color: #856404;
}

.localplus-status-cancelled {
    background: #f8d7da;
    color: #721c24;
}
</style>

