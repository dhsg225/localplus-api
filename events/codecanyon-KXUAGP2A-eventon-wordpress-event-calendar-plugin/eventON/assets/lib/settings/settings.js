/**
 * EventON Settings scripts
 * @version  5.0
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


(function($) {
	// Module for handling settings functionality
    const EventONSettings = {
        // Cache DOM Elements
        E: {
            body: $('body'),
            tabs: $('#acus_left a'),
            forms: $('.evo_settings_box form'),
            webhooksContainer: $('#evowhs_container'),
            resetColorButton: $('#resetColor'),
            arrangeBox: $('.evosetting_arrange_box'),
            colorSelectors: $('.colorselector'),
            imageButton: $('.ajt_choose_image'),
            removeImageButton: $('.ajde_remove_image'),
            multicolor: $('.row_multicolor'),
            legend: $('.legend_icon')
        },

        // Initialize the module
        init() {
            this.handleInitialTab();
            this.bindEvents();
            this.initWebhooks();
            this.cleanupExtraButtons();
            this.setInitialArrangeBoxOrder();
            this.handle_searchSettings();
        },

        // Handle initial tab based on URL hash
        handleInitialTab() {
            const hash = window.location.hash.replace('#', '');
            if (hash) {
                this.switchTab(hash);
                this.updateTabPosition($(`a[data-c_id="${hash}"]`));
            }
        },

        // Bind all event listeners
        bindEvents() {
            const { E } = this;

            // Tab switching
            E.tabs.on('click', (e) => {
                e.preventDefault();
                const tabId = $(e.currentTarget).data('c_id');
                this.switchTab(tabId);
                this.updateTabPosition($(e.currentTarget));
                window.location.hash = tabId;
            });

            // Form save
            E.body.on('click','.evo_trig_form_save', (e) => this.handleFormSave(e));

            // Password toggle
            E.body.on('click', '.evo_hideable_show', (e) => this.togglePassword(e));

            // Collapse menu
            E.body.on('click','.evo_settings_close_trig', (e) => this.toggleCollapseMenu(e));

            // Reset colors
            E.resetColorButton.on('click', () => this.resetColors());

            // Multicolor hover
            E.multicolor.on('mouseover', 'em', (e) => this.showMulticolorName(e));
            E.multicolor.on('mouseout', 'em', (e) => this.hideMulticolorName(e));

            // Legend hover
            E.legend.on('mouseenter', (e) => $(e.currentTarget).siblings('.legend').show());
            E.legend.on('mouseleave', (e) => $(e.currentTarget).siblings('.legend').hide());

            // Image handling
            this.setupImageUpload();

            // Hidden section toggle
            $('.ajdeSET_hidden_open').on('click', (e) => {
                const $el = $(e.currentTarget);
                $el.next('.ajdeSET_hidden_body').toggle();
                $el.toggleClass('open');
            });

            // Sortable fields
            this.setupSortableFields();            
        },

        // handle search settings @since 5.0
        handle_searchSettings(){
            const { E } = this;
            // search settings
            E.body.on('click','.evo_settings_search_open', (e) => {
                e.preventDefault();
                E.body.find('.evo_settings_search_trig').removeClass('evodn').focus();
            });

            // Input field typing event
            E.body.on('input keyup change ', '.evo_settings_search_trig', (e) => {
                const searchValue = $(e.currentTarget).val(); // Get the input value
                
                $('.evo_settings_box').find('.field_name, .acus_subheader').each(function(){
                    if( searchValue == ''){
                        $(this).removeClass('evo_searching');
                    }else{
                        const content = $(this).text();
                        if( content.toLowerCase().indexOf( searchValue.toLowerCase() ) != -1 ){
                            $(this).addClass('evo_searching');
                            console.log(content.toLowerCase());
                        }else{
                            $(this).removeClass('evo_searching');
                        }
                    }                    
                });
            });
        },

        // Switch between tabs
        switchTab(tabId) {
            $('.nfer').hide();
            $(`#setting_${tabId}`).show();
            this.E.resetColorButton.toggle(tabId === 'evcal_002');
        },

        // Update tab position arrow
        updateTabPosition(link) {
            this.E.tabs.removeClass('focused');
            link.addClass('focused');
            $('#acus_arrow').css('top', link.position().top + 3).show();
        },

        // Handle form save
        handleFormSave(event) {
            event.preventDefault();
            const $el = $(event.currentTarget);
            const form = this.E.forms;
            const formData = this.serializeFormData(form);
            const tab = new URLSearchParams(window.location.search).get('tab');

            $(event.currentTarget).evo_admin_get_ajax({
                adata: {
                    a: 'eventon_general_settings_save',
                    data: {
                        formData: JSON.stringify(formData),
                        lang: $('.evo_lang_selection').val(),
                        tab,
                        evoajax: evoajax.nonce
                    },
                    loader_btn_el: true,
                    show_snackbar: { duration: 2000 }
                },
                uid: 'evo_save_general_settings',
                onSuccess: (OO, data, LB) => {
                    if( $el.closest('.evo_set_right').find('.evo_updated').length == 0){
                        const messageDiv = $('<div class="evo_updated updated fade"><p>Settings Saved</p></div>')
                            .insertBefore($el);
                        setTimeout(() => messageDiv.remove(), 5000);
                    }
                    
                },
                onError: () => {
                    this.showSnackbar('Error saving settings.');
                }
            });
        },

        // Serialize form data into JSON
        serializeFormData(form) {
            const formData = form.serializeArray();
            const dataObject = {};

            formData.forEach(item => {
                if (item.value === undefined) return;
                let name = item.name;
                const isArray = name.endsWith('[]');
                if (isArray) name = name.slice(0, -2);

                if (isArray) {
                    dataObject[name] = dataObject[name] || [];
                    dataObject[name].push(item.value);
                } else {
                    dataObject[name] = item.value;
                }
            });

            return dataObject;
        },

        // Toggle password visibility
        togglePassword(event) {
            const icon = $(event.currentTarget).find('i');
            const input = $(event.currentTarget).parent().next('p.field_container').find('input');
            icon.toggleClass('fa-eye fa-eye-slash');
            input.attr('type', icon.hasClass('fa-eye') ? 'password' : 'text');
        },

        // Toggle collapse nav menu
        toggleCollapseMenu(event) {
            const $el = $(event.currentTarget);
            const settings = $('.backender_left');
            const diag = $('.evo_diag');
            const langEx = $('.evo_lang_export');
            $el.toggleClass('close');
            settings.toggleClass('mini', $el.hasClass('close'));
            diag.toggleClass('mini', $el.hasClass('close'));
            langEx.toggleClass('mini', $el.hasClass('close'));
        },

        // Reset colors to default
        resetColors() {
            this.E.colorSelectors.each((_, el) => {
                const input = $(el).siblings('input');
                input.val(input.attr('default'));
            });
            this.showSnackbar('Default colors applied.');
        },

        // Show multicolor name on hover
        showMulticolorName(event) {
            const name = $(event.currentTarget).data('name');
            $(event.currentTarget).closest('.row_multicolor').find('.multicolor_alt').text(name);
        },

        // Hide multicolor name
        hideMulticolorName(event) {
            $(event.currentTarget).closest('.row_multicolor').find('.multicolor_alt').text(' ');
        },

        // Show snackbar message
        showSnackbar(message) {
            $('body').evo_snackbar({ message });
        },

        // Initialize webhooks
        initWebhooks() {
            const webhookModule = {
                init: () => {
                    this.E.body.on('evo_ajax_success_evo_webhook_config', () => webhookModule.populateFields());
                    this.E.body.on('change', '.evo_webhooks_config select.wh_trigger_point', () => webhookModule.populateFields());
                    this.E.body.on('click', '.evowh_del', (e) => webhookModule.deleteWebhook(e));
                },
                populateFields: () => {
                    const lightbox = $('.evo_lightbox.evo_webhooks_config');
                    const whdata = lightbox.find('.evo_elm_webhooks_data').data('whdata');
                    const selectedKey = lightbox.find('select').val();
                    const content = (whdata && selectedKey in whdata) ? whdata[selectedKey] : 'n/a';
                    lightbox.find('.evo_whdata_fields').html(content);
                },
                deleteWebhook: (e) => {
                    const container = this.E.webhooksContainer;
                    const id = $(e.currentTarget).closest('p').data('id');
                    $.ajax({
                        url: the_ajax_script.ajaxurl,
                        data: { id, action: 'evo_webhook_delete' },
                        dataType: 'json',
                        type: 'POST',
                        beforeSend: () => container.addClass('evoloading'),
                        success: (data) => {
                            if (data.status === 'good') {
                                container.html(data.html);
                            } else {
                                this.showSnackbar('Error deleting webhook.');
                            }
                        },
                        complete: () => container.removeClass('evoloading')
                    });
                }
            };
            webhookModule.init();
        },

        // Setup image upload
        setupImageUpload() {
            let customMedia = true;
            const origSendAttachment = wp.media.editor.send.attachment;

            this.E.imageButton.on('click', (e) => {
                e.preventDefault();
                const button = $(e.currentTarget);
                const imageSection = button.parent();

                wp.media.editor.send.attachment = (props, attachment) => {
                    if (customMedia) {
                        imageSection.find('.ajt_image_id').val(attachment.id);
                        imageSection.find('.ajt_image_holder img').attr('src', attachment.url);
                        imageSection.find('.ajt_image_holder').fadeIn();
                        button.fadeOut();
                    } else {
                        return origSendAttachment.apply(this, [props, attachment]);
                    }
                };

                wp.media.editor.open(button);
            });

            this.E.body.on('click', '.add_media', () => { customMedia = false; });

            this.E.removeImageButton.on('click', (e) => {
                e.preventDefault();
                const imageSection = $(e.currentTarget).closest('p');
                imageSection.find('.ajt_image_id').val('');
                imageSection.find('.ajt_image_holder').fadeOut();
                imageSection.find('.ajt_choose_image').fadeIn();
            });
        },

        // Setup sortable fields
        setupSortableFields() {
            this.E.arrangeBox.sortable({
                update: (e, ui) => {
                    const box = $(ui.item).closest('.evosetting_rearrange_box');
                    const sortedIds = $(e.target).sortable('toArray', { attribute: 'data-val' });
                    box.find('.ajderearrange_order').val(sortedIds);
                    this.updateFieldsList(box);
                }
            });

            this.E.arrangeBox.on('click', '.evosetting_tog_trig', (e) => {
                const trigger = $(e.currentTarget);
                trigger.toggleClass(trigger.hasClass('secondary') ? 'fa-toggle-on fa-toggle-off' : 'fa-circle-check fa-circle');
                trigger.toggleClass('on off');
                this.updateFieldsList(trigger.closest('.evosetting_rearrange_box'));
            });
        },

        // Update sortable fields list
        updateFieldsList(box) {
            let selectedFields = '';
            let secondaryFields = '';

            box.find('.evosetting_tog_trig').each((_, trigger) => {
                if ($(trigger).hasClass('off')) return;
                const val = $(trigger).closest('.evo_data_item').data('val');
                if ($(trigger).hasClass('secondary')) {
                    secondaryFields += `${val},`;
                } else {
                    selectedFields += `${val},`;
                }
            });

            box.find('.ajderearrange_selected').val(selectedFields);
            box.find('.ajderearrange_secondary').val(secondaryFields);
        },

        // Set initial order for arrange box
        setInitialArrangeBoxOrder() {
            let items = '';
            $('#ajdeEVC_arrange_box .evo_data_item').each((_, item) => {
                const val = $(item).data('val');
                if (val && val !== 'undefined') items += `${val},`;
            });
            $('.ajderearrange_order').val(items);
        },

        // Cleanup extra save buttons
        cleanupExtraButtons() {
            $('.evo_diag').not('.actual').remove();
        }
    };


    // Initialize on document ready
    $(document).ready(() => EventONSettings.init());
})(jQuery);

