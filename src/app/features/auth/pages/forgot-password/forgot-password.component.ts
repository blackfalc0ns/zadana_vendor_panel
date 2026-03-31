import { Component, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  isRTL = true; // default RTL

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('vendor_lang') || 'ar';
      this.isRTL = savedLang === 'ar';
      this.translate.use(savedLang);

      this.translate.onLangChange.subscribe(event => {
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
    if (this.forgotForm.invalid) {
      this.errorMessage = this.isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address';
      this.successMessage = '';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = this.isRTL 
        ? 'تم إرسال رابط تأكيد استعادة كلمة المرور إلى بريدك الإلكتروني.'
        : 'Password reset link has been sent to your email.';
    }, 1500);
  }
}
