export interface VendorCurrentUser {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role: string;
}

export interface VendorTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface VendorAuthResponse {
  tokens?: VendorTokenPair | null;
  user?: VendorCurrentUser | null;
  isVerified?: boolean;
  message?: string | null;
}

export interface VendorRegisterDraft {
  fullName: string;
  email: string;
  password: string;
  preferredStoreName?: string | null;
}

export interface RegisterVendorPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  businessNameAr: string;
  businessNameEn: string;
  businessType: string;
  commercialRegistrationNumber: string;
  commercialRegistrationExpiryDate?: string | null;
  contactEmail: string;
  contactPhone: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  idNumber?: string | null;
  nationality?: string | null;
  region: string;
  city: string;
  nationalAddress: string;
  taxId?: string | null;
  licenseNumber?: string | null;
  bankName: string;
  accountHolderName: string;
  iban: string;
  swiftCode?: string | null;
  payoutCycle?: string | null;
  logoUrl?: string | null;
  commercialRegisterDocumentUrl?: string | null;
  branchName: string;
  branchAddressLine: string;
  branchLatitude: number;
  branchLongitude: number;
  branchContactPhone: string;
  branchDeliveryRadiusKm: number;
}
