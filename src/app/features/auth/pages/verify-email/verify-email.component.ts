import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  template: `
    <div class="min-h-[100dvh] bg-[#f6f8f7] px-4 py-8 text-slate-950" [dir]="isRTL ? 'rtl' : 'ltr'">
      <div class="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)] lg:grid-cols-[0.92fr_1.08fr]">
        <section class="relative hidden overflow-hidden lg:block">
          <img
            alt="Vendor verification"
            class="absolute inset-0 h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEW1c60Z9X6PmVaxPRNpxHur_LO28-RO0ykfGZxmL_U2d1obOjpzSaSELpZN4atHiahI64IQAkXKH4A-d3juNylCvj1adw5iVpTUU6iyDXcfePY-ugqzrgDCEto5JV8-2joyg0-HuGx2arCdm9s9Qx0-1Cvle1qFT4CjlFam86vwe3kIu5g7Q1vOdyrDNY0kEfJwxibrO6mnhaFP7d2EmRGFaXMqiHq3x6-MPaRphiy-Q2ZBix3vgcz9bYP9TFtYoKW0Z9C-WOFg">
          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,20,24,0.18)_0%,rgba(5,20,24,0.58)_55%,rgba(5,20,24,0.88)_100%)]"></div>
          <div class="relative z-10 flex h-full flex-col justify-end p-10">
            <span class="mb-5 inline-flex w-fit rounded-full border border-white/20 bg-white/12 px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
              {{ 'VERIFY_EMAIL.BADGE' | translate }}
            </span>
            <h1 class="max-w-md text-4xl font-black leading-tight text-white">
              {{ 'VERIFY_EMAIL.HERO_TITLE' | translate }}
            </h1>
            <p class="mt-5 max-w-md text-sm font-bold leading-7 text-white/78">
              {{ 'VERIFY_EMAIL.HERO_DESC' | translate }}
            </p>
          </div>
        </section>

        <section class="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div class="w-full max-w-[460px]">
            <div class="mb-8 text-center">
              <img
                src="assets/i18n/images/logo/logo-auth.png"
                width="800"
                height="309"
                alt="Zadna Logo"
                class="mx-auto h-14 w-48 object-contain drop-shadow-[0_14px_24px_rgba(18,124,140,0.12)]">
              <p class="mt-6 text-[0.72rem] font-black uppercase tracking-[0.2em] text-zadna-primary/75">
                {{ 'VERIFY_EMAIL.EYEBROW' | translate }}
              </p>
              <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {{ 'VERIFY_EMAIL.TITLE' | translate }}
              </h1>
              <p class="mx-auto mt-3 max-w-sm text-sm font-semibold leading-7 text-slate-500">
                {{ 'VERIFY_EMAIL.SUBTITLE' | translate }}
              </p>
            </div>

            <form class="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-7" [formGroup]="form" (ngSubmit)="submit()">
              <label class="block space-y-2">
                <span class="ms-1 text-[0.7rem] font-black uppercase tracking-[0.16em] text-slate-500">{{ 'VERIFY_EMAIL.EMAIL' | translate }}</span>
                <input
                  class="h-13 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none ring-4 ring-transparent transition focus:border-zadna-primary/40 focus:bg-white focus:ring-zadna-primary/10"
                  formControlName="identifier"
                  type="email"
                  autocomplete="email">
              </label>

              <label class="block space-y-2">
                <span class="ms-1 text-[0.7rem] font-black uppercase tracking-[0.16em] text-slate-500">{{ 'VERIFY_EMAIL.OTP_CODE' | translate }}</span>
                <input
                  class="h-14 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-center text-2xl font-black tracking-[0.34em] text-slate-950 outline-none ring-4 ring-transparent transition focus:border-zadna-primary/40 focus:bg-white focus:ring-zadna-primary/10"
                  formControlName="otpCode"
                  maxlength="4"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  type="text"
                  dir="ltr">
              </label>

              @if (errorMessage) {
                <div class="rounded-[18px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
                  {{ errorMessage }}
                </div>
              }

              @if (successMessage) {
                <div class="rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                  {{ successMessage }}
                </div>
              }

              <button
                type="submit"
                [disabled]="isLoading"
                class="inline-flex h-13 w-full items-center justify-center rounded-[18px] bg-zadna-primary px-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_36px_rgba(18,124,140,0.24)] transition hover:-translate-y-0.5 hover:bg-zadna-primaryDark disabled:opacity-60">
                @if (isLoading) {
                  <span class="me-2 h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white"></span>
                  <span>{{ 'VERIFY_EMAIL.VERIFYING' | translate }}</span>
                } @else {
                  <span>{{ 'VERIFY_EMAIL.VERIFY_BUTTON' | translate }}</span>
                }
              </button>

              <div class="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm font-bold">
                <button
                  type="button"
                  [disabled]="isResending"
                  (click)="resend()"
                  class="text-zadna-primary transition hover:text-zadna-primary/80 disabled:opacity-60">
                  {{ (isResending ? 'VERIFY_EMAIL.RESENDING' : 'VERIFY_EMAIL.RESEND') | translate }}
                </button>
                <a routerLink="/login" class="text-slate-500 transition hover:text-slate-900">
                  {{ 'VERIFY_EMAIL.BACK_TO_LOGIN' | translate }}
                </a>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private langSub?: Subscription;
  private autoResendAttempted = false;

  isLoading = false;
  isResending = false;
  currentLang = 'ar';
  errorMessage = '';
  successMessage = '';
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
      otpCode: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]]
    });
  }

  ngOnInit(): void {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || localStorage.getItem('vendor_lang') || localStorage.getItem('lang') || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.cdr.markForCheck();
    });

    const identifier = this.route.snapshot.queryParamMap.get('identifier') || '';
    if (identifier) {
      this.form.patchValue({ identifier });
    }

    if (this.route.snapshot.queryParamMap.get('sent') === '1') {
      this.successMessage = this.translate.instant('VERIFY_EMAIL.SENT');
    }

    if (this.route.snapshot.queryParamMap.get('resend') === '1' && identifier && !this.autoResendAttempted) {
      this.autoResendAttempted = true;
      queueMicrotask(() => this.resend());
    }
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  get isRTL(): boolean {
    return this.currentLang === 'ar';
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = this.translate.instant('VERIFY_EMAIL.INVALID_FORM');
      this.cdr.markForCheck();
      return;
    }

    const { identifier, otpCode } = this.form.getRawValue();
    this.isLoading = true;
    this.cdr.markForCheck();

    this.authService.verifyEmailOtp(`${identifier || ''}`.trim(), `${otpCode || ''}`.trim()).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = this.translate.instant('VERIFY_EMAIL.VERIFIED');
        this.cdr.markForCheck();
        void this.router.navigate(['/submission-success']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.resolveError(error, this.translate.instant('VERIFY_EMAIL.VERIFY_FAILED'));
        this.cdr.markForCheck();
      }
    });
  }

  resend(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const identifierControl = this.form.get('identifier');
    if (identifierControl?.invalid) {
      identifierControl.markAsTouched();
      this.errorMessage = this.translate.instant('VERIFY_EMAIL.ENTER_EMAIL');
      this.cdr.markForCheck();
      return;
    }

    this.isResending = true;
    this.cdr.markForCheck();
    const identifier = `${identifierControl?.value || ''}`.trim();

    this.authService.resendEmailOtp(identifier).subscribe({
      next: (message) => {
        this.isResending = false;
        this.successMessage = message || this.translate.instant('VERIFY_EMAIL.RESEND_SUCCESS');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isResending = false;
        this.errorMessage = this.resolveError(error, this.translate.instant('VERIFY_EMAIL.RESEND_FAILED'));
        this.cdr.markForCheck();
      }
    });
  }

  private resolveError(error: any, fallback: string): string {
    return error?.error?.detail
      || error?.error?.message
      || error?.message
      || fallback;
  }
}
