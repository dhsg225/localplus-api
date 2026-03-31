<?php
/**
 * Multi Data Types Class
 * @version 5.0
 */
if ( ! defined( 'ABSPATH' ) ) exit;

class evo_mdt{
	public $opt;
	public function __construct(){
		$this->opt = EVO()->cal->get_op('evcal_1');

		add_action('admin_init', array($this, 'admin_init'));
		// /add_action('init', array($this, 'init'));

		// register MDT
		add_action('eventon_register_taxonomy', array($this, 'register'), 10);

		// frontend boxes
		add_filter( 'eventon_eventcard_boxes', array( $this, 'eventCard_inclusion' ), 10,1 );
		add_filter('eventon_eventcard_array', array($this, 'eventcard_array'), 10, 4);
		add_filter('evo_eventcard_adds', array($this, 'eventcard_adds'), 10, 1);
		
		for($x=1; $x <= $this->evo_get_mdt_count() ; $x++){
			add_filter('eventon_eventCard_evomdt_'.$x, array($this, 'frontend_box'), 10, 3);
		}
	}

	function admin_init(){
		// event meta box
		add_filter('eventon_event_metaboxs',array($this, 'event_metabox'), 10, 2);
		add_action('eventon_save_meta', array($this, 'save_event_post'), 10, 2);
				
		add_filter( 'eventon_custom_icons',array($this, 'custom_icons') , 10, 1);

		// taxonomy connect
		add_filter( 'evo_taxonomy_form_fields_array',array($this, 'form_field_array') , 10, 3);
		add_filter( 'evo_tax_translated_names',array($this, 'human_tax_name') , 10, 2);

		// custom image field
		$evo_get_mdt_names = $this->evo_get_mdt_names($this->opt);
		for($x=1; $x<= $this->evo_get_mdt_count($this->opt); $x++){
			$mdt_name = $evo_get_mdt_names[$x];

			if( evo_settings_check_yn($this->opt , 'evcal_mdt_img'.$x) ){

				add_action( 'multi_data_type_'.$x.'_add_form_fields', array($this,'custom_field_new'), 10, 2 );
		 		add_action( 'multi_data_type_'.$x.'_edit_form_fields', array($this,'custom_field_edit'), 10, 2 );
		 		add_action( 'edited_multi_data_type_'.$x, array($this,'save_custom_field'), 10, 2 );
		 		add_action( 'create_multi_data_type_'.$x, array($this,'save_custom_field'), 10, 2 );
		 	}
		}

	}

	// Register
		function register(){
			// Each activated multi data types
			$evo_get_mdt_names = $this->evo_get_mdt_names($this->opt);

			$__capabilities = array(
				'manage_terms' 		=> 'manage_eventon_terms',
				'edit_terms' 		=> 'edit_eventon_terms',
				'delete_terms' 		=> 'delete_eventon_terms',
				'assign_terms' 		=> 'assign_eventon_terms',
			);

			for($x=1; $x<= $this->evo_get_mdt_count($this->opt); $x++){
				$mdt_name = $evo_get_mdt_names[$x];

				register_taxonomy( 'multi_data_type_'.$x, 
					apply_filters( 'eventon_taxonomy_objects_mdt'.$x, array('ajde_events') ),
					apply_filters( 'eventon_taxonomy_args_mdt'.$x, array(
						'hierarchical' 			=> false, 
						'label'	 				=> $mdt_name,
						'show_ui' => true,
						'show_in_menu'=>true,
						'show_in_nav_menu'=>true,
						'show_tagcloud'=>false,
						'show_admin_column'=>false,
						'show_in_quick_edit'         => false,
	    				'meta_box_cb'                => false,
						'query_var' => true,
						'capabilities'			=> $__capabilities,
						'rewrite' => array( 'slug' => 'multi-data-type-'.$x ) 
					)) 
				);
			}
		}

