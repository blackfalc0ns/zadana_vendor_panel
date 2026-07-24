export type OnboardingFormKey = 'account' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5';

export interface OnboardingStepItem {
  id: number;
  formKey: OnboardingFormKey;
  labelKey: string;
  sectionKey: string;
  descriptionKey: string;
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
    payoutDay: string;
  };
  meta: {
    reviewStatusAr: string;
    reviewStatusEn: string;
    lastUpdate: string;
    syncedFromAr: string;
    syncedFromEn: string;
  };
}
