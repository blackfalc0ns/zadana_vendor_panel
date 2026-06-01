import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { VendorProfileService } from '../../../features/settings/services/vendor-profile.service';
import { VendorAuthService } from '../services/vendor-auth.service';

export const vendorOnboardingGuard: CanActivateFn = (route) => {
  const authService = inject(VendorAuthService);
  const profileService = inject(VendorProfileService);
  const router = inject(Router);
  const isEditMode = route.queryParamMap.get('mode') === 'edit';

  if (isEditMode) {
    if (!authService.hasApiSession) {
      return router.createUrlTree(['/login']);
    }

    if (authService.isVendorStaffSession) {
      return router.createUrlTree(['/dashboard']);
    }

    return profileService.loadProfileForGuard(true).pipe(
      map((profile) => {
        if (profile.status === 'Active' || profile.commercialAccessEnabled) {
          return router.createUrlTree(['/dashboard']);
        }

        return true;
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          authService.clearLocalSession();
          return of(router.createUrlTree(['/login']));
        }

        return of(router.createUrlTree(['/submission-success']));
      })
    );
  }

  if (authService.hasApiSession) {
    return router.createUrlTree([authService.isVendorStaffSession ? '/dashboard' : '/submission-success']);
  }

  if (!authService.hasValidRegistrationDraft()) {
    return router.createUrlTree(['/register']);
  }

  return true;
};
