import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { AppPageSectionShellComponent } from '../../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';

@Component({
  selector: 'app-profile-operations-window',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, SearchableSelectComponent, AppPageSectionShellComponent],
  template: `
    <div [formGroup]="form" class="space-y-6">
      <div id="banking-section">
        <app-page-section-shell
          [title]="'SETTINGS_PROFILE.SECTIONS.BANKING'"
          [subtitle]="'SETTINGS_PROFILE.SECTIONS.BANKING_HINT'"
          bodyClass="grid gap-6 px-5 py-5">
        <div class="rounded-[12px] border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <span class="text-xs font-bold text-slate-600">{{ 'SETTINGS_PROFILE.UI.BANK_PROFILE' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'ONBOARDING.FIELDS.BANK_NAME' | translate }}</span>
              <app-searchable-select formControlName="bankName" [options]="bankOptions" [placeholder]="'ONBOARDING.FIELDS.BANK_NAME'"></app-searchable-select>
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'ONBOARDING.FIELDS.PAYMENT_CYCLE' | translate }}</span>
              <app-searchable-select formControlName="payoutCycle" [options]="paymentCycleOptions" [placeholder]="'ONBOARDING.FIELDS.PAYMENT_CYCLE'"></app-searchable-select>
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'ONBOARDING.FIELDS.IBAN' | translate }}</span>
              <input formControlName="iban" type="text" dir="ltr" [class]="fieldClass('iban', 'ltr')">
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'ONBOARDING.FIELDS.SWIFT' | translate }}</span>
              <input formControlName="swiftCode" type="text" dir="ltr" class="uppercase" [class]="fieldClass('swiftCode', 'ltr')">
            </label>
          </div>
        </div>
        </app-page-section-shell>
      </div>

      <div id="hours-section">
        <app-page-section-shell
          [title]="'SETTINGS_PROFILE.SECTIONS.HOURS'"
          [subtitle]="'SETTINGS_PROFILE.SECTIONS.HOURS_HINT'"
          bodyClass="px-5 py-5">
        <div actions>
          <span class="inline-flex items-center gap-1.5 rounded-[6px] bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-bold text-emerald-700 border border-emerald-200">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            {{ openDaysCount }} / {{ operatingHours.length }}
          </span>
        </div>

        <div formArrayName="operatingHours" class="grid gap-3">
          @for (hour of operatingHours.controls; track $index) {
            <div
              [formGroupName]="$index"
              class="flex flex-col md:flex-row md:items-center gap-4 rounded-[8px] border p-4 transition-all"
              [ngClass]="hour.get('isOpen')?.value ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'">
              
              <div class="flex flex-1 items-center justify-between gap-3 md:justify-start md:min-w-[200px]">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px]"
                    [ngClass]="hour.get('isOpen')?.value ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'">
                    <span class="material-symbols-outlined text-[18px]">{{ hour.get('isOpen')?.value ? 'storefront' : 'store_closed' }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ hour.get('dayKey')?.value | translate }}</p>
                    <p class="text-[0.7rem] font-bold"
                      [ngClass]="hour.get('isOpen')?.value ? 'text-emerald-600' : 'text-slate-500'">
                      {{ hour.get('isOpen')?.value ? ('SETTINGS_PROFILE.OPEN_NOW' | translate) : ('COMMON.CLOSE' | translate) }}
                    </p>
                  </div>
                </div>

                <label class="group relative flex cursor-pointer items-center justify-center md:ml-auto">
                  <input formControlName="isOpen" type="checkbox" class="peer sr-only">
                  <div class="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20"></div>
                  <div class="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-slate-300 bg-white transition-all peer-checked:left-[22px] peer-checked:border-white shadow-sm"></div>
                </label>
              </div>

              <div class="flex gap-4 md:ml-auto">
                <div class="flex-1 md:w-32">
                  <label class="mb-1 block text-[0.66rem] font-bold text-slate-500" [ngClass]="{'opacity-50': !hour.get('isOpen')?.value}">{{ currentLang === 'ar' ? 'من' : 'From' }}</label>
                  <input formControlName="from" type="time" [class]="timeFieldClass(hour.get('isOpen')?.value)">
                </div>
                <div class="flex-1 md:w-32">
                  <label class="mb-1 block text-[0.66rem] font-bold text-slate-500" [ngClass]="{'opacity-50': !hour.get('isOpen')?.value}">{{ currentLang === 'ar' ? 'إلى' : 'To' }}</label>
                  <input formControlName="to" type="time" [class]="timeFieldClass(hour.get('isOpen')?.value)">
                </div>
              </div>
            </div>
          }
        </div>
        </app-page-section-shell>
      </div>
    </div>
  `
})
export class ProfileOperationsWindowComponent {
  @Input() currentLang: 'ar' | 'en' | string = 'ar';
  @Input({ required: true }) form!: FormGroup;
  @Input() bankOptions: SearchableSelectOption[] = [];
  @Input() paymentCycleOptions: SearchableSelectOption[] = [];
  @Input() openDaysCount = 0;
  @Input() fieldClass!: (controlName: string, mode?: 'context' | 'ltr' | 'rtl') => string;
  @Input() timeFieldClass!: (isOpen: boolean) => string;

  get operatingHours(): FormArray {
    return this.form.get('operatingHours') as FormArray;
  }
}
