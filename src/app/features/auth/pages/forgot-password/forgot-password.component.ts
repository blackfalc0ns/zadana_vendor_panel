import { Component, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  isLoading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  isRTL = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private authService: VendorAuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('vendor_lang') || 'ar';
      this.isRTL = savedLang === 'ar';
      this.translate.use(savedLang);

      this.translate.onLangChange.subscribe((event) => {
        this.isRTL = event.lang === 'ar';
      });
    }
  }

  switchLanguage(lang: string) {
    if (isPlatformBrowser(this.platformId)) {
      this.translate.use(lang);
      localStorage.setItem('vendor_lang', lang);
      this.isRTL = lang === 'ar';
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotForm.invalid) {
      this.errorMessage = this.isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address';
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const identifier = this.forgotForm.get('email')?.value as string;

    this.authService.forgotPassword(identifier).subscribe({
      next: (message) => {
        this.isLoading = false;
        this.successMessage = message;
        void this.router.navigate(['/reset-password'], {
          queryParams: { identifier }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.detail
          || error?.error?.message
          || error?.message
          || (this.isRTL ? 'تعذر إرسال رمز إعادة التعيين الآن.' : 'Unable to send reset instructions right now.');
      }
    });
  }
}
