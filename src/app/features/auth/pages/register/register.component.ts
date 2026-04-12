import { Component, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  submitted = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  isRTL = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private authService: VendorAuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      storeName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('vendor_lang') || 'ar';
      this.isRTL = savedLang === 'ar';
      this.translate.use(savedLang);

      this.translate.onLangChange.subscribe((event) => {
        this.isRTL = event.lang === 'ar';
      });
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
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

    if (this.registerForm.invalid) {
      if (this.registerForm.errors?.['mismatch']) {
        this.errorMessage = this.translate.instant('REGISTER.ERR_MISMATCH');
      } else {
        this.errorMessage = this.translate.instant('REGISTER.ERR_INVALID_FORM');
      }

      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { firstName, lastName, storeName, email, password } = this.registerForm.getRawValue();
    this.authService.saveRegistrationDraft({
      fullName: `${firstName} ${lastName}`.trim(),
      email,
      password,
      preferredStoreName: storeName
    });

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('onboarding_biz_name', storeName || 'Vendor');
    }

    this.isLoading = false;
    void this.router.navigate(['/onboarding']);
  }
}
