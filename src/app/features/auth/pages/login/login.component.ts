import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppInputComponent } from '../../../../shared/components/ui/form-controls/input/input.component';
import { AppCardComponent } from '../../../../shared/components/ui/card/card.component';

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
    private translate: TranslateService
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
    // if (this.loginForm.valid) {
      this.isLoading = true;
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        console.log('Login Success (Navigating to onboarding without validation):', this.loginForm.value);
        this.router.navigate(['/onboarding']);
      }, 1500);
    // } else {
    //   Object.keys(this.loginForm.controls).forEach(key => {
    //     const control = this.loginForm.get(key);
    //     control?.markAsTouched();
    //   });
    // }
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
}

