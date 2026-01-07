// [2025-12-05] - Recurrence Engine
// Generates event occurrences on-the-fly based on iCal-style RRULE
// Inspired by EventON but cleaner and more performant
// Timezone-aware, generates only within requested date range

const { DateTime } = require('luxon');

/**
 * Generate occurrences for a recurring event
 * @param {Object} event - Parent event object
 * @param {Object} rule - Recurrence rule from recurrence_rules table
 * @param {Date|string} startDate - Start of date range (inclusive)
 * @param {Date|string} endDate - End of date range (inclusive)
 * @returns {Array} Array of occurrence objects
 */
function generateOccurrences(event, rule, startDate, endDate) {
  if (!rule || !event.is_recurring) {
    return [];
  }

  // Parse dates
  const rangeStart = DateTime.fromJSDate(new Date(startDate), { zone: rule.timezone || 'UTC' });
  const rangeEnd = DateTime.fromJSDate(new Date(endDate), { zone: rule.timezone || 'UTC' });
  const eventStart = DateTime.fromISO(event.start_time, { zone: rule.timezone || 'UTC' });
  const eventEnd = DateTime.fromISO(event.end_time, { zone: rule.timezone || 'UTC' });
  
  // Calculate duration of the event
  const eventDuration = eventEnd.diff(eventStart);

  const occurrences = [];
  let currentDate = eventStart;
  let occurrenceCount = 0;

  // Parse exceptions as Date objects for comparison
  const exceptions = (rule.exceptions || []).map(d => DateTime.fromISO(d, { zone: rule.timezone || 'UTC' }).startOf('day'));
  const additionalDates = (rule.additional_dates || []).map(d => DateTime.fromISO(d, { zone: rule.timezone || 'UTC' }).startOf('day'));

  // Generate occurrences based on frequency
  while (currentDate <= rangeEnd) {
    // Check end conditions
    if (rule.until) {
      const untilDate = DateTime.fromISO(rule.until, { zone: rule.timezone || 'UTC' });
      if (currentDate > untilDate) {
        break;
      }
    }

    if (rule.count !== null && occurrenceCount >= rule.count) {
      break;
    }

    // Check if current date is in range
    if (currentDate >= rangeStart && currentDate <= rangeEnd) {
      const dateKey = currentDate.toISODate();
      const isException = exceptions.some(ex => ex.toISODate() === dateKey);
      
      if (!isException) {
        const occurrenceEnd = currentDate.plus(eventDuration);
        
        occurrences.push({
          occurrence_id: `${event.id}-${dateKey}`,
          parent_event: event.id,
          ...event,
          start_time: currentDate.toISO(),
          end_time: occurrenceEnd.toISO(),
          is_occurrence: true,
          occurrence_date: dateKey
        });
        
        occurrenceCount++;
      }
    }

    // Move to next occurrence based on frequency
    currentDate = getNextOccurrenceDate(currentDate, rule, eventStart);
    
    // Safety limit to prevent infinite loops
    if (occurrenceCount > 10000) {
      console.warn(`[Recurrence Engine] Safety limit reached for event ${event.id}`);
      break;
    }
  }

  // Add additional dates
  additionalDates.forEach(addDate => {
    const dateKey = addDate.toISODate();
    if (addDate >= rangeStart && addDate <= rangeEnd) {
      const occurrenceStart = addDate.set({
        hour: eventStart.hour,
        minute: eventStart.minute,
        second: eventStart.second
      });
      const occurrenceEnd = occurrenceStart.plus(eventDuration);
      
      // Check if this date already exists as a regular occurrence
      const exists = occurrences.some(occ => occ.occurrence_date === dateKey);
      if (!exists) {
        occurrences.push({
          occurrence_id: `${event.id}-${dateKey}`,
          parent_event: event.id,
          ...event,
          start_time: occurrenceStart.toISO(),
          end_time: occurrenceEnd.toISO(),
          is_occurrence: true,
          occurrence_date: dateKey,
          is_additional: true
        });
      }
    }
  });

  // Sort by start_time
  occurrences.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return occurrences;
}

