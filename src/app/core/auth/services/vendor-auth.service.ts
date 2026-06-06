import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class VendorAuthService {
  private static readonly loginNotificationTestPendingKey = 'vendor_notification_test_pending_user_id';
  private static readonly registrationDraftTtlMs = 24 * 60 * 60 * 1000;
  private readonly apiUrl = `${environment.apiUrl}/vendors/auth`;
  private readonly registerUrl = `${environment.apiUrl}/vendors/register`;
  private readonly accessTokenKey = 'vendor_access_token';
  private readonly refreshTokenKey = 'vendor_refresh_token';
  private readonly userKey = 'vendor_current_user';
  private readonly draftKey = 'vendor_register_draft';
  private readonly skipAuthHeader = 'X-Skip-Auth';

  private readonly currentUserSubject = new BehaviorSubject<VendorCurrentUser | null>(this.readStoredUser());
  private refreshRequest$?: Observable<string>;

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  get hasApiSession(): boolean {
    return !!this.getAccessToken();
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

    return firstValueFrom(
      this.bootstrapCurrentUser().pipe(
        map(() => void 0),
        catchError(() => {
          this.logoutLocally();
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

  resetPassword(identifier: string, otpCode: string, newPassword: string): Observable<string> {
    return this.http.post<{ message?: string }>(
      `${this.apiUrl}/reset-password`,
      { identifier, otpCode, newPassword },
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
          this.logoutLocally();
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
    this.clearPersistedSession();
    if (this.router.url.startsWith('/submission-success')) {
      return;
    }

    void this.router.navigate(['/login']);
  }

  clearLocalSession(): void {
    this.clearPersistedSession();
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
    if (response.tokens?.accessToken) {
      localStorage.setItem(this.accessTokenKey, response.tokens.accessToken);
    }

    if (response.tokens?.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, response.tokens.refreshToken);
    }

    if (response.user) {
      this.persistUser(response.user);
    }
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
    this.currentUserSubject.next(null);
  }
}
