// [2025-12-05] - Simple in-memory cache for recurrence occurrences
// In production, consider using Redis or Supabase for distributed caching

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached value
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null if expired/not found
 */
function get(key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Set cached value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
function set(key, value, ttl = CACHE_TTL) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl
  });
}

/**
 * Delete cached value
 * @param {string} key - Cache key
 */
function del(key) {
  cache.delete(key);
}

/**
 * Clear all cache entries for an event (when event or rule is updated)
 * @param {string} eventId - Event ID
 */
function clearEventCache(eventId) {
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key.startsWith(`recurrence:${eventId}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
}

/**
 * Clear all cache
 */
function clear() {
  cache.clear();
}

module.exports = {
  get,
  set,
  del,
  clearEventCache,
  clear
};

