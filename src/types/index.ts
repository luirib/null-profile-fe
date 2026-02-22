/**
 * Type definitions for null-profile frontend
 */

/**
 * Relying Party branding information
 * (Placeholder for future implementation - will be fetched from backend based on OIDC transaction)
 */
export interface RelyingPartyBranding {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * OIDC transaction context
 * Query parameters from backend redirect to login page
 */
export interface OidcTransactionContext {
  txn?: string; // Transaction ID from backend
  // Add more fields as needed based on backend implementation
}

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}
