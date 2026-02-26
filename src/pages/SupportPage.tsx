import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, AlertCircle, Loader2 } from 'lucide-react';
import { getDonationSummary, createDonationCheckoutSession } from '../lib/api';
import { useCurrentUser } from '../lib/useCurrentUser';
import { formatMoney, toMinorUnits, getCurrencySymbol } from '../lib/money';
import type { DonationSummary } from '../types/api';

const PRESET_AMOUNTS = [5, 10, 25, 50]; // In major units (euros/dollars)

export const SupportPage: React.FC = () => {
  const { userId, isLoading: loadingUser } = useCurrentUser();
  const location = useLocation();
  const previousLocationRef = useRef(location.pathname);
  
  // Summary state
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  // Form state
  const [selectedPreset, setSelectedPreset] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustom, setUseCustom] = useState(false);
  
  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Load donation summary on mount (only after userId is loaded)
  useEffect(() => {
    if (!loadingUser && userId) {
      loadDonationSummary();
    }
  }, [userId, loadingUser]);

  // Reload donation summary when page becomes visible (e.g., returning from Stripe)
  useEffect(() => {
    function handleVisibilityChange() {
      if (!document.hidden && !loadingUser && userId) {
        console.log('Page visible, reloading donation summary');
        loadDonationSummary();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, loadingUser]);

  // Reload donation summary when navigating back to this page
  useEffect(() => {
    const previousPath = previousLocationRef.current;
    const currentPath = location.pathname;
    
    // If we're navigating TO /dashboard/support FROM a different page
    if (currentPath === '/dashboard/support' && previousPath !== currentPath && !loadingUser && userId) {
      console.log('Navigated back to support page, reloading donation summary');
      loadDonationSummary();
    }
    
    previousLocationRef.current = currentPath;
  }, [location, userId, loadingUser]);
  
  async function loadDonationSummary() {
    try {
      setLoadingSummary(true);
      setSummaryError(null);
      const data = await getDonationSummary(userId);
      setSummary(data);
    } catch (error: any) {
      console.error('Failed to load donation summary:', error);
      setSummaryError(error?.message || 'Failed to load donation summary');
    } finally {
      setLoadingSummary(false);
    }
  }
  
  const currentAmount = useCustom ? parseFloat(customAmount) || 0 : selectedPreset;
  const isValidAmount = currentAmount >= 1;
  const currencySymbol = summary ? getCurrencySymbol(summary.currency) : '€';
  
  async function handleDonate() {
    if (!isValidAmount) return;
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const amountMinor = toMinorUnits(currentAmount);
      const response = await createDonationCheckoutSession(userId, amountMinor);
      
      // Redirect to Stripe Checkout
      window.location.assign(response.url);
    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      setSubmitError(error?.message || 'Failed to create checkout session');
      setSubmitting(false);
    }
  }
  
  function handlePresetClick(amount: number) {
    setSelectedPreset(amount);
    setUseCustom(false);
    setSubmitError(null);
  }
  
  function handleCustomAmountChange(value: string) {
    setCustomAmount(value);
    setUseCustom(true);
    setSubmitError(null);
  }

  // Show loading while fetching user authentication
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-900 rounded-lg">
          <Heart size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-mono">Support nullProfile</h1>
      </div>
      
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Motivation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 font-mono">
            Support the infrastructure behind your authentication
          </h2>
          
          <p className="text-sm text-gray-700 leading-relaxed">
            nullProfile is a Swiss privacy-first authentication service designed for modern applications. 
            
            If nullProfile supports your product, consider contributing to help keep the platform secure, independent, and sustainably operated.
          </p>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Your support enables:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span><strong className="text-gray-900">Hosting</strong> — Reliable infrastructure across Swiss data centers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span><strong className="text-gray-900">Continuous security hardening</strong> — Dependency updates, patching, resilience improvements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span><strong className="text-gray-900">Passkey-first features</strong> — Expanding WebAuthn support and developer tools</span>
              </li>
            </ul>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>🔒 Secure payments:</strong> All payments are processed by Stripe. 
              We never see or store your card details.
            </p>
          </div>
        </div>
        
        {/* Right column: Donation form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* Donation Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 font-mono">Donation Summary</h3>
            
            {loadingSummary ? (
              <div className="space-y-2">
                <div className="h-5 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : summaryError ? (
              <div className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{summaryError}</span>
              </div>
            ) : summary ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">You've contributed:</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(summary.userTotalMinor, summary.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total raised:</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(summary.projectTotalMinor, summary.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supporters:</span>
                  <span className="font-semibold text-gray-900">{summary.supporterCount}</span>
                </div>
              </div>
            ) : null}
          </div>
          
          <div className="border-t border-gray-200" />
          
          {/* Amount Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 font-mono">Select Amount</h3>
            
            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handlePresetClick(amount)}
                  disabled={submitting}
                  className={`px-4 py-3 rounded-lg border-2 font-mono font-semibold text-sm transition-all ${
                    !useCustom && selectedPreset === amount
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {currencySymbol}{amount}
                </button>
              ))}
            </div>
            
            {/* Custom amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Custom amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  onFocus={() => setUseCustom(true)}
                  disabled={submitting}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              {useCustom && currentAmount > 0 && currentAmount < 1 && (
                <p className="text-xs text-red-600">Minimum donation is {currencySymbol}1</p>
              )}
            </div>
          </div>
          
          {/* Error message */}
          {submitError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Failed to process donation</p>
                <p className="text-xs text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          )}
          
          {/* Donate button */}
          <button
            onClick={handleDonate}
            disabled={!isValidAmount || submitting}
            className="w-full py-3 px-4 bg-gray-900 text-white font-mono font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Redirecting to secure checkout...
              </>
            ) : (
              <>
                <Heart size={18} />
                Donate {currencySymbol}{currentAmount.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
