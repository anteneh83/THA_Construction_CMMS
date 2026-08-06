const getBaseUrl = () => {
  // If NEXT_PUBLIC_API_URL is set at build/runtime, use it (no trailing slash)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') + '/api';
  }

  // In browser use the current origin so dev setups that proxy /api work
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  // Fallback for server-side / tests
  return 'http://localhost:5001/api';
};

const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cmms_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },

  post: async (endpoint, data, isMultipart = false) => {
    const body = isMultipart ? data : JSON.stringify(data);
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(isMultipart),
      body,
    });
    return response.json();
  },

  put: async (endpoint, data, isMultipart = false) => {
    const body = isMultipart ? data : JSON.stringify(data);
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(isMultipart),
      body,
    });
    return response.json();
  },

  delete: async (endpoint) => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  login: async (username, password) => {
    const response = await fetch(`${getBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.json();
    if (result.success && typeof window !== 'undefined') {
      localStorage.setItem('cmms_token', result.token);
      localStorage.setItem('cmms_user', JSON.stringify(result.user));
    }
    return result;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cmms_token');
      localStorage.removeItem('cmms_user');
    }
  },

  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('cmms_user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }
};
