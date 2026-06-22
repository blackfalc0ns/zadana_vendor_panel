import { normalizeVendorPagePath, resolveVendorPageTitleKey } from './vendor-page-title.config';

describe('vendor-page-title.config', () => {
  it('normalizes paths with query strings and trailing slashes', () => {
    expect(normalizeVendorPagePath('/orders?tab=1')).toBe('/orders');
    expect(normalizeVendorPagePath('/products/')).toBe('/products');
  });

  it('resolves titles for main vendor routes', () => {
    expect(resolveVendorPageTitleKey('/dashboard')).toBe('PAGE_TITLES.DASHBOARD');
    expect(resolveVendorPageTitleKey('/products/submit')).toBe('PAGE_TITLES.PRODUCT_SUBMIT');
    expect(resolveVendorPageTitleKey('/staff/branches/branch-1')).toBe('PAGE_TITLES.BRANCH_DETAIL');
    expect(resolveVendorPageTitleKey('/orders/order-1')).toBe('PAGE_TITLES.ORDER_DETAIL');
  });

  it('falls back to default for unknown routes', () => {
    expect(resolveVendorPageTitleKey('/unknown-page')).toBe('PAGE_TITLES.DEFAULT');
  });
});
