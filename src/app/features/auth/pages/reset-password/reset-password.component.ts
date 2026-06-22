import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, switchMap, timeout } from 'rxjs';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  isLoading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  readonly form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly authService: VendorAuthService,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {
    this.form = this.fb.group({
      identifier: ['', [Validators.required, Validators.email]],
      otpCode: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('lang') || localStorage.getItem('vendor_lang') || 'ar';
      this.translate.use(savedLang);
      this.applyDocumentLanguage(savedLang);
      this.dismissAppSplash();
    }

    const identifier = this.route.snapshot.queryParamMap.get('identifier');
    if (identifier) {
      this.form.patchValue({ identifier });
    }
  }

  switchLanguage(lang: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    localStorage.setItem('vendor_lang', lang);
    this.applyDocumentLanguage(lang);
    this.cdr.markForCheck();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    this.cdr.markForCheck();
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.cdr.markForCheck();
  }

  submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const { identifier, otpCode, newPassword } = this.form.getRawValue();
    this.isLoading = true;
    this.cdr.markForCheck();

    this.authService.verifyPasswordResetOtp(identifier || '', otpCode || '').pipe(
      switchMap((verification) =>
        this.authService.resetPassword(identifier || '', verification.resetToken, newPassword || '')
      ),
      timeout(45000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (message) => {
        this.successMessage = message;
        void this.router.navigate(['/login']);
      },
      error: (error) => {
        this.errorMessage = error?.error?.detail
          || error?.error?.message
          || error?.message
          || this.translate.instant('RESET_PASSWORD_PAGE.ERRORS.RESET_FAILED');
        this.cdr.markForCheck();
      }
    });
  }

  get isRTL(): boolean {
    return this.translate.currentLang === 'ar';
  }

  private applyDocumentLanguage(lang: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

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

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const form = control as FormGroup;
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }
}
