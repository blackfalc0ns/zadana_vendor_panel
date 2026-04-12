export interface VendorOperatingHour {
  dayKey: string;
  from: string;
  to: string;
  isOpen: boolean;
}

export interface VendorProfile {
  storeNameAr: string;
  storeNameEn: string;
  businessType: string;
  supportPhone: string;
  supportEmail: string;
  descriptionAr: string;
  descriptionEn: string;
  region: string;
  city: string;
  nationalAddress: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  idNumber: string;
  nationality: string;
  taxId: string;
  commercialRegistrationNumber: string;
  expiryDate: string;
  licenseNumber: string;
  bankName: string;
  iban: string;
  swiftCode: string;
  payoutCycle: string;
  hasLogo: boolean;
  hasCRDoc: boolean;
  reviewStatus: 'active' | 'pending';
  joinedAt: string;
  operatingHours: VendorOperatingHour[];
  acceptOrders?: boolean;
  minimumOrderAmount?: number | null;
  preparationTimeMinutes?: number | null;
  emailNotificationsEnabled?: boolean;
  smsNotificationsEnabled?: boolean;
  newOrdersNotificationsEnabled?: boolean;
}
