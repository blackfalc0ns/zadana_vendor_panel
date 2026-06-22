import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, finalize, firstValueFrom, map, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  RegisterVendorPayload,
  VendorAuthResponse,
  VendorCurrentUser,
  VendorRegisterDraft
} from '../models/vendor-auth.models';

const IDLE_TIMEOUT_MS = 10 * 60 * 60 * 1000; // 10 hours
const IDLE_ACTIVITY_EVENTS: ReadonlyArray<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll'
];

@Injectable({
  providedIn: 'root'
})
export class VendorAuthService {
  private static readonly loginNotificationTestPendingKey = 'vendor_notification_test_pending_user_id';
  private static readonly registrationDraftTtlMs = 24 * 60 * 60 * 1000;
  private static readonly lastActivityStorageKey = 'vendor_last_activity';
  private static readonly loginRequiredStorageKey = 'vendor_login_required';

  private readonly apiUrl = `${environment.apiUrl}/vendors/auth`;
  private readonly registerUrl = `${environment.apiUrl}/vendors/register`;
  private readonly accessTokenKey = 'vendor_access_token';
  private readonly refreshTokenKey = 'vendor_refresh_token';
  private readonly userKey = 'vendor_current_user';
  private readonly draftKey = 'vendor_register_draft';
  private readonly skipAuthHeader = 'X-Skip-Auth';

