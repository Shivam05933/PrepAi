const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 204) return null;
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };

  if (options.body && typeof options.body !== 'string') {
    mergedOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, mergedOptions);
  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
};

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { method: 'DELETE', ...options })
};
