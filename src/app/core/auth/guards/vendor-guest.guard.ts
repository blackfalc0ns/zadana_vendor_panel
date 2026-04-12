import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { VendorAuthService } from '../services/vendor-auth.service';

export const vendorGuestGuard: CanActivateFn = () => {
  const authService = inject(VendorAuthService);
  const router = inject(Router);

  if (authService.isAuthenticatedSnapshot) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
