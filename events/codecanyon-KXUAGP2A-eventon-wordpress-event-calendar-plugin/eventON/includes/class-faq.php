<?php
/**
 * EVO_FAQ Class
 * Custom taxonomy for Event FAQs
 * @version 5.0
 */
if ( ! defined( 'ABSPATH' ) ) exit;

class EVO_FAQ {
    public $opt;

    public function __construct() {
        $this->opt = EVO()->cal->get_op('evcal_1');

        add_action('admin_init', array($this, 'admin_init'));
        add_action('eventon_register_taxonomy', array($this, 'register'), 10);

        // Frontend event card integration
        add_filter('eventon_eventcard_boxes', array($this, 'eventcard_inclusion'), 10, 1);
        add_filter('eventon_eventcard_array', array($this, 'eventcard_array'), 10, 4);
        add_filter('evo_eventcard_adds', array($this, 'eventcard_adds'), 10, 1);
        add_filter('eventon_eventCard_evo_faq', array($this, 'frontend_box'), 10, 3);

        // Custom icon for FAQs
        add_filter('eventon_custom_icons', array($this, 'custom_icons'), 10, 1);

        // Taxonomy form fields
        add_filter('evo_taxonomy_form_fields_array', array($this, 'form_field_array'), 10, 3);
        add_filter('evo_tax_translated_names', array($this, 'human_tax_name'), 10, 2);
    }

    public function admin_init() {
        // Event meta box
        add_filter('eventon_event_metaboxs', array($this, 'event_metabox'), 10, 2);
        add_action('eventon_save_meta', array($this, 'save_event_post'), 10, 2);
    }

    // Register the evo_faq taxonomy
    public function register() {
        $__capabilities = array(
            'manage_terms' => 'manage_eventon_terms',
            'edit_terms' => 'edit_eventon_terms',
            'delete_terms' => 'delete_eventon_terms',
            'assign_terms' => 'assign_eventon_terms',
        );

        register_taxonomy('evo_faq', 
            apply_filters('eventon_taxonomy_objects_evo_faq', array('ajde_events')),
            apply_filters('eventon_taxonomy_args_evo_faq', array(
                'hierarchical' => false,
                'label' => __('Event FAQs', 'eventon'),
                'show_ui' => true,
                'show_in_menu' => true,
                'show_in_nav_menus' => true,
                'show_tagcloud' => false,
                'show_admin_column' => false,
                'show_in_quick_edit' => false,
                'meta_box_cb' => false,
                'query_var' => true,
                'capabilities' => $__capabilities,
                'rewrite' => array('slug' => 'event-faq')
            ))
        );
    }

    // Frontend Integration
    public function eventcard_inclusion($array) {
        $array['evo_faq'] = array('evo_faq', __('Event FAQs', 'eventon'));
        return $array;
    }

    public function custom_icons($array) {
        $array[] = array(
            'id' => 'evcal__evo_faq',
            'type' => 'icon',
            'name' => __('Event FAQs Icon', 'eventon'),
            'default' => 'fa-question-circle'
        );
        return $array;
    }

