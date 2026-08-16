const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL.replace(/\/$/, '')}/api/v1`;

async function resolveAuthHeaders(options = {}) {
  const headers = { ...options.headers };

  if (typeof options.getToken === 'function') {
    try {
      const freshToken = await options.getToken();
      if (freshToken) {
        localStorage.setItem('wagh_token', freshToken);
        headers.Authorization = `Bearer ${freshToken}`;
      }
    } catch (_) {
      // Fall back to stored token below
    }
  }

  if (!headers.Authorization) {
    const token = localStorage.getItem('wagh_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const clerkUid = localStorage.getItem('wagh_clerk_uid');
  const clerkEmail = localStorage.getItem('wagh_clerk_email');
  const clerkName = localStorage.getItem('wagh_clerk_name');

  if (clerkUid) {
    headers['x-user-uid'] = clerkUid;
    headers['x-clerk-user-id'] = clerkUid;
  }
  if (clerkEmail) headers['x-user-email'] = clerkEmail;
  if (clerkName) headers['x-user-name'] = clerkName;

  return headers;
}

// Customer API fetch helper — completely isolated from admin session/headers
export async function fetchApi(endpoint, options = {}) {
  const { getToken, headers: _ignored, ...fetchOptions } = options;
  const headers = await resolveAuthHeaders({ getToken, headers: options.headers });

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    const data = await res.json();
    if (!res.ok) {
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

    const data = await res.json();
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
