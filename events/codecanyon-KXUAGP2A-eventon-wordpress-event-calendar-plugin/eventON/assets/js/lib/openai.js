/**
 * Open AI Admin Scripts
 * @version 5.0.1
 * @license EventON JavaScript Assets 
 * Copyright (C) 2014-2025 Ashan Jay, AshanJay Designs LLC.
 * 
 * PROPRIETARY LICENSE - All Rights Reserved
 * 
 * Permission granted solely for personal use with valid EventON license.
 * YOU MAY NOT: redistribute, resell, sublicense, or publish these Assets.
 * 
 * Trademark: "EventON" is a trademark of AshanJay Designs LLC.
 * Contact: info@myeventon.com
 * 
 * PROVIDED "AS IS" WITHOUT WARRANTY. VIOLATION MAY RESULT IN LEGAL ACTION.
 */

jQuery(document).ready(function($) {

	const EVO_AI_Process = {

		E: {
			body : $('body'),
			AIbar: $('#evoai_bar'),
			evoai_vals1: ['Title', 'Subtitle', 'Description'],
            evoai_vals2: ['Generate', 'Rewrite', 'Engaging', 'Creative', 'Casual', 'Enthusiastic', 'Professional', 'Concise', 'Call-to-action'],
            evoai_vals3: ['Event Types', 'Tags', 'FAQs', 'Colors', 'Summary','X Post'],
            evoai_vals4: ['Short','Medium','Long'],
            evoai_vals5: ['3','5','8','10'],
            evoai_data: { l1: '', l2: '', l3:'' }
		},
		init(){
			this.bindEvents();
		},
		bindEvents(){
			const { E } = this;
			E.body.on('input', '#evoai_full_input', (e) => this.handle_realtime_check(e));
			E.body.on('click','.evoai_trig_open', (e) => this.handle_AIassist(e, 0, ''));
			E.body.on('click','.evoai_trig', (e) => this.handle_AIassist(e));
			E.body.on('click','.evoai_trig_close', (e) => this.hide_ai_bar(e));
			E.body.on('click','.evoai_trig_minimize', (e) => this.hide_minimize(e));
			E.body.on('click', '.evoai_trig_proceed', (e) => this.handle_proceed(e));
			E.body.on('evo_eventedit_all_dom_loaded', (e) => this.handle_addWand(e));
			E.body.on('evo_ajax_beforesend_evoai_enhance_content_trig', (e, OO, el) => this.handle_before_send(e, OO, el));
            E.body.on('evo_ajax_success_evoai_enhance_content_trig', (e, OO, data, el) => this.handle_success(e, OO, data, el));
            E.body.on('evo_ajax_success_evo_get_tax_list', (e, OO, data, el) => this.handle_newFAQ(e, OO, data, el));
            E.body.on('click', '.evoai_trig_copy', (e) => this.handle_copy_response(e));
            E.body.on('click', '.evoai_trig_apply', (e) => this.handle_apply_response(e));
            E.body.on('click', '.evoai_trig_del', (e) => this.handle_delete_response(e));
		},
		handle_realtime_check(event){
			const text = $(event.currentTarget).val().trim();
	        const checks = {
                description: text.length > 10, // Basic length check
                date: /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\w+\s+\d{1,2},\s+\d{4})\b/.test(text), // e.g., 12-25-2025 or December 25, 2025
                time: /\b(\d{1,2}:\d{2}\s*(AM|PM)|noon|midnight)\b/i.test(text), // e.g., 7:30 PM
                duration: /\bDuration:\s*(\d+\s*(hours?|hrs?|minutes?|mins?))\b/i.test(text), // e.g., Duration: 2 hours
                location: /\bLocation:\s*([\w\s]+)\b/i.test(text), // e.g., Location: City Hall
                address: /\b\d{1,5}\s+[\w\s]+,\s*[\w\s]+,\s*[A-Z]{2}\s*\d{5}\b/.test(text) // e.g., 123 Main St, Springfield, IL 62701
            };

	        $.each(checks, function(key, isValid) {
	            const $span = $('.evoai_field_' + key);
	            $span.find('i').toggleClass('fa-square-o', !isValid).toggleClass('fa-check-square', isValid);
	        });
		},
		handle_AIassist(event, level, val){
			const { E } = this;
			const O = $(event.currentTarget);

			if( O.hasClass('minimized')){
				E.AIbar.not('.show').addClass('show');
				O.removeClass('minimized').find('em').remove();
				return;
			}

            if (level === undefined) level = O.data('l');
            if (val === undefined) val = O.data('val');
            if (!E.AIbar.hasClass('show')) $('.evoai_bar_in_main').addClass('appearing');
            E.AIbar.not('.show').addClass('show').find('.evoai_bar_in').removeClass('loading');
            this.load_ai_creator(level, val);   

            if( O.hasClass('backtoL0')) $('.evoai_bar_responses').html('');
		},
		handle_addWand(event){
			$('#evcal_subtitle')
				.after('<i class="evoai_trig fa fa-wand-magic-sparkles evoposa evot0 evor10 evoh100p evodfx evofxaic evocurp evohoop7" data-val="subtitle" data-l="1"></i>');
		},
		hide_minimize(event){
			$('.evoai_trig_open').addClass('minimized').append(`<em class='evoposa evobr30 evodfx'></em>`);
			this.E.AIbar.removeClass('show');
		},
		handle_proceed(event) {
            this.handle_ajax_call();
        },
		load_ai_creator(level, val) {
            const { E } = this;
            if (level === undefined) level = 0;
            if (val === undefined) val = '';
            E.evoai_data = {
                l1: level === 1 ? val : (level === 0 ? '' : E.evoai_data.l1),
                //l2: level === 2 ? val : (level <= 1 ? '' : E.evoai_data.l2),
                l2: level === 2 ? val : (level === 3 ? E.evoai_data.l2 : (level <= 1 ? '' : E.evoai_data.l2)),
                l3: level === 3 ? val : (level < 3 ? '' : E.evoai_data.l3)
            };
            let newContent = '';
            if (level === 0) {
                let event_title = $('#title').val();
                if (typeof wp !== 'undefined' && wp.data && wp.data.select) {
                    event_title = wp.data.select('core/editor').getEditedPostAttribute('title');
                }

                let availableMain = E.evoai_vals1;
                let mainButtonsHTML = availableMain.map(value => 
                    `<button class='evoai_trig evo_admin_btn' data-l='1' data-val='${value.toLowerCase().replace(/\s+/g, '-')}'>${value}</button>`
                ).join('');

                // if title is set 
                let suggestButtonsHTML = '';
                if( event_title && event_title !== undefined ){
                	let availableSuggest = E.evoai_vals3;
                	suggestButtonsHTML = availableSuggest.map(value => 
	                    `<button class='evoai_trig evo_admin_btn' data-l='1' data-val='${value.toLowerCase().replace(/\s+/g, '-')}'>${value}</button>`
	                ).join('');
                }                

                E.body.find('.evoai_assist_now').html('');
                newContent = `
                    <div class='evoai_content_main evodfx evofxdrr evogap5 evofx_ww'>${mainButtonsHTML}</div>
                    <p class='evomar0i evopad0i evofx_10a'>${evoai_para.suggest}:</p>
                    <div class='evoai_content_suggest evodfx evofxdrr evogap5 evofx_ww'>${suggestButtonsHTML}</div>
                `;

            } else if (level === 1) {
                let selectedText = [...E.evoai_vals1, ...E.evoai_vals3].find(value => 
                    value.toLowerCase().replace(/\s+/g, '-') === E.evoai_data.l1
                ) || 'Unknown';
                let content = '', event_title = '', subtitle = '';
                event_title = $('#title').val();
                if (typeof wp !== 'undefined' && wp.data && wp.data.select) {
                    event_title = wp.data.select('core/editor').getEditedPostAttribute('title');
                }
                subtitle = $('#evcal_subtitle').val();
                if (E.evoai_data.l1 === 'description' || E.evoai_data.l1 === 'x-post') {
                    if (typeof wp !== 'undefined' && wp.data && wp.data.select) {
                        content = wp.data.select('core/editor').getEditedPostContent();
                    } else {
                        if (typeof tinyMCE !== 'undefined' && tinyMCE.get('content')) {
                            content = tinyMCE.get('content').getContent();
                        } else {
                            content = $('#content').val() || '';
                        }
                    }
                    // Clean content by stripping HTML tags and &nbsp;
                    const cleanContent = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
                    content = cleanContent;
                }
                let availableOptions = E.evoai_vals2;
                switch (E.evoai_data.l1) {
                    case 'title':
                        availableOptions = (!event_title || event_title.trim() === '') 
                            ? ['Generate'] 
                            : E.evoai_vals2.filter(option => option !== 'Generate');
                        break;
                    case 'description':
                        availableOptions = (!content || content === '') 
                            ? ['Generate'] 
                            : E.evoai_vals2.filter(option => option !== 'Generate');
                        break;
                    case 'subtitle':
                        availableOptions = (!subtitle || subtitle.trim() === '') 
                            ? ['Generate'] 
                            : E.evoai_vals2.filter(option => option !== 'Generate');
                        break;
                    case 'x-post':
                    case 'summary':
                        availableOptions = E.evoai_vals2.filter(option => !['Generate', 'Rewrite'].includes(option));
                        break;
                    case 'event-types':
                    case 'tags':
                    case 'colors':
                    case 'faqs':
                        availableOptions = E.evoai_vals2.filter(option => !['Generate', 'Rewrite','Concise', 'Call-to-action'].includes(option));
                        break;
                    default:
                        availableOptions = E.evoai_vals2;
                }
                let buttonsHTML = availableOptions.map(value => 
                    `<button class='evoai_trig evo_admin_btn' data-l='2' data-val='${value.toLowerCase().replace(/\s+/g, '-')}'>${value}</button>`
                ).join('');


                let additionalHTML = '';
                let proceedHTML = `<button class='evoai_trig_proceed evo_admin_btn evobgclpi'>${evoai_para.proceed}<i class='fa fa-arrow-right evomarl15 evofz16'></i></button>`;
                const requiresAdditional = ['x-post', 'event-types', 'tags', 'colors', 'faqs', 'summary'].includes(E.evoai_data.l1);
                if (requiresAdditional) {
                    let addVals = (E.evoai_data.l1 === 'x-post' || E.evoai_data.l1 === 'summary') ? E.evoai_vals4 : E.evoai_vals5;
                    let addButtonsHTML = addVals.map(value => 
                        `<button class='evoai_trig evo_admin_btn${E.evoai_data.l3 === value.toLowerCase() ? ' selected' : ''}' data-l='3' data-val='${value.toLowerCase()}'>${value}</button>`
                    ).join('');
                    //console.log(addVals);
                    additionalHTML = `<p class='evomar0i evopad0i evofx_10a'>${addVals[0] !== 'Short' ? evoai_para.count: evoai_para.length }:</p>
                    <div class='evoai_additional evodfx evofxdrr evogap5 evofxww'>${addButtonsHTML}</div>`;
                }
                E.body.find('.evoai_assist_now').html(
                    `<span class='evoai_trig backtoL0 evocurp evobrdB1 evobr20 evolh1 evoHcw evoHbgcprime' data-l='0' style="padding: 3px 10px;"><i class='fa fa-chevron-left evodn evomarr5 evofz12'></i>${selectedText}</span>`
                );
                newContent = `<p class='evomar0i evopad0i evofx_10a'>${evoai_para.style}:</p>
                	<div class='evodfx evofxdrr evogap5 evofxww evofxjcfs'>${buttonsHTML}</div>${additionalHTML}${proceedHTML}`;

            // Select level 2/3 item
           	} else if (level === 2 || level === 3) {
           		//console.log(val);
           		const selectedVal = String(val).toLowerCase().replace(/\s+/g, '-');
                E.body.find(`.evoai_trig[data-l='${level}']`).removeClass('selected');
                E.body.find(`.evoai_trig[data-l='${level}'][data-val='${selectedVal}']`).addClass('selected');
            }

            if (newContent) E.body.find('.evoai_content').html(newContent);
            setTimeout(() => $('.evoai_bar_in_main').removeClass('appearing'), 1000);
        },
        handle_ajax_call() {
            const { E } = this;
            let content = '', event_title = '', subtitle = '';
            event_title = $('#title').val();
            if (typeof wp !== 'undefined' && wp.data && wp.data.select) {
                event_title = wp.data.select('core/editor').getEditedPostAttribute('title');
            }
            subtitle = $('#evcal_subtitle').val();
            if (['description', 'x-post', 'summary'].includes(E.evoai_data.l1)) {
                if (typeof wp !== 'undefined' && wp.data && wp.data.select) {
                    content = wp.data.select('core/editor').getEditedPostContent();
                } else {
                    if (typeof tinyMCE !== 'undefined' && tinyMCE.get('content')) {
                        content = tinyMCE.get('content').getContent();
                    } else {
                        content = $('#content').val() || '';
                    }
                }
            }
            E.body.evo_admin_get_ajax({
                adata: {
                    a: 'evoai_enhance_content',
                    data: {
                        l1: E.evoai_data.l1,
                        l2: E.evoai_data.l2,
                        l3: E.evoai_data.l3,
                        title: event_title,
                        subtitle: subtitle,
                        content: content
                    }
                },
                uid: 'evoai_enhance_content_trig'
            });
        },
        hide_ai_bar() {
            const { E } = this;
            E.AIbar.removeClass('show');
            $('.evoai_bar_responses').html('');
            this.load_ai_creator(0, '');
        },
        handle_before_send(event, OO, el) {
            const { E } = this;
            E.body.find('.evoai_bar_in_main').addClass('loading');
            E.body.find('.evoai_icon').removeClass('fa-wand-magic-sparkles').addClass('fa-spinner');
            E.body.find('.evoai_trig_proceed i').removeClass('fa-arrow-right').addClass('fa-circle-notch');
        },
        handle_success(event, OO, data, el) {
            const { E } = this;
            E.body.find('.evoai_bar_in_main').removeClass('loading');
            E.body.find('.evoai_icon').addClass('fa-wand-magic-sparkles').removeClass('fa-spinner');
            E.body.find('.evoai_trig_proceed i').addClass('fa-arrow-right').removeClass('fa-circle-notch ');

            if (data.success && data.contents ) {
                const $responsesContainer = E.body.find('.evoai_bar_responses');
                const $dataType = OO.ajaxdata.l1;
                let contents = Array.isArray(data.contents) ? data.contents : data.contents[''] || [];
                let responseItems = [];

                if (['faqs', 'event-types', 'tags', 'colors'].includes($dataType) && Array.isArray(contents[0])) {
                    if ($dataType === 'faqs') {
                        // Flatten FAQs into individual response items
                        responseItems = contents[0].map(item => ({ faqs: item }));
                    } else {
                        // Flatten event types, tags, or future similar items into response items
                        responseItems = contents[0].map(item => ({ list_items: item }));
                    }
                } else {
                    // Non-FAQ, non-list items remain as-is
                    responseItems = contents.map(item => ({ item }));
                }

                let extraStyles = '';
                let extraClasses = '';

                const blockItems = ['colors','event-types','tags'];
                $responsesContainer.attr({'class':'evoai_bar_responses evopad10'});
                if( blockItems.includes($dataType)) $responsesContainer.addClass('evodfx evofxdrr evofxww evogap20 '+ $dataType);

                responseItems.forEach((responseItem, index) => {
                	const excludeTypes = ['x-post', 'event-types', 'tags', 'summary'];
		            const $applyResponse = !excludeTypes.includes($dataType)
		                ? `<i class='evoai_trig_apply fa fa-arrow-right evofz18 evocurp evoop7 evohoop10 evotooltipfree L' title="${evoai_para.apply_response}"></i>`
		                : '';
		            const $delResponse = `<i class='evoai_trig_del fa fa-xmark evofz18 evocurp evoop7 evohoop10 evotooltipfree L' title="${evoai_para.delete_response}"></i>`;
		            let cleanedItem = '';
		            let hiddenValue = '';

		            if ($dataType === 'faqs' && responseItem.faqs) {
                        // Format single FAQ as Q: ... A: ...
                        const faq = responseItem.faqs;
                        cleanedItem = `Q: ${faq.Q || 'Error'}\nA: ${faq.A || 'Invalid FAQ format'}`;
                        // Store raw JSON for single FAQ with proper escaping
                        const escapedJson = JSON.stringify([faq], (key, value) => {
                            if (typeof value === 'string') {
                                return value.replace(/'/g, "\\'").replace(/"/g, '\\"');
                            }
                            return value;
                        });
                        hiddenValue = `<input type='hidden' class='evoai_response_json' value="${encodeURIComponent(escapedJson)}"/>`;
                    } else if (responseItem.list_items) {
                        // Format single list item (event types, tags, colors, etc.)                
                        const item = responseItem.list_items;
                        cleanedItem = `${item.value || 'Error'}`;
                        // Store raw JSON for single list item with proper escaping
                        const escapedJson = JSON.stringify([item], (key, value) => {
                            if (typeof value === 'string') {
                                return value.replace(/'/g, "\\'").replace(/"/g, '\\"');
                            }
                            return value;
                        });
                        if( $dataType == 'colors') extraStyles = `background-color:${cleanedItem};`;
                        hiddenValue = `<input type='hidden' class='evoai_response_json' value="${encodeURIComponent(escapedJson)}"/>`;
                    } else {
                        cleanedItem = String(responseItem.item || '').replace(/^"|"$/g, '');
                    }

		            const htmlContent = `
		                <div class='evoai_bar_in_response evoai_bar_in evoai_response_type_${$dataType} evobgcw evobr20 evopad15 evow100p evoboxbb evodfx evofxdrr evofxjcsb evofxaic evomarb10 animate-in ${extraClasses}' style='animation-delay: ${index * 0.2}s;${extraStyles}'>
		                    <span class='evoai_response evomarr10' style='white-space: pre-line;'>${cleanedItem}</span>${hiddenValue}
		                    <div class='evodfx evofxdrc evogap10'>
		                        <i class='evoai_trig_copy fa fa-copy evofz18 evocurp evoop7 evohoop10 evotooltipfree L' title="${evoai_para.copy_response}"></i>${$applyResponse} ${$delResponse}
		                    </div>
		                </div>
		            `;
		            $responsesContainer.append(htmlContent);
                });
                setTimeout(() => {
                    $responsesContainer.scrollTop($responsesContainer[0].scrollHeight);
                }, data.contents.length * 200);
            } else {
                $(el).evo_snackbar({ message: data.msg || 'Something went wrong', });
            }
        },
        handle_copy_response(event) {
            const response_box = $(event.currentTarget).closest('.evoai_bar_in');
            const response = response_box.find('.evoai_response').text();
            navigator.clipboard.writeText(response).then(() => {
                $(event.currentTarget).evo_snackbar({ message: 'Copied to clipboard!', visible_duration: 2000 });
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                $(event.currentTarget).evo_snackbar({ message: 'Failed to copy. Please try again.', visible_duration: 2000 });
            });
        },
        handle_apply_response(event) {
            const { E } = this;
            const $el = $(event.currentTarget);
            const response_box = $el.closest('.evoai_bar_in');
            const response = response_box.find('.evoai_response').text();
            if (E.evoai_data.l1 === 'title') {
                if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
                    wp.data.dispatch('core/editor').editPost({ title: response });
                } else {
                    $('#title').val(response);
                }
            }
            if (E.evoai_data.l1 === 'subtitle') {
                $('#evcal_subtitle').val(response);
            }
            if (E.evoai_data.l1 === 'description') {
                if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
                    const blocks = wp.blocks.parse(response) || [wp.blocks.createBlock('core/paragraph', { content: response })];
                    wp.data.dispatch('core/editor').resetBlocks(blocks);
                } else {
                    if (typeof tinyMCE !== 'undefined' && tinyMCE.get('content')) {
                        tinyMCE.get('content').setContent(response);
                    } else {
                        $('#content').val(response);
                    }
                }
            }
            if (E.evoai_data.l1 === 'colors') {
                const colorMB = $('body').find(".evomb_color_colors");
                colorMB.find('.evoselectedColor').css('background-color',response);
                colorMB.find('.evcal_color_hex').text(response);
                colorMB.find('input.evo_color_hex').val(response);

            }
            if (E.evoai_data.l1 === 'faqs') {

            	response_box.find('.evoai_response').addClass('evoloading evoai_working');

            	const faqRes = response_box.find('.evoai_response_json').val();
            	let faqs = [];
		        try {
		            faqs = JSON.parse(decodeURIComponent(faqRes));
		        } catch (e) {
		            console.error('Failed to parse FAQ JSON:', e);
		            return;
		        }

		        if (faqs.length > 0) {
		        	const { Q, A } = faqs[0];
	            	$el.evo_lightbox_open({
	            		adata:{
	            			type:'ajax',
	            			data:{
	            				type:'new',tax:'evo_faq',
	            				event_id: $('#evoai_bar').data('eid'),	            				
	            				a:'eventon_get_event_tax_term_section',
	            				from:'ai',	q: Q,	answer: A
	            			}
	            		},
	            		lbdata:{
	            			title:'Add new Event FAQs for the Event',
	            			class:'evo_config_term'
	            		},
	            		uid:'evo_get_tax_list'
	            	});
	            }else{
	            	E.evo_snackbar({ message: 'Could not Apply!', visible_duration: 2000 });
	            }
	            return;

            }
            E.body.trigger('evoelm_hideall_tooltips');
            this.hide_ai_bar();
        },
        handle_newFAQ(event, OO, data, el) {
        	if( 'from' in OO.adata.data && OO.adata.data.from == 'ai'){
        		this.E.body.find('.evoai_working').removeClass( 'evoloading');
        		const $form = this.E.body.find('.evo_tax_event_settings.evolb_form');

        		// Strip slashes from q and answer
		        const cleanQ = String(OO.adata.data.q).replace(/\\(['"])/g, '$1');
		        const cleanAnswer = String(OO.adata.data.answer).replace(/\\(['"])/g, '$1');
		        
		        $form.find('input[name="term_name"]').val( cleanQ );
		        $form.find('textarea[name="description"]').val( cleanAnswer );

		        this.hide_minimize(event);
        	}
        },
        handle_delete_response(event){
        	const $responseDiv = $(event.currentTarget).closest('.evoai_bar_in');
		    $responseDiv.addClass('evotraso_cc evotrans_all').animate({
		        opacity: 0,transform: 'scale(0.8)'
		    }, 300, function() {
		        $responseDiv.remove();
		    });
        }
	};

	EVO_AI_Process.init();



});