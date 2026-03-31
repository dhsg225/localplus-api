/**
 * Daily Calendar View JavaScript
 * Handles navigation and interactions for daily view
 */

(function ($) {
    'use strict';

    $(document).ready(function () {
        initDailyView();
    });

    function initDailyView() {
        const dailyCalendars = document.querySelectorAll('.localplus-calendar-daily');

        dailyCalendars.forEach(calendar => {
            // Navigation buttons
            const prevDayBtn = calendar.querySelector('.localplus-nav-prev-day');
            const nextDayBtn = calendar.querySelector('.localplus-nav-next-day');
            const prevMonthBtn = calendar.querySelector('.localplus-nav-prev-month');
            const nextMonthBtn = calendar.querySelector('.localplus-nav-next-month');
            const dayStripItems = calendar.querySelectorAll('.localplus-day-strip-item');

            // Navigate to previous day
            if (prevDayBtn) {
                prevDayBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    navigateDay(calendar, -1);
                });
            }

            // Navigate to next day
            if (nextDayBtn) {
                nextDayBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    navigateDay(calendar, 1);
                });
            }

            // Navigate to previous month
            if (prevMonthBtn) {
                prevMonthBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    navigateMonth(calendar, -1);
                });
            }

            // Navigate to next month
            if (nextMonthBtn) {
                nextMonthBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    navigateMonth(calendar, 1);
                });
            }

            // Click on day strip item
            dayStripItems.forEach(item => {
                item.addEventListener('click', function (e) {
                    e.preventDefault();
                    const date = this.dataset.date;
                    if (date) {
                        navigateToDate(calendar, date);
                    }
                });
            });

            // Lightbox events are globally handled by frontend.js via initLightbox
        });
    }

    function navigateDay(calendar, direction) {
        const currentDate = calendar.dataset.focusDate;
        if (!currentDate) return;

        const date = new Date(currentDate);
        date.setDate(date.getDate() + direction);
        const newDate = date.toISOString().split('T')[0];

        navigateToDate(calendar, newDate);
    }

    function navigateMonth(calendar, direction) {
        const currentDate = calendar.dataset.focusDate;
        if (!currentDate) return;

        const date = new Date(currentDate);
        date.setMonth(date.getMonth() + direction);
        const newDate = date.toISOString().split('T')[0];

        navigateToDate(calendar, newDate);
    }

    function navigateToDate(calendar, date) {
        // Update URL parameter
        const url = new URL(window.location.href);
        url.searchParams.set('date', date);
        window.history.pushState({}, '', url);

        // Reload the page with new date
        // In a real implementation, you might want to use AJAX to update just the calendar
        window.location.href = url.toString();
    }

    // Handle browser back/forward
    window.addEventListener('popstate', function () {
        const urlParams = new URLSearchParams(window.location.search);
        const date = urlParams.get('date');
        if (date) {
            const calendar = document.querySelector('.localplus-calendar-daily');
            if (calendar) {
                navigateToDate(calendar, date);
            }
        }
    });

})(jQuery);

