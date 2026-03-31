/**
 * Yearly Calendar View JavaScript
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        initYearlyView();
    });
    
    function initYearlyView() {
        const yearlyCalendars = document.querySelectorAll('.localplus-calendar-yearly');
        
        yearlyCalendars.forEach(calendar => {
            const prevYearBtn = calendar.querySelector('.localplus-nav-prev-year');
            const nextYearBtn = calendar.querySelector('.localplus-nav-next-year');
            const todayBtn = calendar.querySelector('.localplus-nav-today');
            
            if (prevYearBtn) {
                prevYearBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateYear(calendar, -1);
                });
            }
            
            if (nextYearBtn) {
                nextYearBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateYear(calendar, 1);
                });
            }
            
            if (todayBtn) {
                todayBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateToCurrentYear(calendar);
                });
            }
            
            // Click on day to filter/zoom (optional - could navigate to daily view)
            const dayCells = calendar.querySelectorAll('.localplus-yearly-day.has-events');
            dayCells.forEach(day => {
                day.addEventListener('click', function(e) {
                    const date = this.dataset.date;
                    if (date) {
                        // Could navigate to daily view or show events for that day
                        console.log('LocalPlus Events: Day clicked:', date);
                        // Future: Could open a modal or navigate to daily view
                    }
                });
            });
        });
    }
    
    function navigateYear(calendar, direction) {
        const currentYear = parseInt(calendar.dataset.year);
        if (isNaN(currentYear)) return;
        
        const newYear = currentYear + direction;
        navigateToYear(calendar, newYear);
    }
    
    function navigateToCurrentYear(calendar) {
        const currentYear = new Date().getFullYear();
        navigateToYear(calendar, currentYear);
    }
    
    function navigateToYear(calendar, year) {
        const url = new URL(window.location.href);
        url.searchParams.set('year', year);
        window.history.pushState({}, '', url);
        window.location.href = url.toString();
    }
    
})(jQuery);