    public function frontend_box($object, $helpers, $EVENT) {
        $terms = wp_get_post_terms($object->event_id, $object->tax);

        if ($terms && !is_wp_error($terms)) {
            $terms_count = count($terms);
            $index = 0;
            ob_start();
            ?>
            <div class='evo_metarow_faq evo_metarow_faq evorow evcal_evdata_row evcal_evrow_sm <?php echo $helpers['end_row_class']; ?>' data-event_id='<?php echo $EVENT->ID; ?>'>
                <span class='evcal_evdata_icons'><i class='fa <?php echo get_eventON_icon('evcal__evo_faq', 'fa-question-circle', $helpers['evOPT']); ?>'></i></span>
                <div class='evcal_evdata_cell'>
                    <h3 class='evo_h3'><?php echo evo_lang( 'FAQ' ); ?></h3>
                    <?php if (!empty($EVENT->get_prop('_evo_faq_subheader')) ) : ?>
                        <p class='evo_faq_subtitle evomarb15i'><?php echo $EVENT->get_prop('_evo_faq_subheader'); ?></p>
                    <?php endif; ?>
                    <div class='evo_faq_data'>
                        <?php 

                        foreach ($terms as $term) : 
                            $faClass = ($index === 0) ? 'minus' : 'plus';
                            $border = ($terms_count > 1) ? 'evoborderb' : '';
                            $display = ($index === 0) ? '' : ' evodn';
                            
                        ?>
                            <div class='evo_faq_item evomarb10 evopadb0 <?= $border;?>'>
                                <h4 class='evoff_1i evomar0 evomarb10i evopad0i evocurp evodfx evofxjcsb evohoop7 evo_faq_toggle'><?php echo $term->name; ?>
                                    <i class='fa fa-<?php echo $faClass;?>'></i></h4>
                                <div class='evo_faq_answer evopadb10<?php echo $display; ?>'><?php echo apply_filters('the_content', $term->description); ?></div>
                            </div>
                        <?php $index++;
                        endforeach; ?>
                    </div>
                </div>
            </div>
            <?php
            return ob_get_clean();
        }
    }

    public function eventcard_array($array, $pmv, $eventid, $__repeatInterval) {
        $array['evo_faq'] = array(
            'event_id' => $eventid,
            'x' => 1,
            'tax' => 'evo_faq',
            '__repeatInterval' => (!empty($__repeatInterval) ? $__repeatInterval : 0)
        );
        return $array;
    }

    public function eventcard_adds($array) {
        $array[] = 'evo_faq';
        return $array;
    }

    // Event Post Meta Box
    public function event_metabox($array, $EVENT) {
        $array[] = array(
            'id' => 'evo_faq',
            'name' => __('FAQs', 'eventon'),
            'variation' => 'customfield',
            'hiddenVal' => '',
            'iconURL' => get_eventON_icon('evcal__evo_faq', 'fa-question-circle', $this->opt),
            'iconPOS' => '',
            'type' => 'code',
            'content' => $this->content($EVENT),
            'slug' => 'evo_faq'
        );
        return $array;
    }

    public function content($EVENT) {
        ob_start();
        ?>
        <div class='evcal_data_block_style1'>
            <div class='evcal_db_data'>
                <p>
                    <input type="text" id="evcal_subheader_faq" name="_evo_faq_subheader" value="<?php echo $EVENT->get_prop('_evo_faq_subheader'); ?>" style="width:100%"/>
                    <label for="evcal_subheader_faq"><?php _e('Section subtitle text', 'eventon'); ?></label>
                </p>
                <div class='evo_singular_tax_for_event evo_faq'>
                    <?php echo EVO()->taxonomies->get_meta_box_content('evo_faq', $EVENT->ID); ?>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function save_event_post($fields, $post_id) {
        if (isset($_POST['_evo_faq_subheader'])) {
            update_post_meta($post_id, '_evo_faq_subheader', $_POST['_evo_faq_subheader']);
        } else {
            delete_post_meta($post_id, '_evo_faq_subheader');
        }
    }

    // Taxonomy Form Fields
    public function form_field_array($array, $tax, $event_tax_term) {
        if ($tax !== 'evo_faq') return $array;

        $array['evo_faq'] = array(
            'term_name' => array(
                'type' => 'text',
                'name' => __('Question', 'eventon'),
                'value' => ($event_tax_term ? $event_tax_term->name : ''),
                'var' => 'term_name',
                'tooltip'=> __('If you change the question, it will create a new FAQ item.')
            ),
            'description' => array(
                'type' => 'textarea',
                'name' => __('Answer', 'eventon'),
                'var' => 'description',
                'value' => ($event_tax_term ? $event_tax_term->description : ''),
            ),
        );

        return $array;
    }

    public function human_tax_name($array, $tax) {
        if ($tax === 'evo_faq') {
            $array['evo_faq'] = __('Event FAQs', 'eventon');
        }
        return $array;
    }
}