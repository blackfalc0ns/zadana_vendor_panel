import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { VendorProfileService } from '../../../features/settings/services/vendor-profile.service';
import { VendorAuthService } from '../services/vendor-auth.service';

export const vendorAuthGuard: CanActivateFn = () => {
  const authService = inject(VendorAuthService);
  const profileService = inject(VendorProfileService);
  const router = inject(Router);

  if (!authService.hasApiSession) {
    return router.createUrlTree(['/login']);
  }

  return profileService.loadProfileForGuard(true).pipe(
    map((profile) => {
      if (profile.status === 'Active' || profile.commercialAccessEnabled) {
        return true;
      }

      return router.createUrlTree(['/submission-success']);
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        authService.clearLocalSession();
        return of(router.createUrlTree(['/login']));
      }

      return of(router.createUrlTree(['/submission-success']));
    })
  );
};
