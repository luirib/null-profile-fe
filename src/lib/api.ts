import type {
  PasskeySummary,
  RelyingPartySummary,
  RelyingPartyDetail,
  CreateRelyingPartyRequest,
  UpdateRelyingPartyRequest,
  UsageSummary,
  DonationSummary,
  CreateDonationCheckoutRequest,
  CheckoutSessionResponse,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface ApiError {
  message: string;
  status?: number;
  traceId?: string; // Correlation ID for debugging
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
 * 
 * Includes trace ID extraction for debugging production issues:
 * - Reads X-Trace-Id from response headers
 * - Includes trace ID in error objects
 * - Logs trace ID to console for easy copy/paste
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

    // Extract trace ID from response headers for debugging
    const traceId = response.headers.get('X-Trace-Id') || undefined;
    if (traceId) {
      console.log(`[API] Request trace ID: ${traceId} (${options?.method || 'GET'} ${endpoint})`);
    }

    // Global 401/403 handling
    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      throw {
        message: 'Unauthorized',
        status: response.status,
        traceId,
      } as ApiError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      let errorTraceId = traceId;
      
      // Check for custom error message in header
      const headerErrorMessage = response.headers.get('X-Error-Message');
      if (headerErrorMessage) {
        errorMessage = headerErrorMessage;
      } else {
        try {
          const errorJson = JSON.parse(errorText);
          // Prioritize errorDescription (user message) over error (error code)
          errorMessage = errorJson.errorDescription || errorJson.message || errorJson.error || errorMessage;
          // Extract trace ID from error body if present
          if (errorJson.traceId) {
            errorTraceId = errorJson.traceId;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
      }
      
      // Log error with trace ID for debugging
      console.error(`[API ERROR] ${errorMessage} (Trace ID: ${errorTraceId || 'unknown'})`);
      
      const error: ApiError = {
        message: errorMessage,
        status: response.status,
        traceId: errorTraceId,
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
    console.error('[API ERROR] Network error:', error);
    throw {
      message: 'Network error. Please check your connection.',
      status: 0,
      traceId: undefined,
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
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await apiPost('/api/session/logout');
  } finally {
    localStorage.removeItem('authenticated');
    window.location.href = '/login';
  }
}

/**
 * Check if user is authenticated
 */
export async function checkAuthentication(): Promise<boolean> {
  return localStorage.getItem('authenticated') === 'true';
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

/**
 * Get usage summary for a specific RP or all RPs
 * @param rpId - "ALL" for all RPs, or a specific RP UUID
 * @param months - Number of months to retrieve (6, 12, or 24)
 */
export async function getUsageSummary(rpId: string, months: number): Promise<UsageSummary> {
  return apiGet<UsageSummary>(`/api/usage/summary?rpId=${rpId}&months=${months}`);
}

// ============================================================================
// Billing/Donations
// ============================================================================

/**
 * Get donation summary for a user
 * @param userId - User UUID to get donation summary for
 */
export async function getDonationSummary(userId: string): Promise<DonationSummary> {
  return apiGet<DonationSummary>(`/api/billing/donations/summary?userId=${userId}`);
}

/**
 * Create a Stripe Checkout session for a donation
 * @param userId - User UUID making the donation
 * @param amountMinor - Donation amount in minor units (cents)
 */
export async function createDonationCheckoutSession(
  userId: string,
  amountMinor: number
): Promise<CheckoutSessionResponse> {
  const request: CreateDonationCheckoutRequest = {
    userId,
    amount: amountMinor,
  };
  return apiPost<CheckoutSessionResponse>('/api/billing/donations/checkout-session', request);
}

