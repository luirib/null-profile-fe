import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, BrandHeader } from '../components';
import {
  authenticateWithPasskey,
  registerPasskey,
  isWebAuthnAvailable,
  getWebAuthnErrorMessage,
  generateSuggestedPasskeyName,
} from '../lib/webauthn';
import { setAuthenticated } from '../lib/api';
import type { RelyingPartyBranding, OidcTransactionContext } from '../types';

type PageState = 'idle' | 'register' | 'authenticating' | 'registering';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<PageState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [branding] = useState<RelyingPartyBranding | undefined>(undefined);
  const [txnContext, setTxnContext] = useState<OidcTransactionContext>({});
  const [passkeyName, setPasskeyName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Extract transaction context from query params
    const txn = searchParams.get('txn');
    setTxnContext({ txn: txn || undefined });
  }, [searchParams]);

  // Auto-focus input when entering register mode
  useEffect(() => {
    if ((state === 'register' || state === 'registering') && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state]);

  // Check WebAuthn availability
  if (!isWebAuthnAvailable()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-mono">
        <Card className="max-w-md w-full">
          <BrandHeader branding={branding} />
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠</div>
            <h2 className="text-xl font-mono font-semibold mb-3 text-gray-900">WebAuthn Unavailable</h2>
            <p className="text-gray-600 font-mono text-sm leading-relaxed">
              Your browser does not support WebAuthn. Please use Chrome, Firefox, Safari, or Edge.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const handleAuthenticate = async () => {
    setError(null);
    setState('authenticating');

    try {
      const result = await authenticateWithPasskey(txnContext.txn);

      if (result.success) {
        setAuthenticated(true);

        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }

        window.location.href = '/dashboard';
      } else {
        setError('Authentication failed. Please try again.');
        setState('idle');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(getWebAuthnErrorMessage(err));
      setState('idle');
    }
  };

  const handleShowRegisterMode = () => {
    setError(null);
    setPasskeyName(generateSuggestedPasskeyName());
    setState('register');
  };

  const handleCancelRegister = () => {
    setError(null);
    setPasskeyName('');
    setState('idle');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = passkeyName.trim();
    
    // Validate passkey name
    if (trimmedName.length < 2) {
      setError('Passkey name must be at least 2 characters.');
      return;
    }
    
    if (trimmedName.length > 40) {
      setError('Passkey name must be less than 40 characters.');
      return;
    }

    setError(null);
    setState('registering');

    try {
      const result = await registerPasskey(txnContext.txn, trimmedName);

      if (result.success) {
        setAuthenticated(true);

        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }

        window.location.href = '/dashboard';
      } else {
        setError('Registration failed. Please try again.');
        setState('register');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(getWebAuthnErrorMessage(err));
      setState('register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-mono">
      <Card className="max-w-md w-full">
        <BrandHeader branding={branding} />

        <div className="text-center mb-8">
          <p className="text-gray-600 font-mono text-sm">
            Passwordless authentication via WebAuthn
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-600 text-sm font-mono">{error}</p>
          </div>
        )}

        {txnContext.txn && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-slate-700 text-sm font-mono">
              <strong className="font-semibold">OIDC:</strong> Authorization flow active
            </p>
          </div>
        )}

        {state === 'register' || state === 'registering' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="passkeyName"
                className="block text-sm font-mono font-medium text-gray-700 mb-2"
              >
                Passkey identifier
              </label>
              <input
                ref={inputRef}
                type="text"
                id="passkeyName"
                className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                placeholder="e.g., Work Laptop, iPhone"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                disabled={state === 'registering'}
                maxLength={40}
                required
              />
              <p className="mt-2 text-xs text-gray-500 font-mono">
                Choose a memorable name for this device
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={handleCancelRegister}
                disabled={state === 'registering'}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={state === 'registering'}
              >
                Register
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleAuthenticate}
              isLoading={state === 'authenticating'}
            >
              Continue with Passkey
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleShowRegisterMode}
              disabled={state === 'authenticating'}
            >
              Create New Passkey
            </Button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 font-mono">
            Zero-knowledge authentication • No passwords stored
          </p>
        </div>
      </Card>
    </div>
  );
};