	// Frontend
		function eventCard_inclusion($array){
			$mdt_name = $this->evo_get_mdt_names();
			for($x=1; $x <= $this->evo_get_mdt_count() ; $x++){
				$array['evomdt_'.$x]= array( 'evomdt_'.$x, $mdt_name[$x]);
			}

			return $array;
		}
		function custom_icons($array){
			$mdt_name = $this->evo_get_mdt_names();
			for($x=1; $x <= $this->evo_get_mdt_count() ; $x++){
				$array[] = array('id'=>'evcal__evomdt_'.$x,'type'=>'icon','name'=> $mdt_name[$x].' Icon','default'=>'fa-list');
			}
			return $array;
		}
		function frontend_box($object, $helpers, $EVENT){

			$x = $object->x;
			$mdt_name = $this->evo_get_mdt_names();
			$terms = wp_get_post_terms($object->event_id, $object->tax);

			if ( $terms && ! is_wp_error( $terms ) ):
			ob_start();
			echo  "<div class='evo_metarow_mdt_{$x} evo_metarow_mdt evorow evcal_evdata_row evcal_evrow_sm".$helpers['end_row_class']."' data-event_id='".$EVENT->ID."'>
					<span class='evcal_evdata_icons'><i class='fa ".get_eventON_icon('evcal__evomdt_'.$x, 'fa-list',$helpers['evOPT'] )."'></i></span>
					<div class='evcal_evdata_cell'>";
				echo "<h3 class='evo_h3'>".evo_lang($mdt_name[$x])."</h3>";

				if(!empty($EVENT->get_prop('_evomdt_subheader_'.$x) ))
					echo "<p class='evomdt_subtitle'>". $EVENT->get_prop('_evomdt_subheader_'.$x) ."</p>";

				// each term
				$tax_data = $this->get_mdt_term_data( $object->tax );
				$is_sort = $EVENT->check_yn('_evomdt_sort_'. $x );

				$term_content = [];

				
				foreach($terms as $term){
					ob_start();
					echo "<div class='evomdt_item evodfx evofxdrc evofxww evogap20'>";

					// term image
					$img_attr = '';
					if(!empty($tax_data[$term->term_id]['image']))
						$img_attr = wp_get_attachment_image_src( $tax_data[$term->term_id]['image'], 'full' );

						if( $img_attr){
							echo "<div class='evo_img_triglb  evobgsc evobgpc evobr15 evodb' style='height:200px; width:200px; background-image: url(". $img_attr[0].");' data-f='{$img_attr[0]}' data-w='{$img_attr[1]}' data-h='{$img_attr[2]}' ></div>";
						}

					echo "<div class=''>";
						echo "<h4 class='evoff_1 evofz16i evomarb10i'>".$tax_data[$term->term_id]['name'].'</h4>';
						echo "<div class='evomarb10'>";
						echo apply_filters('the_content',$tax_data[$term->term_id]['description']);
						echo "</div>";
						// additional data fields
						$this->additional_field_values($object->tax, $tax_data , $term->term_id);

					echo "</div>";

					echo "</div>";

					// if sorting
					if( $is_sort ){
						$pre_sel_val = !empty( $tax_data[ $term->term_id ]['evcal_mdta_1_1'] ) ? $tax_data[ $term->term_id ]['evcal_mdta_1_1']: 'none';
						$term_content[$pre_sel_val][ $term->term_id ] = ob_get_clean();
					}else{
						$term_content[ $term->term_id ] = ob_get_clean();
					}
				}

				//EVO_Debug($term_content);


				if( $is_sort ):

					$options_str = EVO()->cal->get_prop('evcal_mdta_1_1_fv', 'evcal_1');
		            $options = $options_str ? array_filter(array_map('trim', explode(',', $options_str)), 'strlen') : [];
		            array_unshift($options, '-');

					foreach($term_content as $preset_val => $termids){


						if(isset($options[$preset_val]) ){
							echo "<p class='evomarb20i evomart10i evoff_1i evofz16i'>". $options[$preset_val] ."</p>";
						}elseif ( $preset_val == 'none'){
							echo "<p class='evomarb20i evomart10i evoff_1i evofz16i'>". evo_lang("No Category") ."</p>";
						}

						echo "<div class='evomdt_data grid'>";

						foreach($termids as $content){
							echo $content;
						}
						echo "</div>";
					}
				else:
					echo "<div class='evomdt_data grid'>";
					foreach($term_content as  $content){
						echo $content;
					}
					echo "</div>";
				endif;


			echo "</div>";
			echo "</div>";

			return ob_get_clean();
			endif;
		}
		private function additional_field_values($tax, $tax_data, $termid){

			$mdt_index = $this->tax_index($tax);

		    for( $z=1; $z <= $this->evo_max_mdt_addfield_count(); $z++){
		        $postfix = $mdt_index. '_' .$z;
		        $field_pre_var = 'evcal_mdta_'.$mdt_index. '_' .$z;

		        if( EVO()->cal->get_prop( $field_pre_var ) &&
		            !empty($this->opt['evcal_mdta_name_'.$postfix]) &&
		            !empty($tax_data[$termid]['evcal_mdta_'.$postfix])
		        ){	

		            $visibility = isset($this->opt['evcal_mdta_'.$postfix.'_v']) ? $this->opt['evcal_mdta_'.$postfix.'_v'] : 0;
		            $field_type = EVO()->cal->get_prop($field_pre_var.'_ft', 'evcal_1', '0');
		            $saved_value = $tax_data[$termid]['evcal_mdta_'.$postfix];
		            $options_str = EVO()->cal->get_prop($field_pre_var.'_fv', 'evcal_1');
		            $options = $options_str ? array_filter(array_map('trim', explode(',', $options_str)), 'strlen') : [];
		            array_unshift($options, '-');

		            if( $visibility == 0 ){
		                echo "<p><span>" . esc_html($this->opt['evcal_mdta_name_'.$postfix]) . "</span>";

		                if ($field_type == '1' && $options) {
		                    // Select field: map index to value
		                    $index = intval(stripslashes($saved_value));
		                    $display_value = isset($options[$index]) ? $options[$index] : stripslashes($saved_value);
		                    echo esc_html($display_value);
		                } else {
		                    // Text field: apply link filtering
		                    if( strtolower(substr(stripslashes($saved_value), 0, 4)) == 'http' ){
		                        echo '<a href="' . esc_url(stripslashes($saved_value)) . '" target="_blank">' . esc_html(stripslashes($saved_value)) . "</a>";
		                    } else {
		                        echo esc_html(stripslashes($saved_value));
		                    }
		                }
		                echo "</p>";
		            }						
		        }
		    }
		}	

