import React from 'react';
import { RelyingPartyBranding } from '../types';

export interface BrandHeaderProps {
  branding?: RelyingPartyBranding;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({ branding }) => {
  // Default branding if none provided
  const defaultBranding: RelyingPartyBranding = {
    name: 'null-profile',
  };

  const brand = branding || defaultBranding;

  return (
    <div className="text-center mb-8">
      {brand.logoUrl && (
        <img
          src={brand.logoUrl}
          alt={brand.name}
          className="h-16 w-auto mx-auto mb-4"
        />
      )}
      <h1
        className="text-3xl font-bold mb-2"
        style={brand.primaryColor ? { color: brand.primaryColor } : undefined}
      >
        {brand.name}
      </h1>
    </div>
  );
};
