import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { AppPageSectionShellComponent } from '../../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';

@Component({
  selector: 'app-profile-core-window',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, SearchableSelectComponent, AppPageSectionShellComponent],
  template: `
    <div [formGroup]="form" class="space-y-6">
      <div id="store-section">
        <app-page-section-shell
          [title]="'SETTINGS_PROFILE.SECTIONS.STORE'"
          [subtitle]="'SETTINGS_PROFILE.SECTIONS.STORE_HINT'"
          bodyClass="grid gap-6 px-5 py-5 lg:grid-cols-2">
        <div class="rounded-[12px] border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <span class="text-xs font-bold text-slate-600">{{ 'SETTINGS_PROFILE.UI.STORE_BASICS' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5">
            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.STORE_NAME_AR' | translate }}</span>
              <input formControlName="storeNameAr" type="text" [class]="fieldClass('storeNameAr')">
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.STORE_NAME_EN' | translate }}</span>
              <input formControlName="storeNameEn" type="text" dir="ltr" [class]="fieldClass('storeNameEn', 'ltr')">
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.BUSINESS_TYPE' | translate }}</span>
              <app-searchable-select formControlName="businessType" [options]="businessTypeOptions" [placeholder]="'SETTINGS_PROFILE.FIELDS.BUSINESS_TYPE'"></app-searchable-select>
            </label>
          </div>
        </div>

        <div class="rounded-[12px] border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <span class="text-xs font-bold text-slate-600">{{ 'SETTINGS_PROFILE.UI.SUPPORT_CHANNELS' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5">
            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.SUPPORT_PHONE' | translate }}</span>
              <input formControlName="supportPhone" type="tel" dir="ltr" [class]="fieldClass('supportPhone', 'ltr')">
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.SUPPORT_EMAIL' | translate }}</span>
              <input formControlName="supportEmail" type="email" dir="ltr" [class]="fieldClass('supportEmail', 'ltr')">
            </label>
          </div>
        </div>

        <div class="rounded-[12px] border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div class="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <span class="text-xs font-bold text-slate-600">{{ 'SETTINGS_PROFILE.UI.STORE_DESCRIPTION' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.DESCRIPTION_AR' | translate }}</span>
              <textarea formControlName="descriptionAr" rows="4" [class]="textareaClass('descriptionAr')"></textarea>
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.DESCRIPTION_EN' | translate }}</span>
              <textarea formControlName="descriptionEn" rows="4" dir="ltr" [class]="textareaClass('descriptionEn', 'ltr')"></textarea>
            </label>
          </div>
        </div>
        </app-page-section-shell>
      </div>

      <div id="owner-section">
        <app-page-section-shell
          [title]="'SETTINGS_PROFILE.SECTIONS.OWNER'"
          [subtitle]="'SETTINGS_PROFILE.SECTIONS.OWNER_HINT'"
          bodyClass="grid gap-6 px-5 py-5">
        <div class="rounded-[12px] border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <span class="text-xs font-bold text-slate-600">{{ 'SETTINGS_PROFILE.UI.OWNER_DETAILS' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.OWNER_NAME' | translate }}</span>
              <input formControlName="ownerName" type="text" [class]="fieldClass('ownerName')">
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.OWNER_PHONE' | translate }}</span>
              <input formControlName="ownerPhone" type="tel" dir="ltr" [class]="fieldClass('ownerPhone', 'ltr')">
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.OWNER_EMAIL' | translate }}</span>
              <input formControlName="ownerEmail" type="email" dir="ltr" [class]="fieldClass('ownerEmail', 'ltr')">
            </label>
          </div>
        </div>
        </app-page-section-shell>
      </div>

      <div id="contact-section">
        <app-page-section-shell
          [title]="'SETTINGS_PROFILE.SECTIONS.CONTACT'"
          [subtitle]="'SETTINGS_PROFILE.SECTIONS.CONTACT_HINT'"
          bodyClass="grid gap-6 px-5 py-5">
        <div class="rounded-[12px] border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <span class="text-xs font-bold text-slate-600">{{ 'SETTINGS_PROFILE.UI.CONTACT_PROFILE' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.REGION' | translate }}</span>
              <app-searchable-select formControlName="region" [options]="regionOptions" [placeholder]="'SETTINGS_PROFILE.FIELDS.REGION'"></app-searchable-select>
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.CITY' | translate }}</span>
              <app-searchable-select formControlName="city" [options]="cityOptions" [placeholder]="'SETTINGS_PROFILE.FIELDS.CITY'"></app-searchable-select>
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.NATIONAL_ADDRESS' | translate }}</span>
              <textarea formControlName="nationalAddress" rows="3" [class]="textareaClass('nationalAddress')"></textarea>
            </label>
          </div>
        </div>
        </app-page-section-shell>
      </div>
    </div>
  `
})
export class ProfileCoreWindowComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() businessTypeOptions: SearchableSelectOption[] = [];
  @Input() regionOptions: SearchableSelectOption[] = [];
  @Input() cityOptions: SearchableSelectOption[] = [];
  @Input() fieldClass!: (controlName: string, mode?: 'context' | 'ltr' | 'rtl') => string;
  @Input() textareaClass!: (controlName: string, mode?: 'context' | 'ltr' | 'rtl') => string;
}
