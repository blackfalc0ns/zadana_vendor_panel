export const SAUDI_DIAL_CODE = '+966';
export const SAUDI_COUNTRY_CODE = 'SA';
export const SAUDI_MOBILE_LOCAL_LENGTH = 9;

/** Valid Saudi mobile operator prefixes without leading zero (5X). */
export const SAUDI_MOBILE_PREFIXES = [
  '50',
  '51',
  '53',
  '54',
  '55',
  '56',
  '57',
  '58',
  '59'
] as const;

export type SaudiMobilePrefix = (typeof SAUDI_MOBILE_PREFIXES)[number];

export function isSaudiMobilePrefix(value: string): value is SaudiMobilePrefix {
  return (SAUDI_MOBILE_PREFIXES as readonly string[]).includes(value);
}

export function formatSaudiMobilePrefixLabel(prefix: string): string {
  return `0${prefix}`;
}

export function normalizeSaudiLocalDigits(
  raw: string | null | undefined,
  dialCode = SAUDI_DIAL_CODE
): string {
  if (!raw) {
    return '';
  }

  let digits = raw.replace(/\D/g, '');
  const dialDigits = dialCode.replace(/\D/g, '');

  if (dialDigits && digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, SAUDI_MOBILE_LOCAL_LENGTH);
}

export function parseSaudiPhoneNumber(
  full: string | null | undefined,
  dialCode = SAUDI_DIAL_CODE
): { local: string; prefix: SaudiMobilePrefix | null } {
  const local = normalizeSaudiLocalDigits(full, dialCode);
  const prefixCandidate = local.length >= 2 ? local.slice(0, 2) : null;

  return {
    local,
    prefix: prefixCandidate && isSaudiMobilePrefix(prefixCandidate) ? prefixCandidate : null
  };
}

export function buildSaudiPhoneNumber(
  local: string,
  dialCode = SAUDI_DIAL_CODE
): string {
  const normalizedLocal = normalizeSaudiLocalDigits(local, dialCode);

  if (!normalizedLocal) {
    return '';
  }

  return `${dialCode}${normalizedLocal}`;
}

export function isValidSaudiMobileNumber(full: string | null | undefined, dialCode = SAUDI_DIAL_CODE): boolean {
  const { local, prefix } = parseSaudiPhoneNumber(full, dialCode);
  return !!prefix && local.length === SAUDI_MOBILE_LOCAL_LENGTH;
}

export function getSaudiMobilePrefixesHint(): string {
  return SAUDI_MOBILE_PREFIXES.map((prefix) => formatSaudiMobilePrefixLabel(prefix)).join(' • ');
}
