import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of, timeout } from 'rxjs';
import { VendorProfileService } from '../../../features/settings/services/vendor-profile.service';
import { VendorAuthService } from '../services/vendor-auth.service';
import { canAccessVendorDashboard, VendorActivationSnapshot } from '../utils/vendor-activation.util';

const PROFILE_GUARD_TIMEOUT_MS = 2500;

function resolveAuthenticatedRedirect(profile: VendorActivationSnapshot, router: Router): UrlTree {
  return router.createUrlTree([
    canAccessVendorDashboard(profile)
      ? '/dashboard'
      : '/submission-success'
  ]);
}

function redirectIfAuthenticated(redirect: UrlTree | null, router: Router): void {
  if (!redirect) {
    return;
  }

  void router.navigateByUrl(redirect);
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

  // Do not block guest routes while the profile API is slow or offline.
  profileService.loadProfileForGuard(false).pipe(
    timeout({ first: PROFILE_GUARD_TIMEOUT_MS }),
    map((profile) => resolveAuthenticatedRedirect(profile, router)),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        authService.clearLocalSession();
        return of(null);
      }

      if (profileService.hasCachedProfileSnapshot()) {
        return of(resolveAuthenticatedRedirect(profileService.getProfileSnapshot(), router));
      }

      return of(null);
    })
  ).subscribe((redirect) => redirectIfAuthenticated(redirect, router));

  return true;
};
