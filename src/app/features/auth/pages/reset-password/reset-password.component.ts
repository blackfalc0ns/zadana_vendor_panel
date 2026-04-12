import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  isLoading = false;
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
    private readonly authService: VendorAuthService
  ) {
    this.form = this.fb.group({
      identifier: ['', [Validators.required, Validators.email]],
      otpCode: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const identifier = this.route.snapshot.queryParamMap.get('identifier');
    if (identifier) {
      this.form.patchValue({ identifier });
    }
  }

  get isRTL(): boolean {
    return (this.translate.currentLang || 'ar') === 'ar';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = this.translate.instant('RESET_PASSWORD_PAGE.ERRORS.INVALID_FORM');
      return;
    }

    const { identifier, otpCode, newPassword } = this.form.getRawValue();
    this.isLoading = true;

    this.authService.resetPassword(identifier || '', otpCode || '', newPassword || '').subscribe({
      next: (message) => {
        this.isLoading = false;
        this.successMessage = message;
        void this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.detail
          || error?.error?.message
          || error?.message
          || this.translate.instant('RESET_PASSWORD_PAGE.ERRORS.RESET_FAILED');
      }
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const form = control as FormGroup;
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }
}
