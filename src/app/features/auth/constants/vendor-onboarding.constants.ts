export interface SelectOption {
  value: string;
  labelKey?: string;
  label?: string;
  disabled?: boolean;
  nameAr?: string;
  nameEn?: string;
}

/** Region with geographic center and zoom level for the map */
export interface RegionOption extends SelectOption {
  lat: number;
  lng: number;
  zoom: number;
}

/** City with geographic center, zoom level, and parent region */
export interface CityOption extends SelectOption {
  region: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const BUSINESS_TYPES: SelectOption[] = [
  { value: 'RETAIL', labelKey: 'ONBOARDING.BUSINESS_TYPES.RETAIL' },
  { value: 'WHOLESALE', labelKey: 'ONBOARDING.BUSINESS_TYPES.WHOLESALE' },
  { value: 'MANUFACTURER', labelKey: 'ONBOARDING.BUSINESS_TYPES.MANUFACTURER' },
  { value: 'SERVICES', labelKey: 'ONBOARDING.BUSINESS_TYPES.SERVICES' },
  { value: 'OTHER', labelKey: 'ONBOARDING.BUSINESS_TYPES.OTHER' }
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
  {
    value: 'PER_ORDER_DIRECT_PAYOUT',
    labelKey: 'ONBOARDING.PAYMENT_CYCLES.PER_ORDER_DIRECT_PAYOUT_COMING_SOON',
    disabled: true
  },
  { value: 'WEEKLY', labelKey: 'ONBOARDING.PAYMENT_CYCLES.WEEKLY' },
  { value: 'BIWEEKLY', labelKey: 'ONBOARDING.PAYMENT_CYCLES.BIWEEKLY' },
  { value: 'MONTHLY', labelKey: 'ONBOARDING.PAYMENT_CYCLES.MONTHLY' }
];

export const PAYOUT_DAYS: SelectOption[] = [
  { value: 'MONDAY', labelKey: 'ONBOARDING.PAYOUT_DAYS.MONDAY' },
  { value: 'THURSDAY', labelKey: 'ONBOARDING.PAYOUT_DAYS.THURSDAY' }
];