		function eventcard_array($array, $pmv, $eventid, $__repeatInterval){
			for($x=1; $x <= $this->evo_get_mdt_count() ; $x++){
				$array['evomdt_'.$x]= array(
					'event_id' => $eventid,
					//'pmv'=>$pmv,
					'x'=>$x,
					'tax'=>'multi_data_type_'.$x,
					'__repeatInterval'=>(!empty($__repeatInterval)? $__repeatInterval:0)
				);
			}
			return $array;
		}
		function eventcard_adds($array){
			for($x=1; $x <= $this->evo_get_mdt_count() ; $x++){	$array[] = 'evomdt_'.$x;	}
			return $array;
		}

		
	// Event Post meta box		
		function event_metabox($array, $EVENT){
			$mdt_name = $this->evo_get_mdt_names();
			for($x=1; $x <= $this->evo_get_mdt_count() ; $x++){	
				$icon = get_eventON_icon('evcal__evomdt_'.$x, 'fa-list',$this->opt );			
				$array[] = array(
					'id'=>'ev_mdt_'.$x,
					'name'=> __('Multi Data','eventon')  .' #'. $x ,
					'name_full'=> __('Multi Data','eventon')  .' - '. $mdt_name[$x] ,
					'variation'=>'customfield',	
					'hiddenVal'=>'',	
					'iconURL'=>$icon,
					'iconPOS'=>'',
					'type'=>'code',
					'content'=>$this->content($mdt_name[$x], 'multi_data_type_'.$x, $x, $EVENT),
					'slug'=>'ev_mdt_1'
				);
			}

			return $array;			
		}
		function content($name, $tax, $x, $EVENT){
			
			ob_start();
			$mdt_name = EVO()->cal->get_prop('evcal_mdt_name_'. $x,'evcal_1');
			?>
			<div class='evcal_data_block_style1'>
				<div class='evcal_db_data'>
					<p>
						<input type="text" id="evcal_subheader_<?php echo $x;?>" name="_evomdt_subheader_<?php echo $x;?>" value="<?php echo $EVENT->get_prop('_evomdt_subheader_'.$x);?>" style="width:100%"/>
						<label for="evcal_lmlink_target"><?php _e('Section subtitle text','eventon');?></label>	
					</p>
					<div class='evo_singular_tax_for_event <?php echo $tax;?>' >
					<?php 

					echo EVO()->taxonomies->get_meta_box_content( $tax, $EVENT->ID);
					?>
					</div>

					<?php 
					echo EVO()->elements->get_element([
						'type'=> 'yesno',
						'id'=> '_evomdt_sort_'. $x,
						'name'=> sprintf(__('Sort %s by Pre-set Values'), $mdt_name),
						'tooltip'=> __('This will sort all items based on the order of the Pre-set values, if pre-set values are set.'),
						'value'=> $EVENT->get_prop('_evomdt_sort_'. $x),
					]);	
					?>
				</div>
			</div>
			<?php 

			return ob_get_clean();
		}
		public function save_event_post($fields, $post_id){
			$help = new evo_helper();
		    $postdata = $help->sanitize_array($_POST);

		    for($x=1; $x <= $this->evo_get_mdt_count(); $x++){	
		    	// Define fields to save
		        $mdt_fields = [
		            '_evomdt_subheader_' . $x ,
		            '_evomdt_sort_' . $x 
		        ];

		        // Save each field
		        foreach ($mdt_fields as $key ) {
		            if (isset($postdata[$key])) {
		                update_post_meta($post_id, $key, $postdata[$key] );
		            } else {
		                delete_post_meta($post_id, $key);
		            }
		        }	        
		    }

		}

