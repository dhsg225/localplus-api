<?php 
/**
 * Open AI Integration
 * @version 5.0.1
 */

class EVO_OpenAI{
public function __construct(){
		add_action('admin_init',array($this,'init'));
		add_filter('eventon_settings_3rdparty', array($this, 'settings'), 10, 1);

		// include ai caller
		add_action('evo_admin_event_only_page', array($this, 'evo_event_only_admin_page'));
	}

	public function init(){
		$ajax_events = array(				
			'evoai_enhance_content'=>'enhance_content',
			'evoai_reset_usage'=>'reset_usage',
			'evoai_privacy_notice'=>'get_privacy_notice',
		);
		foreach ( $ajax_events as $ajax_event => $class ) {				
			add_action( 'wp_ajax_'.  $ajax_event, array( $this, $class ) );
			add_action( 'wp_ajax_nopriv_'.  $ajax_event, array( $this, 'restrict_unauthenticated' ) );
		}

		//$this->init_ai_bar();
		
	}

	// Handle unauthenticated requests
    public function restrict_unauthenticated() {
        wp_send_json( array( 'status' => 'bad', 'msg' => __( 'Authentication required', 'eventon' )) );
        wp_die();
    }

    public function evo_event_only_admin_page(){
    	add_action('admin_footer', array($this, 'init_ai_bar'));
    }

// ajax
	public function enhance_content(){

		// validate
		EVO()->helper->validate_request();
		$help = new evo_helper();
		$post_data = $help->sanitize_post();

		$data_type = sanitize_text_field($post_data['l1']);
		$data_type = str_replace('-', ' ', $data_type);// title, description

	    $mode = !empty($post_data['l2']) && in_array(strtolower($post_data['l2']), ['generate', 'rewrite', 'engaging', 'creative', 'casual', 'enthusiastic', 'professional', 'concise', 'call-to-action']) 
        ? strtolower(sanitize_text_field($post_data['l2'])) 
        : 'generate';

        $l3 = !empty($post_data['l3']) ? strtolower(sanitize_text_field($post_data['l3'])) : '';

	    $title = !empty($post_data['title']) ? sanitize_text_field($post_data['title']) : '';
	    $subtitle = !empty($post_data['subtitle']) ? sanitize_text_field($post_data['subtitle']) : '';
	    $content = !empty($post_data['content']) ? wp_kses_post($post_data['content']) : '';
	    // Clean content to remove HTML tags and &nbsp;
	    $clean_content = wp_strip_all_tags($content); // Removes all HTML tags
	    $clean_content = str_replace('&nbsp;', '', $clean_content); // Remove &nbsp;
	    $clean_content = trim($clean_content); // Remove whitespace

	    $evoai_vals4 = ['short', 'medium', 'long'];
    	$evoai_vals5 = ['3', '5', '8', '10'];

    	// Validate l3 based on data_type
	    if (in_array($data_type, ['x post', 'summary']) && !in_array($l3, $evoai_vals4)) {
	        $l3 = 'short'; // Default for x post, summary
	    } elseif (in_array($data_type, ['event types', 'tags', 'faqs', 'colors']) && !in_array($l3, $evoai_vals5)) {
	        $l3 = '3'; // Default for event types, tags, faqs, colors
	    }


	    // Enforce length limits (example)
	    if (strlen($title) > 200 || strlen($subtitle) > 200 || strlen($content) > 2000) {
	        wp_send_json_error(['msg' => __('Input exceeds maximum length', 'eventon')]);
	        return;
	    }

	    $max_tokens = 300;
	    $n_completions = 3;
	    $prompt = '';

	    //EVO_Debug($mode);

		switch ($data_type) {			
			case 'title':
				$prompt = $mode === 'rewrite' ? "Rewrite event title: {$title}" : "Make event title {$title} more {$mode}";
            	if ($mode === 'generate') $prompt = $title ? "Create event title for '{$title}'" : "Create event title for event";
			break;
			case 'subtitle':
				$prompt = $mode === 'rewrite' ? "Rewrite event subtitle: {$subtitle}" : "Make event subtitle {$subtitle} more {$mode}";
	            if ($mode === 'generate') $prompt = $title ? "Create event subtitle for '{$title}'" : "Create event subtitle for event";
	            $prompt .= ". Keep it 15 words or fewer.";
			break;
			case 'description':
				if ($mode === 'generate' || empty($clean_content)) {
			        $prompt = $title ? "Create a 100-word event description for '{$title}'" : "Create a 100-word event description for event";
			    } else {
			        $prompt = $mode === 'rewrite' ? "Rewrite event description: {$clean_content}" : "Make event description {$clean_content} more {$mode}";
			    }

			break;
			case 'x post':
	            $max_chars = $l3 === 'short' ? 100 : ($l3 === 'medium' ? 200 : 280);
	            $prompt = "Create a {$l3} Twitter post ({$max_chars} chars max) for event: '{$title}'";
	            if ($content) $prompt .= ", description: '{$content}'";
	            $prompt .= ". Make it {$mode}.";
	            break;
	        case 'event types':
	        	$n_completions = 1; // Single completion for event types
	            $prompt = $title ? "Suggest {$l3} event type categories for event: '{$title}'" : "Suggest {$l3} event type categories for an event";
	            if ($content) $prompt .= ", description: '{$content}'";
	            $prompt .= ". Make it {$mode}. Return each category as a JSON object: [{\"value\": \"value1\"}, {\"value\": \"value2\"}, ...].";
	            break;
	        case 'tags':
	            $n_completions = 1; // Single completion for tags
	            $prompt = $title ? "Suggest {$l3} tags for event: '{$title}'" : "Suggest {$l3} tags for an event";
	            if ($content) $prompt .= ", description: '{$content}'";
	            $prompt .= ". Make it {$mode}. Return each tag as a JSON object: [{\"value\": \"value1\"}, {\"value\": \"value2\"}, ...].";
	            break;
	        case 'colors':
	        	$n_completions = 1; // Single completion for colors
	            $prompt = $title ? "Suggest {$l3} color suggestions for event: '{$title}'" : "Suggest {$l3} color suggestions for an event";
	            if ($content) $prompt .= ", description: '{$content}'";
	            $prompt .= ". Make it {$mode}. Provide colors as hex codes in #RRGGBB format. Return each color as a JSON object: [{\"value\": \"#RRGGBB\"}, {\"value\": \"#RRGGBB\"}, ...].";
	            break;
	            break;

	        case 'faqs':
	            $n_completions = 1; // Single completion for FAQs
	            $prompt = $title ? "Generate {$l3} FAQs for event: '{$title}'" : "Generate {$l3} FAQs for an event";
	            if ($content) $prompt .= ", description: '{$content}'";
	            $prompt .= ". Make it {$mode}. Return in JSON format: [{\"question\": \"\", \"answer\": \"\"}, ...].";
	            break;	        
	        case 'summary':
	            $word_count = $l3 === 'short' ? 50 : ($l3 === 'medium' ? 100 : 200);
	            $prompt = $title ? "Create a {$l3} summary ({$word_count} words max) for event: '{$title}'" : "Create a {$l3} summary ({$word_count} words max) for an event";
	            if ($content) $prompt .= ", description: '{$content}'";
	            $prompt .= ". Make it {$mode}.";
	            break;
			break;	
		}

		//EVO_Debug($prompt);
			

		$response = $this->call_openai_api($prompt, $max_tokens, $n_completions);
    	$enhanced_contents = [];

	    //EVO_Debug($response);

	    if (!empty($response['error'])) {
	        wp_send_json_error(array(
	            'msg' => $response['error']['message'],
	            'code' => $response['error']['code']
	        ));
	        return;
	    }

	    if (!empty($response['choices'])) {
	    	foreach ($response['choices'] as $choice) {
	            $text = $choice['message']['content'] ?? '';
	            if (in_array($data_type, ['faqs', 'event types', 'tags', 'colors'])) {
	                try {
	                    // Extract JSON block, ignoring text before or after
	                    $json_match = [];
	                    preg_match('/```json\n([\s\S]*?)\n```/', $text, $json_match);
	                    $json_text = !empty($json_match[1]) ? $json_match[1] : trim($text);
	                    // Remove comments (// and /* */) from JSON text
	                    $json_text = preg_replace('/\/\/[^\n]*\n/', '', $json_text); // Remove // comments
	                    $json_text = preg_replace('/\/\*[\s\S]*?\*\//', '', $json_text); // Remove /* */ comments
	                    $parsed = json_decode($json_text, true);
	                    if (is_array($parsed) && !empty($parsed)) {
	                        if ($data_type === 'faqs') {
	                            // Transform FAQs into desired format: [['Q' => 'question', 'A' => 'answer'], ...]
	                            $faq_array = array_map(function($faq) {
	                                return [
	                                    'Q' => isset($faq['question']) ? sanitize_text_field($faq['question']) : 'Error',
	                                    'A' => isset($faq['answer']) ? wp_kses_post($faq['answer']) : 'Invalid FAQ format'
	                                ];
	                            }, $parsed);
	                            $enhanced_contents = [$faq_array]; // Single array of FAQs
	                        } else {
	                            // Transform event types, tags, or colors into desired format: [['value' => 'value1'], ...]
	                            $value_array = array_map(function($item) {
	                                return [
	                                    'value' => isset($item['value']) ? sanitize_text_field($item['value']) : 'Error'
	                                ];
	                            }, $parsed);
	                            $enhanced_contents = [$value_array]; // Single array of values
	                        }
	                    } else {
	                        $enhanced_contents = [[['Error' => 'Invalid format']]];
	                    }
	                } catch (Exception $e) {
	                    $enhanced_contents = [[['Error' => 'Failed to parse JSON']]];
	                }
	            } else {
	                $enhanced_contents[] = $text;
	            }
	        }
	    }

	    wp_send_json_success(array(
	        'contents' => $enhanced_contents
	    ));

	}

