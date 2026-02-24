import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '../components';
import {
  authenticateWithPasskey,
  registerPasskey,
  isWebAuthnAvailable,
  getWebAuthnErrorMessage,
  generateSuggestedPasskeyName,
} from '../lib/webauthn';
import { setAuthenticated } from '../lib/api';
import type { RelyingPartyBranding } from '../types';

type PageState = 'idle' | 'register' | 'authenticating' | 'registering';

// Helper functions for neutral OIDC text
function getOidcSubtitle(): string {
  return 'Sign in to continue';
}

function getOidcBannerText(rpName: string): string {
  return `Use an existing passkey to continue, or create a new one for your account.`;
}

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

export const OidcLoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [branding, setBranding] = useState<RelyingPartyBranding | null>(null);
  const [txnId, setTxnId] = useState<string | undefined>(undefined);
  const [passkeyName, setPasskeyName] = useState('');
  const [logoError, setLogoError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Extract transaction ID from query params
    const txn = searchParams.get('txn');
    
    if (!txn) {
      // No transaction ID, fallback to regular login
      navigate('/login', { replace: true });
      return;
    }

    setTxnId(txn);

    // Fetch branding for this transaction
    const fetchBranding = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/oidc/branding?txn=${txn}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.warn('Failed to fetch branding, falling back to default login');
          navigate('/login', { replace: true });
          return;
        }

        const brandingData = await response.json();
        setBranding(brandingData);
      } catch (err) {
        console.error('Error fetching branding:', err);
        navigate('/login', { replace: true });
      }
    };

    fetchBranding();
  }, [searchParams, navigate]);

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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-mono font-bold text-gray-900 mb-2">
              {branding?.displayName || 'Authentication'}
            </h1>
          </div>
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

  // Wait for branding to load
  if (branding === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600 font-mono text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const handleAuthenticate = async () => {
    setError(null);
    setState('authenticating');

    try {
      const result = await authenticateWithPasskey(txnId);

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
      const result = await registerPasskey(txnId, trimmedName);

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

  // Determine colors with validation
  const primaryColor = branding?.primaryColor && isValidHexColor(branding.primaryColor) 
    ? branding.primaryColor 
    : '#111827'; // default gray-900
  const secondaryColor = branding?.secondaryColor && isValidHexColor(branding.secondaryColor)
    ? branding.secondaryColor
    : '#6B7280'; // default gray-500

  const rpDisplayName = branding?.displayName || branding?.rpName || 'the application';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-mono">
      <Card className="max-w-md w-full">
        {/* Header with branding */}
        <div className="text-center mb-8">
          {branding?.logoUrl && !logoError && (
            <div className="mb-4 flex justify-center">
              <img
                src={branding.logoUrl}
                alt={`${rpDisplayName} logo`}
                className="h-12 object-contain"
                onError={() => setLogoError(true)}
              />
            </div>
          )}
          <h1 className="text-2xl font-mono font-bold text-gray-900 mb-2">
            {rpDisplayName}
          </h1>
          <p className="text-gray-600 font-mono text-sm">
            {getOidcSubtitle()}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-600 text-sm font-mono">{error}</p>
          </div>
        )}

        {/* OIDC context banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm font-mono leading-relaxed">
            {getOidcBannerText(rpDisplayName)}
          </p>
        </div>

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
                className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ 
                  ['--focus-ring-color' as any]: primaryColor,
                } as React.CSSProperties}
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
                disabled={state === 'registering'}
                style={{
                  backgroundColor: primaryColor,
                  borderColor: primaryColor,
                }}
              >
                {state === 'registering' ? 'Creating...' : 'Create passkey'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleAuthenticate}
              disabled={state === 'authenticating'}
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor,
              }}
            >
              {state === 'authenticating' ? 'Authenticating...' : 'Continue with passkey'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500 font-mono">or</span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleShowRegisterMode}
              disabled={state === 'authenticating'}
              style={{
                color: secondaryColor,
                borderColor: secondaryColor,
              }}
            >
              Create new passkey
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-xs text-gray-400 font-mono">
            Strong Authentication
          </p>
        </div>
      </Card>
    </div>
  );
};
