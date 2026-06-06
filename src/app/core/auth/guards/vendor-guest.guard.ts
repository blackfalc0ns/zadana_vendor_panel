import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, timeout } from 'rxjs';
import { VendorProfileService } from '../../../features/settings/services/vendor-profile.service';
import { VendorAuthService } from '../services/vendor-auth.service';

const PROFILE_GUARD_TIMEOUT_MS = 6000;

function resolveAuthenticatedRedirect(profile: { status: string; commercialAccessEnabled?: boolean }, router: Router) {
  return router.createUrlTree([
    profile.status === 'Active' || profile.commercialAccessEnabled
      ? '/dashboard'
      : '/submission-success'
  ]);
}

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

  if (profileService.hasCachedProfileSnapshot()) {
    profileService.loadProfile(false).subscribe();
    return resolveAuthenticatedRedirect(profileService.getProfileSnapshot(), router);
  }

  return profileService.loadProfileForGuard(false).pipe(
    timeout({ first: PROFILE_GUARD_TIMEOUT_MS }),
    map((profile) => resolveAuthenticatedRedirect(profile, router)),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        authService.clearLocalSession();
        return of(true);
      }

      if (profileService.hasCachedProfileSnapshot()) {
        return of(resolveAuthenticatedRedirect(profileService.getProfileSnapshot(), router));
      }

      return of(true);
    })
  );
};
