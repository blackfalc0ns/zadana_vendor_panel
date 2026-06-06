import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  forwardRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SAUDI_DIAL_CODE,
  SAUDI_MOBILE_LOCAL_LENGTH,
  buildSaudiPhoneNumber,
  parseSaudiPhoneNumber
} from '../../../../constants/saudi-phone.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-2 w-full" [ngClass]="customClass">
      <label *ngIf="label" class="form-label-base">
        {{ label | translate }}
        <span *ngIf="isRequired" class="text-red-500">*</span>
      </label>

      <div [class]="wrapperClass" [attr.dir]="isRtl ? 'rtl' : 'ltr'">
        <div
          class="flex shrink-0 items-center gap-2 border-e border-inherit bg-slate-100/90 px-3.5 select-none"
          aria-hidden="true">
          <span
            class="inline-flex min-w-[1.65rem] items-center justify-center rounded-md border border-slate-200/80 bg-white px-1.5 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-slate-600"
            dir="ltr">
            {{ countryCode }}
          </span>
          <span class="text-sm font-black tracking-wide text-slate-800 tabular-nums" dir="ltr">{{ dialCode }}</span>
        </div>

        <input
          type="tel"
          dir="ltr"
          inputmode="numeric"
          autocomplete="tel-national"
          [value]="localValue"
          [disabled]="disabled"
          [placeholder]="placeholder | translate"
          [attr.maxlength]="localMaxLength"
          (input)="onLocalInput($event)"
          (blur)="onBlur()"
          class="min-w-0 flex-1 border-0 bg-transparent px-3 text-left text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      <div *ngIf="isTouched && error" class="px-1 animate-in fade-in duration-300">
        <p class="text-[10px] font-bold text-red-500 italic">{{ error | translate }}</p>
      </div>
    </div>
  `
})
export class PhoneInputComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  readonly localMaxLength = SAUDI_MOBILE_LOCAL_LENGTH + 1;

  @Input() dialCode = SAUDI_DIAL_CODE;
  @Input() countryCode = 'SA';
  @Input() placeholder = 'COMMON.PHONE_LOCAL_PLACEHOLDER';
  @Input() invalid = false;
  @Input() label = '';
  @Input() error = '';
  @Input() isTouched = false;
  @Input() isRequired = false;
  @Input() customClass = '';

  lang = this.translate.currentLang || 'ar';
  localValue = '';
  disabled = false;

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe((event) => {
      this.lang = event.lang;
      this.cdr.markForCheck();
    });
  }

  get isRtl(): boolean {
    return (this.lang || 'ar').startsWith('ar');
  }

  get wrapperClass(): string {
    return [
      'flex h-12 w-full overflow-hidden rounded-[14px] border shadow-sm transition-all duration-200',
      this.invalid
        ? 'border-rose-300 bg-rose-50/30 focus-within:border-rose-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-100'
        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 focus-within:border-zadna-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-zadna-primary/10'
    ].join(' ');
  }

  writeValue(value: string | null): void {
    this.localValue = this.formatLocalDisplay(parseSaudiPhoneNumber(value, this.dialCode).local);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  onLocalInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = this.normalizeLocalDigits(input.value);
    this.localValue = this.formatLocalDisplay(normalized);
    input.value = this.localValue;
    this.onChange(buildSaudiPhoneNumber(normalized, this.dialCode));
    this.cdr.markForCheck();
  }

  onBlur(): void {
    this.isTouched = true;
    this.onTouched();
  }

  private normalizeLocalDigits(raw: string): string {
    let digits = raw.replace(/\D/g, '');
    const dialDigits = this.dialCode.replace(/\D/g, '');

    if (dialDigits && digits.startsWith(dialDigits)) {
      digits = digits.slice(dialDigits.length);
    }

    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    return digits.slice(0, SAUDI_MOBILE_LOCAL_LENGTH);
  }

  private formatLocalDisplay(local: string): string {
    if (!local) {
      return '';
    }

    return local.startsWith('5') ? `0${local}` : local;
  }
}
