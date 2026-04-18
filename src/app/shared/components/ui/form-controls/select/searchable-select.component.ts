import { Component, ElementRef, EventEmitter, forwardRef, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface SearchableSelectOption<T = any> {
  labelKey?: string; // For translation key
  label?: string; // For direct string
  value: T;
  disabled?: boolean;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-2 w-full" [ngClass]="customClass">
      <label *ngIf="label" class="form-label-base">
        {{ label | translate }} <span *ngIf="isRequired" class="text-rose-500">*</span>
      </label>

      <div class="relative" #dropdownContainer>
        <button
          type="button"
          [disabled]="disabled"
          (click)="toggle()"
          class="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-[0.85rem] font-bold text-slate-900 outline-none transition-all focus:border-zadna-primary focus:ring-1 focus:ring-zadna-primary disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          [class.border-rose-500]="isTouched && error"
          [class.ring-1]="isTouched && error"
          [class.ring-rose-500]="isTouched && error"
        >
          <span class="truncate" [class.text-slate-400]="!selectedLabel">{{ selectedLabel || (placeholder | translate) }}</span>
          <svg class="h-4 w-4 text-slate-400 transition-transform duration-200" [class.rotate-180]="isOpen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        @if (isOpen && !disabled) {
          <div class="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl origin-top animate-in fade-in zoom-in-95 duration-200">
            @if (searchable) {
              <div class="relative">
                <svg class="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input
                  type="text"
                  [(ngModel)]="searchTerm"
                  class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[0.8rem] font-bold text-slate-900 outline-none transition-colors focus:border-zadna-primary rtl:pl-4 rtl:pr-10"
                  [placeholder]="searchPlaceholder | translate"
                  (click)="$event.stopPropagation()"
                  #searchInput
                >
              </div>
            }

            <div class="max-h-60 overflow-y-auto rounded-xl border border-slate-100 no-scrollbar" [class.mt-3]="searchable">
              @if (allowClear && hasValue) {
                <button
                  type="button"
                  (click)="select('', $event)"
                  class="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2.5 text-start text-[0.8rem] font-bold text-rose-500 hover:bg-slate-50 transition-colors">
                  <span>{{ clearText | translate }}</span>
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              }

              @for (option of filteredOptions; track option.value) {
                <button
                  type="button"
                  [disabled]="option.disabled"
                  (click)="select(option.value, $event)"
                  class="group flex w-full items-center justify-between px-3 py-2.5 text-start text-[0.8rem] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50"
                  [class.text-zadna-primary]="option.value === value"
                  [class.bg-slate-50]="option.value === value"
                  [class.text-slate-700]="option.value !== value"
                >
                  <span class="truncate transition-colors group-hover:text-zadna-primary">{{ getOptionLabel(option) }}</span>
                  @if (option.value === value) {
                    <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                    </svg>
                  }
                </button>
              } @empty {
                <div class="flex flex-col items-center justify-center py-6 text-slate-400">
                  <svg class="mb-2 h-8 w-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span class="text-[0.78rem] font-bold">{{ noResultsText | translate }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <div *ngIf="isTouched && error" class="px-1 stagger-1 animate-in fade-in duration-300">
        <p class="text-[10px] font-bold text-rose-500 italic">{{ error | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class SearchableSelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'COMMON.SELECT_OPTION';
  @Input() searchPlaceholder = 'COMMON.SEARCH';
  @Input() noResultsText = 'COMMON.NO_RESULTS';
  @Input() clearText = 'COMMON.CLEAR_SELECTION';
  @Input() options: SearchableSelectOption[] = [];
  @Input() error = '';
  @Input() isTouched = false;
  @Input() isRequired = false;
  @Input() customClass = '';
  @Input() allowClear = true;
  @Input() searchable = true;

  @Output() selectionChange = new EventEmitter<any>();

  value: any = '';
  disabled = false;
  isOpen = false;
  searchTerm = '';

  onChange: any = () => {};
  onTouched: any = () => {};

  constructor(
    private readonly elementRef: ElementRef,
    private readonly translate: TranslateService
  ) {}

  get filteredOptions(): SearchableSelectOption[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.options;
    return this.options.filter(opt => this.getOptionLabel(opt).toLowerCase().includes(term));
  }

  get selectedLabel(): string {
    const selected = this.options.find(opt => opt.value === this.value);
    return selected ? this.getOptionLabel(selected) : '';
  }

  get hasValue(): boolean {
    return this.value !== undefined && this.value !== null && this.value !== '';
  }

  getOptionLabel(option: SearchableSelectOption): string {
    if (option.label) return option.label;
    if (option.labelKey) return this.translate.instant(option.labelKey);
    return String(option.value);
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchTerm = '';
      setTimeout(() => {
        const input = this.elementRef.nativeElement.querySelector('input');
        if (input) input.focus();
      }, 50);
    } else {
      this.onTouched();
      this.isTouched = true;
    }
  }

  select(val: any, event: Event): void {
    event.stopPropagation();
    this.value = val;
    this.onChange(val);
    this.selectionChange.emit(val);
    this.isOpen = false;
    this.searchTerm = '';
    this.onTouched();
    this.isTouched = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen) {
        this.isOpen = false;
        this.onTouched();
        this.isTouched = true;
      }
    }
  }

  writeValue(value: any): void {
    this.value = value !== undefined && value !== null ? value : '';
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
