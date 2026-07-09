import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, finalize, timeout } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppInputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { AppCardComponent } from '../../../../shared/components/ui/card/card.component';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';
import { VendorProfileService } from '../../../settings/services/vendor-profile.service';

const LOGIN_REQUEST_TIMEOUT_MS = 15000;

@Component({
 changeDetection: ChangeDetectionStrategy.OnPush,
 selector: 'app-login',
 standalone: true,
 imports: [
 CommonModule,
 ReactiveFormsModule,
 TranslateModule,
 RouterModule,
 AppButtonComponent,
 AppInputComponent,
 AppCardComponent
 ],
 templateUrl: './login.component.html',
 styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
 private readonly cdr = inject(ChangeDetectorRef);
 private routeParamsSub?: Subscription;
 private autoResendAttempted = false;
 loginForm!: FormGroup;
 verifyEmailForm!: FormGroup;
 isLoading = false;
 isResending = false;
 isVerifyEmailMode = false;
 showPassword = false;
 submitted = false;
 verifySubmitted = false;
 errorMessage = '';
 successMessage = '';

 constructor(
 private fb: FormBuilder,
 private route: ActivatedRoute,
 private router: Router,
 private translate: TranslateService,
 private authService: VendorAuthService,
 private profileService: VendorProfileService
 ) {}

 ngOnInit(): void {
 const savedLang = localStorage.getItem('lang') || localStorage.getItem('vendor_lang') || 'ar';
 this.translate.use(savedLang);
 this.applyDocumentLanguage(savedLang);
 this.dismissAppSplash();

 this.initForm();
 this.initVerifyEmailForm();
 this.initModeFromRoute();
 }

 ngOnDestroy(): void {
 this.routeParamsSub?.unsubscribe();
 }

 private initForm(): void {
 this.loginForm = this.fb.group({
 email: ['', [Validators.required]],
 password: ['', [Validators.required]],
 rememberMe: [false]
 });
 }

 private initVerifyEmailForm(): void {
 this.verifyEmailForm = this.fb.group({
 identifier: ['', [Validators.required, Validators.email]],
 otpCode: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]]
 });
 }

 private initModeFromRoute(): void {
 this.routeParamsSub?.unsubscribe();
 this.routeParamsSub = this.route.queryParamMap.subscribe((params) => {
 this.isVerifyEmailMode = this.router.url.startsWith('/verify-email');

 if (params.get('reason') === 'session-expired') {
 this.errorMessage = this.translate.instant('LOGIN.ERR_SESSION_EXPIRED');
 }

 if (!this.isVerifyEmailMode) {
 this.autoResendAttempted = false;
 this.cdr.markForCheck();
 return;
 }

 const identifier = params.get('identifier') || '';
 if (identifier) {
 this.verifyEmailForm.patchValue({ identifier });
 this.loginForm.patchValue({ email: identifier });
 }

 if (params.get('sent') === '1') {
 this.successMessage = this.isRTL
 ? 'Ø£Ø±Ø³Ù„Ù†Ø§ Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ Ø¥Ù„Ù‰ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.'
 : 'We sent a verification code to your email.';
 }

 if (params.get('resend') === '1' && identifier && !this.autoResendAttempted) {
 this.autoResendAttempted = true;
 this.resendVerifyEmailOtp();
 }

 this.cdr.markForCheck();
 });
 }

 togglePassword(): void {
 this.showPassword =!this.showPassword;
 this.cdr.markForCheck();
 }

 onSubmit(): void {
 if (this.isVerifyEmailMode) {
 this.submitVerifyEmail();
 return;
 }

 this.submitted = true;
 this.errorMessage = '';
 this.successMessage = '';

 if (this.loginForm.invalid) {
 Object.keys(this.loginForm.controls).forEach((key) => {
 this.loginForm.get(key)?.markAsTouched();
 });
 this.cdr.markForCheck();
 return;
 }

 this.isLoading = true;
 this.cdr.markForCheck();
 const { email, password } = this.loginForm.getRawValue();

 this.authService.login(email, password).pipe(
 timeout({ first: LOGIN_REQUEST_TIMEOUT_MS }),
 finalize(() => {
 this.isLoading = false;
 this.cdr.markForCheck();
 })
 ).subscribe({
 next: () => {
 void this.navigateAfterLogin();
 },
 error: (error: unknown) => {
 if (this.isEmailVerificationRequired(error)) {
 const identifier = `${this.loginForm.get('email')?.value || ''}`.trim();
 void this.router.navigate(['/verify-email'], {
 queryParams: identifier ? { identifier, resend: '1' } : { resend: '1' }
 });
 this.cdr.markForCheck();
 return;
 }

 this.errorMessage = this.resolveLoginErrorMessage(error);
 this.cdr.markForCheck();
 }
 });
 }

 private async navigateAfterLogin(): Promise<void> {
 try {
 await this.router.navigateByUrl('/dashboard');
 this.profileService.loadProfile(true).subscribe();
 } catch {
 await this.router.navigateByUrl('/dashboard');
 } finally {
 this.cdr.markForCheck();
 }
 }

 submitVerifyEmail(): void {
 this.verifySubmitted = true;
 this.errorMessage = '';
 this.successMessage = '';

 if (this.verifyEmailForm.invalid) {
 this.verifyEmailForm.markAllAsTouched();
 this.errorMessage = this.isRTL ? 'تأكد من البريد الإلكتروني ورمز التحقق.' : 'Check the email and OTP code.';
 this.cdr.markForCheck();
 return;
 }

 this.isLoading = true;
 this.cdr.markForCheck();
 const { identifier, otpCode } = this.verifyEmailForm.getRawValue();

 this.authService.verifyEmailOtp(`${identifier || ''}`.trim(), `${otpCode || ''}`.trim()).subscribe({
 next: () => {
 this.cdr.markForCheck();
 this.isLoading = false;
 this.successMessage = this.isRTL ? 'فعّلنا البريد الإلكتروني بنجاح.' : 'Email verified successfully.';
 void this.router.navigate(['/submission-success']);
 },
 error: (error) => {
 this.cdr.markForCheck();
 this.isLoading = false;
 this.errorMessage = this.resolvePlainError(error, this.isRTL ? 'ما قدرنا تأكيد الرمز.' : 'Could not verify the code.');
 }
 });
 }

 resendVerifyEmailOtp(): void {
 this.errorMessage = '';
 this.successMessage = '';

 const identifierControl = this.verifyEmailForm.get('identifier');
 if (identifierControl?.invalid) {
 identifierControl.markAsTouched();
 this.errorMessage = this.isRTL ? 'اكتب البريد الإلكتروني أولا.' : 'Enter the email first.';
 return;
 }

 this.isResending = true;
 const identifier = `${identifierControl?.value || ''}`.trim();

 this.authService.resendEmailOtp(identifier).subscribe({
 next: (message) => {
 this.cdr.markForCheck();
 this.isResending = false;
    this.successMessage = message || (this.isRTL ? 'أرسلنا رمز جديد.' : 'A new OTP has been sent.');
 },
 error: (error) => {
 this.cdr.markForCheck();
 this.isResending = false;
 this.errorMessage = this.resolvePlainError(error, this.isRTL ? 'ما قدرنا نرسل رمز جديد.' : 'Could not resend the OTP.');
 }
 });
 }

 showLoginForm(): void {
 this.isVerifyEmailMode = false;
 this.errorMessage = '';
 this.successMessage = '';
 void this.router.navigate(['/login']);
 this.cdr.markForCheck();
 }

 toggleLanguage(): void {
 const currentLang = this.translate.currentLang;
 const newLang = currentLang === 'ar' ? 'en' : 'ar';
 this.switchLanguage(newLang);
 }

 switchLanguage(lang: string): void {
 this.translate.use(lang);
 localStorage.setItem('lang', lang);
 localStorage.setItem('vendor_lang', lang);
 this.applyDocumentLanguage(lang);
 this.cdr.markForCheck();
 }

 private applyDocumentLanguage(lang: string): void {
 document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
 document.documentElement.lang = lang;
 }

 private dismissAppSplash(): void {
 queueMicrotask(() => {
 const splash = document.getElementById('app-loader');
 if (!splash || splash.dataset['dismissed'] === 'true') {
 return;
 }

 splash.dataset['dismissed'] = 'true';
 splash.style.opacity = '0';
 setTimeout(() => splash.remove(), 450);
 });
 }

 get isRTL(): boolean {
 return this.translate.currentLang === 'ar';
 }

 /**
 * Map of known server error strings → i18n translation keys.
 * This ensures raw English messages from the API are never shown
 * on an Arabic (or any translated) UI.
 */
 private static readonly SERVER_MESSAGE_MAP: Record<string, string> = {
 'invalid credentials': 'LOGIN.ERR_INVALID_CREDENTIALS',
 'invalid credentials.': 'LOGIN.ERR_INVALID_CREDENTIALS',
 'invalid email or password': 'LOGIN.ERR_INVALID_CREDENTIALS',
 'account is locked': 'LOGIN.ERR_ACCOUNT_LOCKED',
 'account locked': 'LOGIN.ERR_ACCOUNT_LOCKED',
 'account is not allowed': 'LOGIN.ERR_ACCOUNT_NOT_ALLOWED',
 'access denied': 'LOGIN.ERR_ACCOUNT_NOT_ALLOWED',
 'account email not verified': 'LOGIN.ERR_LOGIN_FAILED',
 'accountemailnotverified': 'LOGIN.ERR_LOGIN_FAILED',
 'user not found': 'LOGIN.ERR_INVALID_CREDENTIALS'
 };

 private isEmailVerificationRequired(error: unknown): boolean {
 if (!(error instanceof HttpErrorResponse)) {
 return false;
 }

 const code = `${error.error?.code || error.error?.errorCode || ''}`.trim().toLowerCase();
 if (code === 'accountemailnotverified' || code === 'account_email_not_verified') {
 return true;
 }

 const candidates = [
 error.error?.code,
 error.error?.errorCode,
 error.error?.detail,
 error.error?.message,
 error.error?.title
 ];

 return candidates.some((candidate) => {
 if (typeof candidate!== 'string') return false;

 const normalized = candidate.trim().toLowerCase();
 if (!normalized || this.isGenericFrameworkMessage(normalized)) return false;

 return normalized.includes('accountemailnotverified')
 || (normalized.includes('email') && (normalized.includes('not verified') || normalized.includes('unverified')))
 || (normalized.includes('بريد') && (normalized.includes('غير') || normalized.includes('تفعيل') || normalized.includes('تحقق') || normalized.includes('موثق')));
 });
 }

 private resolveLoginErrorMessage(error: unknown): string {
 if (!(error instanceof HttpErrorResponse)) {
 return this.translate.instant('LOGIN.ERR_LOGIN_FAILED');
 }

 // 1 — Try to match the raw server message to a known translation key
 const translationKey = this.resolveServerMessageKey(error);
 if (translationKey) {
 return this.translate.instant(translationKey);
 }

 // 2 — Fall back to status-code-based translated messages
 if (error.status === 0) {
 return this.translate.instant('LOGIN.ERR_SERVER_UNREACHABLE');
 }

 if (error.status === 401) {
 return this.translate.instant('LOGIN.ERR_INVALID_CREDENTIALS');
 }

 if (error.status === 403) {
 return this.translate.instant('LOGIN.ERR_ACCOUNT_NOT_ALLOWED');
 }

 if (error.status === 423) {
 return this.translate.instant('LOGIN.ERR_ACCOUNT_LOCKED');
 }

 if (error.status >= 500) {
 return this.translate.instant('LOGIN.ERR_SERVER_ERROR');
 }

 return this.translate.instant('LOGIN.ERR_LOGIN_FAILED');
 }

 /**
 * Extracts the server-provided error string and maps it to a
 * known i18n key. Returns null when no match is found.
 */
 private resolveServerMessageKey(error: HttpErrorResponse): string | null {
 const candidates = [
 error.error?.detail,
 error.error?.message,
 error.error?.title
 ];

 for (const candidate of candidates) {
 if (typeof candidate!== 'string') continue;

 const normalized = candidate.trim().toLowerCase();
 if (!normalized) continue;

 // Skip generic HTTP framework noise
 if (this.isGenericFrameworkMessage(normalized)) continue;

 const key = LoginComponent.SERVER_MESSAGE_MAP[normalized];
 if (key) return key;
 }

 return null;
 }

 private isGenericFrameworkMessage(lowerMessage: string): boolean {
 const blockedFragments = [
 'http failure response for',
 'unknown error',
 'http error response for'
 ];

 return blockedFragments.some((fragment) => lowerMessage.includes(fragment));
 }

 private resolvePlainError(error: any, fallback: string): string {
 return error?.error?.detail
 || error?.error?.message
 || error?.message
 || fallback;
 }
}
