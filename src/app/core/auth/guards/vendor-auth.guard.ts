import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, timeout } from 'rxjs';
import { VendorProfileService } from '../../../features/settings/services/vendor-profile.service';
import { VendorAuthService } from '../services/vendor-auth.service';

const PROFILE_GUARD_TIMEOUT_MS = 6000;

export const vendorAuthGuard: CanActivateFn = () => {
  const authService = inject(VendorAuthService);
  const profileService = inject(VendorProfileService);
  const router = inject(Router);

  if (!authService.hasApiSession) {
    const queryParams: Record<string, string> = {};
    if (authService.requiresFreshLogin) {
      queryParams['reason'] = 'session-expired';
    }

    return router.createUrlTree(['/login'], { queryParams });
  }

  if (authService.isVendorStaffSession) {
    return true;
  }

  return profileService.loadProfileForGuard(false).pipe(
    timeout({ first: PROFILE_GUARD_TIMEOUT_MS }),
    map((profile) => {
      if (profile.status === 'Active' || profile.commercialAccessEnabled) {
        return true;
      }

      return router.createUrlTree(['/submission-success']);
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        authService.forceLogoutForExpiredSession();
        return of(router.createUrlTree(['/login'], { queryParams: { reason: 'session-expired' } }));
      }

      const cachedProfile = profileService.getProfileSnapshot();
      if (profileService.hasCachedProfileSnapshot()) {
        if (cachedProfile.status === 'Active' || cachedProfile.commercialAccessEnabled) {
          return of(true);
        }

        return of(router.createUrlTree(['/submission-success']));
      }

      return of(router.createUrlTree(['/login']));
    })
  );
};