		// add meta data fields to tax array
		public function form_field_array($array, $tax, $event_tax_term){

			if( strpos($tax, 'multi_data_type_') === false ) return $array;
						
			$mdt_index = $this->tax_index($tax);

			$array[$tax ] = array(
				'term_name'=>array(
					'type'=>'text',
					'name'=> __('Name','eventon'),
					'value'=> ($event_tax_term? $event_tax_term->name:''),
					'var'=>	'term_name'
				),
				'description'=> array(
					'type'=>'textarea',
					'name'=>__('Description','eventon'),
					'var'=>'description',
					'value'=> ($event_tax_term? $event_tax_term->description:''),				
				),
			);

			// image field
				if( evo_settings_check_yn($this->opt , 'evcal_mdt_img'.$mdt_index) ){
					$array[$tax ]['image'] = array(
						'type'=>'image',
						'name'=>__('Image','eventon'),
						'var'=>	'image'
					);
				}

			// foreach additional fields - support field types = text, select
				for( $z=1; $z <= $this->evo_max_mdt_addfield_count(); $z++){
					$postfix = $mdt_index. '_' .$z;
					$field_pre_var = 'evcal_mdta_'.$mdt_index. '_' .$z;

					if( EVO()->cal->get_prop($field_pre_var, 'evcal_1') && EVO()->cal->get_prop( 'evcal_mdta_name_'.$postfix , 'evcal_1' ) ){	
						$field_name_var = 'term_meta['. $field_pre_var .']';
						$_field_type = EVO()->cal->get_prop($field_pre_var .'_ft', 'evcal_1', '0');
						$_field_value = EVO()->cal->get_prop( $field_pre_var . '_fv','evcal_1');


						$field_type = ( $_field_type == '1' && $_field_value ) ? 'select' : 'text';
        				$options = $_field_value ? array_filter(array_map('trim', explode(',', $_field_value)), 'strlen') : [];
        				if ($field_type == 'select')  array_unshift($options, '-');

						$array[$tax ]['evcal_mdta_'.$postfix] = array(
							'type'=> $field_type,
							'name'=>$this->opt[ 'evcal_mdta_name_'.$postfix],	
							'var'=>'evcal_mdta_'.$postfix,
							'options'=> 	$options		
						);
					}
				}


				//$array[$tax ]['submit'] = array('type'=>'button', 'name'=>'');


			return $array;

		}

		function human_tax_name($array, $tax){
			if( strpos($tax, 'multi_data_type_') === false ) return $array;

			$mdt_index = $this->tax_index($tax);
			$array[ $tax ] = $this->get_mdt_name($mdt_index );
			return $array;
		}

