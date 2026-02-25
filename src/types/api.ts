export interface PasskeySummary {
  id: string;
  name: string;
  createdAt: string;
}

export interface RelyingPartySummary {
  id: string;
  rpId: string;
  name: string;
  createdAt: string;
}

export interface RelyingPartyDetail {
  id: string;
  rpId: string;
  name: string;
  sectorId?: string;
  redirectUris: string[];
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface UserInfo {
  userId: string;
}

export interface CreateRelyingPartyRequest {
  name: string;
  redirectUris: string[];
  sectorId?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateRelyingPartyRequest {
  name?: string;
  redirectUris?: string[];
  sectorId?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UsageSummary {
  months: string[];
  mau: number[];
  logins: number[];
  retention?: number[];
  activeRecently?: number[];
}

export interface DonationSummary {
  currency: string;
  userTotalMinor: number;
  projectTotalMinor: number;
  supporterCount: number;
}

export interface CreateDonationCheckoutRequest {
  userId: string;
  amount: number; // minor units (cents)
}

export interface CheckoutSessionResponse {
  url: string;
}
