import { APP_INITIALIZER, EnvironmentProviders, Provider } from '@angular/core';
import { VendorAuthService } from '../services/vendor-auth.service';

/**
 * Restores the vendor session before the router/guards run:
 * 1. Acquire CSRF token
 * 2. Silent refresh via HttpOnly refresh cookie when access token is memory-only
 * 3. Bootstrap /me into the auth subject
 *
 * Never throws — failures fall through to the login route.
 */
export function provideVendorAuthBootstrap(): Provider | EnvironmentProviders {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    deps: [VendorAuthService],
    useFactory: (authService: VendorAuthService) => async () => {
      try {
        await authService.initializeSession();
      } catch (err) {
        console.warn('[Zadana Vendor] auth bootstrap failed', err);
      }
    }
  };
}
