/**
 * Weekly Calendar View JavaScript
 * [2026-02-02] Enhanced with Speed Scroller and Premium UX
 */

(function ($) {
    'use strict';

    $(document).ready(function () {
        initWeeklyView();
    });

    function initWeeklyView() {
        console.log('LocalPlus: Initializing Weekly View v1.2.17');
        const weeklyCalendars = document.querySelectorAll('.localplus-calendar-weekly');

        weeklyCalendars.forEach(calendar => {
            const container = $(calendar);
            const style = calendar.dataset.weekStyle;

            // Previous/Next Week Navigation
            container.on('click', '.localplus-nav-prev-week, .localplus-nav-next-week', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const direction = $(this).hasClass('localplus-nav-prev-week') ? -1 : 1;
                navigateWeek(calendar, direction);
            });

            // Day Card Click (Style 2 scrolling)
            container.on('click', '.localplus-day-card', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const targetDate = this.dataset.date;

                // Update active state
                container.find('.localplus-day-card').removeClass('active');
                $(this).addClass('active');

                // If in Style 2 (List), we scroll to the section
                if (style == '2') {
                    const targetSection = container.find(`#lp-day-${targetDate}`);
                    if (targetSection.length) {
                        $('html, body').animate({
                            scrollTop: targetSection.offset().top - 150
                        }, 500);
                    }
                }
            });

            // Speed Scroller Toggle
            container.on('click', '.localplus-speed-scroller-trigger', function (e) {
                e.preventDefault();
                e.stopPropagation();
                container.find('.localplus-speed-scroller-dropdown').toggleClass('active');
            });

            // Close dropdown when clicking outside
            $(document).on('click', function (e) {
                if (!$(e.target).closest('.localplus-week-range-selector').length) {
                    container.find('.localplus-speed-scroller-dropdown').removeClass('active');
                }
            });

            // Week selection from dropdown
            container.on('click', '.localplus-scroller-item', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const targetDate = this.dataset.date;
                if (targetDate) {
                    navigateToWeek(calendar, targetDate);
                }
            });

            // Lightbox events are globally handled by frontend.js
        });
    }

    function navigateWeek(calendar, direction) {
        const weekStart = calendar.dataset.weekStart;
        if (!weekStart) return;

        // Use a more robust date parsing to avoid timezone shifts
        const parts = weekStart.split('-');
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        date.setDate(date.getDate() + (direction * 7));

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const newDate = `${y}-${m}-${d}`;

        navigateToWeek(calendar, newDate);
    }

    function navigateToWeek(calendar, date) {
        const url = new URL(window.location.href);
        url.searchParams.set('week_start', date);
        window.location.href = url.toString();
    }

})(jQuery);
