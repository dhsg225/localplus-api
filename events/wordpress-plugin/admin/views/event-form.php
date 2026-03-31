<?php
/**
 * Admin Event Form View (Add/Edit)
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}

$is_edit = !empty($event);
$page_title = $is_edit ? __('Edit Event', 'localplus-events') : __('Add New Event', 'localplus-events');
?>

<div class="wrap">
    <h1><?php echo esc_html($page_title); ?></h1>
    
    <?php settings_errors('localplus_events'); ?>
    
    <form method="post" action="">
        <?php wp_nonce_field('localplus_event_save'); ?>
        
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="title"><?php _e('Title', 'localplus-events'); ?> <span class="required">*</span></label>
                </th>
                <td>
                    <input type="text" 
                           id="title" 
                           name="title" 
                           value="<?php echo $is_edit ? esc_attr($event['title']) : ''; ?>" 
                           class="regular-text" 
                           required>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="description"><?php _e('Description', 'localplus-events'); ?></label>
                </th>
                <td>
                    <?php
                    $content = $is_edit ? $event['description'] : '';
                    wp_editor($content, 'description', array(
                        'textarea_name' => 'description',
                        'textarea_rows' => 10,
                        'media_buttons' => false,
                    ));
                    ?>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="start_time"><?php _e('Start Time', 'localplus-events'); ?> <span class="required">*</span></label>
                </th>
                <td>
                    <input type="datetime-local" 
                           id="start_time" 
                           name="start_time" 
                           value="<?php echo $is_edit ? esc_attr(date('Y-m-d\TH:i', strtotime($event['start_time']))) : ''; ?>" 
                           required>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="end_time"><?php _e('End Time', 'localplus-events'); ?> <span class="required">*</span></label>
                </th>
                <td>
                    <input type="datetime-local" 
                           id="end_time" 
                           name="end_time" 
                           value="<?php echo $is_edit ? esc_attr(date('Y-m-d\TH:i', strtotime($event['end_time']))) : ''; ?>" 
                           required>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="status"><?php _e('Status', 'localplus-events'); ?></label>
                </th>
                <td>
                    <select id="status" name="status">
                        <option value="draft" <?php selected($is_edit ? $event['status'] : 'draft', 'draft'); ?>><?php _e('Draft', 'localplus-events'); ?></option>
                        <option value="published" <?php selected($is_edit ? $event['status'] : '', 'published'); ?>><?php _e('Published', 'localplus-events'); ?></option>
                        <option value="cancelled" <?php selected($is_edit ? $event['status'] : '', 'cancelled'); ?>><?php _e('Cancelled', 'localplus-events'); ?></option>
                    </select>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="event_type"><?php _e('Event Type', 'localplus-events'); ?></label>
                </th>
                <td>
                    <select id="event_type" name="event_type">
                        <option value="general" <?php selected($is_edit ? ($event['event_type'] ?? 'general') : 'general', 'general'); ?>><?php _e('General', 'localplus-events'); ?></option>
                        <option value="music" <?php selected($is_edit ? ($event['event_type'] ?? '') : '', 'music'); ?>><?php _e('Music', 'localplus-events'); ?></option>
                        <option value="festival" <?php selected($is_edit ? ($event['event_type'] ?? '') : '', 'festival'); ?>><?php _e('Festival', 'localplus-events'); ?></option>
                        <option value="wellness" <?php selected($is_edit ? ($event['event_type'] ?? '') : '', 'wellness'); ?>><?php _e('Wellness', 'localplus-events'); ?></option>
                        <option value="food" <?php selected($is_edit ? ($event['event_type'] ?? '') : '', 'food'); ?>><?php _e('Food', 'localplus-events'); ?></option>
                        <option value="sports" <?php selected($is_edit ? ($event['event_type'] ?? '') : '', 'sports'); ?>><?php _e('Sports', 'localplus-events'); ?></option>
                    </select>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="location"><?php _e('Location', 'localplus-events'); ?></label>
                </th>
                <td>
                    <input type="text" 
                           id="location" 
                           name="location" 
                           value="<?php echo $is_edit ? esc_attr($event['location'] ?? '') : ''; ?>" 
                           class="regular-text">
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="venue_area"><?php _e('Venue Area', 'localplus-events'); ?></label>
                </th>
                <td>
                    <input type="text" 
                           id="venue_area" 
                           name="venue_area" 
                           value="<?php echo $is_edit ? esc_attr($event['venue_area'] ?? '') : ''; ?>" 
                           class="regular-text"
                           placeholder="e.g., Hua Hin">
                </td>
            </tr>
        </table>
        
        <p class="submit">
            <input type="submit" 
                   name="localplus_event_submit" 
                   id="submit" 
                   class="button button-primary" 
                   value="<?php echo $is_edit ? esc_attr__('Update Event', 'localplus-events') : esc_attr__('Create Event', 'localplus-events'); ?>">
            <a href="<?php echo admin_url('admin.php?page=localplus-events'); ?>" class="button">
                <?php _e('Cancel', 'localplus-events'); ?>
            </a>
        </p>
    </form>
</div>

