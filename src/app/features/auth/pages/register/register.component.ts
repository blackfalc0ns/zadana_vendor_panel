import { Component, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  isRTL = true; // default RTL

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
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

      this.translate.onLangChange.subscribe(event => {
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
    // if (this.registerForm.invalid) {
    //   if (this.registerForm.errors?.['mismatch']) {
    //     this.errorMessage = this.isRTL ? 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين' : 'Passwords do not match';
    //   } else {
    //     this.errorMessage = this.isRTL ? 'يرجى إكمال جميع الحقول بشكل صحيح' : 'Please fill all details correctly';
    //   }
    //   // return;
    // }

    this.isLoading = true;
    this.errorMessage = '';
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/onboarding']); // Changed to onboarding for flow testing
    }, 1500);
  }
}
