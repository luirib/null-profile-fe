const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Base fetch wrapper with credentials
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include cookies for session management
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      const error: ApiError = {
        message: errorMessage,
        status: response.status,
      };
      throw error;
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }
    
    // Network or other errors
    throw {
      message: 'Network error. Please check your connection.',
      status: 0,
    } as ApiError;
  }
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Check if user is authenticated (session exists)
 * This is a placeholder - adapt based on actual backend endpoint
 */
export async function checkAuthentication(): Promise<boolean> {
  try {
    // Try to fetch session info from backend
    // If backend doesn't have this endpoint yet, this will fail gracefully
    await apiGet('/api/session');
    return true;
  } catch {
    // For now, fallback to checking localStorage
    return localStorage.getItem('authenticated') === 'true';
  }
}

/**
 * Mark user as authenticated (local fallback)
 */
export function setAuthenticated(value: boolean): void {
  if (value) {
    localStorage.setItem('authenticated', 'true');
  } else {
    localStorage.removeItem('authenticated');
  }
}
