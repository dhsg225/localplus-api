<?php
/**
 * Lightbox Modal Partial
 * Shared across all views that use lightbox
 * 
 * @package LocalPlus_Event_Engine
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="localplus-event-modal" id="localplus-event-modal" role="dialog" aria-labelledby="localplus-modal-title" aria-hidden="true" style="display: none;">
    <div class="localplus-modal-wrapper">
        <div class="localplus-modal-wrapper-inner">
            <div class="localplus-modal-container">
                <button class="localplus-modal-close" aria-label="<?php esc_attr_e('Close', 'localplus-events'); ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="localplus-modal-content">
                    <div class="localplus-modal-header">
                        <div class="localplus-modal-date-badge"></div>
                        <h2 id="localplus-modal-title" class="localplus-modal-title"></h2>
                        <p class="localplus-modal-subtitle"></p>
                        <div class="localplus-modal-header-info">
                            <div class="localplus-modal-header-info-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span class="localplus-modal-header-time"></span>
                            </div>
                            <div class="localplus-modal-header-info-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span class="localplus-modal-header-location"></span>
                            </div>
                        </div>
                    </div>
                    <div class="localplus-modal-scrollable">
                        <div class="localplus-modal-image-wrapper">
                            <img class="localplus-modal-image" src="" alt="">
                        </div>
                        <div class="localplus-modal-body">
                            <div class="localplus-modal-description"></div>
                            
                            <div class="localplus-modal-details">
                                <div class="localplus-modal-detail-section">
                                    <h4 class="localplus-modal-detail-title">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        Organizer
                                    </h4>
                                    <div class="localplus-modal-organizer"></div>
                                </div>
                                
                                <div class="localplus-modal-detail-section">
                                    <h4 class="localplus-modal-detail-title">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                        Map
                                    </h4>
                                    <div class="localplus-modal-map"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

