import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { VendorAuthService } from '../services/vendor-auth.service';

export const vendorAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(VendorAuthService);
  const skipAuth = request.headers.has('X-Skip-Auth');

  if (skipAuth) {
    return next(request.clone({ headers: request.headers.delete('X-Skip-Auth') }));
  }

  const accessToken = authService.getAccessToken();
  const authorizedRequest = accessToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      const hasRefreshToken = !!authService.getRefreshToken();

      if (!isUnauthorized || !hasRefreshToken) {
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        switchMap((newToken) => next(request.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` }
        }))),
        catchError((refreshError) => {
          authService.logoutLocally();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
