import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppCheckboxComponent),
      multi: true
    }
  ],
  template: `
    <label class="group flex items-center cursor-pointer select-none space-x-3 rtl:space-x-reverse" [class.opacity-50]="disabled">
      <div class="relative">
        <input 
          type="checkbox" 
          class="sr-only" 
          [checked]="checked" 
          [disabled]="disabled"
          (change)="onToggle($event)"
        >
        <div 
          class="w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center p-0.5"
          [ngClass]="{
            'bg-zadna-primary border-zadna-primary shadow-lg shadow-zadna-primary/20 scale-110': checked && !disabled,
            'bg-white border-slate-200 group-hover:border-zadna-primary': !checked && !disabled,
            'bg-slate-100 border-slate-100': disabled
          }"
        >
          <svg 
            class="w-full h-full text-white transform transition-transform duration-300"
            [class.scale-100]="checked"
            [class.scale-0]="!checked"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="4" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
      <span 
        class="text-xs font-bold transition-colors"
        [ngClass]="{
          'text-slate-700': !disabled,
          'text-slate-400': disabled
        }"
      >
        <ng-content></ng-content>
      </span>
    </label>
  `
})
export class AppCheckboxComponent implements ControlValueAccessor {
  @Input() checked = false;
  @Input() disabled = false;
  @Output() changed = new EventEmitter<boolean>();

  onChange: any = () => {};
  onTouched: any = () => {};

  onToggle(event: Event): void {
    if (this.disabled) return;
    this.checked = (event.target as HTMLInputElement).checked;
    this.onChange(this.checked);
    this.onTouched();
    this.changed.emit(this.checked);
  }

  writeValue(value: any): void {
    this.checked = !!value;
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
}
