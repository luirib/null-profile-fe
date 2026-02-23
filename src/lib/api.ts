import type {
  PasskeySummary,
  RelyingPartySummary,
  RelyingPartyDetail,
  UserInfo,
  CreateRelyingPartyRequest,
  UpdateRelyingPartyRequest,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Handle 401/403 responses globally
 */
function handleUnauthorized() {
  localStorage.removeItem('authenticated');
  window.location.href = '/login';
}

/**
 * Base fetch wrapper with credentials and global error handling
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

    // Global 401/403 handling
    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      throw {
        message: 'Unauthorized',
        status: response.status,
      } as ApiError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      
      // Check for custom error message in header
      const headerErrorMessage = response.headers.get('X-Error-Message');
      if (headerErrorMessage) {
        errorMessage = headerErrorMessage;
      } else {
        try {
          const errorJson = JSON.parse(errorText);
          // Prioritize errorDescription (user message) over error (error code)
          errorMessage = errorJson.errorDescription || errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      }
      
      const error: ApiError = {
        message: errorMessage,
        status: response.status,
      };
      throw error;
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

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
 * PUT request
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'DELETE' });
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<UserInfo> {
  return apiGet<UserInfo>('/api/me');
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await apiPost('/api/logout');
  } finally {
    localStorage.removeItem('authenticated');
    window.location.href = '/login';
  }
}

/**
 * Check if user is authenticated
 */
export async function checkAuthentication(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch (error) {
    const apiError = error as ApiError;
    // If we get 404 (endpoint not implemented), check localStorage fallback
    if (apiError.status === 404) {
      return localStorage.getItem('authenticated') === 'true';
    }
    return false;
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

// ============================================================================
// Passkeys Management
// ============================================================================

/**
 * Get all passkeys for current user
 */
export async function getPasskeys(): Promise<PasskeySummary[]> {
  try {
    return await apiGet<PasskeySummary[]>('/api/passkeys');
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.status === 404) {
      console.warn('Passkeys endpoint not implemented yet');
      return [];
    }
    throw error;
  }
}

/**
 * Get passkey registration options (returns raw backend response)
 */
export async function getPasskeyRegistrationOptions(displayName: string): Promise<any> {
  return apiPost('/api/passkeys/options', { displayName });
}

/**
 * Verify passkey registration (raw backend call)
 */
export async function verifyPasskeyRegistration(payload: any): Promise<void> {
  return apiPost('/api/passkeys/verify', payload);
}

/**
 * Rename a passkey
 */
export async function renamePasskey(id: string, name: string): Promise<void> {
  return apiPut(`/api/passkeys/${id}`, { name });
}

/**
 * Delete a passkey
 */
export async function deletePasskey(id: string): Promise<void> {
  return apiDelete(`/api/passkeys/${id}`);
}

// ============================================================================
// Relying Parties Management
// ============================================================================

/**
 * Get all relying parties
 */
export async function getRelyingParties(): Promise<RelyingPartySummary[]> {
  try {
    return await apiGet<RelyingPartySummary[]>('/api/relying-parties');
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.status === 404) {
      console.warn('Relying Parties endpoint not implemented yet');
      return [];
    }
    throw error;
  }
}

/**
 * Get relying party details
 */
export async function getRelyingParty(id: string): Promise<RelyingPartyDetail> {
  return apiGet<RelyingPartyDetail>(`/api/relying-parties/${id}`);
}

/**
 * Create a new relying party
 */
export async function createRelyingParty(data: CreateRelyingPartyRequest): Promise<RelyingPartyDetail> {
  return apiPost<RelyingPartyDetail>('/api/relying-parties', data);
}

/**
 * Update a relying party
 */
export async function updateRelyingParty(id: string, data: UpdateRelyingPartyRequest): Promise<RelyingPartyDetail> {
  return apiPut<RelyingPartyDetail>(`/api/relying-parties/${id}`, data);
}

/**
 * Delete a relying party
 */
export async function deleteRelyingParty(id: string): Promise<void> {
  return apiDelete(`/api/relying-parties/${id}`);
}

/**
 * Delete the current user's account
 * This permanently removes all passkeys, relying parties, and user data
 */
export async function deleteAccount(): Promise<void> {
  return apiDelete('/api/account');
}

