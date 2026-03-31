<?php 
/**
 * EventCard Organizer html content
 * @version 5.0.1
 */

						
$OT = "<div class='evo_metarow_organizer evorow evcal_evdata_row evcal_evrow_sm ".$end_row_class."'>
		<span class='evcal_evdata_icons'><i class='fa ".get_eventON_icon('evcal__fai_004', 'fa-microphone',$evOPT )."'></i></span>
		<div class='evcal_evdata_cell'>							
			<h3 class='evo_h3'>". evo_lang_get('evcal_evcard_org', 'Organizer')."</h3>";
			
$OT.= "<div class='evo_evdata_cell_content evodfx evofx_ww evofx_dr_r evogap15'>";

//EVO_Debug($event_organizer);
// foreach organizer
foreach( $event_organizer as $EOID=>$EO){

	//print_r($EO);

	// learn more button data
		$btn_data = $this->helper->array_to_html_data( array(
			'lbvals'=> array(
				'lbc'=>'evo_organizer_lb', 'lbac'=>'lb_max',
				'preload_temp_key'=>'preload_taxlb',
				't'=>	$EO->name,
				'ajax'=>'yes',
				'ajax_type'=>'endpoint',
				'ajax_action'=>'eventon_get_tax_card_content',
				'end'=>'client',
				'd'=> array(					
					'eventid'=> $EVENT->ID,
					'ri'=> $EVENT->ri,
					'term_id'=> $EO->term_id,
					'tax'=>'event_organizer',
					'load_lbcontent'=>true
				)
			)
		) );


	// image
	$img_src = (!empty($EO->organizer_img_id)? 
		wp_get_attachment_image_src($EO->organizer_img_id,'medium'): null);

	$newdinwow = (!empty($EO->organizer_link_target) && $EO->organizer_link_target=='yes')? 'target="_blank"':'';

	// Organizer link
		$org_link = '';
		if(!empty($EO->organizer_link) || !empty($EO->link) ){	

			if( !empty($EO->link) ) $org_link = $EO->link;
			if( !empty($EO->organizer_link) ) $org_link = $EO->organizer_link;

			$orgNAME = "<span class='evo_card_organizer_name_t marb5'><a ".( $newdinwow )." href='" . 
				evo_format_link( $org_link ) . "' class='evocl1i'>".$EO->name."</a></span>";
		}else{
			$orgNAME = "<span class='evo_card_organizer_name_t marb5'>". $EO->name."</span>";
		}	



	$OT.= "<div class='evo_card_organizer evofx_1'>";

	// image
	if( !empty($img_src)){
		$OT.= "<p class='evo_data_val evo_card_organizer_image'><img class='evolb_trigger evo_curp evo_transit_all evo_trans_sc1_03 evo_boxsh_1' {$btn_data} src='{$img_src[0]}'/></p>";
	}

	

	$org_data = '';
	$org_data .= "<h4 class='evo_org_name evo_h4 marb5 evottui evocl1i evopadb10i'>" . $orgNAME . "</h4>" ;
		
	
	// description
	if( !empty($EO->description_full)):
		$words = explode(' ', $EO->description_full);
	    $short_desc = implode(' ', array_slice($words, 0, 25));
	    //$org_data .= "<div class='evo_org_details'>$short_desc...</div>";
		$org_data .= "<div class='evo_org_details'>" . $EO->description_full . "</div>";
	endif;
		
	$org_data .= "<p class='evo_card_organizer_more evomart10i'><a class='evolb_trigger evo_btn_arr mart10' ". $btn_data .">". evo_lang('Learn More') . "<i class='fa fa-chevron-right'></i></a></p>";

	$OT .= apply_filters('evo_organizer_event_card', $org_data, $ED, $EO->term_id);

	$OT .= "</div>";

}


$OT.= "</div>";															
$OT .= "</div>	</div>";

echo $OT;
