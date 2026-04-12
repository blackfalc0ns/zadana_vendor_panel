import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { VendorAuthService } from '../services/vendor-auth.service';

export const vendorAuthGuard: CanActivateFn = () => {
  const authService = inject(VendorAuthService);
  const router = inject(Router);

  if (authService.isAuthenticatedSnapshot) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
