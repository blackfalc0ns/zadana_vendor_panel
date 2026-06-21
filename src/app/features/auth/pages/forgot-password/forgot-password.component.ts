import { Component, Inject, OnInit, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, timeout } from 'rxjs';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm: FormGroup;
  isLoading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private authService: VendorAuthService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedLang = localStorage.getItem('lang') || localStorage.getItem('vendor_lang') || 'ar';
    this.translate.use(savedLang);
    this.applyDocumentLanguage(savedLang);
    this.dismissAppSplash();
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

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();
    const identifier = `${this.forgotForm.get('email')?.value || ''}`.trim();

    this.authService.forgotPassword(identifier).pipe(
      timeout(45000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (message) => {
        this.successMessage = message;
        void this.router.navigate(['/reset-password'], {
          queryParams: { identifier }
        });
      },
      error: (error) => {
        this.errorMessage = error?.error?.detail
          || error?.error?.message
          || error?.message
          || this.translate.instant('FORGOT_PASSWORD_PAGE.ERRORS.SEND_FAILED');
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
}