	private function call_openai_api($prompt, $max_tokens, $n = 1){
		$url = 'https://api.openai.com/v1/chat/completions';
		$api_key = EVO()->cal->get_prop('evoai_key','evcal_1');
		$model = EVO()->cal->get_prop_def( 'evoai_model','evcal_1', 'gpt-4o-mini');

		//EVO_Debug($api_key);

		// if api key is missing
		if (!$api_key || !preg_match('/^sk-(proj-)?[a-zA-Z0-9_-]{1,256}$/', $api_key)) {
			return [
	            'error' => [
	                'message' => __('Invalid or missing API Key', 'eventon'),
	                'code' => 'invalid_api_key'
	            ]
	        ];
		}
		
		$headers = array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json'
        );

        $body = array(
            'model' => $model, 
            'messages' => array(array('role' => 'user', 'content' => $prompt)),
            'max_tokens' => $max_tokens,
            'temperature' => 0.7,
            'n' => $n // Number of completions (options)
        );

        $response = wp_remote_post($url, array(
            'headers' => $headers,
            'body' => wp_json_encode($body),
            'timeout' => 30
        ));

        //EVO_Debug($body);
        //EVO_Debug($response);

        if (is_wp_error($response)) {
	        return array('error' => array(
	            'message' => $response->get_error_message(),
	            'code' => 'wp_error'
	        ));
	    }

