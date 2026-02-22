import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, BrandHeader, Modal } from '../components';
import {
  authenticateWithPasskey,
  registerPasskey,
  isWebAuthnAvailable,
  getWebAuthnErrorMessage,
} from '../lib/webauthn';
import { setAuthenticated } from '../lib/api';
import type { RelyingPartyBranding, OidcTransactionContext } from '../types';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branding] = useState<RelyingPartyBranding | undefined>(undefined);
  const [txnContext, setTxnContext] = useState<OidcTransactionContext>({});
  const [showNameModal, setShowNameModal] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    // Extract transaction context from query params
    const txn = searchParams.get('txn');
    setTxnContext({ txn: txn || undefined });
  }, [searchParams]);

  // Check WebAuthn availability
  if (!isWebAuthnAvailable()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <BrandHeader branding={branding} />
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">WebAuthn Not Supported</h2>
            <p className="text-gray-600">
              Your browser does not support WebAuthn/Passkeys. Please use a modern
              browser like Chrome, Firefox, Safari, or Edge.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const handleAuthenticate = async () => {
    setError(null);
    setIsAuthenticating(true);

    try {
      const result = await authenticateWithPasskey(txnContext.txn);

      if (result.success) {
        // Mark as authenticated
        setAuthenticated(true);

        // If backend provides a redirect URL (e.g., back to RP), follow it
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }

        // Otherwise, navigate to dashboard
        window.location.href = '/dashboard';
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(getWebAuthnErrorMessage(err));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async () => {
    // Open modal to get display name
    setShowNameModal(true);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      return;
    }

    setShowNameModal(false);
    setError(null);
    setIsRegistering(true);

    try {
      const result = await registerPasskey(txnContext.txn, displayName.trim());

      if (result.success) {
        // Mark as authenticated
        setAuthenticated(true);

        // If backend provides a redirect URL (e.g., back to RP), follow it
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }

        // Otherwise, navigate to dashboard
        window.location.href = '/dashboard';
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(getWebAuthnErrorMessage(err));
    } finally {
      setIsRegistering(false);
      setDisplayName('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full">
        <BrandHeader branding={branding} />

        <div className="text-center mb-6">
          <p className="text-gray-600">
            Sign in with your passkey. No passwords required.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {txnContext.txn && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>OIDC Transaction:</strong> Continuing authorization flow...
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Button
            variant="primary"
            className="w-full"
            onClick={handleAuthenticate}
            isLoading={isAuthenticating}
            disabled={isRegistering}
          >
            🔑 Continue with Passkey
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleRegister}
            isLoading={isRegistering}
            disabled={isAuthenticating}
          >
            ➕ Create Passkey
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            This site uses WebAuthn/Passkeys for secure, passwordless authentication.
          </p>
        </div>
      </Card>

      <Modal
        isOpen={showNameModal}
        onClose={() => {
          setShowNameModal(false);
          setDisplayName('');
        }}
        title="Create Passkey"
      >
        <form onSubmit={handleNameSubmit}>
          <div className="mb-4">
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoFocus
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              This name will be used to identify your passkey.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowNameModal(false);
                setDisplayName('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Passkey
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
