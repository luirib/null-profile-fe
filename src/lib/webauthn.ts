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

  // Convert base64url strings to ArrayBuffers
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge: base64UrlToArrayBuffer(options.challenge),
    rp: options.rp,
    user: {
      id: base64UrlToArrayBuffer(options.user.id),
      name: options.user.name,
      displayName: options.user.displayName,
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

  // Verify with backend
  return verifyRegistration(credential, txn);
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
 */
export function getWebAuthnErrorMessage(error: unknown): string {
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
