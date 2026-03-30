import { apiPost } from './api';
import { arrayBufferToBase64Url, base64UrlToArrayBuffer } from './base64url';

/**
 * WebAuthn Registration Options from backend
 */
export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  timeout?: number;
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    residentKey?: 'required' | 'preferred' | 'discouraged';
    requireResidentKey?: boolean;
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
  attestation?: 'none' | 'indirect' | 'direct';
}

/**
 * WebAuthn Authentication Options from backend
 */
export interface AuthenticationOptions {
  challenge: string;
  timeout?: number;
  rpId?: string;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  allowCredentials?: Array<{
    type: string;
    id: string;
  }>;
}

/**
 * Get registration options from backend
 */
export async function getRegistrationOptions(
  txn?: string,
  displayName?: string
): Promise<RegistrationOptions> {
  return apiPost<RegistrationOptions>('/webauthn/registration/options', {
    txn,
    displayName,
  });
}

/**
 * Verify registration with backend
 */
export async function verifyRegistration(
  credential: Credential,
  name: string,
  txn?: string
): Promise<{ success: boolean; redirectUrl?: string }> {
  const publicKeyCredential = credential as PublicKeyCredential;
  const response = publicKeyCredential.response as AuthenticatorAttestationResponse;

  const registrationData = {
    id: publicKeyCredential.id,
    rawId: arrayBufferToBase64Url(publicKeyCredential.rawId),
    type: publicKeyCredential.type,
    response: {
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
    },
    name,
    txn,
  };

  return apiPost<{ success: boolean; redirectUrl?: string }>(
    '/webauthn/registration/verify',
    registrationData
  );
}

/**
 * Get authentication options from backend
 */
export async function getAuthenticationOptions(
  txn?: string
): Promise<AuthenticationOptions> {
  return apiPost<AuthenticationOptions>('/webauthn/authentication/options', {
    txn,
  });
}

/**
 * Verify authentication with backend
 */
export async function verifyAuthentication(
  credential: Credential,
  txn?: string
): Promise<{ success: boolean; redirectUrl?: string }> {
  const publicKeyCredential = credential as PublicKeyCredential;
  const response = publicKeyCredential.response as AuthenticatorAssertionResponse;

  const authenticationData = {
    id: publicKeyCredential.id,
    rawId: arrayBufferToBase64Url(publicKeyCredential.rawId),
    type: publicKeyCredential.type,
    response: {
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      signature: arrayBufferToBase64Url(response.signature),
      userHandle: response.userHandle
        ? arrayBufferToBase64Url(response.userHandle)
        : null,
    },
    txn,
  };

  return apiPost<{ success: boolean; redirectUrl?: string }>(
    '/webauthn/authentication/verify',
    authenticationData
  );
}

/**
 * Generate a suggested passkey name based on browser/platform
 */
export function generateSuggestedPasskeyName(): string {
  const ua = navigator.userAgent;
  let platform = 'Device';
  let browser = '';

  // Detect platform
  if (ua.includes('Windows')) platform = 'Windows';
  else if (ua.includes('Mac')) platform = 'Mac';
  else if (ua.includes('Linux')) platform = 'Linux';
  else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS';
  else if (ua.includes('Android')) platform = 'Android';

  // Detect browser
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  if (browser) {
    return `${platform} ${browser}`;
  }
  return `${platform} device`;
}

/**
 * Register a new passkey (WebAuthn registration flow)
 */
export async function registerPasskey(
  txn?: string,
  displayName?: string
): Promise<{ success: boolean; redirectUrl?: string }> {
  // Check WebAuthn support
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Get registration options from backend
  const options = await getRegistrationOptions(txn, displayName);

  // IMPORTANT: Override user.name and user.displayName with the chosen label
  // This ensures the OS/platform shows the user's chosen name, not the backend's technical name
  const chosenLabel = displayName || options.user.displayName;

  // Convert base64url strings to ArrayBuffers
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge: base64UrlToArrayBuffer(options.challenge),
    rp: options.rp,
    user: {
      id: base64UrlToArrayBuffer(options.user.id),
      name: chosenLabel,  // Override with chosen label so OS displays it
      displayName: chosenLabel,  // Also set displayName
    },
    pubKeyCredParams: options.pubKeyCredParams.map((param) => ({
      type: param.type as PublicKeyCredentialType,
      alg: param.alg,
    })),
    timeout: options.timeout,
    authenticatorSelection: options.authenticatorSelection,
    attestation: options.attestation,
  };

  // Create credential
  const credential = await navigator.credentials.create({
    publicKey: publicKeyOptions,
  });

  if (!credential) {
    throw new Error('Failed to create credential');
  }

  // Verify with backend - pass the chosen label as the name
  return verifyRegistration(credential, chosenLabel, txn);
}

