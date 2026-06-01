const MOJIBAKE_MARKERS = /[ÃØÙÂ�]/;

export function looksLikeUtf8Mojibake(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return MOJIBAKE_MARKERS.test(value) || value.includes('â€¢') || value.includes('Â·');
}

export function repairUtf8Mojibake(value: string | null | undefined): string {
  const safeValue = value ?? '';
  if (!safeValue) {
    return '';
  }

  const normalizedPunctuation = safeValue
    .replace(/Â·/g, '·')
    .replace(/â€¢/g, '•');

  if (!looksLikeUtf8Mojibake(normalizedPunctuation)) {
    return normalizedPunctuation;
  }

  try {
    const bytes = Uint8Array.from(
      Array.from(normalizedPunctuation).map((character) => character.charCodeAt(0))
    );

    const decoded = new TextDecoder('utf-8').decode(bytes);
    return looksLikeUtf8Mojibake(decoded) ? normalizedPunctuation : decoded;
  } catch {
    return normalizedPunctuation;
  }
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
