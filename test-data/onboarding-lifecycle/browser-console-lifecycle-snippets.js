// Paste one block at a time into browser DevTools on http://localhost:4200.

// 1) Create a valid registration draft and open onboarding.
localStorage.setItem('vendor_register_draft', JSON.stringify({
  fullName: 'Lifecycle Tester',
  email: 'lifecycle.tester+001@example.com',
  password: 'Test@12345',
  preferredStoreName: 'Zadana Lifecycle Test Store',
  createdAtUtc: new Date().toISOString()
}));
localStorage.setItem('onboarding_biz_name', 'Zadana Lifecycle Test Store');
location.href = '/onboarding';

// 2) Create an expired draft. Opening onboarding should clear it and redirect to register.
localStorage.setItem('vendor_register_draft', JSON.stringify({
  fullName: 'Expired Lifecycle Tester',
  email: 'expired.lifecycle@example.com',
  password: 'Test@12345',
  preferredStoreName: 'Expired Draft Store',
  createdAtUtc: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
}));
location.href = '/onboarding';

// 3) Clear lifecycle/session state for a clean retest.
[
  'vendor_register_draft',
  'onboarding_biz_name',
  'vendor_access_token',
  'vendor_refresh_token',
  'vendor_current_user'
].forEach((key) => localStorage.removeItem(key));
sessionStorage.clear();
location.href = '/register';

