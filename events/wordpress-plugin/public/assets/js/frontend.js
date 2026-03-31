/**
 * Frontend JavaScript for LocalPlus Events
 * 
 * @package LocalPlus_Event_Engine
 */

(function ($) {
    'use strict';

    $(document).ready(function () {
        // [2025-12-05] - Initialize ALL shortcode containers on the page
        // This allows multiple shortcodes with different display methods on the same page
        const containers = document.querySelectorAll('.localplus-events-list');

        if (containers.length === 0) return;

        console.log('LocalPlus Events: Found', containers.length, 'shortcode container(s)');

        // Initialize each container independently
        containers.forEach((container, index) => {
            const displayMethod = container.dataset.displayMethod || 'slide-down';
            console.log('LocalPlus Events: Container', index + 1, 'using display method:', displayMethod);

            // Initialize based on display method
            switch (displayMethod) {
                case 'lightbox':
                    initLightbox(container);
                    break;
                case 'slide-down':
                case 'eventcard': // Backward compatibility
                    initSlideDown(container);
                    break;
                case 'gridview':
                case 'daily':
                case 'weekly':
                case 'table-week':
                case 'yearly':
                    // All calendar/grid views use lightbox by default
                    initLightbox(container);
                    break;
                case 'tooltip':
                    initTooltip(container);
                    break;
                case 'singlepage':
                    // No JS needed, links handle it
                    break;
                case 'tiles':
                case 'map':
                case 'slider':
                    // These require addons - show message if needed
                    console.log('Display method "' + displayMethod + '" requires an addon.');
                    break;
            }
        });

        // Lazy load images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            // [2025-01-XX] - Defensive check to prevent null reference errors
            const images = document.querySelectorAll('.localplus-event-image[data-src]');
            if (images && images.length > 0) {
                images.forEach(img => {
                    if (img) {
                        imageObserver.observe(img);
                    }
                });
            }
        }
    });

    /**
     * Initialize Lightbox modal
     * [2025-12-05] - Updated to work with multiple shortcodes on same page
     */
    function initLightbox(container) {
        // Find or create modal (shared across all lightbox instances)
        let modal = document.getElementById('localplus-event-modal');
        if (!modal) {
            // Check if modal exists in this container
            modal = container.querySelector('.localplus-event-modal');
            if (!modal) {
                console.warn('LocalPlus Events: Modal element not found for container');
                return;
            }
            // Move modal to body level and give it an ID
            modal.id = 'localplus-event-modal';
        }

        // Move modal to body level to avoid parent container overflow/positioning issues
        if (modal.parentElement !== document.body) {
            console.log('LocalPlus Events: Moving modal to body level');
            document.body.appendChild(modal);
        }

        // Only set up close handlers once (shared modal)
        if (!modal.dataset.initialized) {
            const closeBtn = modal.querySelector('.localplus-modal-close');

            // Close handlers (only set up once)
            if (closeBtn) {
                closeBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    closeLightbox();
                });
            }

            // Close on overlay click
            modal.addEventListener('click', function (e) {
                if (e.target === modal || e.target.classList.contains('localplus-modal-wrapper')) {
                    closeLightbox();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    closeLightbox();
                }
            });

            modal.dataset.initialized = 'true';
        }

        // Find event cards within THIS container only
        const eventCards = container.querySelectorAll('.localplus-event-lightbox');

        console.log('LocalPlus Events: Initializing lightbox for container, found', eventCards.length, 'cards');

        // Open modal on card click (only for cards in this container)
        eventCards.forEach(card => {
            // Check if already initialized to avoid duplicate listeners
            if (card.dataset.lightboxInitialized === 'true') {
                return;
            }
            card.dataset.lightboxInitialized = 'true';

            card.addEventListener('click', function (e) {
                // Don't open if clicking on a link or button
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                const eventData = this.dataset.eventData;
                if (eventData) {
                    try {
                        const event = JSON.parse(eventData);
                        console.log('LocalPlus Events: Opening lightbox for event:', event.title);
                        openLightbox(event);
                    } catch (e) {
                        console.error('LocalPlus Events: Error parsing event data:', e);
                    }
                } else {
                    console.warn('LocalPlus Events: No event data found on card');
                }
            });
        });
        // Lightbox events are globally handled by frontend.js
    }

    /**
     * Initialize Slide-down panel
     * [2025-12-05] - Updated to work with multiple shortcodes on same page
     * [2025-12-05] - Renamed from initEventCard to initSlideDown
     */
    function initSlideDown(container) {
        const eventCards = container.querySelectorAll('.localplus-event-card-toggle');

        eventCards.forEach(card => {
            // Check if already initialized to avoid duplicate listeners
            if (card.dataset.slideDownInitialized === 'true') {
                return;
            }
            card.dataset.slideDownInitialized = 'true';

            card.addEventListener('click', function (e) {
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    return;
                }

                // Toggle active state
                const isActive = this.classList.contains('active');

                // Close all other cards in this container
                const allCards = container.querySelectorAll('.localplus-event-card-toggle');
                allCards.forEach(c => {
                    if (c !== this) {
                        c.classList.remove('active');
                    }
                });

                // Toggle this card
                if (!isActive) {
                    this.classList.add('active');
                    // Scroll into view if needed
                    setTimeout(() => {
                        const panel = this.querySelector('.localplus-event-details-panel');
                        if (panel) {
                            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }, 300);
                } else {
                    this.classList.remove('active');
                }
            });
        });
    }

    /**
     * Initialize Tooltip
     * [2025-12-05] - Updated to work with multiple shortcodes on same page
     */
    function initTooltip(container) {
        // Find or create tooltip (shared across all tooltip instances)
        let tooltip = document.getElementById('localplus-event-tooltip');
        if (!tooltip) {
            tooltip = container.querySelector('.localplus-event-tooltip');
            if (!tooltip) return;
            tooltip.id = 'localplus-event-tooltip';
            // Move to body if needed
            if (tooltip.parentElement !== document.body) {
                document.body.appendChild(tooltip);
            }
        }

        const eventCards = container.querySelectorAll('.localplus-event-tooltip-trigger');

        eventCards.forEach(card => {
            // Check if already initialized to avoid duplicate listeners
            if (card.dataset.tooltipInitialized === 'true') {
                return;
            }
            card.dataset.tooltipInitialized = 'true';

            const eventData = card.dataset.eventData;
            if (!eventData) return;

            let event;
            try {
                event = JSON.parse(eventData);
            } catch (e) {
                return;
            }

            card.addEventListener('mouseenter', function (e) {
                showTooltip(tooltip, event, e);
            });

            card.addEventListener('mouseleave', function () {
                hideTooltip(tooltip);
            });

            card.addEventListener('mousemove', function (e) {
                positionTooltip(tooltip, e);
            });
        });
    }

    /**
     * Show tooltip
     */
    function showTooltip(tooltip, event, e) {
        const startDate = new Date(event.start_time);
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

        const dateStr = startDate.toLocaleDateString('en-US', dateOptions);
        const timeStr = startDate.toLocaleTimeString('en-US', timeOptions);
        const location = event.venue_area || event.location || 'Location TBA';

        tooltip.innerHTML = `
            <strong>${event.title || ''}</strong><br>
            <small>${dateStr} • ${timeStr}</small><br>
            <small>📍 ${location}</small>
        `;

        tooltip.classList.add('active');
        positionTooltip(tooltip, e);
    }

    /**
     * Position tooltip
     */
    function positionTooltip(tooltip, e) {
        const x = e.clientX + 15;
        const y = e.clientY + 15;

        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }

    /**
     * Hide tooltip
     */
    function hideTooltip(tooltip) {
        tooltip.classList.remove('active');
    }

    /**
     * Open lightbox modal
     */
    function openLightbox(event) {
        const modal = document.getElementById('localplus-event-modal');
        if (!modal) {
            console.error('LocalPlus Events: Modal element not found in DOM');
            return;
        }

        console.log('LocalPlus Events: Opening lightbox modal');
        console.log('LocalPlus Events: Modal element found:', modal);

        // Format date/time
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

        const dateStr = startDate.toLocaleDateString('en-US', dateOptions);
        const timeStr = startDate.toLocaleTimeString('en-US', timeOptions) + ' - ' +
            endDate.toLocaleTimeString('en-US', timeOptions);

        // Populate modal header
        const dateBadge = modal.querySelector('.localplus-modal-date-badge');
        const title = modal.querySelector('.localplus-modal-title');
        const subtitle = modal.querySelector('.localplus-modal-subtitle');
        const headerTime = modal.querySelector('.localplus-modal-header-time');
        const headerLocation = modal.querySelector('.localplus-modal-header-location');

        if (dateBadge) dateBadge.textContent = dateStr;
        if (title) title.textContent = event.title || '';
        if (subtitle) subtitle.textContent = event.subtitle || '';
        if (headerTime) headerTime.textContent = timeStr;
        if (headerLocation) headerLocation.textContent = event.venue_area || event.location || 'Location TBA';

        // Populate modal image
        const modalImage = modal.querySelector('.localplus-modal-image');
        const imageWrapper = modal.querySelector('.localplus-modal-image-wrapper');
        if (event.hero_image_url && modalImage && imageWrapper) {
            modalImage.src = event.hero_image_url;
            modalImage.alt = event.title || '';
            imageWrapper.style.display = 'block';
        } else if (imageWrapper) {
            imageWrapper.style.display = 'none';
        }

        // Populate modal body
        const description = modal.querySelector('.localplus-modal-description');
        if (description) {
            description.textContent = event.full_description || event.description || 'No description available.';
        }

        // Populate Organizer
        const organizer = modal.querySelector('.localplus-modal-organizer');
        if (organizer) {
            // [2025-12-05] - Check organizer field first (set by PHP sanitization), then fallback to metadata
            const organizerName = event.organizer || event.organizer_name || (event.metadata && event.metadata.organizer_name) || event.created_by_name || 'Not specified';
            organizer.textContent = organizerName;
            // Hide organizer section if no organizer data
            if (organizerName === 'Not specified' || !organizerName) {
                const organizerSection = organizer.closest('.localplus-modal-detail-section');
                if (organizerSection) {
                    organizerSection.style.display = 'none';
                }
            }
        }

        // Populate Map
        const mapContainer = modal.querySelector('.localplus-modal-map');
        if (mapContainer) {
            const location = event.venue_area || event.location || '';
            const latitude = event.venue_latitude || event.latitude || event.lat || null;
            const longitude = event.venue_longitude || event.longitude || event.lng || event.lon || null;

            if (latitude && longitude) {
                // Create embedded Google Maps iframe (public embed URL, no API key required)
                const mapEmbedUrl = `https://www.google.com/maps?q=${latitude},${longitude}&hl=en&z=14&output=embed`;
                const mapLinkUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                mapContainer.innerHTML = `
                    <div class="localplus-modal-map-embed">
                        <iframe 
                            src="${mapEmbedUrl}" 
                            width="100%" 
                            height="300" 
                            style="border:0; border-radius: 4px;" 
                            allowfullscreen="" 
                            loading="lazy" 
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                    <a href="${mapLinkUrl}" target="_blank" rel="noopener noreferrer" class="localplus-modal-map-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>Open in Google Maps</span>
                    </a>
                    ${location ? `<p class="localplus-modal-map-location">${location}</p>` : ''}
                `;
            } else if (location) {
                // Show location search with embedded map (public embed URL, no API key required)
                const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
                const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(location)}&hl=en&z=14&output=embed`;
                mapContainer.innerHTML = `
                    <div class="localplus-modal-map-embed">
                        <iframe 
                            src="${mapEmbedUrl}" 
                            width="100%" 
                            height="300" 
                            style="border:0; border-radius: 4px;" 
                            allowfullscreen="" 
                            loading="lazy" 
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                    <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="localplus-modal-map-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>Open ${location} in Google Maps</span>
                    </a>
                `;
            } else {
                mapContainer.innerHTML = '<span class="localplus-modal-map-unavailable">Location not available</span>';
            }
        }

        // Prevent body scroll (EventOn style)
        document.body.classList.add('localplus-modal-open');

        // Force display and add show class
        modal.style.display = 'block';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');

        // Debug: Check computed styles and parent elements
        const computedStyle = window.getComputedStyle(modal);
        console.log('LocalPlus Events: Modal display:', computedStyle.display);
        console.log('LocalPlus Events: Modal opacity:', computedStyle.opacity);
        console.log('LocalPlus Events: Modal visibility:', computedStyle.visibility);
        console.log('LocalPlus Events: Modal z-index:', computedStyle.zIndex);
        console.log('LocalPlus Events: Modal position:', computedStyle.position);
        console.log('LocalPlus Events: Modal top:', computedStyle.top);
        console.log('LocalPlus Events: Modal left:', computedStyle.left);
        console.log('LocalPlus Events: Modal width:', computedStyle.width);
        console.log('LocalPlus Events: Modal height:', computedStyle.height);

        // Check parent elements for overflow/positioning issues
        let parent = modal.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.overflow === 'hidden' || parentStyle.overflow === 'auto' ||
                parentStyle.position === 'relative' || parentStyle.position === 'absolute') {
                console.log('LocalPlus Events: Parent element at depth', depth, ':', parent.tagName, parent.className,
                    'overflow:', parentStyle.overflow, 'position:', parentStyle.position);
            }
            parent = parent.parentElement;
            depth++;
        }

        // Check if modal is actually in viewport
        const rect = modal.getBoundingClientRect();
        console.log('LocalPlus Events: Modal bounding rect:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
        });

        // Force check if modal is visible
        const isVisible = rect.width > 0 && rect.height > 0 &&
            rect.top >= 0 && rect.left >= 0 &&
            rect.top < window.innerHeight && rect.left < window.innerWidth;
        console.log('LocalPlus Events: Modal is visible in viewport:', isVisible);
        console.log('LocalPlus Events: Modal show class added');

        // Reset scroll position
        const scrollable = modal.querySelector('.localplus-modal-scrollable');
        if (scrollable) {
            scrollable.scrollTop = 0;
        }

        // Focus management
        const closeBtn = modal.querySelector('.localplus-modal-close');
        if (closeBtn) {
            setTimeout(() => closeBtn.focus(), 350);
        }
    }

    /**
     * Close lightbox modal
     */
    function closeLightbox() {
        const modal = document.getElementById('localplus-event-modal');
        if (!modal) return;

        console.log('LocalPlus Events: Closing lightbox modal');

        // Remove show class and force hide
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';

        // Restore body scroll after animation
        setTimeout(() => {
            document.body.classList.remove('localplus-modal-open');
            modal.setAttribute('aria-hidden', 'true');
        }, 500);
    }

    // Export functions to window for other scripts to use
    window.openLightbox = openLightbox;
    window.closeLightbox = closeLightbox;

})(jQuery);