  private readonly currentUserSubject = new BehaviorSubject<VendorCurrentUser | null>(this.readStoredUser());
  private refreshRequest$?: Observable<string>;
  private idleTimerHandle: ReturnType<typeof setTimeout> | null = null;
  private idleListenersBound = false;
  private sessionExpiryRedirectPending = false;

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly ngZone: NgZone,
    private readonly router: Router
  ) {}

  get hasApiSession(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.forceLogoutForExpiredSession();
      return false;
    }

    if (this.isIdleTimedOut()) {
      this.forceLogoutForExpiredSession();
      return false;
    }

    return true;
  }

  get requiresFreshLogin(): boolean {
    return this.safeLocalGet(VendorAuthService.loginRequiredStorageKey) === '1';
  }

  get isAuthenticatedSnapshot(): boolean {
    return this.hasApiSession && !!this.currentUserSubject.value;
  }

  get currentUserSnapshot(): VendorCurrentUser | null {
    return this.currentUserSubject.value;
  }

  get isVendorStaffSession(): boolean {
    const user = this.currentUserSubject.value;
    const role = `${user?.role || ''}`.toLowerCase();
    const roleCode = `${user?.access?.activeScope?.roleCode || ''}`.toLowerCase();

    return role === 'vendorstaff'
      || role === 'vendor_staff'
      || roleCode === 'vendor_company_manager'
      || roleCode.startsWith('vendor_branch_');
  }

  getToken(): string | null {
    return this.getAccessToken();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  initializeSession(): Promise<void> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      this.clearPersistedSession();
      return Promise.resolve();
    }

    if (this.isTokenExpired(accessToken)) {
      this.forceLogoutForExpiredSession();
      return Promise.resolve();
    }

    if (this.requiresFreshLogin) {
      this.clearPersistedSession();
      return Promise.resolve();
    }

    return firstValueFrom(
      this.bootstrapCurrentUser().pipe(
        map(() => void 0),
        tap(() => this.startIdleWatchdog()),
        catchError(() => {
          this.forceLogoutForExpiredSession();
          return of(void 0);
        })
      )
    );
  }

  login(identifier: string, password: string): Observable<VendorCurrentUser> {
    return this.http.post<VendorAuthResponse>(
      `${this.apiUrl}/login`,
      { identifier, password },
      { headers: this.createSkipAuthHeaders() }
    ).pipe(
      tap((response) => this.persistSession(response)),
      tap((response) => {
        if (response.user?.id) {
          sessionStorage.setItem(VendorAuthService.loginNotificationTestPendingKey, response.user.id);
        }
      }),
      map((response) => {
        if (!response.user) {
          throw new Error('Vendor user snapshot is missing from login response.');
        }

        return response.user;
      })
    );
  }

  registerVendor(payload: RegisterVendorPayload): Observable<VendorCurrentUser> {
    return this.http.post<VendorAuthResponse>(
      this.registerUrl,
      payload,
      { headers: this.createSkipAuthHeaders() }
    ).pipe(
      tap((response) => this.persistSession(response)),
      tap(() => this.clearRegistrationDraft()),
      map((response) => {
        if (!response.user) {
          throw new Error('Vendor user snapshot is missing from register response.');
        }

        return response.user;
      })
    );
  }

  forgotPassword(identifier: string): Observable<string> {
    return this.http.post<{ message?: string }>(
      `${this.apiUrl}/forgot-password`,
      { identifier },
      { headers: this.createSkipAuthHeaders() }
    ).pipe(map((response) => response.message || 'Password reset OTP sent.'));
  }

  verifyPasswordResetOtp(identifier: string, otpCode: string): Observable<{ resetToken: string; expiresInSeconds: number; message?: string }> {
    return this.http.post<{ resetToken: string; expiresInSeconds: number; message?: string }>(
      `${this.apiUrl}/verify-reset-otp`,
      { identifier, otpCode },
      { headers: this.createSkipAuthHeaders() }
    );
  }

  resetPassword(identifier: string, resetToken: string, newPassword: string): Observable<string> {
    return this.http.post<{ message?: string }>(
      `${this.apiUrl}/reset-password`,
      { identifier, resetToken, newPassword },
      { headers: this.createSkipAuthHeaders() }
    ).pipe(map((response) => response.message || 'Password reset successful.'));
  }

  verifyEmailOtp(identifier: string, otpCode: string): Observable<VendorCurrentUser> {
    return this.http.post<VendorAuthResponse>(
      `${this.apiUrl}/verify-otp`,
      { identifier, otpCode },
      { headers: this.createSkipAuthHeaders() }
    ).pipe(
      tap((response) => this.persistSession(response)),
      map((response) => {
        if (!response.user) {
          throw new Error('Vendor user snapshot is missing from OTP verification response.');
        }

        return response.user;
      })
    );
  }

  resendEmailOtp(identifier: string): Observable<string> {
    return this.http.post<{ message?: string }>(
      `${this.apiUrl}/resend-otp`,
      { identifier },
      { headers: this.createSkipAuthHeaders() }
    ).pipe(map((response) => response.message || 'OTP resent successfully.'));
  }

  bootstrapCurrentUser(): Observable<VendorCurrentUser> {
    return this.http.get<VendorCurrentUser>(`${this.apiUrl}/me`).pipe(
      tap((user) => this.persistUser(user))
    );
  }

  refreshAccess(): Observable<VendorCurrentUser | null> {
    return this.http.get<VendorCurrentUser>(`${this.apiUrl}/me`).pipe(
      tap((user) => this.persistUser(user)),
      catchError((err) => {
        if (err.status === 401 || err.status === 403) {
          this.forceLogoutForExpiredSession();
        }
        return of(null);
      })
    );
  }

  refreshSession(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available.'));
    }

    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ = this.http.post<VendorAuthResponse>(
      `${this.apiUrl}/refresh-token`,
      { refreshToken },
      { headers: this.createSkipAuthHeaders() }
    ).pipe(
      tap((response) => this.persistSession(response)),
      map((response) => response.tokens?.accessToken || ''),
      tap((token) => {
        if (!token) {
          throw new Error('Refresh token response did not include a new access token.');
        }
      }),
      catchError((err) => {
        if (err.status === 401 || err.status === 403) {
          this.forceLogoutForExpiredSession();
        }
        return throwError(() => err);
      }),
      finalize(() => {
        this.refreshRequest$ = undefined;
      }),
      shareReplay(1)
    );

    return this.refreshRequest$;
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    const request$ = refreshToken
      ? this.http.post<void>(`${this.apiUrl}/logout`, { refreshToken })
      : of(void 0);

    return request$.pipe(
      catchError(() => of(void 0)),
      tap(() => this.logoutLocally()),
      map(() => void 0)
    );
  }

  logoutLocally(): void {
    this.clearLoginRequired();
    this.clearPersistedSession();
    if (this.router.url.startsWith('/submission-success')) {
      return;
    }

    void this.router.navigate(['/login']);
  }

  forceLogoutForExpiredSession(): void {
    this.markLoginRequired();
    this.clearPersistedSession();
    this.redirectToLoginForExpiredSession();
  }

  clearLocalSession(): void {
    this.clearPersistedSession();
  }

  touchActivity(): void {
    this.safeLocalSet(VendorAuthService.lastActivityStorageKey, Date.now().toString());
  }

  saveRegistrationDraft(draft: VendorRegisterDraft): void {
    localStorage.setItem(this.draftKey, JSON.stringify({
      ...draft,
      createdAtUtc: draft.createdAtUtc || new Date().toISOString()
    }));
  }

  getRegistrationDraft(): VendorRegisterDraft | null {
    const stored = localStorage.getItem(this.draftKey);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as VendorRegisterDraft;
    } catch {
      this.clearRegistrationDraft();
      return null;
    }
  }

  getValidRegistrationDraft(): VendorRegisterDraft | null {
    const draft = this.getRegistrationDraft();
    if (!this.isRegistrationDraftValid(draft)) {
      this.clearRegistrationDraft();
      return null;
    }

    return draft;
  }

  hasValidRegistrationDraft(): boolean {
    return !!this.getValidRegistrationDraft();
  }

  clearRegistrationDraft(): void {
    localStorage.removeItem(this.draftKey);
  }

  createSkipAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ [this.skipAuthHeader]: 'true' });
  }

  consumePendingLoginNotificationTestUserId(userId: string): boolean {
    const pendingUserId = sessionStorage.getItem(VendorAuthService.loginNotificationTestPendingKey);
    if (!pendingUserId || pendingUserId !== userId) {
      return false;
    }

    sessionStorage.removeItem(VendorAuthService.loginNotificationTestPendingKey);
    return true;
  }

  private persistSession(response: VendorAuthResponse): void {
    this.clearLoginRequired();
    this.sessionExpiryRedirectPending = false;

    if (response.tokens?.accessToken) {
      localStorage.setItem(this.accessTokenKey, response.tokens.accessToken);
    }

    if (response.tokens?.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, response.tokens.refreshToken);
    }

    if (response.user) {
      this.persistUser(response.user);
    }

    this.touchActivity();
    this.startIdleWatchdog();
  }

  private persistUser(user: VendorCurrentUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));

    const workspaceName = user.access?.activeScope?.scopeEntityName?.trim();
    if (workspaceName) {
      localStorage.setItem('vendor_workspace_name', workspaceName);
    }

    this.currentUserSubject.next(user);
  }

  private isRegistrationDraftValid(draft: VendorRegisterDraft | null): draft is VendorRegisterDraft {
    if (!draft?.fullName?.trim() || !draft.email?.trim() || !draft.password?.trim()) {
      return false;
    }

    if (!draft.createdAtUtc) {
      return false;
    }

    const createdAt = Date.parse(draft.createdAtUtc);
    if (!Number.isFinite(createdAt)) {
      return false;
    }

    return Date.now() - createdAt <= VendorAuthService.registrationDraftTtlMs;
  }

  private readStoredUser(): VendorCurrentUser | null {
    const stored = localStorage.getItem(this.userKey);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as VendorCurrentUser;
    } catch {
      return null;
    }
  }

  private clearPersistedSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('vendor_workspace_name');
    this.safeLocalRemove(VendorAuthService.lastActivityStorageKey);
    this.stopIdleWatchdog();
    this.currentUserSubject.next(null);
  }

  private redirectToLoginForExpiredSession(): void {
    if (this.router.url.startsWith('/submission-success')) {
      return;
    }

    if (!this.router.navigated || this.sessionExpiryRedirectPending) {
      return;
    }

    const currentUrl = this.router.url;
    if (!currentUrl || currentUrl.startsWith('/login')) {
      return;
    }

    this.sessionExpiryRedirectPending = true;

    this.ngZone.run(() => {
      void this.router.navigate(['/login'], {
        queryParams: { reason: 'session-expired' },
        replaceUrl: true
      }).finally(() => {
        this.sessionExpiryRedirectPending = false;
      });
    });
  }

  private isTokenExpired(token: string): boolean {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((char) => {
        return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      return payload.exp ? (payload.exp * 1000) <= Date.now() : false;
    } catch {
      return true;
    }
  }

  private isIdleTimedOut(): boolean {
    const raw = this.safeLocalGet(VendorAuthService.lastActivityStorageKey);
    if (!raw) {
      this.touchActivity();
      return false;
    }

    const last = Number(raw);
    if (!Number.isFinite(last)) {
      this.touchActivity();
      return false;
    }

    return Date.now() - last > IDLE_TIMEOUT_MS;
  }

  private startIdleWatchdog(): void {
    if (this.idleListenersBound || typeof window === 'undefined') {
      return;
    }

    this.idleListenersBound = true;
    this.touchActivity();

    const handleActivity = () => this.touchActivity();

    this.ngZone.runOutsideAngular(() => {
      for (const eventName of IDLE_ACTIVITY_EVENTS) {
        window.addEventListener(eventName, handleActivity, { passive: true });
      }

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleActivity, { passive: true });
      }

      const tick = () => {
        const token = this.getAccessToken();
        if (!token) {
          this.stopIdleWatchdog();
          return;
        }

        if (this.isTokenExpired(token) || this.isIdleTimedOut()) {
          this.ngZone.run(() => this.forceLogoutForExpiredSession());
          return;
        }

        this.idleTimerHandle = setTimeout(tick, 60_000);
      };

      this.idleTimerHandle = setTimeout(tick, 60_000);
    });
  }

  private stopIdleWatchdog(): void {
    if (this.idleTimerHandle) {
      clearTimeout(this.idleTimerHandle);
      this.idleTimerHandle = null;
    }
  }

  private markLoginRequired(): void {
    this.safeLocalSet(VendorAuthService.loginRequiredStorageKey, '1');
  }

  private clearLoginRequired(): void {
    this.safeLocalRemove(VendorAuthService.loginRequiredStorageKey);
  }

  private safeLocalGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeLocalSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }

  private safeLocalRemove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
