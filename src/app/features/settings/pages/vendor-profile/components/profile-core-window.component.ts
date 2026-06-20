import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { PhoneInputComponent } from '../../../../../shared/components/ui/form-controls/phone-input/phone-input.component';
import { AppPageSectionShellComponent } from '../../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';
import { VendorReviewItem } from '../../../models/vendor-profile.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-core-window',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, SearchableSelectComponent, PhoneInputComponent, AppPageSectionShellComponent],
  template: `
    <ng-template #reviewBadge let-field="field">
      <ng-container *ngIf="getFieldReviewItem(field) as item">
        <span
          class="shrink-0 rounded-[4px] border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider shadow-sm"
          [ngClass]="reviewItemStatusBadgeClasses(field)">
          {{ reviewItemStatusLabel(item.status) }}
        </span>
      </ng-container>
    </ng-template>

    <ng-template #reviewNote let-field="field">
      <div
        *ngIf="getFieldReviewItem(field)?.decisionNote as note"
        class="mb-2 flex items-start gap-2 rounded-[6px] border border-amber-200 bg-amber-50 px-3 py-2">
        <span class="material-symbols-outlined text-[1rem] text-amber-600">info</span>
        <p class="text-xs font-medium text-amber-800">{{ note }}</p>
      </div>
    </ng-template>

    <div [formGroup]="form" class="space-y-6">
      <div id="store-section">
        <app-page-section-shell
          [title]="'SETTINGS_PROFILE.SECTIONS.STORE'"
          [subtitle]="'SETTINGS_PROFILE.SECTIONS.STORE_HINT'"
          bodyClass="grid gap-6 px-5 py-5 lg:grid-cols-2">
        <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md">
          <div class="border-b border-white/40 bg-white/50 px-6 py-4 rounded-t-[1.5rem]">
            <span class="text-[0.75rem] font-black uppercase tracking-wider text-slate-700">{{ 'SETTINGS_PROFILE.UI.STORE_BASICS' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5">
            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.STORE_NAME_AR' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'storeNameAr' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'storeNameAr' }"></ng-container>
              <input formControlName="storeNameAr" type="text" [class]="fieldClass('storeNameAr')">
              <p *ngIf="form.get('storeNameAr')?.invalid && (form.get('storeNameAr')?.touched || form.get('storeNameAr')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
            </label>

            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.STORE_NAME_EN' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'storeNameEn' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'storeNameEn' }"></ng-container>
              <input formControlName="storeNameEn" type="text" dir="ltr" [class]="fieldClass('storeNameEn', 'ltr')">
              <p *ngIf="form.get('storeNameEn')?.invalid && (form.get('storeNameEn')?.touched || form.get('storeNameEn')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
            </label>

            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.BUSINESS_TYPE' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'businessType' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'businessType' }"></ng-container>
              <app-searchable-select
                formControlName="businessType" 
                [options]="businessTypeOptions" 
                [placeholder]="'SETTINGS_PROFILE.FIELDS.BUSINESS_TYPE'"
                [error]="form.get('businessType')?.invalid && (form.get('businessType')?.touched || form.get('businessType')?.dirty) ? 'REGISTER.ERR_GENERAL' : ''"
                [isTouched]="form.get('businessType')?.touched || form.get('businessType')?.dirty || false"
                [isRequired]="true"
              ></app-searchable-select>
            </label>
          </div>
        </div>

        <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md">
          <div class="border-b border-white/40 bg-white/50 px-6 py-4 rounded-t-[1.5rem]">
            <span class="text-[0.75rem] font-black uppercase tracking-wider text-slate-700">{{ 'SETTINGS_PROFILE.UI.SUPPORT_CHANNELS' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5">
            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.SUPPORT_PHONE' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'supportPhone' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'supportPhone' }"></ng-container>
              <app-phone-input
                formControlName="supportPhone"
                [invalid]="!!(form.get('supportPhone')?.invalid && (form.get('supportPhone')?.touched || form.get('supportPhone')?.dirty))"
              ></app-phone-input>
              <p *ngIf="form.get('supportPhone')?.invalid && (form.get('supportPhone')?.touched || form.get('supportPhone')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
            </label>

            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.SUPPORT_EMAIL' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'supportEmail' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'supportEmail' }"></ng-container>
              <input formControlName="supportEmail" type="email" dir="ltr" [class]="fieldClass('supportEmail', 'ltr')">
              <p *ngIf="form.get('supportEmail')?.invalid && (form.get('supportEmail')?.touched || form.get('supportEmail')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
            </label>
          </div>
        </div>

        <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md lg:col-span-2">
          <div class="border-b border-white/40 bg-white/50 px-6 py-4 rounded-t-[1.5rem]">
            <span class="text-[0.75rem] font-black uppercase tracking-wider text-slate-700">{{ 'SETTINGS_PROFILE.UI.STORE_DESCRIPTION' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.DESCRIPTION_AR' | translate }}
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'descriptionAr' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'descriptionAr' }"></ng-container>
              <textarea formControlName="descriptionAr" rows="4" [class]="textareaClass('descriptionAr')"></textarea>
            </label>

            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.DESCRIPTION_EN' | translate }}
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'descriptionEn' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'descriptionEn' }"></ng-container>
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
        <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md">
          <div class="border-b border-white/40 bg-white/50 px-6 py-4 rounded-t-[1.5rem]">
            <span class="text-[0.75rem] font-black uppercase tracking-wider text-slate-700">{{ 'SETTINGS_PROFILE.UI.OWNER_DETAILS' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.OWNER_NAME' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'ownerName' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'ownerName' }"></ng-container>
              <input formControlName="ownerName" type="text" [class]="fieldClass('ownerName')">
              <p *ngIf="form.get('ownerName')?.invalid && (form.get('ownerName')?.touched || form.get('ownerName')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
            </label>

            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.OWNER_PHONE' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'ownerPhone' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'ownerPhone' }"></ng-container>
              <app-phone-input
                formControlName="ownerPhone"
                [invalid]="!!(form.get('ownerPhone')?.invalid && (form.get('ownerPhone')?.touched || form.get('ownerPhone')?.dirty))"
              ></app-phone-input>
              <p *ngIf="form.get('ownerPhone')?.invalid && (form.get('ownerPhone')?.touched || form.get('ownerPhone')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
            </label>

            <label class="block md:col-span-2">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.OWNER_EMAIL' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'ownerEmail' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'ownerEmail' }"></ng-container>
              <input formControlName="ownerEmail" type="email" dir="ltr" [class]="fieldClass('ownerEmail', 'ltr')">
              <p *ngIf="form.get('ownerEmail')?.invalid && (form.get('ownerEmail')?.touched || form.get('ownerEmail')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
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
        <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md">
          <div class="border-b border-white/40 bg-white/50 px-6 py-4 rounded-t-[1.5rem]">
            <span class="text-[0.75rem] font-black uppercase tracking-wider text-slate-700">{{ 'SETTINGS_PROFILE.UI.CONTACT_PROFILE' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.REGION' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'region' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'region' }"></ng-container>
              <app-searchable-select
                formControlName="region" 
                [options]="regionOptions" 
                [placeholder]="'SETTINGS_PROFILE.FIELDS.REGION'"
                [error]="form.get('region')?.invalid && (form.get('region')?.touched || form.get('region')?.dirty) ? 'REGISTER.ERR_GENERAL' : ''"
                [isTouched]="form.get('region')?.touched || form.get('region')?.dirty || false"
                [isRequired]="true"
              ></app-searchable-select>
            </label>

            <label class="block">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.CITY' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'city' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'city' }"></ng-container>
              <app-searchable-select
                formControlName="city" 
                [options]="cityOptions" 
                [placeholder]="'SETTINGS_PROFILE.FIELDS.CITY'"
                [error]="form.get('city')?.invalid && (form.get('city')?.touched || form.get('city')?.dirty) ? 'REGISTER.ERR_GENERAL' : ''"
                [isTouched]="form.get('city')?.touched || form.get('city')?.dirty || false"
                [isRequired]="true"
              ></app-searchable-select>
            </label>

            <label class="block md:col-span-2">
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ 'SETTINGS_PROFILE.FIELDS.NATIONAL_ADDRESS' | translate }} <span class="text-rose-500 font-extrabold">*</span>
                </span>
                <ng-container *ngTemplateOutlet="reviewBadge; context: { field: 'nationalAddress' }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="reviewNote; context: { field: 'nationalAddress' }"></ng-container>
              <textarea formControlName="nationalAddress" rows="3" [class]="textareaClass('nationalAddress')"></textarea>
              <p *ngIf="form.get('nationalAddress')?.invalid && (form.get('nationalAddress')?.touched || form.get('nationalAddress')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
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
  @Input() reviewItems: VendorReviewItem[] = [];
  @Input() getFieldReviewItem: (field: string) => VendorReviewItem | undefined = () => undefined;
  @Input() reviewItemStatusLabel: (status: string) => string = (status) => status;
  @Input() reviewItemStatusBadgeClasses: (field: string) => string = () => 'bg-slate-100 text-slate-600';
}
