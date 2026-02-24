import React from 'react';
import { RelyingPartyBranding } from '../types';

export interface BrandHeaderProps {
  branding?: RelyingPartyBranding;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({ branding }) => {
  // Default branding if none provided
  const defaultBranding: RelyingPartyBranding = {
    rpName: 'nullProfile',
    displayName: 'nullProfile',
  };

  const brand = branding || defaultBranding;

  return (
    <div className="text-center mb-10">
      {brand.logoUrl && (
        <img
          src={brand.logoUrl}
          alt={brand.displayName}
          className="h-16 w-auto mx-auto mb-4"
        />
      )}
      <h1
        className="text-3xl font-mono font-bold mb-2 text-gray-900 tracking-tight"
        style={brand.primaryColor ? { color: brand.primaryColor } : undefined}
      >
        {brand.displayName}
      </h1>
    </div>
  );
};
