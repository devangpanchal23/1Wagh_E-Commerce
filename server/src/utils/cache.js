/**
 * Tiny in-process TTL cache for hot read-only endpoints (catalog, categories,
 * home collections). Survives between requests on a warm server/lambda, so
 * repeat visitors are served without a database round trip at all.
 *
 * Deliberately not Redis: the catalog is small and a single process cache
 * removes the network hop entirely.
 */

const store = new Map();
const MAX_ENTRIES = 200;

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value;
}

function set(key, value, ttlSeconds = 60) {
  // Evict oldest insertion first — Map preserves insertion order.
  if (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    store.delete(oldestKey);
  }

  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/**
 * Drops every entry whose key starts with one of the given prefixes.
 * Called after writes so admins see their edits immediately.
 */
function invalidate(...prefixes) {
  for (const key of store.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      store.delete(key);
    }
  }
}

function clear() {
  store.clear();
}

module.exports = { get, set, invalidate, clear };
