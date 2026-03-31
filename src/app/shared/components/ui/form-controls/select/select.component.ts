import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export interface SelectOption {
  labelKey: string;
  value: any;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-2 w-full" [ngClass]="customClass">
      <label *ngIf="label" class="form-label-base">
        {{ label | translate }} <span *ngIf="isRequired" class="text-red-500">*</span>
      </label>
      
      <div class="relative group">
        <select
          [value]="value"
          [disabled]="disabled"
          (change)="onChangeValue($event)"
          (blur)="onBlur()"
          class="form-input-base w-full appearance-none cursor-pointer pr-10 rtl:pl-10 rtl:pr-4 transition-all"
          [class.ring-2]="isTouched && error"
          [class.ring-red-500]="isTouched && error"
        >
          <option value="" disabled selected>{{ placeholder | translate }}</option>
          <option *ngFor="let option of options" [value]="option.value">
            {{ option.labelKey | translate }}
          </option>
        </select>
        
        <div class="absolute inset-y-0 right-4 rtl:left-4 rtl:right-auto flex items-center pointer-events-none text-slate-400 group-focus-within:text-zadna-primary transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>

      <div *ngIf="isTouched && error" class="px-1 stagger-1 animate-in fade-in duration-300">
        <p class="text-[10px] font-bold text-red-500 italic">{{ error | translate }}</p>
      </div>
    </div>
  `
})
export class AppSelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'COMMON.SELECT_OPTION';
  @Input() options: SelectOption[] = [];
  @Input() error = '';
  @Input() isTouched = false;
  @Input() isRequired = false;
  @Input() customClass = '';

  value: any = '';
  disabled = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onChangeValue(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.value = val;
    this.onChange(val);
  }

  onBlur(): void {
    this.isTouched = true;
    this.onTouched();
  }
}
