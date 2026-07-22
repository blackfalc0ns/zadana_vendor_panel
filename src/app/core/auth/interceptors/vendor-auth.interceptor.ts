import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, from, retry, switchMap, throwError, timer } from 'rxjs';
import { VendorAuthService } from '../services/vendor-auth.service';
import { environment } from '../../../../environments/environment';

const VENDOR_AUTH_LOGIN_PATH = '/vendors/auth/login';
const VENDOR_AUTH_REFRESH_PATH = '/vendors/auth/refresh-token';
const VENDOR_AUTH_LOGOUT_PATH = '/vendors/auth/logout';
const VENDOR_AUTH_CSRF_PATH = '/vendors/auth/csrf';
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getApiOrigin(): string | null {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    return new URL(environment.apiUrl, base).origin.toLowerCase();
  } catch {
    return null;
  }
}

function isOurApiRequest(request: HttpRequest<unknown>): boolean {
  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    return false;
  }

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    return new URL(request.url, base).origin.toLowerCase() === apiOrigin;
  } catch {
    return false;
  }
}

export const vendorAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(VendorAuthService);
  const isApiUrl = isOurApiRequest(request);

  if (!isApiUrl) {
    if (request.headers.has('Authorization')) {
      request = request.clone({ headers: request.headers.delete('Authorization') });
    }
    return next(request);
  }

  const skipAuth = request.headers.has('X-Skip-Auth');
  const accessToken = authService.getAccessToken();
  const language = localStorage.getItem('vendor_lang') || localStorage.getItem('lang') || 'ar';
  const isStateChanging = STATE_CHANGING_METHODS.has(request.method);
  const isVendorAuthCsrf = request.url.includes(VENDOR_AUTH_CSRF_PATH);
  const headers: Record<string, string> = { 'Accept-Language': language };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (isStateChanging && !isVendorAuthCsrf) {
    const csrf = authService.getCsrfToken();
    if (csrf) {
      headers['X-XSRF-TOKEN'] = csrf;
    }
  }

  const sanitizedRequest = skipAuth
    ? request.clone({ headers: request.headers.delete('X-Skip-Auth') })
    : request;

  const authorizedRequest = sanitizedRequest.clone({
    setHeaders: headers,
    withCredentials: true
  });

  return next(authorizedRequest).pipe(
    retry({
      count: request.method === 'GET' ? 1 : 0,
      delay: (error: unknown, retryCount: number) => {
        if (!isTransientReadError(error)) {
          return throwError(() => error);
        }

        return timer(200 * retryCount);
      }
    }),
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      const isVendorAuthRequest = request.url.includes(VENDOR_AUTH_LOGIN_PATH)
        || request.url.includes(VENDOR_AUTH_REFRESH_PATH)
        || request.url.includes(VENDOR_AUTH_LOGOUT_PATH);

      if (error instanceof HttpErrorResponse && error.status === 400 && isStateChanging && !isVendorAuthCsrf) {
        const payload = error.error as { code?: string; errorCode?: string; message?: string } | undefined;
        const message = payload?.message ?? '';
        const code = `${payload?.code || payload?.errorCode || ''}`.trim().toUpperCase();
        const looksLikeCsrfFailure = /anti.?forgery|xsrf|csrf/i.test(message)
          || code === 'ANTIFORGERY'
          || code === 'INVALID_CSRF_TOKEN';

        if (looksLikeCsrfFailure) {
          return retryAfterCsrfRefresh(authorizedRequest, next, authService);
        }
      }

      if (!isUnauthorized || isVendorAuthRequest || skipAuth) {
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        switchMap((newToken) => next(authorizedRequest.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`,
            'Accept-Language': language
          },
          withCredentials: true
        }))),
        catchError((refreshError) => {
          authService.forceLogoutForExpiredSession();
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function isTransientReadError(error: unknown): boolean {
  return error instanceof HttpErrorResponse &&
    (error.status === 0 ||
      error.status === 502 ||
      error.status === 503 ||
      error.status === 504);
}

function retryAfterCsrfRefresh(
  request: HttpRequest<unknown>,
  next: (request: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>,
  authService: VendorAuthService
): Observable<HttpEvent<unknown>> {
  return from(authService.acquireCsrfToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return throwError(() => new HttpErrorResponse({ status: 400, statusText: 'CSRF token unavailable' }));
      }

      return next(request.clone({
        setHeaders: { 'X-XSRF-TOKEN': token },
        withCredentials: true
      }));
    }),
    catchError((err) => throwError(() => err))
  );
}
