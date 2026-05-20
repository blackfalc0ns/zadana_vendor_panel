import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppInputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { AppCardComponent } from '../../../../shared/components/ui/card/card.component';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';

@Component({
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
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private authService: VendorAuthService
  ) {
    // Default to Arabic as per rules
    this.translate.setDefaultLang('ar');
    this.translate.use('ar');
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading = false;
        void this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorMessage = this.resolveLoginErrorMessage(error);
      }
    });
  }

  toggleLanguage(): void {
    const currentLang = this.translate.currentLang;
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    this.switchLanguage(newLang);
  }

  switchLanguage(lang: string): void {
    this.translate.use(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
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
    'user not found': 'LOGIN.ERR_INVALID_CREDENTIALS'
  };

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
      if (typeof candidate !== 'string') continue;

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
}
