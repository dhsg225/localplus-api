<?php 
/**
 * EventCard Event Type html content
 * @version 5.0
 */


if( empty($eventtype) || !isset( $eventtype['terms'] )) return '';

echo "<div class='evo_metarow_et evorow evcal_evdata_row evcal_evrow_sm ".$end_row_class."'>
		
		<div class='evcal_evdata_cell'>							
			<h3 class='evo_h3'>".evo_lang( 'Event Type')."</h3>";

		echo "<div class='evodfx evofxdrr evogap10 evofxww'>";
		foreach($eventtype['terms'] as $term_id => $term ){
			//EVO_Debug($term);
			
			$icon = evo_get_term_meta_field( 'event_type', $term_id, 'et_icon' );
			if( !empty($icon)) $icon = "<i class='fa {$icon}'></i>";
			$color = evo_get_term_meta_field( 'event_type', $term_id, 'et_color', '', 'dcdcdc' );

			$data = [
				'sp_title'=> evo_lang('Events in'). ' '. evo_lang( $term['tn'] ),
				'ajax'=> 'yes',
				'adata'=> [
					'a'=> 'eventon_get_instant_cal',
					'data'=> [
						'shortcode'=> apply_filters('evo_et_events_sc', [
							'calendar_type'=> 'default',
							'hide_past'=> 'yes',
							'number_of_months'=> 2,
							'event_type'=> $term['id'],
							'ux_val'=>'3'
							//'x_ids'=> $EVENT->ID,
						], $term, $EVENT),	
						'process_sc'=> true,
						'direction'=> 'next'					
					],
					'uid'=> 'evo_et_trigger',
				],
				'uid'=> 'evo_et_trigger',
				'end'=> 'client',
			];

			$text_color_class = ( !eventon_is_hex_dark( $color) ? 'evoclw':'evocl1' );

			echo "<button class='evo_et_trigger evoff_2i evofz14i evobrn evoboxsn evopad10-15 evobr8 evocurp evoHbgci  evoHbrc1 evoHcwi evo_transit_all evodfx evofxdrr evogap10 {$text_color_class}' data-d='". json_encode($data)."' data-id='{$term['id']}' style='background-color:#{$color}; '>{$icon}". $term['tn'] ."</button>";
		}

		echo "</div>";

echo "</div></div>";
?>