        $body = wp_remote_retrieve_body($response);
	    $data = json_decode($body, true);

	    if (json_last_error() !== JSON_ERROR_NONE) {
	        return [
	            'error' => [
	                'message' => __('Invalid API response format', 'eventon'),
	                'code' => 'json_error'
	            ]
	        ];
	    }

	    if (isset($data['error'])) {
	        return array('error' => array(
	            'message' => $data['error']['message'],
	            'code' => $data['error']['code'] ?? 'api_error'
	        ));
	    }

	    $this->store_usage( $data, $prompt);
	    return $data;
	}

	private function store_usage($data, $prompt){
		// Extract usage data
	    $usage = isset($data['usage']) ? $data['usage'] : array(
	        'prompt_tokens' => 0,
	        'completion_tokens' => 0,
	        'total_tokens' => 0
	    );

	    // Get current stored usage from options (or initialize)
	    $current_usage = get_option('evoai_usage_totals', array(
	        'prompt_tokens' => 0,
	        'completion_tokens' => 0,
	        'total_tokens' => 0, 
	        'call_count' => 0 , // Initialize call count
	        //'since'=> time()
	    ));

	    // Add new usage to current totals
	    $current_usage['prompt_tokens'] += $usage['prompt_tokens'];
	    $current_usage['completion_tokens'] += $usage['completion_tokens'];
	    $current_usage['total_tokens'] += $usage['total_tokens'];
	    $current_usage['last_updated'] = time(); // Add timestamp
	    $current_usage['call_count'] = isset($current_usage['call_count']) ? $current_usage['call_count'] + 1 : 1;

	    // Update the option with new totals
	    update_option('evoai_usage_totals', $current_usage);
	}

	public function reset_usage(){

		// validate
		EVO()->helper->validate_request();
			
		if (get_transient('evoai_reset_cooldown')) {
		    wp_send_json_error(array('msg' => __('Please wait before resetting again', 'eventon')));
		    return;
		}
		set_transient('evoai_reset_cooldown', true, 60); // 60-second cooldown

		$new_data = array(
		    'prompt_tokens' => 0,
		    'completion_tokens' => 0,
		    'total_tokens' => 0, 
		    'call_count' => 0,
		    //'since'=> time()
		);

		update_option('evoai_usage_totals', $new_data);

		wp_send_json_success(array(
			'msg'=> __('Successfully reset usage data'),
	        'content' => $new_data
	    ));
	}

	public function get_privacy_notice(){
		// validate
		EVO()->helper->validate_request();


		ob_start();
		?>

		<div class="evoai-privacy-notice">
		    <p>EventON connects to OpenAI to generate titles, subtitles, descriptions, and X posts based on event data you provide (e.g., event title, description). When you use this feature:</p>
		    <ul>
		        <li><strong>Data Sent:</strong> Event titles, subtitles, descriptions, or other input you submit are sent to OpenAI’s API.</li>
		        <li><strong>Purpose:</strong> OpenAI processes this data to generate content responses (3 options per request).</li>
		        <li><strong>Data Use:</strong> OpenAI may retain data for 30 days for service operation and abuse monitoring, but it is not used to train models unless you opt in. Your inputs and outputs remain your own.</li>
		        <li><strong>Token Counts:</strong> EventON saves token usage (word-like units AI processes) locally for tracking. Counts may differ from OpenAI’s due to estimation; see <a href="https://openai.com/api-docs#token-usage" target="_blank">OpenAI Token Docs</a>.</li>
		        <li><strong>Privacy:</strong> We do not store your data beyond processing. Ensure sensitive information is not submitted, as OpenAI’s privacy practices apply (see <a href="https://openai.com/privacy" target="_blank">OpenAI Privacy Policy</a>).</li>
		        <li><strong>Consent:</strong> By using this feature, you consent to data being sent to OpenAI under their terms.</li>
		    </ul>
		</div>
		<?php 

		wp_send_json_success(array(
			'msg' => esc_html__('AI Privacy Notice', 'eventon'),
	        'content' => ob_get_clean()
	    ));
	}