	// admin
		public function custom_field_new($taxonomy){
			$mdt_index = str_replace('_', '', ( strrchr($taxonomy, '_') ) );
			$term_field_name = 'evcal_mdt_img' . $mdt_index;
				

			?><div class='evo_mdt_img_holder'>
				<?php
				EVO()->elements->get_element(array(
					'_echo'=>true,
					'type'=>'image',
					'id'=> "term_meta[".$term_field_name ."]",
					'value'=> '',
					'name'=> __('Choose Image','eventon'),
				));
				?>
			</div>
			
			<?php

			for( $z=1; $z <= $this->evo_max_mdt_addfield_count(); $z++){
				$postfix = $mdt_index. '_' .$z;
				$field_pre_var = 'evcal_mdta_'.$mdt_index. '_' .$z;

				if( EVO()->cal->get_prop($field_pre_var, 'evcal_1') && EVO()->cal->get_prop( 'evcal_mdta_name_'.$postfix , 'evcal_1' ) ){	
					$field_name_var = 'term_meta['. $field_pre_var .']';
					$field_type = EVO()->cal->get_prop($field_pre_var .'_ft', 'evcal_1', '0');
					$field_value = EVO()->cal->get_prop( $field_pre_var . '_fv','evcal_1');

					if( $field_type == '1' && !$field_value ) $field_type = '0';

					echo '<div class="form-field">';
					switch ($field_type) {
						case '1': // select field

							?>
							<label for="<?php echo $field_name_var;?>"><?php echo EVO()->cal->get_prop( 'evcal_mdta_name_'.$postfix ); ?></label>
							<?php
				            echo "<select name='$field_name_var' id='$field_name_var'>";
				            if ($field_value) {
				                $options = array_map('trim', explode(',', $field_value));
				                array_unshift($options, '-');
				                foreach ($options as $index=>$option) {
				                    $option = trim($option); // Remove any extra whitespace
				                    echo "<option value='" . $index . "'>" . esc_html($option) . "</option>";
				                }
				            } else {
				                echo "<option value=''>" . __('No options available', 'eventon') . "</option>";
				            }
				            echo "</select>";
							break;
						
						default: // text field
							?>
							<label for="<?php echo $field_name_var;?>"><?php echo EVO()->cal->get_prop( 'evcal_mdta_name_'.$postfix ); ?></label>
							<input type="text" name="<?php echo $field_name_var;?>" id="<?php echo $field_name_var;?>" value="">
							<?php
							break;
					}
					echo "</div>";					
				}
			}
		}

		// edit term fields
		public function custom_field_edit($term, $taxonomy){

			$mdt_index = str_replace('_', '', ( strrchr($taxonomy, '_') ) );

			$term_meta = evo_get_term_meta($taxonomy ,$term->term_id);

			?>
			<tr class="form-field">
				<th scope="row" valign="top"><label for="term_meta[image]"><?php _e( 'Image', 'eventon' ); ?></label></th>
				<td class=''>
					<div class='evo_mdt_img_holder'>
					<?php
						$img_id = !empty($term_meta[ 'image' ]) ? $term_meta[ 'image' ] : null;						

						EVO()->elements->get_element(array(
							'_echo'=>true,
							'type'=>'image',
							'id'=> "term_meta[image]",
							'value'=> $img_id,
							'name'=> '',
						));
						?>
					</div>
					<p class="description"><?php _e( '(Optional) Image','eventon' ); ?></p>
				</td>
			</tr>
			<?php

			// additional meta fields
			for( $z=1; $z <= $this->evo_max_mdt_addfield_count(); $z++){
				$postfix = $mdt_index. '_' .$z;
				if( evo_settings_check_yn($this->opt , 'evcal_mdta_'.$postfix) &&
					!empty( $this->opt[ 'evcal_mdta_name_'.$postfix ])
				){	
					$field_name_var = 'term_meta[evcal_mdta_'. $postfix .']';
					$field_value = !empty( $term_meta[ 'evcal_mdta_'. $postfix ] ) ? $term_meta[ 'evcal_mdta_'. $postfix ]: null;
					?>
					<tr class="form-field">
							<th scope="row" valign="top"><label for="<?php echo $field_name_var;?>"><?php echo $this->opt[ 'evcal_mdta_name_'.$postfix]; ?></label></th>
							<td>
								<input type="text" name="<?php echo $field_name_var;?>" id="<?php echo $field_name_var;?>" value="<?php echo $field_value; ?>">
							</td>
						</tr>
					<?php					
				}
			}
		}

