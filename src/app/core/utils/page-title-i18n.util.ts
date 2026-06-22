const PAGE_TITLE_BRAND_KEY = 'PAGE_TITLES.BRAND';
const PAGE_TITLE_DEFAULT_KEY = 'PAGE_TITLES.DEFAULT';

export function isUnresolvedTranslation(key: string, value: string | undefined | null): boolean {
  if (!value?.trim()) {
    return true;
  }

  return value.trim() === key;
}

/** Returns a browser title only when translations are fully resolved (never raw i18n keys). */
export function buildLocalizedPageTitle(
  titleKey: string,
  translations: Record<string, string>
): string | null {
  const brand = translations[PAGE_TITLE_BRAND_KEY];
  if (isUnresolvedTranslation(PAGE_TITLE_BRAND_KEY, brand)) {
    return null;
  }

  const primary = translations[titleKey];
  const fallback = translations[PAGE_TITLE_DEFAULT_KEY];

  const pageTitle = !isUnresolvedTranslation(titleKey, primary)
    ? primary.trim()
    : !isUnresolvedTranslation(PAGE_TITLE_DEFAULT_KEY, fallback)
      ? fallback.trim()
      : null;

  if (!pageTitle) {
    return null;
  }

  return `${pageTitle} | ${brand.trim()}`;
}
