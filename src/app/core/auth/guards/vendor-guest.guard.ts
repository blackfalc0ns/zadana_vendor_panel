import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { VendorProfileService } from '../../../features/settings/services/vendor-profile.service';
import { VendorAuthService } from '../services/vendor-auth.service';

export const vendorGuestGuard: CanActivateFn = () => {
  const authService = inject(VendorAuthService);
  const profileService = inject(VendorProfileService);
  const router = inject(Router);

  if (!authService.hasApiSession) {
    return true;
  }

  if (authService.isVendorStaffSession) {
    return router.createUrlTree(['/dashboard']);
  }

  return profileService.loadProfileForGuard(true).pipe(
    map((profile) => router.createUrlTree([
      profile.status === 'Active' || profile.commercialAccessEnabled
        ? '/dashboard'
        : '/submission-success'
    ])),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        authService.clearLocalSession();
        return of(true);
      }

      return of(router.createUrlTree(['/submission-success']));
    })
  );
};