		// @updated 4.3.5
		function save_custom_field($term_id){
			$help = new evo_helper();
			$postdata = $help->sanitize_array( $_POST );

			if( !isset( $postdata['term_meta'] ) ) return;
			if( !isset( $postdata['taxonomy'] ) ) return;

			$taxonomy = $postdata['taxonomy'];
			
			if (  strpos($taxonomy, 'multi') !== false ) {


				$mdt_index = str_replace('_', '', ( strrchr($taxonomy, '_') ) );

				$term_meta_fields = array('image');
				// include additional meta fields
				for( $z=1; $z <= $this->evo_max_mdt_addfield_count(); $z++){
					$term_meta_fields[] = 'evcal_mdta_' . $mdt_index. '_'. $z;
				}			

				$term_meta = evo_get_term_meta($taxonomy ,$term_id);

				foreach( $term_meta_fields as $field ){
					if( !isset( $postdata['term_meta'][ $field ] )) continue;

					

					$term_meta[ $field ] = $postdata['term_meta'][ $field ];
				}

				evo_save_term_metas($taxonomy, $term_id, $term_meta);
				
			}
		}

	// Supportive
		function tax_index($tax){
			$mdt_index = explode('_', $tax);
			return $mdt_index[3];
		}
		function evo_max_mdt_count(){
			return apply_filters('evo_multi_data_type_count',3);
		}
		// this return the count for each multi data type that are activated in accordance
		function evo_get_mdt_count($evopt=''){
			$evopt = (!empty($evopt))? $evopt: $this->opt;

			$maxnum = $this->evo_max_mdt_count();
			$count=0;
			for($x=1; $x<= $maxnum; $x++ ){
				if(!empty($evopt['evcal_mdt_'.$x]) && $evopt['evcal_mdt_'.$x]=='yes'){
					$count = $x;
				}else{	break;	}
			}
			return $count;
		}
		function evo_get_mdt_names($options=''){
			$output = array();

			$options = (!empty($options))? $options: $this->opt;
			for( $x=1; $x <= $this->evo_max_mdt_count($options); $x++){

				$pretext = (!empty($options['evcal_mdt_name_'.$x ]))? 
					$options['evcal_mdt_name_'.$x ]:'Multi Data Type '.$x;

				$output[$x] = evo_lang_get('multi-data-type-'.$x, $pretext);
			}
			return $output;
		}
		function get_mdt_name( $mdt_index){
			$options = $this->opt;
			$pretext = (!empty($options['evcal_mdt_name_'.$mdt_index ]))? 
					$options['evcal_mdt_name_'.$mdt_index ]:
					'Multi Data Type '.$mdt_index;

			return evo_lang_get('multi-data-type-'. $mdt_index , $pretext);
		}
		function evo_max_mdt_addfield_count(){
			return apply_filters('evo_multi_data_type_fields_count',3);
		}
		function get_mdt_term_data($tax){
			$output = array();
			$terms = get_terms($tax, array('hide_empty'=>false));
			if ( $terms && ! is_wp_error( $terms ) ){
				
				$fields = $this->fields_of_mdt($tax);
				
				foreach($terms as $term){

					$termmeta = evo_get_term_meta($tax,$term->term_id);

					$output[$term->term_id]['name'] = $term->name;
					$output[$term->term_id]['description'] = $term->description;

					// each additional data field
					foreach($fields as $field=>$val){
						if(in_array($field, array('name','description'))) continue;
						if(empty($termmeta[$field])) continue;
						$output[$term->term_id][$field] = $termmeta[$field];
					}
				}
			}
			return $output;
		}
		function fields_of_mdt($tax='multi_data_type_1'){

			$mdt_index = $this->tax_index($tax);

			$base = array(
				'name'=>array('Name','text'),
				'description'=> array('Description','textarea'),
			);

			// image field
				if( evo_settings_check_yn($this->opt , 'evcal_mdt_img'.$mdt_index) ){
					$base['image'] = array('Image','image');
				}

			// foreach additional fields
				for( $z=1; $z <= $this->evo_max_mdt_addfield_count(); $z++){
					$postfix = $mdt_index. '_' .$z;
					if( evo_settings_check_yn($this->opt , 'evcal_mdta_'.$postfix) &&
						!empty( $this->opt[ 'evcal_mdta_name_'.$postfix ])
					){
						$base['evcal_mdta_'.$postfix] = array(
							$this->opt[ 'evcal_mdta_name_'.$postfix],
							'text',
							'norequired'
						);
					}
				}
			return $base;
		}
}