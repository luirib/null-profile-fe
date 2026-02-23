export interface PasskeySummary {
  id: string;
  name: string;
  createdAt: string;
}

export interface RelyingPartySummary {
  id: string;
  name: string;
  createdAt: string;
}

export interface RelyingPartyDetail {
  id: string;
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
