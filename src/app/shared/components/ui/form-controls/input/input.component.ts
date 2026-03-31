import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true
    }
  ]
})
export class AppInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() dir: 'rtl' | 'ltr' | 'auto' = 'auto';
  @Input() error = '';
  @Input() isTouched = false;
  @Input() isRequired = false;
  @Input() hasIcon = false;
  @Input() customClass = '';
  @Input() inputClass = '';
  @Input() rows = 3;

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

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
  }

  onBlur(): void {
    this.isTouched = true;
    this.onTouched();
  }
}
