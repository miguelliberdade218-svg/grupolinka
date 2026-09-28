import { useAuth } from '../contexts/authContext';

export const useApiClient = () => {
  const { token } = useAuth();

  const request = async <T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      const existingHeaders = options.headers as Record<string, string>;
      Object.assign(headers, existingHeaders);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  };

  return {
    get: <T = any>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T = any>(url: string, body?: any) =>
      request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    put: <T = any>(url: string, body?: any) =>
      request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
    patch: <T = any>(url: string, body?: any) =>
      request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' }),
  };
};

// Para uso sem hooks
export const apiClient = {
  get: async <T = any>(url: string, token?: string): Promise<T> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },

  post: async <T = any>(url: string, body?: any, token?: string): Promise<T> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },

  put: async <T = any>(url: string, body?: any, token?: string): Promise<T> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },

  patch: async <T = any>(url: string, body?: any, token?: string): Promise<T> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },

  delete: async <T = any>(url: string, token?: string): Promise<T> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(url, { method: 'DELETE', headers });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },
};
