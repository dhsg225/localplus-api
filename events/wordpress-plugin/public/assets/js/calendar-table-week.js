/**
 * Table Week Calendar View JavaScript
 */

(function ($) {
    'use strict';

    $(document).ready(function () {
        initTableWeekView();
    });

    function initTableWeekView() {
        const tableWeekCalendars = document.querySelectorAll('.localplus-calendar-table-week');

        tableWeekCalendars.forEach(calendar => {
            const prevWeekBtn = calendar.querySelector('.localplus-nav-prev-week');
            const nextWeekBtn = calendar.querySelector('.localplus-nav-next-week');

            if (prevWeekBtn) {
                prevWeekBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    navigateWeek(calendar, -1);
                });
            }

            if (nextWeekBtn) {
                nextWeekBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    navigateWeek(calendar, 1);
                });
            }

            // Lightbox events are globally handled by frontend.js via initLightbox
        });
    }

    function navigateWeek(calendar, direction) {
        const weekStart = calendar.dataset.weekStart;
        if (!weekStart) return;

        const date = new Date(weekStart);
        date.setDate(date.getDate() + (direction * 7));
        const newDate = date.toISOString().split('T')[0];

        navigateToWeek(calendar, newDate);
    }

    function navigateToWeek(calendar, date) {
        const url = new URL(window.location.href);
        url.searchParams.set('table_week_start', date);
        window.history.pushState({}, '', url);
        window.location.href = url.toString();
    }

})(jQuery);

