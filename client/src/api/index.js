const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL.replace(/\/$/, '')}/api/v1`;

let inMemoryAccessToken = null;

// Catalog data is public, changes infrequently, and is requested by several
// independent components (especially in development Strict Mode). Keep a very
// small client-side cache and coalesce identical in-flight reads so navigation
// never creates duplicate network work. Authenticated/profile requests are
// deliberately excluded to avoid serving stale personal data.
const publicReadCache = new Map();
const inFlightReads = new Map();
const PUBLIC_READ_TTLS = [
  { pattern: /^\/categories(?:\?|$)/, ttl: 10 * 60 * 1000 },
  { pattern: /^\/products\/collections\/featured(?:\?|$)/, ttl: 5 * 60 * 1000 },
  { pattern: /^\/products(?:\/[^/?]+)?(?:\?|$)/, ttl: 60 * 1000 },
];

function publicReadTtl(endpoint) {
  return PUBLIC_READ_TTLS.find(({ pattern }) => pattern.test(endpoint))?.ttl || 0;
}

export function invalidatePublicReadCache(...prefixes) {
  for (const key of publicReadCache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) publicReadCache.delete(key);
  }
}

export function setAccessToken(token) {
  inMemoryAccessToken = token;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

// Customer API fetch helper — sends httpOnly cookies & handles access token refresh
export async function fetchApi(endpoint, options = {}) {
  const { headers: customHeaders, _isRetry, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const cacheTtl = method === 'GET' && !fetchOptions.signal && !_isRetry
    ? publicReadTtl(endpoint)
    : 0;
  const cacheKey = `${method}:${endpoint}`;

  if (cacheTtl) {
    const cached = publicReadCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;
    if (cached) publicReadCache.delete(cacheKey);
    if (inFlightReads.has(cacheKey)) return inFlightReads.get(cacheKey);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(inMemoryAccessToken ? { Authorization: `Bearer ${inMemoryAccessToken}` } : {}),
    ...customHeaders,
  };

  const request = (async () => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      credentials: 'include', // Includes httpOnly refreshToken cookie
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Handle TOKEN_EXPIRED by triggering silent refresh and retrying once
      if (res.status === 401 && data.code === 'TOKEN_EXPIRED' && !_isRetry && endpoint !== '/auth/refresh') {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          const refreshData = await refreshRes.json().catch(() => ({}));

          if (refreshRes.ok && refreshData.success && refreshData.accessToken) {
            setAccessToken(refreshData.accessToken);
            // Retry original request once
            return await fetchApi(endpoint, {
              ...options,
              _isRetry: true,
            });
          }
        } catch (_) {
          setAccessToken(null);
        }
      }

      throw new Error(data.message || 'Something went wrong');
    }

    if (method !== 'GET' && (/^\/products(?:\/|$)/.test(endpoint) || /^\/categories(?:\/|$)/.test(endpoint))) {
      // Product/category writes must be visible immediately in the same tab.
      invalidatePublicReadCache('GET:/products', 'GET:/categories');
    }

    return data;
  } catch (err) {
    console.warn(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
  })();

  if (!cacheTtl) return request;

  inFlightReads.set(cacheKey, request);
  try {
    const data = await request;
    publicReadCache.set(cacheKey, { data, expiresAt: Date.now() + cacheTtl });
    return data;
  } finally {
    inFlightReads.delete(cacheKey);
  }
}

// Dedicated Admin API fetch helper — strictly uses wagh_admin_token
export async function fetchAdminApi(endpoint, options = {}) {
  const adminToken =
    localStorage.getItem('wagh_admin_token') || sessionStorage.getItem('wagh_admin_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('wagh_admin_token');
        sessionStorage.removeItem('wagh_admin_token');
      }
      throw new Error(data.message || 'Admin request failed');
    }

    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET') {
      invalidatePublicReadCache('GET:/products', 'GET:/categories');
    }

    return data;
  } catch (err) {
    console.warn(`Admin API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

// Reads the download filename out of a Content-Disposition header, supporting
// both the plain `filename="…"` and RFC 5987 `filename*=UTF-8''…` forms.
function parseFilenameFromDisposition(disposition) {
  if (!disposition) return '';

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      // fall through to the plain filename below
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(disposition);
  return plainMatch ? plainMatch[1].trim() : '';
}

/**
 * Admin fetch helper for binary file downloads (Excel exports, etc).
 * Mirrors fetchAdminApi's auth and 401 handling, but resolves to the raw Blob
 * instead of parsed JSON. Error responses are still read as JSON so the server's
 * message reaches the caller.
 *
 * @returns {Promise<{ blob: Blob, filename: string, totalRecords: number|null }>}
 */
export async function fetchAdminFile(endpoint, options = {}) {
  const adminToken =
    localStorage.getItem('wagh_admin_token') || sessionStorage.getItem('wagh_admin_token');

  const headers = {
    ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('wagh_admin_token');
        sessionStorage.removeItem('wagh_admin_token');
      }
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || `Download failed (${res.status})`);
    }

    const blob = await res.blob();
    if (!blob || blob.size === 0) {
      throw new Error('The server returned an empty file');
    }

    const totalHeader = res.headers.get('X-Total-Records');

    return {
      blob,
      filename: parseFilenameFromDisposition(res.headers.get('Content-Disposition')),
      totalRecords: totalHeader === null ? null : Number(totalHeader),
    };
  } catch (err) {
    console.warn(`Admin File Download Error [${endpoint}]:`, err.message);
    throw err;
  }
}

/**
 * Trigger a browser "Save as" for an in-memory Blob.
 * Uses a temporary object URL + synthetic anchor click, which is the only
 * approach that works consistently on desktop and mobile browsers (including
 * iOS Safari) for files fetched with an Authorization header.
 */
export function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = filename || 'download';
  link.rel = 'noopener';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke on the next tick so Safari has time to start the download
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
