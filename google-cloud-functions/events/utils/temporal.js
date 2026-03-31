// [2026-03-29] - Temporal Event Engine Utility (v1.7.0)
// Deterministic expansion of recurrence rules without external dependencies.

/**
 * Expands a recurrence rule into instances for a given date range.
 * 
 * @param {Object} event Parent event data (start_time, end_time, timezone)
 * @param {Object} rule Recurrence rule data
 * @param {Date} limitDate The end date for generation (default: 3 months from now)
 * @returns {Array} Array of instances { start_time, end_time }
 */
function expandRecurrence(event, rule, limitDate = null) {
  const instances = [];
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const duration = end.getTime() - start.getTime();

  // If no limit provided, default to 3 months
  if (!limitDate) {
    limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() + 3);
  }

  const frequency = rule.frequency; // daily, weekly, monthly
  const interval = rule.interval || 1;
  const count = rule.count;
  const until = rule.until ? new Date(rule.until) : null;
  const byweekday = rule.by_day || []; // ['mo', 'tu', ...]
  const bymonthday = rule.by_month_day || []; // [1, 15, ...]

  let currentStart = new Date(start);
  let iterations = 0;

  // For the very first instance, we always include it if it's the start date
  // But subsequent iterations will move the cursor
  
  while (true) {
    // 1. Basic Constraints
    if (count && instances.length >= count) break;
    if (until && currentStart > until) break;
    if (currentStart > limitDate) break;

    // 2. Frequency Logic
    if (frequency === 'daily') {
       // Only add after iteration 0 if we already have the start
       if (iterations > 0) currentStart.setDate(currentStart.getDate() + interval);
    } 
    else if (frequency === 'weekly') {
      if (iterations > 0 && byweekday.length === 0) {
        currentStart.setDate(currentStart.getDate() + (interval * 7));
      } else if (byweekday.length > 0) {
         // ADVANCED WEEKLY: Scan day by day until we hit a selected weekday
         if (iterations > 0) currentStart.setDate(currentStart.getDate() + 1);
         const dayMap = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
         const currentDay = dayMap[currentStart.getDay()];
         if (!byweekday.includes(currentDay)) {
            iterations++;
            continue; 
         }
      } else if (iterations > 0) {
        currentStart.setDate(currentStart.getDate() + (interval * 7));
      }
    }
    else if (frequency === 'monthly') {
      if (iterations > 0) currentStart.setMonth(currentStart.getMonth() + interval);
      if (bymonthday.length > 0) {
         // ADVANCED MONTHLY: Force to specific day of month
         currentStart.setDate(bymonthday[0]); 
      }
    }
    else if (iterations > 0) {
       break; // Single instance
    }

    // Double check constraints again after move
    if (until && currentStart > until) break;
    if (currentStart > limitDate) break;

    // 3. Exception check
    const dateStr = currentStart.toISOString().split('T')[0];
    const isExcluded = rule.exceptions && rule.exceptions.includes(dateStr);

    if (!isExcluded) {
      const instanceEnd = new Date(currentStart.getTime() + duration);
      instances.push({
        start_time: currentStart.toISOString(),
        end_time: instanceEnd.toISOString()
      });
    }

    iterations++;
    // Fallback infinite loop protection
    if (iterations > 1000) break;
  }

  return instances;
}

module.exports = {
  expandRecurrence
};