/**
 * Authenticate with passkey (WebAuthn authentication flow)
 */
export async function authenticateWithPasskey(
  txn?: string
): Promise<{ success: boolean; redirectUrl?: string }> {
  // Check WebAuthn support
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Get authentication options from backend
  const options = await getAuthenticationOptions(txn);

  // Convert base64url strings to ArrayBuffers
  const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge: base64UrlToArrayBuffer(options.challenge),
    timeout: options.timeout,
    rpId: options.rpId,
    userVerification: options.userVerification,
    allowCredentials: options.allowCredentials?.map((cred) => ({
      type: cred.type as PublicKeyCredentialType,
      id: base64UrlToArrayBuffer(cred.id),
    })),
  };

  // Get credential
  const credential = await navigator.credentials.get({
    publicKey: publicKeyOptions,
  });

  if (!credential) {
    throw new Error('Failed to get credential');
  }

  // Verify with backend
  return verifyAuthentication(credential, txn);
}

/**
 * Check if WebAuthn is available
 */
export function isWebAuthnAvailable(): boolean {
  return !!window.PublicKeyCredential;
}

/**
 * Get user-friendly error message for WebAuthn errors
 * Includes trace ID for debugging production issues
 */
export function getWebAuthnErrorMessage(error: unknown): string {
  // Handle API errors (from backend) with trace ID
  if (error && typeof error === 'object') {
    const apiError = error as any;
    
    if ('traceId' in apiError && apiError.traceId) {
      // Include trace ID in error message for user to report
      const baseMessage = apiError.message || 'An error occurred';
      return `${baseMessage}\n\nTrace ID: ${apiError.traceId}\n(Copy this ID when reporting issues)`;
    }
    
    if ('message' in apiError && typeof apiError.message === 'string') {
      return apiError.message;
    }
  }
  
  // Handle browser WebAuthn errors
  if (error instanceof Error) {
    const errorName = error.name;
    
    switch (errorName) {
      case 'NotAllowedError':
        return 'Authentication was cancelled or timed out.';
      case 'NotSupportedError':
        return 'WebAuthn is not supported on this device.';
      case 'SecurityError':
        return 'Security error. Please ensure you are on a secure connection (HTTPS).';
      case 'InvalidStateError':
        return 'This passkey has already been registered.';
      case 'AbortError':
        return 'Authentication was aborted.';
      default:
        return error.message || 'An unknown error occurred.';
    }
  }
  
  return 'An unknown error occurred.';
}

/**
 * Add a new passkey to an authenticated user
 */
export async function addPasskeyToUser(displayName: string): Promise<void> {
  // Check WebAuthn support
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Get registration options from backend
  const { getPasskeyRegistrationOptions, verifyPasskeyRegistration } = await import('./api');
  const options = await getPasskeyRegistrationOptions(displayName);

  // Convert base64url strings to ArrayBuffers
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge: base64UrlToArrayBuffer(options.challenge),
    rp: options.rp,
    user: {
      id: base64UrlToArrayBuffer(options.user.id),
      name: displayName,
      displayName: displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams.map((param: any) => ({
      type: param.type as PublicKeyCredentialType,
      alg: param.alg,
    })),
    timeout: options.timeout,
    authenticatorSelection: options.authenticatorSelection,
    attestation: options.attestation,
    excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
      type: cred.type as PublicKeyCredentialType,
      id: base64UrlToArrayBuffer(cred.id),
    })),
  };

  // Create credential
  const credential = await navigator.credentials.create({
    publicKey: publicKeyOptions,
  });

  if (!credential) {
    throw new Error('Failed to create credential');
  }

  // Format response for backend
  const publicKeyCredential = credential as PublicKeyCredential;
  const response = publicKeyCredential.response as AuthenticatorAttestationResponse;

  const registrationData = {
    name: displayName,
    id: publicKeyCredential.id,
    response: {
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
    },
  };

  // Verify with backend
  await verifyPasskeyRegistration(registrationData);
}
