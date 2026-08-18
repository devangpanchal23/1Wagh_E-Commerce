const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL.replace(/\/$/, '')}/api/v1`;

let inMemoryAccessToken = null;

export function setAccessToken(token) {
  inMemoryAccessToken = token;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

// Customer API fetch helper — sends httpOnly cookies & handles access token refresh
export async function fetchApi(endpoint, options = {}) {
  const { headers: customHeaders, _isRetry, ...fetchOptions } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...(inMemoryAccessToken ? { Authorization: `Bearer ${inMemoryAccessToken}` } : {}),
    ...customHeaders,
  };

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

    return data;
  } catch (err) {
    console.warn(`API Error [${endpoint}]:`, err.message);
    throw err;
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
    return data;
  } catch (err) {
    console.warn(`Admin API Error [${endpoint}]:`, err.message);
    throw err;
  }
}