// ADMIN Content
	public function init_ai_bar(){

		if ( !$this->is_ai_ready())    return;
		
		global $post, $pagenow;

	    // Return if not on ajde_events post edit page
	    if ($pagenow !== 'post.php' || !isset($post->post_type) || $post->post_type !== 'ajde_events') return;

	    $is_all_events_page = false;
			
	    wp_enqueue_script(
	    	'evoai_admin_script', EVO()->assets_path . '/js/lib/openai.js',  ['jquery', 'jquery-form', 'wp-element', 'wp-editor'], EVO()->version,true
	    );

	    $event_id = isset($_REQUEST['post'])? (int)$_REQUEST['post']:'';

	    wp_localize_script('evoai_admin_script', 'evoai_para', [
	        'copy_response' => esc_js(__('Copy Response', 'eventon')),
	        'apply_response' => esc_js(__('Apply Response', 'eventon')),
	        'delete_response' => esc_js(__('Delete Response', 'eventon')),
	        'add_event_title' => esc_js(__('Add Event with AI', 'eventon')),
	        'suggest' => esc_js(__('Or Suggest', 'eventon')),
	        'length' => esc_js(__('Length', 'eventon')),
	        'count' => esc_js(__('Count', 'eventon')),
	        'proceed' => esc_js(__('Proceed', 'eventon')),
	        'style' => esc_js(__('Style', 'eventon')),
	    ]);

	    $btn_title = $is_all_events_page ? 
	    	__('Use AI to create new event','eventon'):
	    	__('Use AI to enhance event content','eventon');
    	
        ?>
        <!-- inline styles -->
	        <style type="text/css">
	        	.evoai_btn{z-index: 9}
	        	.evoai_btn button{
				    box-shadow: 0px 0px 10px -5px #333;
				    border: none;outline: none;
	        	}
	        	.evoai_btn button:hover{box-shadow: 0px 0px 5px 5px var(--evo_color_prime); }
	        	#evoai_bar{    pointer-events: none;z-index: 900000;padding: 10px 10px 70px;box-sizing: border-box; max-width:500px; right:0    	}
	        	#evoai_bar.show{opacity:1!important;display: flex!important; height:100%;}	        	
	        	.evoai_bar_in{ box-shadow: 0px 0px 10px #333;
	        		opacity: 0;
				    position: relative; /* Ensure it layers over the ball */
				    z-index: 1;
	        	}
	        	.colors .evoai_bar_in,.event-types .evoai_bar_in,.tags .evoai_bar_in
	        	{width: auto;margin: 0;flex: auto;}
	        	.colors .evoai_bar_in span.evoai_response{font-family: var(--evo_font_1);font-size: 16px;}
	        	#evoai_bar.show .evoai_bar_in_main{opacity: 1; margin:0px 10px 10px;    width: calc(100% - 20px);}
	        	#evoai_bar.show .evoai_bar_in_main.appearing{opacity: 0;}
	        	#evoai_bar.show .evoai_bar_in_main.appearing {
				    animation: evoai_fadeIn 0.2s ease 0.8s forwards; /* Delay matches ball animation end */
				}
	        	.evoai_bar_o{	transition: transform 0.2s;transform: translateY(0px);  pointer-events: all; margin: 0 auto; max-width: 600px;	}
	        	#evoai_bar.show .evoai_bar_o{ max-height:100%;  }
	        	.evoai_bar_o_ballout{position: absolute;  bottom: 0;width: calc( 100% - 20px); margin:0 0 10px 10px;}
	        	.evoai_bar_o_ball{  
				    height: 65px; width: 65px; display: block;margin: 0 auto;
				    background-color: #fff;
				    box-shadow: 0px 0px 10px #333;
				    border-radius: 40px;				    
				    transform: translate(-50%, -50%) scale(0);
				}
				#evoai_bar.show .evoai_bar_o_ball {
				    animation: evoai_growAndExpand 1s ease forwards; /* Total duration for both steps */
				}

				@keyframes evoai_growAndExpand {
				    0% { transform: scale(0); width: 65px; height:65px;border-radius: 40px; opacity: 1; background-color: var(--evo_color_prime)}
				    37.5% { transform: scale(1); width: 65px; height:65px;border-radius: 40px; opacity: 1;background-color: #fff; } /* 0.3s / 0.8s */
				    75% { transform: scale(1); width: 100%;height:65px; border-radius: 20px; opacity: 1; } /* 0.6s / 0.8s */
				    100% { transform: scale(1); width: 100%; height:200px;border-radius: 20px; opacity: 0; }
				}
				@keyframes evoai_popIn { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
				@keyframes evoai_fadeIn { from { opacity: 0; } to { opacity: 1; } }
				@keyframes evoai_slideUp { from { transform: translateY(100px); } to { transform: translateY(0px); } }
				@keyframes evoai_searching_pulse { 0% { background: var(--evo_color_second); } 25% { background: #d7a4ff; } 50% { background: #33d1f5; } 75% { background: #71ffbd; } 100% { background: var(--evo_color_second); } }
				@keyframes evoai_turn { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
				
				.evoai_bar_in_main .fa-spinner, .evoai_bar_in_main .fa-circle-notch{animation: evoai_turn 1s linear infinite;height: 16px;width: 18px;}
				#evoai_bar.show .evoai_bar_in.evoai_bar_in_main.loading {animation: evoai_searching_pulse 3s linear infinite;opacity: 1;}
				#evoai_bar.show .evoai_bar_in.evoai_bar_in_main.loading:before,
				#evoai_bar.show .evoai_bar_in.evoai_bar_in_main.loading:after{
					content:"";position: absolute;
				}
				#evoai_bar.show .evoai_bar_in.evoai_bar_in_main.loading:before{
					    z-index: 1;
				    background-color: #ffffff40;
				    height: 100%; width: 100%;left: 0;
				    border-radius: 15px;
				}
				.evoai_bar_responses{overflow-y: scroll; -ms-overflow-style: none;  scrollbar-width: none;}
				.evoai_bar_responses::-webkit-scrollbar {display: none;}
	        	.evoai_bar_responses .evoai_bar_in:hover{    background-color: var(--evo_color_second);box-shadow: 0px 0px 0px 2px #000;}
	        	.evoai_bar_in_response.animate-in {  animation: evoai_popIn 0.3s ease forwards; /* 0.3s duration, ease timing */}
	        	.evoai_bar_in_response{background-color: #eee;}
	        	.evoai_assist_now span:hover i{display: inline-block;}	        	
				.evoai_trig_open {
				    opacity: 0;transform: scale(0); transform-origin: center center;animation: evoai_button_popIn 0.3s ease 3s forwards; /* Appear with slight delay */
				}
				@keyframes evoai_button_popIn {
				    0% { opacity: 0; transform: scale(0); }
				    100% { opacity: 1; transform: scale(1); }
				}
	        	#evoai_bar .evo_admin_btn.evoai_trig{border-radius: 10px;}
	        	#evoai_bar .evo_admin_btn.evoai_trig.selected{background-color: var(--evo_color_prime);}
	        	.evoai_trig_open em{background-color: #b63eff;height: 12px; width: 12px;top:0; right:0;margin:-2px;}
	        	.evoai_trig_minimize::before{
	        		content: '';width: 18px;height: 2px; background-color: var(--evo_cl_b30);position: absolute;top: 50%; 
				    transform: translateY(-50%);left: 0;
	        	}
	        	.evoai_trig_minimize:hover::before{background-color: var(--evo_color_1);}


	        </style>
	        <div class='evoai_btn evoposf evob0 evor0'>
	        	<button class='evoai_trig_open evobr50 evobgcp evofz24 evopad10i evomar10i evocurp evo_transit_all evo_trans_sc1_1 evoHbgcw' data-location='<?php echo $is_all_events_page ? 'all':'one';?>' style='height: 48px;width: 48px; '>
	        		<i class='fa fa-wand-magic-sparkles evotooltipfree L ' title="<?php echo $btn_title;?>" ></i>
	        	</button>
	        </div>

	        <div id='evoai_bar' class='evoposf evob0 evow100p evofxdrcr' style="opacity: 0;display: none;" data-location='<?php echo $is_all_events_page ? 'all':'one';?>' data-eid='<?php echo $event_id;?>'>
	        	<div class='evoai_bar_o evodfx evofxdrc evogap10'>
	        		<div class='evoai_bar_o_ballout'><span class='evoai_bar_o_ball'></span></div>

	        		<div class='evoai_bar_responses evopad10'></div>

	        		<div class='evoai_bar_in_main appearing evoai_bar_in  evobgcw evobr20 evopad15 evow100p evodfx evofxdrr evofxaic evogap10 evofxjcsb evoboxbb evoposr'>
		        		<div class='evodfx evofxdrc evogap10 evofxaifs'>
		        			<div class='evodfx evogap10 evofxdrr evopadr60'>
			        			<i class='evoai_icon fa fa-wand-magic-sparkles evofz18'></i>
			        			<p class='evomar0i evopad0i evofx_10a'><?php _e('Use AI to Assist with ...');?></p>
			        			<p class='evoai_assist_now evomar0i evopad0i'></p>
			        		</div>
		        			        		
			        		<div class='evoai_content evodfx evofxdrc evogap5 evofxaic evofxaifs'>
			        		</div>
		        		</div>	
		        		<i class='evoai_trig_minimize evofz18 evocurp evoposa evobr30 evodfx evofxaic evofxjcc  evo_transit_all evotooltipfree L' data-d='<?php _e('Minimize');?>' style='position: absolute;right:40px; top:15px;height:18px; width: 18px;'></i>
		        		<i class='evoai_trig_close fa fa-times evofz18 evocurp evohoop7 evoposa evobr30 evodfx evofxaic evofxjcc evoHbgc1 evoHcw evo_transit_all' style='right:10px; top:10px;height: 25px; width: 25px;'></i>
		        	</div>
	        	</div>
	        </div>
        <?php 
	}

	private function all_event_page_content(){
		?>
		<div class='evoai_new_event_creation'>
			<div class='evodfx evofxdrr evogap10 evofxaic evopadr20 evopadb10'>
				<i class='evoai_icon fa fa-wand-magic-sparkles evofz18'></i>
				<p class='evomar0i evopad0i '><?php _e('Describe what your event is about, event date, time, duration of event, location name & address.');?>
					<span class='evoop7'><?php _e('Use key words "Duration:", "Location:", "Address:", time like "Oct 5, 2028 at 7:00pm" to make sure proper results are generated.');?></span>
					
				</p>
			</div>
			<div class=''>
				<textarea id='evoai_full_input' class='evow100p evobr10 evoff_2 evofz14i evopad10'></textarea>
			</div>
			<div class='evoai_realtime_checks evodfx evofxdrr evogap10 evomart10'>
				<span class='evoop7 evomarr10'><?php _e('Pre-Check');?></span>
				<?php 

				$required_fields = [
				    'description' => __('Description', 'eventon'),
				    'date' => __('Date', 'eventon'),
				    'time' => __('Time', 'eventon'),
				    'duration' => __('Duration', 'eventon'),
				    'location' => __('Location Name', 'eventon'),
				    'address' => __('Address', 'eventon')
				];

				foreach ($required_fields as $key => $label): ?>
			        <span class="evoai_field_status evoai_field_<?php echo esc_attr($key); ?>" data-field="<?php echo esc_attr($key); ?>">
			            <?php echo esc_html($label); ?>: <i class="fa fa-square-o"></i>
			        </span>
			    <?php endforeach; ?>
			</div>
			<button class='evonobtn'><?php _e('Create Event');?></button>

		</div>
		<?php 
	}
	public function is_ai_ready(){
		if( !EVO()->cal->check_yn('evoai_on','evcal_1')) return false;
		if( !EVO()->cal->get_prop('evoai_key','evcal_1')) return false;

		// Check if current user is admin
		if( current_user_can('administrator')) return true;

		if( !EVO()->cal->get_prop('evoai_roles')) return false;

		$selected_roles = EVO()->cal->get_prop('evoai_roles');
		$current_user = wp_get_current_user();

		// Check if user's role is in selected roles
	    if (!empty($current_user->roles) && is_array($selected_roles)) {
	        foreach ($current_user->roles as $role) {
	            if (in_array($role, $selected_roles)) return true;
	        }
	    }

		return true;
	}

	public function settings($array){
		$array[] = array('type'=>'sub_section_open',
			'name'=> __('OpenAI','eventon'), 
			'icon_class'=> 'fa-wand-magic-sparkles',
		);

		$array[] = array('id'=>'evoai_note','type'=>'note',			
			'name'=> sprintf('%s <a href="%s" target="_blank">%s <i class="fa fa-up-right-from-square"></i></a> %s',
				__('Create an account at OpenAI and acquire an API key.'),
				'https://platform.openai.com/api-keys',
				__('Get your OpenAI API Key.','eventon'),
				__('API Key is required for AI features to work. '),
			)
		);	

		$array[] = array('type'=>'yesno','id'=>'evoai_on', 'name'=>__('Activate AI on Events','eventon'), 'afterstatement'=> 'evoai_on');
		$array[] = array('id'=>'evoai_on','type'=>'begin_afterstatement');
			
			$array[] = array('type'=>'text','id'=>'evoai_key', 
				'name'=>__('OpenAI API Key','eventon'),
				'hideable'=> true
			);
			$array[] = array('type'=>'select','id'=>'evoai_model', 
				'name'=>__('Model','eventon'),
				'options'=> array(
					'gpt-4o-mini'=> __('GPT-4o Mini'),
					'gpt-3.5-turbo'=> __('GPT-3.5 Turbo'),	
					'gpt-4o'=> __('GPT-4o'),

					
					'gpt-4o-mini'=> __('GPT-4o Mini -- Balanced quality at low cost'),
					'gpt-4o'=> __('GPT-4o -- high quality creative input'),
					'gpt-5-mini'=> __('GPT-5 Mini -- advanced reasoning with efficiency'),
					'gpt-5'=> __('GPT-5 -- top-tier intelligence, nuanced event enhancements'),
					'gpt-3.5-turbo'=> __('GPT-3.5 Turbo - Simple, fast, and cheapest tasks'),
				),
				'tooltip'=> __('Each model is best for certain tasks and costs for usage changes based on the model.')
			);
			$array[] = array('id'=>'evoai_roles',
				'type'=>'checkboxes',
				'name'=> __('Choose user roles that can use AI for events. If none selected, only admins can use it. Admins always have full access.' ),
				'options'=>$this->user_roles(),
			);
			$array[] = array('type'=>'code','content'=> $this->usage_data());

		$array[] = array('id'=>'evoai_on','type'=>'end_afterstatement');

		

		$array[] = array('type'=>'sub_section_close');
		return $array;
	}
	private function user_roles(){
		$roles = array();
		foreach(get_editable_roles() as $role_name => $role_info){
			$roles[$role_name ] = translate_user_role($role_info['name']) ;
		}
		unset($roles['administrator']);
		return $roles;
	}
	
	public function usage_data(){
		ob_start();
		$current_usage = get_option('evoai_usage_totals', array(
	        'prompt_tokens' => 0,
	        'completion_tokens' => 0,
	        'total_tokens' => 0, 
	        'call_count' => 0
	    ));
	    $name_map = array(
	        'prompt_tokens' => __('Prompt Tokens', 'eventon'),
	        'completion_tokens' => __('Completion Tokens', 'eventon'),
	        'total_tokens' => __('Total Tokens', 'eventon'),
	        'since' => __('Usage Data Since', 'eventon'),
	        'last_updated' => __('Last Updated', 'eventon'),
	        'call_count' => __('API Calls', 'eventon')
	    );
		?>
		<script type="text/javascript">
			jQuery(document).ready(function($) {
			// reset API Usage data
			$('body').on('click','.evoai_trig_reset',function(event){
				event.preventDefault();
				$(this).evo_admin_get_ajax({
			        adata: {
			            a: 'evoai_reset_usage',
			            data:{},
			            show_snackbar: true,
			            loader_btn_el: true,
			        },uid:'evoai_reset_data'
			    });
			})
			.on('evo_ajax_success_evoai_reset_data',function(event, OO, data, el){
				$.each(data.contents, function(index, val){
					$('.evoai_usage_data_item[data-val='+index+']').find('span.v').html( val );
				});
			})
			.on('click','.evoai_trig_privacy',function(e){e.preventDefault();});

			});
		</script>
		<p><?php _e('Local OpenAI API Usage Data','eventon');?></p>
		<div class='evopad15 evobr10 evoclw evodfx evogap15 evomarb20 evofxww' style="background-color: #727272;">			
			<?php 
				$has_usage_data = false;
				foreach($current_usage as $key=>$val){
					$name = $name_map[$key] ?? ucwords(str_replace('_', ' ', $key));

					if ($val === 0 && $key !== 'last_updated') continue;
					if ($key === 'last_updated' && $val > 0) $val = date('Y-m-d H:i:s', $val); // e.g., "2025-02-25 14:30:00"

					$tooltip = '';
					$has_usage_data = true;
					if( $key == 'prompt_tokens') $tooltip = EVO()->elements->tooltips(__('The number of tokens sent to OpenAI API as prompt. Tokens can be parts of words, punctuations, or special characters.'), '', false, false, 'evoposri');

					echo "<p class='evoai_usage_data_item evodfx evofxdrr evogap10 evofxaic' data-val='{$key}'><span >{$name}:</span><span class='v evobgcl1 evopad5-10 evobr10'>{$val}</span>{$tooltip}</p>";
				}
			if( !$has_usage_data ):
				echo "<p class=''>". __('No data found') . "</p>";
			endif;
			?>

		</div>
		<?php 
		if( $current_usage['total_tokens']> 0):?>
			<div class=''>
				<button class='evo_admin_btn evoai_trig_reset w'><?php _e('Reset Usage Data','eventon');?></button>			
			</div>
		<?php endif;?>
		<em class='hr_line'></em>
		<div class=''>
			<p><?php _e('OpenAI Privacy and Usage Terms','eventon');?></p>
			<?php 
			EVO()->elements->print_trigger_element(array(
				'adata'=> array(					
					'data'=> array(
						'a'=>'evoai_privacy_notice',
					)
				),
				'lbdata'=> array(
					'class'=>'evoai_privacy',
					'title'=> __('Open AI Privacy Notice','eventon')
				),
				'uid'=>'evoai_privacy',
				'dom_element'=> 'button',
				'class_attr'=>'evo_admin_btn evolb_trigger evoai_trig_privacy w',
				'title'=> __('Privacy Notice','eventon')
			),'trig_lb');
			?>			
		</div>
		<?php
		return ob_get_clean();
	}

} 
new EVO_OpenAI();