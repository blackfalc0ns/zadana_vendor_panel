export interface VendorPageTitleRule {
  pattern: RegExp;
  titleKey: string;
}

/** Most specific patterns first. */
export const VENDOR_PAGE_TITLE_RULES: readonly VendorPageTitleRule[] = [
  { pattern: /^\/login$/, titleKey: 'PAGE_TITLES.LOGIN' },
  { pattern: /^\/register$/, titleKey: 'PAGE_TITLES.REGISTER' },
  { pattern: /^\/forgot-password$/, titleKey: 'PAGE_TITLES.FORGOT_PASSWORD' },
  { pattern: /^\/reset-password$/, titleKey: 'PAGE_TITLES.RESET_PASSWORD' },
  { pattern: /^\/invitations\/accept\/[^/]+$/, titleKey: 'PAGE_TITLES.INVITATION_ACCEPT' },
  { pattern: /^\/verify-email$/, titleKey: 'PAGE_TITLES.VERIFY_EMAIL' },
  { pattern: /^\/onboarding$/, titleKey: 'PAGE_TITLES.ONBOARDING' },
  { pattern: /^\/submission-success$/, titleKey: 'PAGE_TITLES.SUBMISSION_SUCCESS' },

  { pattern: /^\/dashboard$/, titleKey: 'PAGE_TITLES.DASHBOARD' },

  { pattern: /^\/products\/submit$/, titleKey: 'PAGE_TITLES.PRODUCT_SUBMIT' },
  { pattern: /^\/products\/requests$/, titleKey: 'PAGE_TITLES.CATALOG_REQUESTS' },
  { pattern: /^\/products\/[^/]+$/, titleKey: 'PAGE_TITLES.PRODUCT_DETAIL' },
  { pattern: /^\/products$/, titleKey: 'PAGE_TITLES.PRODUCTS' },

  { pattern: /^\/offers$/, titleKey: 'PAGE_TITLES.OFFERS' },
  { pattern: /^\/alerts$/, titleKey: 'PAGE_TITLES.ALERTS' },

  { pattern: /^\/orders\/create$/, titleKey: 'PAGE_TITLES.ORDER_CREATE' },
  { pattern: /^\/orders\/[^/]+$/, titleKey: 'PAGE_TITLES.ORDER_DETAIL' },
  { pattern: /^\/orders$/, titleKey: 'PAGE_TITLES.ORDERS' },

  { pattern: /^\/disputes\/[^/]+$/, titleKey: 'PAGE_TITLES.DISPUTE_DETAIL' },
  { pattern: /^\/disputes$/, titleKey: 'PAGE_TITLES.DISPUTES' },

  { pattern: /^\/finance$/, titleKey: 'PAGE_TITLES.FINANCE' },

  { pattern: /^\/staff\/branches\/[^/]+$/, titleKey: 'PAGE_TITLES.BRANCH_DETAIL' },
  { pattern: /^\/staff\/employees\/[^/]+$/, titleKey: 'PAGE_TITLES.EMPLOYEE_DETAIL' },
  { pattern: /^\/staff\/invitations\/[^/]+$/, titleKey: 'PAGE_TITLES.INVITATION_DETAIL' },
  { pattern: /^\/staff$/, titleKey: 'PAGE_TITLES.STAFF' },

  { pattern: /^\/support\/tickets\/[^/]+$/, titleKey: 'PAGE_TITLES.SUPPORT_TICKET_DETAIL' },
  { pattern: /^\/support\/reference\/[^/]+$/, titleKey: 'PAGE_TITLES.SUPPORT_REFERENCE_DETAIL' },
  { pattern: /^\/support$/, titleKey: 'PAGE_TITLES.SUPPORT' },

  { pattern: /^\/profile$/, titleKey: 'PAGE_TITLES.PROFILE' },

  { pattern: /^\/$/, titleKey: 'PAGE_TITLES.DASHBOARD' }
];

export function normalizeVendorPagePath(url: string): string {
  const path = (url.split('?')[0]?.split('#')[0] ?? '/').trim();
  if (!path || path === '/') {
    return '/';
  }

  return path.endsWith('/') ? path.slice(0, -1) : path;
}

export function resolveVendorPageTitleKey(url: string): string {
  const path = normalizeVendorPagePath(url);

  for (const rule of VENDOR_PAGE_TITLE_RULES) {
    if (rule.pattern.test(path)) {
      return rule.titleKey;
    }
  }

  return 'PAGE_TITLES.DEFAULT';
}