/**
 * Calculate the next occurrence date based on recurrence rule
 * @param {DateTime} currentDate - Current occurrence date
 * @param {Object} rule - Recurrence rule
 * @param {DateTime} eventStart - Original event start date
 * @returns {DateTime} Next occurrence date
 */
function getNextOccurrenceDate(currentDate, rule, eventStart) {
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'daily':
      return currentDate.plus({ days: interval });

    case 'weekly':
      if (rule.byweekday && rule.byweekday.length > 0) {
        // Find next weekday in the list
        // Rule uses: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        // Luxon uses: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
        const weekdays = rule.byweekday; // [1, 3, 5] = Mon, Wed, Fri
        let nextDate = currentDate.plus({ days: 1 });
        
        // Look ahead up to 7 * interval days to find next valid weekday
        for (let i = 0; i < 7 * interval; i++) {
          // Convert Luxon weekday (1-7) to rule format (0-6)
          let luxonWeekday = nextDate.weekday; // 1=Mon, 7=Sun
          let ruleWeekday = luxonWeekday === 7 ? 0 : luxonWeekday; // 0=Sun, 1=Mon, ..., 6=Sat
          
          if (weekdays.includes(ruleWeekday)) {
            return nextDate;
          }
          nextDate = nextDate.plus({ days: 1 });
        }
        
        // If not found in current week, jump to next interval week
        // Convert first weekday from rule format to Luxon format
        const firstWeekday = weekdays[0] === 0 ? 7 : weekdays[0];
        return currentDate.plus({ weeks: interval }).set({ weekday: firstWeekday });
      } else {
        // No specific weekdays, just add interval weeks
        return currentDate.plus({ weeks: interval });
      }

    case 'monthly':
      if (rule.bymonthday) {
        // On day X of month
        let nextDate = currentDate.plus({ months: interval });
        const targetDay = Math.min(rule.bymonthday, nextDate.daysInMonth);
        return nextDate.set({ day: targetDay });
      } else if (rule.bysetpos && rule.byweekday && rule.byweekday.length > 0) {
        // On Nth weekday of month (e.g., 1st Monday)
        let nextDate = currentDate.plus({ months: interval });
        const weekday = rule.byweekday[0]; // Use first weekday if multiple
        const setpos = rule.bysetpos; // 1=first, 2=second, 3=third, 4=fourth, -1=last
        
        // Convert weekday from rule format (0-6) to Luxon format (1-7)
        const luxonWeekday = weekday === 0 ? 7 : weekday;
        
        if (setpos === -1) {
          // Last weekday of month
          const lastDay = nextDate.endOf('month');
          let candidate = lastDay;
          while (candidate.weekday !== luxonWeekday && candidate.day > 1) {
            candidate = candidate.minus({ days: 1 });
          }
          return candidate;
        } else {
          // Nth weekday of month
          const firstDay = nextDate.startOf('month');
          let candidate = firstDay;
          let found = 0;
          
          while (candidate.month === nextDate.month) {
            if (candidate.weekday === luxonWeekday) {
              found++;
              if (found === setpos) {
                return candidate;
              }
            }
            candidate = candidate.plus({ days: 1 });
          }
          
          // Fallback: return first of next month
          return nextDate.startOf('month');
        }
      } else {
        // Default: same day of month, interval months later
        return currentDate.plus({ months: interval });
      }

    case 'yearly':
      return currentDate.plus({ years: interval });

    default:
      console.warn(`[Recurrence Engine] Unknown frequency: ${rule.frequency}`);
      return currentDate.plus({ days: 1 });
  }
}

/**
 * Generate cache key for recurrence results
 * @param {string} eventId - Event ID
 * @param {Date|string} startDate - Start of date range
 * @param {Date|string} endDate - End of date range
 * @returns {string} Cache key
 */
function getCacheKey(eventId, startDate, endDate) {
  const start = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
  const end = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
  return `recurrence:${eventId}:${start}:${end}`;
}

module.exports = {
  generateOccurrences,
  getNextOccurrenceDate,
  getCacheKey
};

