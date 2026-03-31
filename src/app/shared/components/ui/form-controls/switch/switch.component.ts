import { Component, Input, Output, EventEmitter, forwardRef, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppSwitchComponent),
      multi: true
    }
  ],
  template: `
    <label class="group flex items-center cursor-pointer select-none space-x-3 rtl:space-x-reverse" [class.opacity-50]="disabled">
      <div 
        class="relative w-11 h-6 transition-all duration-500 rounded-full border border-transparent shadow-inner"
        [ngClass]="{
          'bg-zadna-primary shadow-zadna-primary/20': checked && !disabled,
          'bg-slate-200': !checked && !disabled,
          'bg-slate-100': disabled
        }"
      >
        <input 
          type="checkbox" 
          class="sr-only" 
          [checked]="checked" 
          [disabled]="disabled"
          (change)="onToggle($event)"
        >
        <div 
          class="absolute top-0.5 left-0.5 rtl:right-0.5 rtl:left-auto w-4.5 h-4.5 bg-white rounded-full shadow-lg transition-all duration-500 transform"
          [ngClass]="{
            'translate-x-5 rtl:-translate-x-5 scale-110': checked,
            'translate-x-0 scale-100': !checked
          }"
        >
          <div 
            class="w-full h-full rounded-full transition-opacity duration-500"
            [ngClass]="{
              'bg-gradient-to-tr from-white to-zadna-primary/10 opacity-100': checked,
              'opacity-0': !checked
            }"
          ></div>
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
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    .w-4\.5 { width: 1.125rem; }
    .h-4\.5 { height: 1.125rem; }
  `]
})
export class AppSwitchComponent implements ControlValueAccessor {
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
