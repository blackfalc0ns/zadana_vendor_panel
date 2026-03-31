export interface SelectOption {
  value: string;
  labelKey: string;
}

export const BUSINESS_TYPES: SelectOption[] = [
  { value: 'RETAIL', labelKey: 'ONBOARDING.BUSINESS_TYPES.RETAIL' },
  { value: 'WHOLESALE', labelKey: 'ONBOARDING.BUSINESS_TYPES.WHOLESALE' },
  { value: 'MANUFACTURER', labelKey: 'ONBOARDING.BUSINESS_TYPES.MANUFACTURER' },
  { value: 'SERVICES', labelKey: 'ONBOARDING.BUSINESS_TYPES.SERVICES' },
  { value: 'OTHER', labelKey: 'ONBOARDING.BUSINESS_TYPES.OTHER' }
];

export const REGIONS: SelectOption[] = [
  { value: 'CENTRAL', labelKey: 'ONBOARDING.REGIONS.CENTRAL' },
  { value: 'WESTERN', labelKey: 'ONBOARDING.REGIONS.WESTERN' },
  { value: 'EASTERN', labelKey: 'ONBOARDING.REGIONS.EASTERN' },
  { value: 'NORTHERN', labelKey: 'ONBOARDING.REGIONS.NORTHERN' },
  { value: 'SOUTHERN', labelKey: 'ONBOARDING.REGIONS.SOUTHERN' }
];

export const CITIES: SelectOption[] = [
  { value: 'RIYADH', labelKey: 'ONBOARDING.CITIES.RIYADH' },
  { value: 'JEDDAH', labelKey: 'ONBOARDING.CITIES.JEDDAH' },
  { value: 'DAMMAM', labelKey: 'ONBOARDING.CITIES.DAMMAM' },
  { value: 'MAKKAH', labelKey: 'ONBOARDING.CITIES.MAKKAH' },
  { value: 'MADINAH', labelKey: 'ONBOARDING.CITIES.MADINAH' },
  { value: 'OTHER', labelKey: 'ONBOARDING.CITIES.OTHER' }
];

export const NATIONALITIES: SelectOption[] = [
  { value: 'SAUDI', labelKey: 'ONBOARDING.NATIONALITIES.SAUDI' },
  { value: 'EGYPTIAN', labelKey: 'ONBOARDING.NATIONALITIES.EGYPTIAN' },
  { value: 'EMIRATI', labelKey: 'ONBOARDING.NATIONALITIES.EMIRATI' },
  { value: 'KUWAITI', labelKey: 'ONBOARDING.NATIONALITIES.KUWAITI' },
  { value: 'OTHER', labelKey: 'ONBOARDING.NATIONALITIES.OTHER' }
];

export const BANKS: SelectOption[] = [
  { value: 'ALRAJHI', labelKey: 'ONBOARDING.BANKS.ALRAJHI' },
  { value: 'SNB', labelKey: 'ONBOARDING.BANKS.SNB' },
  { value: 'ALINMA', labelKey: 'ONBOARDING.BANKS.ALINMA' },
  { value: 'RIYAD', labelKey: 'ONBOARDING.BANKS.RIYAD' },
  { value: 'SABB', labelKey: 'ONBOARDING.BANKS.SABB' },
  { value: 'FRANSI', labelKey: 'ONBOARDING.BANKS.FRANSI' }
];

export const PAYMENT_CYCLES: SelectOption[] = [
  { value: 'WEEKLY', labelKey: 'ONBOARDING.PAYMENT_CYCLES.WEEKLY' },
  { value: 'BIWEEKLY', labelKey: 'ONBOARDING.PAYMENT_CYCLES.BIWEEKLY' },
  { value: 'MONTHLY', labelKey: 'ONBOARDING.PAYMENT_CYCLES.MONTHLY' }
];
