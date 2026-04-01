const ARABIC_TO_LATIN_MAP: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'e',
  آ: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ي: 'y',
  ى: 'a',
  ة: 'h',
  ؤ: 'w',
  ئ: 'y',
  ء: '',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9'
};

export type WorkEmailProvisioningStatus = 'connected' | 'not_provisioned';

export function normalizeCompanyDomain(value?: string | null): string {
  if (!value) {
    return '';
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^mailto:/, '')
    .replace(/^@+/, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/^\.+|\.+$/g, '');
}

export function resolveWorkEmailProvisioningStatus(domain?: string | null): WorkEmailProvisioningStatus {
  return normalizeCompanyDomain(domain) ? 'connected' : 'not_provisioned';
}

export function buildWorkEmail(fullName: string, domain?: string | null, contact?: string | null): string {
  const normalizedDomain = normalizeCompanyDomain(domain);

  if (!normalizedDomain) {
    return '';
  }

  const localPart = deriveEmailLocalPart(fullName, contact);
  return `${localPart}@${normalizedDomain}`;
}

function deriveEmailLocalPart(fullName: string, contact?: string | null): string {
  const emailLocalPart = extractLocalPartFromEmail(contact);

  if (emailLocalPart) {
    return sanitizeLocalPart(emailLocalPart);
  }

  const transliterated = transliterateArabic(fullName);
  const sanitizedName = sanitizeLocalPart(transliterated);

  if (sanitizedName) {
    return sanitizedName;
  }

  const numericFallback = (contact || '').replace(/\D+/g, '').slice(-4);
  return numericFallback ? `staff.${numericFallback}` : `staff.${Math.floor(100 + Math.random() * 900)}`;
}

function extractLocalPartFromEmail(value?: string | null): string {
  if (!value || !value.includes('@')) {
    return '';
  }

  return value.split('@')[0] || '';
}

function transliterateArabic(value: string): string {
  return Array.from(value.trim())
    .map((char) => ARABIC_TO_LATIN_MAP[char] ?? char)
    .join('');
}

function sanitizeLocalPart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 32) || 'staff';
}
