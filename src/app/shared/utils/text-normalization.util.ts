const MOJIBAKE_MARKERS = /[ÃØÙÂÕÊËÈÉàùúûüþÿ�]/;

function tryDecodeLatin1BytesAsUtf8(value: string): string | null {
  try {
    const bytes = Uint8Array.from(Array.from(value).map((character) => character.charCodeAt(0)));
    const decoded = new TextDecoder('utf-8').decode(bytes);

    if (!decoded || decoded === value) {
      return null;
    }

    if (looksLikeUtf8MojibakeSegment(decoded) && !/[\u0600-\u06FF]/.test(decoded)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function looksLikeUtf8MojibakeSegment(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  if (MOJIBAKE_MARKERS.test(value) || value.includes('â€¢') || value.includes('Â·')) {
    return true;
  }

  const latinExtendedCount = (value.match(/[\u00C0-\u00FF]/g) || []).length;
  const asciiLetterCount = (value.match(/[A-Za-z]/g) || []).length;

  return latinExtendedCount >= 2 && latinExtendedCount > asciiLetterCount;
}

export function looksLikeUtf8Mojibake(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return value
    .split(/\s+/)
    .some((segment) => looksLikeUtf8MojibakeSegment(segment));
}

function repairSegment(segment: string): string {
  if (!segment || !looksLikeUtf8MojibakeSegment(segment)) {
    return segment;
  }

  const decoded = tryDecodeLatin1BytesAsUtf8(segment);
  return decoded ?? segment;
}

function repairMixedString(value: string): string {
  const parts = value.match(/[\u0600-\u06FF\s]+|[^\u0600-\u06FF\s]+/g) ?? [value];

  return parts
    .map((part) => {
      if (!part.trim()) {
        return part;
      }

      if (/[\u0600-\u06FF]/.test(part) && !looksLikeUtf8MojibakeSegment(part)) {
        return part;
      }

      const decodedWhole = repairSegment(part);
      if (decodedWhole !== part) {
        return decodedWhole;
      }

      return part
        .split(/(\s+)/)
        .map((segment) => repairSegment(segment))
        .join('');
    })
    .join('');
}

export function repairUtf8Mojibake(value: string | null | undefined): string {
  const safeValue = value ?? '';
  if (!safeValue) {
    return '';
  }

  const normalizedPunctuation = safeValue
    .replace(/Â·/g, '·')
    .replace(/â€¢/g, '•');

  const repaired = repairMixedString(normalizedPunctuation);
  if (!looksLikeUtf8Mojibake(repaired)) {
    return repaired.trim();
  }

  const fullyDecoded = tryDecodeLatin1BytesAsUtf8(normalizedPunctuation);
  if (fullyDecoded && !looksLikeUtf8Mojibake(fullyDecoded)) {
    return fullyDecoded.trim();
  }

  return repaired.trim();
}

export function resolveLocalizedMessage(message: string | null | undefined, currentLang: string): string {
  if (!message) {
    return '';
  }

  const repaired = repairUtf8Mojibake(message);
  if (!repaired.includes('|')) {
    return repaired;
  }

  const parts = repaired.split('|').map((item) => item.trim()).filter(Boolean);
  if (parts.length < 2) {
    return repaired;
  }

  return currentLang.startsWith('ar') ? parts[0] : parts[1];
}
