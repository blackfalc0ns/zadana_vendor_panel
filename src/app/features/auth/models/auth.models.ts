export interface OnboardingStepItem {
  id: number;
  labelKey: string;
  sectionKey: string;
}

export interface OnboardingSeedData {
  store: {
    businessNameAr: string;
    businessNameEn: string;
    businessType: string;
    contactPhone: string;
    description: string;
    region: string;
    city: string;
    nationalAddress: string;
    registrationDate: string;
  };
  owner: {
    fullName: string;
    email: string;
    phone: string;
    idNumber: string;
    nationality: string;
  };
  legal: {
    commercialRegistrationNumber: string;
    expiryDate: string;
    taxId: string;
    licenseNumber: string;
  };
  banking: {
    bankName: string;
    iban: string;
    swiftCode: string;
    paymentCycle: string;
  };
  meta: {
    reviewStatusAr: string;
    reviewStatusEn: string;
    lastUpdate: string;
    syncedFromAr: string;
    syncedFromEn: string;
  };
}
