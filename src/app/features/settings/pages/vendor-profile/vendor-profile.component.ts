import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { DetailTabsNavComponent, DetailTabNavItem } from '../../../../shared/components/ui/navigation/detail-tabs-nav/detail-tabs-nav.component';
import { normalizeCompanyDomain } from '../../../../shared/utils/work-email.utils';
import { BANKS, BUSINESS_TYPES, CITIES, NATIONALITIES, PAYMENT_CYCLES, REGIONS, SelectOption } from '../../../auth/constants/vendor-onboarding.constants';
import { VendorOperatingHour, VendorProfile, VendorProfileService } from '../../services/vendor-profile.service';

interface ProfileSectionNavItem {
  id: string;
  labelKey: string;
  fields?: string[];
  kind?: 'hours';
}

@Component({
  selector: 'app-vendor-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgClass, AppPageHeaderComponent, AppPanelHeaderComponent, DetailTabsNavComponent],
  template: `
    <div class="space-y-6 pb-16" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">

      <app-page-header
        [title]="'SETTINGS_PROFILE.TITLE' | translate"
        [description]="'SETTINGS_PROFILE.SUBTITLE' | translate"
      >
        <div actions class="flex flex-wrap items-center gap-3">
          <span
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.68rem] font-black shadow-sm"
            [ngClass]="statusBadgeClass">
            <span class="h-2 w-2 rounded-full" [ngClass]="statusDotClass"></span>
            {{ profileStatusLabelKey | translate }}
          </span>

          <button
            type="button"
            (click)="saveProfile()"
            [disabled]="profileForm.invalid || isSaving"
            class="inline-flex items-center gap-2 rounded-[16px] bg-zadna-primary px-4 py-2.5 text-[0.76rem] font-black text-white shadow-[0_14px_26px_rgba(14,116,144,0.24)] transition-all hover:-translate-y-0.5 disabled:opacity-60">
            @if (isSaving) {
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white"></span>
            }
            {{ 'SETTINGS_PROFILE.SAVE' | translate }}
          </button>
        </div>
      </app-page-header>

      <section class="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50">
        <div class="px-5 py-5 md:px-6">
        <div>
          <div class="space-y-4">
            <div class="flex flex-wrap items-start gap-3">
              <div class="flex h-16 w-16 items-center justify-center rounded-[20px] border border-zadna-primary/10 bg-zadna-primary/10 text-[1.05rem] font-black uppercase text-zadna-primary">
                {{ initials }}
              </div>

              <div class="min-w-0 flex-1">
                <p class="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-slate-400">{{ 'COMMON.PROFILE' | translate }}</p>
                <div class="mt-1.5 flex flex-wrap items-center gap-2.5">
                  <h2 class="text-[clamp(1.25rem,3vw,1.95rem)] font-black leading-[1.08] text-slate-900">{{ displayStoreName }}</h2>
                  <span class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[0.66rem] font-extrabold text-emerald-700">
                    <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                    {{ 'SIDEBAR.VERIFIED_VENDOR' | translate }}
                  </span>
                </div>
                <p class="mt-1.5 max-w-2xl text-[0.78rem] font-bold leading-5 text-slate-500">
                  {{ currentLang === 'ar' ? (profileForm.value.descriptionAr || profileForm.value.descriptionEn) : (profileForm.value.descriptionEn || profileForm.value.descriptionAr) }}
                </p>

                <div class="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-black text-slate-700">
                  <span class="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1.5">
                    {{ translatedOption('ONBOARDING.BUSINESS_TYPES', profileForm.value.businessType) }}
                  </span>
                  <span class="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1.5">
                    {{ translatedOption('ONBOARDING.REGIONS', profileForm.value.region) }} - {{ translatedOption('ONBOARDING.CITIES', profileForm.value.city) }}
                  </span>
                  <span class="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1.5">
                    {{ profileForm.value.supportPhone || '-' }}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
        </div>

        <div class="border-t border-slate-100 bg-slate-50/55 px-3 py-3 sm:px-4">
          <app-detail-tabs-nav
            [tabs]="profileTabs"
            [activeTab]="activeTab"
            (tabChange)="setActiveTab($event)">
          </app-detail-tabs-nav>
        </div>
      </section>

      <form [formGroup]="profileForm" class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div class="space-y-6">
          <section id="store-section" [ngClass]="activeTab === 'store-section' ? 'overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50' : 'hidden'">
            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
            </div>
            <app-panel-header
              [title]="'SETTINGS_PROFILE.SECTIONS.STORE'"
              [subtitle]="'SETTINGS_PROFILE.SECTIONS.STORE_HINT'"
              eyebrow="COMMON.PROFILE"
              containerClass="border-b border-slate-100 px-5 py-4"
              titleClass="text-[0.94rem] font-black text-slate-900"
              subtitleClass="mt-1 text-[0.72rem] font-bold text-slate-500"
            >
              <div actions>
                <span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-[0.7rem] font-black text-slate-600">
                  {{ completedFields(getSectionItem('store-section')) }}/{{ totalFields(getSectionItem('store-section')) }}
                </span>
              </div>
            </app-panel-header>

            <div class="grid gap-4 px-5 py-5 lg:grid-cols-2">
              <div class="rounded-[18px] border border-slate-200/70 bg-slate-50/60">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'الهوية التجارية' : 'Store Basics' }}</span>
                </div>
                <div class="grid gap-4 p-4">
                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.STORE_NAME_AR' | translate }}</span>
                    <input formControlName="storeNameAr" type="text" [ngClass]="fieldClass('storeNameAr')">
                  </label>

                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.STORE_NAME_EN' | translate }}</span>
                    <input formControlName="storeNameEn" type="text" dir="ltr" [ngClass]="fieldClass('storeNameEn', 'ltr')">
                  </label>

                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.BUSINESS_TYPE' | translate }}</span>
                    <div class="relative">
                      <select formControlName="businessType" [ngClass]="selectClass('businessType')">
                        @for (option of optionsWithCurrent(businessTypes, profileForm.get('businessType')?.value); track option.value) {
                          <option [value]="option.value">{{ option.labelKey ? (option.labelKey | translate) : option.value }}</option>
                        }
                      </select>
                      <span class="pointer-events-none absolute inset-y-0 flex items-center text-slate-400" [ngClass]="currentLang === 'ar' ? 'left-2.5' : 'right-2.5'">
                        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div class="rounded-[18px] border border-slate-200/70 bg-slate-50/60">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'قنوات الدعم' : 'Support Channels' }}</span>
                </div>
                <div class="grid gap-4 p-4">
                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.SUPPORT_PHONE' | translate }}</span>
                    <input formControlName="supportPhone" type="tel" dir="ltr" [ngClass]="fieldClass('supportPhone', 'ltr')">
                  </label>

                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.SUPPORT_EMAIL' | translate }}</span>
                    <input formControlName="supportEmail" type="email" dir="ltr" [ngClass]="fieldClass('supportEmail', 'ltr')">
                  </label>

                  <label class="space-y-2.5 lg:col-span-2">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.COMPANY_DOMAIN' | translate }}</span>
                    <input
                      formControlName="companyDomain"
                      type="text"
                      dir="ltr"
                      placeholder="store.com"
                      [ngClass]="fieldClass('companyDomain', 'ltr')">
                    <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <p class="text-[0.68rem] font-bold text-slate-400">{{ 'SETTINGS_PROFILE.DOMAIN.HINT' | translate }}</p>
                      <span
                        class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-black"
                        [ngClass]="companyDomainBadgeClass">
                        <span class="h-2 w-2 rounded-full" [ngClass]="hasConfiguredCompanyDomain ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                        {{ companyDomainStatusKey | translate }}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div class="rounded-[18px] border border-slate-200/70 bg-slate-50/60 lg:col-span-2">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'وصف المتجر' : 'Store Description' }}</span>
                </div>
                <div class="grid gap-4 p-4 md:grid-cols-2">
                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.DESCRIPTION_AR' | translate }}</span>
                    <textarea formControlName="descriptionAr" rows="4" [ngClass]="textareaClass('descriptionAr')"></textarea>
                  </label>

                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.DESCRIPTION_EN' | translate }}</span>
                    <textarea formControlName="descriptionEn" rows="4" dir="ltr" [ngClass]="textareaClass('descriptionEn', 'ltr')"></textarea>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section id="owner-section" [ngClass]="activeTab === 'owner-section' ? 'overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50' : 'hidden'">
            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
            </div>
            <app-panel-header
              [title]="'SETTINGS_PROFILE.SECTIONS.OWNER'"
              [subtitle]="'SETTINGS_PROFILE.SECTIONS.OWNER_HINT'"
              eyebrow="COMMON.PROFILE"
              containerClass="border-b border-slate-100 px-5 py-4"
              titleClass="text-[0.94rem] font-black text-slate-900"
              subtitleClass="mt-1 text-[0.72rem] font-bold text-slate-500"
            ></app-panel-header>

            <div class="grid gap-4 px-5 py-5">
              <div class="rounded-[18px] border border-slate-200/70 bg-slate-50/60">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'بيانات المالك' : 'Owner Details' }}</span>
                </div>
                <div class="grid gap-4 p-4 md:grid-cols-2">
                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.OWNER_NAME' | translate }}</span>
                    <input formControlName="ownerName" type="text" [ngClass]="fieldClass('ownerName')">
                  </label>

                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.OWNER_PHONE' | translate }}</span>
                    <input formControlName="ownerPhone" type="tel" dir="ltr" [ngClass]="fieldClass('ownerPhone', 'ltr')">
                  </label>

                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.OWNER_EMAIL' | translate }}</span>
                    <input formControlName="ownerEmail" type="email" dir="ltr" [ngClass]="fieldClass('ownerEmail', 'ltr')">
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section id="contact-section" [ngClass]="activeTab === 'contact-section' ? 'overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50' : 'hidden'">
            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
            </div>
            <app-panel-header
              [title]="'SETTINGS_PROFILE.SECTIONS.CONTACT'"
              [subtitle]="'SETTINGS_PROFILE.SECTIONS.CONTACT_HINT'"
              eyebrow="COMMON.PROFILE"
              containerClass="border-b border-slate-100 px-5 py-4"
              titleClass="text-[0.94rem] font-black text-slate-900"
              subtitleClass="mt-1 text-[0.72rem] font-bold text-slate-500"
            ></app-panel-header>

            <div class="grid gap-4 px-5 py-5">

              <div class="rounded-[18px] border border-slate-200/70 bg-slate-50/60">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'العنوان والموقع' : 'Address & Location' }}</span>
                </div>
                <div class="grid gap-4 p-4">
                  <div class="grid gap-4 md:grid-cols-2">
                    <label class="space-y-2.5">
                      <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.REGION' | translate }}</span>
                      <div class="relative">
                        <select formControlName="region" [ngClass]="selectClass('region')">
                          @for (option of optionsWithCurrent(regions, profileForm.get('region')?.value); track option.value) {
                            <option [value]="option.value">{{ option.labelKey ? (option.labelKey | translate) : option.value }}</option>
                          }
                        </select>
                        <span class="pointer-events-none absolute inset-y-0 flex items-center text-slate-400" [ngClass]="currentLang === 'ar' ? 'left-2.5' : 'right-2.5'">
                          <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                          </svg>
                        </span>
                      </div>
                    </label>

                    <label class="space-y-2.5">
                      <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.CITY' | translate }}</span>
                      <div class="relative">
                        <select formControlName="city" [ngClass]="selectClass('city')">
                          @for (option of optionsWithCurrent(cities, profileForm.get('city')?.value); track option.value) {
                            <option [value]="option.value">{{ option.labelKey ? (option.labelKey | translate) : option.value }}</option>
                          }
                        </select>
                        <span class="pointer-events-none absolute inset-y-0 flex items-center text-slate-400" [ngClass]="currentLang === 'ar' ? 'left-2.5' : 'right-2.5'">
                          <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                          </svg>
                        </span>
                      </div>
                    </label>
                  </div>

                  <label class="space-y-2.5">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.NATIONAL_ADDRESS' | translate }}</span>
                    <textarea formControlName="nationalAddress" rows="4" [ngClass]="textareaClass('nationalAddress')"></textarea>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section id="legal-section" [ngClass]="activeTab === 'legal-section' ? 'overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50' : 'hidden'">
            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
            </div>
            <app-panel-header
              [title]="'SETTINGS_PROFILE.SECTIONS.LEGAL'"
              [subtitle]="'SETTINGS_PROFILE.SECTIONS.LEGAL_HINT'"
              eyebrow="COMMON.LIVE"
              containerClass="border-b border-slate-100 px-5 py-4"
              titleClass="text-[0.94rem] font-black text-slate-900"
              subtitleClass="mt-1 text-[0.72rem] font-bold text-slate-500"
            ></app-panel-header>

            <div class="grid gap-4 px-5 py-5">
              <div class="grid gap-3 md:grid-cols-3">
                <div class="rounded-[16px] border border-emerald-100 bg-emerald-50/80 p-4">
                  <p class="text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-emerald-600/80">{{ currentLang === 'ar' ? 'حالة الملف' : 'Profile Status' }}</p>
                  <div class="mt-2">
                    <span class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.68rem] font-black" [ngClass]="statusBadgeClass">
                      <span class="h-2 w-2 rounded-full" [ngClass]="statusDotClass"></span>
                      {{ profileStatusLabelKey | translate }}
                    </span>
                  </div>
                </div>

                <div class="rounded-[16px] border border-slate-200 bg-slate-50/80 p-4">
                  <p class="text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'اكتمال القانوني' : 'Legal Completion' }}</p>
                  <p class="mt-2 text-[1rem] font-black text-slate-900">{{ sectionPercent(getSectionItem('legal-section')) }}%</p>
                  <p class="mt-1 text-[0.7rem] font-bold text-slate-500">{{ completedFields(getSectionItem('legal-section')) }}/{{ totalFields(getSectionItem('legal-section')) }}</p>
                </div>

                <div class="rounded-[16px] border border-amber-100 bg-amber-50/80 p-4">
                  <p class="text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-amber-600/80">{{ currentLang === 'ar' ? 'المراجعة' : 'Review' }}</p>
                  <p class="mt-2 text-[0.84rem] font-black text-slate-900">{{ currentLang === 'ar' ? 'تأكد من تطابق السجل والرقم الضريبي' : 'Check CR and tax ID alignment' }}</p>
                </div>
              </div>

              <div class="rounded-[18px] border border-slate-200/70 bg-slate-50/60">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'معرفات قانونية' : 'Legal Identifiers' }}</span>
                </div>
                <div class="grid gap-4 p-4 md:grid-cols-2">
                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'ONBOARDING.FIELDS.ID_NUMBER' | translate }}</span>
                    <input formControlName="idNumber" type="text" dir="ltr" [ngClass]="fieldClass('idNumber', 'ltr')">
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'ONBOARDING.FIELDS.NATIONALITY' | translate }}</span>
                    <div class="relative">
                      <select formControlName="nationality" [ngClass]="selectClass('nationality')">
                        @for (option of optionsWithCurrent(nationalities, profileForm.get('nationality')?.value); track option.value) {
                          <option [value]="option.value">{{ option.labelKey ? (option.labelKey | translate) : option.value }}</option>
                        }
                      </select>
                      <span class="pointer-events-none absolute inset-y-0 flex items-center text-slate-400" [ngClass]="currentLang === 'ar' ? 'left-2.5' : 'right-2.5'">
                        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'ONBOARDING.FIELDS.CR_NUMBER' | translate }}</span>
                    <input formControlName="commercialRegistrationNumber" type="text" dir="ltr" [ngClass]="fieldClass('commercialRegistrationNumber', 'ltr')">
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'ONBOARDING.FIELDS.CR_EXPIRY' | translate }}</span>
                    <input formControlName="expiryDate" type="date" dir="ltr" [ngClass]="fieldClass('expiryDate', 'ltr')">
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'ONBOARDING.FIELDS.TAX_ID' | translate }}</span>
                    <input formControlName="taxId" type="text" dir="ltr" [ngClass]="fieldClass('taxId', 'ltr')">
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'ONBOARDING.FIELDS.LICENSE' | translate }}</span>
                    <input formControlName="licenseNumber" type="text" dir="ltr" [ngClass]="fieldClass('licenseNumber', 'ltr')">
                  </label>
                </div>
              </div>

              <div class="rounded-[18px] border border-slate-200/70 bg-white">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'ملخص التحقق' : 'Verification Summary' }}</span>
                </div>
                <div class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
                  <div class="rounded-[14px] border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-[0.64rem] font-extrabold uppercase tracking-[0.14em] text-slate-400">{{ 'ONBOARDING.FIELDS.ID_NUMBER' | translate }}</p>
                    <p class="mt-1.5 text-[0.82rem] font-black text-slate-900">{{ profileForm.value.idNumber || '-' }}</p>
                  </div>
                  <div class="rounded-[14px] border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-[0.64rem] font-extrabold uppercase tracking-[0.14em] text-slate-400">{{ 'ONBOARDING.FIELDS.NATIONALITY' | translate }}</p>
                    <p class="mt-1.5 text-[0.82rem] font-black text-slate-900">{{ translatedOption('ONBOARDING.NATIONALITIES', profileForm.value.nationality) }}</p>
                  </div>
                  <div class="rounded-[14px] border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-[0.64rem] font-extrabold uppercase tracking-[0.14em] text-slate-400">{{ 'ONBOARDING.FIELDS.CR_NUMBER' | translate }}</p>
                    <p class="mt-1.5 text-[0.82rem] font-black text-slate-900">{{ profileForm.value.commercialRegistrationNumber || '-' }}</p>
                  </div>
                  <div class="rounded-[14px] border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-[0.64rem] font-extrabold uppercase tracking-[0.14em] text-slate-400">{{ 'ONBOARDING.FIELDS.TAX_ID' | translate }}</p>
                    <p class="mt-1.5 text-[0.82rem] font-black text-slate-900">{{ profileForm.value.taxId || '-' }}</p>
                  </div>
                </div>
              </div>

              <div class="rounded-[18px] border border-slate-200/70 bg-slate-50/60">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ 'ONBOARDING.DOCS_CARD_TITLE' | translate }}</span>
                </div>
                <div class="grid gap-3 p-4 md:grid-cols-2">
                  <label class="flex items-center justify-between gap-3 rounded-[14px] border border-slate-200/80 bg-white px-4 py-3">
                    <div>
                      <p class="text-[0.78rem] font-black text-slate-800">{{ 'ONBOARDING.FIELDS.LOGO' | translate }}</p>
                      <p class="mt-1 text-[0.68rem] font-bold text-slate-500">{{ profileForm.value.hasLogo ? ('COMMON.ACTIVE' | translate) : ('ONBOARDING.UPLOAD_PENDING' | translate) }}</p>
                    </div>
                    <input formControlName="hasLogo" type="checkbox" class="h-4.5 w-4.5 rounded border-slate-300 text-zadna-primary focus:ring-zadna-primary/20">
                  </label>

                  <label class="flex items-center justify-between gap-3 rounded-[14px] border border-slate-200/80 bg-white px-4 py-3">
                    <div>
                      <p class="text-[0.78rem] font-black text-slate-800">{{ 'ONBOARDING.FIELDS.CR_DOC' | translate }}</p>
                      <p class="mt-1 text-[0.68rem] font-bold text-slate-500">{{ profileForm.value.hasCRDoc ? ('COMMON.ACTIVE' | translate) : ('ONBOARDING.UPLOAD_PENDING' | translate) }}</p>
                    </div>
                    <input formControlName="hasCRDoc" type="checkbox" class="h-4.5 w-4.5 rounded border-slate-300 text-zadna-primary focus:ring-zadna-primary/20">
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section id="banking-section" [ngClass]="activeTab === 'banking-section' ? 'overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50' : 'hidden'">
            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
            </div>
            <app-panel-header
              [title]="'SETTINGS_PROFILE.SECTIONS.BANKING'"
              [subtitle]="'SETTINGS_PROFILE.SECTIONS.BANKING_HINT'"
              eyebrow="COMMON.CURRENCY"
              containerClass="border-b border-slate-100 px-5 py-4"
              titleClass="text-[0.94rem] font-black text-slate-900"
              subtitleClass="mt-1 text-[0.72rem] font-bold text-slate-500"
            ></app-panel-header>

            <div class="grid gap-4 px-5 py-5">
              <div class="rounded-[18px] border border-slate-200/70 bg-slate-50/60">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'ملف البنك' : 'Bank Profile' }}</span>
                </div>
                <div class="grid gap-4 p-4 md:grid-cols-2">
                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'ONBOARDING.FIELDS.BANK_NAME' | translate }}</span>
                    <div class="relative">
                      <select formControlName="bankName" [ngClass]="selectClass('bankName')">
                        @for (option of optionsWithCurrent(banks, profileForm.get('bankName')?.value); track option.value) {
                          <option [value]="option.value">{{ option.labelKey ? (option.labelKey | translate) : option.value }}</option>
                        }
                      </select>
                      <span class="pointer-events-none absolute inset-y-0 flex items-center text-slate-400" [ngClass]="currentLang === 'ar' ? 'left-2.5' : 'right-2.5'">
                        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'ONBOARDING.FIELDS.PAYMENT_CYCLE' | translate }}</span>
                    <div class="relative">
                      <select formControlName="payoutCycle" [ngClass]="selectClass('payoutCycle')">
                        @for (option of optionsWithCurrent(paymentCycles, profileForm.get('payoutCycle')?.value); track option.value) {
                          <option [value]="option.value">{{ option.labelKey ? (option.labelKey | translate) : option.value }}</option>
                        }
                      </select>
                      <span class="pointer-events-none absolute inset-y-0 flex items-center text-slate-400" [ngClass]="currentLang === 'ar' ? 'left-2.5' : 'right-2.5'">
                        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'ONBOARDING.FIELDS.IBAN' | translate }}</span>
                    <input formControlName="iban" type="text" dir="ltr" [ngClass]="fieldClass('iban', 'ltr')">
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'ONBOARDING.FIELDS.SWIFT' | translate }}</span>
                    <input formControlName="swiftCode" type="text" dir="ltr" class="uppercase" [ngClass]="fieldClass('swiftCode', 'ltr')">
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section id="hours-section" [ngClass]="activeTab === 'hours-section' ? 'overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50' : 'hidden'">
            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
            </div>
            <app-panel-header
              [title]="'SETTINGS_PROFILE.SECTIONS.HOURS'"
              [subtitle]="'SETTINGS_PROFILE.SECTIONS.HOURS_HINT'"
              eyebrow="COMMON.OPEN"
              containerClass="border-b border-slate-100 px-5 py-4"
              titleClass="text-[0.94rem] font-black text-slate-900"
              subtitleClass="mt-1 text-[0.72rem] font-bold text-slate-500"
            >
              <div actions>
                <span class="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-[0.7rem] font-black text-emerald-600">
                  {{ openDaysCount }}/{{ operatingHours.length }}
                </span>
              </div>
            </app-panel-header>

            <div formArrayName="operatingHours" class="grid gap-2.5 px-5 py-5">
              @for (hour of operatingHours.controls; track $index) {
                <div
                  [formGroupName]="$index"
                  class="grid gap-3 rounded-[18px] border p-3 transition md:grid-cols-[minmax(0,1fr)_128px_128px]"
                  [ngClass]="hour.get('isOpen')?.value ? 'border-emerald-100 bg-[linear-gradient(180deg,rgba(236,253,245,0.9),rgba(255,255,255,1))]' : 'border-slate-100 bg-slate-50/90'">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[0.8rem] font-black text-slate-800">{{ hour.get('dayKey')?.value | translate }}</p>
                      <p class="mt-1 text-[0.68rem] font-bold text-slate-500">
                        {{ hour.get('isOpen')?.value ? ('SETTINGS_PROFILE.OPEN_NOW' | translate) : ('COMMON.CLOSE' | translate) }}
                      </p>
                    </div>

                    <label class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[0.68rem] font-black text-slate-600 shadow-sm">
                      <input formControlName="isOpen" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-zadna-primary focus:ring-zadna-primary/30">
                      {{ 'SETTINGS_PROFILE.OPEN_NOW' | translate }}
                    </label>
                  </div>

                  <input formControlName="from" type="time" [ngClass]="timeFieldClass(hour.get('isOpen')?.value)">
                  <input formControlName="to" type="time" [ngClass]="timeFieldClass(hour.get('isOpen')?.value)">
                </div>
              }
            </div>
          </section>
        </div>

        <div class="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <section class="hidden">
            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
            </div>
            <app-panel-header
              [title]="'SETTINGS_PROFILE.SECTIONS.LEGAL'"
              [subtitle]="'SETTINGS_PROFILE.SECTIONS.LEGAL_HINT'"
              eyebrow="COMMON.LIVE"
              containerClass="border-b border-slate-100 px-5 py-4"
              titleClass="text-[0.94rem] font-black text-slate-900"
              subtitleClass="mt-1 text-[0.72rem] font-bold text-slate-500"
            ></app-panel-header>

            <div class="grid gap-4 px-5 py-5">
              <div class="grid gap-3 md:grid-cols-3">
                <div class="rounded-[16px] border border-emerald-100 bg-emerald-50/80 p-4">
                  <p class="text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-emerald-600/80">{{ currentLang === 'ar' ? 'حالة الملف' : 'Profile Status' }}</p>
                  <div class="mt-2">
                    <span class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.68rem] font-black" [ngClass]="statusBadgeClass">
                      <span class="h-2 w-2 rounded-full" [ngClass]="statusDotClass"></span>
                      {{ profileStatusLabelKey | translate }}
                    </span>
                  </div>
                </div>

                <div class="rounded-[16px] border border-slate-200 bg-slate-50/80 p-4">
                  <p class="text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'اكتمال القانوني' : 'Legal Completion' }}</p>
                  <p class="mt-2 text-[1rem] font-black text-slate-900">{{ sectionPercent(getSectionItem('legal-section')) }}%</p>
                  <p class="mt-1 text-[0.7rem] font-bold text-slate-500">{{ completedFields(getSectionItem('legal-section')) }}/{{ totalFields(getSectionItem('legal-section')) }}</p>
                </div>

                <div class="rounded-[16px] border border-amber-100 bg-amber-50/80 p-4">
                  <p class="text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-amber-600/80">{{ currentLang === 'ar' ? 'المراجعة' : 'Review' }}</p>
                  <p class="mt-2 text-[0.84rem] font-black text-slate-900">{{ currentLang === 'ar' ? 'تأكد من تطابق السجل والرقم الضريبي' : 'Check CR and tax ID alignment' }}</p>
                </div>
              </div>

              <div class="rounded-[18px] border border-slate-200/70 bg-slate-50/60">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'معرّفات قانونية' : 'Legal Identifiers' }}</span>
                </div>
                <div class="grid gap-4 p-4">
                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.COMMERCIAL_REGISTRATION' | translate }}</span>
                    <input formControlName="commercialRegistrationNumber" type="text" [ngClass]="fieldClass('commercialRegistrationNumber')">
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.TAX_ID' | translate }}</span>
                    <input formControlName="taxId" type="text" [ngClass]="fieldClass('taxId')">
                  </label>
                </div>
              </div>

              <div class="rounded-[18px] border border-slate-200/70 bg-white">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'ملخص التحقق' : 'Verification Summary' }}</span>
                </div>
                <div class="grid gap-3 p-4 md:grid-cols-2">
                  <div class="rounded-[14px] border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-[0.64rem] font-extrabold uppercase tracking-[0.14em] text-slate-400">{{ 'SETTINGS_PROFILE.FIELDS.COMMERCIAL_REGISTRATION' | translate }}</p>
                    <p class="mt-1.5 text-[0.82rem] font-black text-slate-900">{{ profileForm.value.commercialRegistrationNumber || '-' }}</p>
                  </div>
                  <div class="rounded-[14px] border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-[0.64rem] font-extrabold uppercase tracking-[0.14em] text-slate-400">{{ 'SETTINGS_PROFILE.FIELDS.TAX_ID' | translate }}</p>
                    <p class="mt-1.5 text-[0.82rem] font-black text-slate-900">{{ profileForm.value.taxId || '-' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="hidden">
            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-300"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
            </div>
            <app-panel-header
              [title]="'SETTINGS_PROFILE.SECTIONS.BANKING'"
              [subtitle]="'SETTINGS_PROFILE.SECTIONS.BANKING_HINT'"
              eyebrow="COMMON.CURRENCY"
              containerClass="border-b border-slate-100 px-5 py-4"
              titleClass="text-[0.94rem] font-black text-slate-900"
              subtitleClass="mt-1 text-[0.72rem] font-bold text-slate-500"
            ></app-panel-header>

            <div class="grid gap-4 px-5 py-5">
              <div class="rounded-[18px] border border-slate-200/70 bg-slate-50/60">
                <div class="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <span class="h-2 w-2 rounded-full bg-rose-300"></span>
                  <span class="h-2 w-2 rounded-full bg-amber-300"></span>
                  <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                  <span class="ms-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-500">{{ currentLang === 'ar' ? 'ملف البنك' : 'Bank Profile' }}</span>
                </div>
                <div class="grid gap-4 p-4">
                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.BANK_NAME' | translate }}</span>
                    <input formControlName="bankName" type="text" [ngClass]="fieldClass('bankName')">
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.IBAN' | translate }}</span>
                    <input formControlName="iban" type="text" [ngClass]="fieldClass('iban')">
                  </label>

                  <label class="space-y-2.5 block">
                    <span class="text-[0.75rem] font-black text-slate-500">{{ 'SETTINGS_PROFILE.FIELDS.PAYOUT_CYCLE' | translate }}</span>
                    <input formControlName="payoutCycle" type="text" [ngClass]="fieldClass('payoutCycle')">
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section class="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50">
            <div class="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
              <p class="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-zadna-primary/75">{{ 'COMMON.PROFILE' | translate }}</p>
              <h3 class="mt-1.5 text-[0.94rem] font-black text-slate-900">{{ displayStoreName }}</h3>
              <p class="mt-1 text-[0.72rem] font-bold text-slate-500">{{ translatedOption('ONBOARDING.BUSINESS_TYPES', profileForm.value.businessType) }}</p>
            </div>

            <div class="space-y-2.5 px-5 py-4">
              @for (item of sectionNavItems; track item.id) {
                <button
                  type="button"
                  (click)="setActiveTab(item.id)"
                  class="flex w-full items-center justify-between gap-3 rounded-[16px] border px-3.5 py-2.5 text-start transition-all"
                  [ngClass]="activeTab === item.id
                    ? 'border-zadna-primary/15 bg-zadna-primary/[0.06] shadow-sm shadow-zadna-primary/5'
                    : 'border-slate-100 bg-slate-50/80 hover:border-slate-200 hover:bg-white'">
                  <div>
                    <p class="text-[0.72rem] font-black" [ngClass]="activeTab === item.id ? 'text-zadna-primary' : 'text-slate-800'">{{ item.labelKey | translate }}</p>
                    <p class="mt-1 text-[0.68rem] font-bold text-slate-500">{{ completedFields(item) }}/{{ totalFields(item) }}</p>
                  </div>
                  <span class="inline-flex min-w-[60px] items-center justify-center rounded-full px-2.5 py-1 text-[0.66rem] font-black" [ngClass]="sectionPercent(item) === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-600'">
                    {{ sectionPercent(item) }}%
                  </span>
                </button>
              }

              <button
                type="button"
                (click)="saveProfile()"
                [disabled]="profileForm.invalid || isSaving"
                class="inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-slate-950 px-4 py-2.5 text-[0.76rem] font-black text-white shadow-[0_14px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 disabled:opacity-60">
                @if (isSaving) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white"></span>
                }
                {{ 'SETTINGS_PROFILE.SAVE' | translate }}
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  `
})
export class VendorProfileComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  isSaving = false;
  activeTab = 'store-section';
  profileForm: FormGroup;
  private langSub: Subscription;
  private profileSub?: Subscription;
  readonly businessTypes = BUSINESS_TYPES;
  readonly regions = REGIONS;
  readonly cities = CITIES;
  readonly nationalities = NATIONALITIES;
  readonly banks = BANKS;
  readonly paymentCycles = PAYMENT_CYCLES;

  readonly sectionNavItems: ProfileSectionNavItem[] = [
    {
      id: 'store-section',
      labelKey: 'SETTINGS_PROFILE.SECTIONS.STORE',
      fields: ['storeNameAr', 'storeNameEn', 'businessType', 'supportPhone', 'supportEmail', 'companyDomain', 'descriptionAr', 'descriptionEn']
    },
    {
      id: 'owner-section',
      labelKey: 'SETTINGS_PROFILE.SECTIONS.OWNER',
      fields: ['ownerName', 'ownerPhone', 'ownerEmail']
    },
    {
      id: 'contact-section',
      labelKey: 'SETTINGS_PROFILE.SECTIONS.CONTACT',
      fields: ['region', 'city', 'nationalAddress']
    },
    {
      id: 'legal-section',
      labelKey: 'SETTINGS_PROFILE.SECTIONS.LEGAL',
      fields: ['idNumber', 'nationality', 'commercialRegistrationNumber', 'expiryDate', 'taxId', 'licenseNumber', 'hasLogo', 'hasCRDoc']
    },
    {
      id: 'banking-section',
      labelKey: 'SETTINGS_PROFILE.SECTIONS.BANKING',
      fields: ['bankName', 'iban', 'swiftCode', 'payoutCycle']
    },
    {
      id: 'hours-section',
      labelKey: 'SETTINGS_PROFILE.SECTIONS.HOURS',
      kind: 'hours'
    }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly profileService: VendorProfileService,
    private readonly translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => this.currentLang = event.lang);
    this.profileForm = this.buildForm();
  }

  ngOnInit(): void {
    this.profileSub = this.profileService.getProfile().subscribe((profile) => {
      this.patchProfile(profile);
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.profileSub?.unsubscribe();
  }

  get operatingHours(): FormArray {
    return this.profileForm.get('operatingHours') as FormArray;
  }

  get displayStoreName(): string {
    return this.currentLang === 'ar'
      ? (this.profileForm.value.storeNameAr || this.profileForm.value.storeNameEn || '-')
      : (this.profileForm.value.storeNameEn || this.profileForm.value.storeNameAr || '-');
  }

  get initials(): string {
    const name = this.displayStoreName;
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
    }

    return (name || 'VS').substring(0, 2).toUpperCase();
  }

  get openDaysCount(): number {
    return this.operatingHours.controls.filter((control) => control.get('isOpen')?.value).length;
  }

  get profileCompletion(): number {
    const controls = [
      'storeNameAr',
      'storeNameEn',
      'businessType',
      'supportPhone',
      'supportEmail',
      'companyDomain',
      'region',
      'city',
      'nationalAddress',
      'ownerName',
      'ownerEmail',
      'ownerPhone',
      'idNumber',
      'nationality',
      'taxId',
      'commercialRegistrationNumber',
      'expiryDate',
      'licenseNumber',
      'bankName',
      'iban',
      'swiftCode',
      'payoutCycle'
    ];

    const completed = controls.filter((key) => this.isFieldCompleted(key)).length;
    return Math.round((completed / controls.length) * 100);
  }

  get profileCompletionGradient(): string {
    const completionDegrees = Math.max(12, Math.round(this.profileCompletion * 3.6));
    return `conic-gradient(#ffffff 0deg ${completionDegrees}deg, rgba(255,255,255,0.16) ${completionDegrees}deg 360deg)`;
  }

  get profileTabs(): DetailTabNavItem[] {
    const icons: Record<string, string> = {
      'store-section': 'storefront',
      'owner-section': 'person',
      'contact-section': 'location_on',
      'legal-section': 'verified_user',
      'banking-section': 'account_balance_wallet',
      'hours-section': 'schedule'
    };

    return this.sectionNavItems.map((item) => ({
      id: item.id,
      labelKey: this.translate.instant(item.labelKey),
      icon: icons[item.id],
      count: this.sectionPercent(item)
    }));
  }

  get statusBadgeClass(): string {
    return this.profileForm.value.reviewStatus === 'active'
      ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
      : 'border-amber-100 bg-amber-50 text-amber-600';
  }

  get statusDotClass(): string {
    return this.profileForm.value.reviewStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-500';
  }

  get normalizedCompanyDomain(): string {
    return normalizeCompanyDomain(this.profileForm.get('companyDomain')?.value);
  }

  get hasConfiguredCompanyDomain(): boolean {
    return !!this.normalizedCompanyDomain;
  }

  get companyDomainStatusKey(): string {
    return this.hasConfiguredCompanyDomain
      ? 'SETTINGS_PROFILE.DOMAIN.CONNECTED'
      : 'SETTINGS_PROFILE.DOMAIN.NOT_CONFIGURED';
  }

  get companyDomainBadgeClass(): string {
    return this.hasConfiguredCompanyDomain
      ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
      : 'border-amber-100 bg-amber-50 text-amber-600';
  }

  get profileStatusLabelKey(): string {
    return this.profileForm.value.reviewStatus === 'active'
      ? 'SETTINGS_PROFILE.STATUS_ACTIVE'
      : 'SETTINGS_PROFILE.STATUS_PENDING';
  }

  scrollToSection(sectionId: string): void {
    this.activeTab = sectionId;
  }

  setActiveTab(tabId: string): void {
    this.scrollToSection(tabId);
  }

  getSectionItem(sectionId: string): ProfileSectionNavItem {
    return this.sectionNavItems.find((item) => item.id === sectionId) ?? this.sectionNavItems[0];
  }

  completedFields(item: ProfileSectionNavItem): number {
    if (item.kind === 'hours') {
      return this.openDaysCount;
    }

    return (item.fields || []).filter((field) => this.isFieldCompleted(field)).length;
  }

  totalFields(item: ProfileSectionNavItem): number {
    if (item.kind === 'hours') {
      return Math.max(this.operatingHours.length, 1);
    }

    return Math.max(item.fields?.length || 0, 1);
  }

  sectionPercent(item: ProfileSectionNavItem): number {
    return Math.round((this.completedFields(item) / this.totalFields(item)) * 100);
  }

  fieldClass(controlName: string, mode: 'context' | 'ltr' | 'rtl' = 'context'): string {
    const invalid = this.isControlInvalid(controlName);
    const alignment = mode === 'ltr'
      ? 'text-left'
      : mode === 'rtl'
        ? 'text-right'
        : this.currentLang === 'ar'
          ? 'text-right'
          : 'text-left';

    return [
      'h-10 w-full rounded-[12px] border px-3 text-[0.75rem] font-semibold text-slate-900 outline-none transition-all',
      alignment,
      invalid
        ? 'border-rose-200 bg-rose-50/70 focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100'
        : 'border-slate-200/80 bg-slate-50/80 focus:border-zadna-primary/25 focus:bg-white focus:ring-2 focus:ring-zadna-primary/10'
    ].join(' ');
  }

  selectClass(controlName: string, mode: 'context' | 'ltr' | 'rtl' = 'context'): string {
    const alignment = mode === 'ltr'
      ? 'text-left'
      : mode === 'rtl'
        ? 'text-right'
        : this.currentLang === 'ar'
          ? 'text-right'
          : 'text-left';

    return [
      this.fieldClass(controlName, mode),
      'appearance-none cursor-pointer',
      alignment,
      this.currentLang === 'ar' ? 'pl-9 pr-3' : 'pr-9 pl-3'
    ].join(' ');
  }

  textareaClass(controlName: string, mode: 'context' | 'ltr' | 'rtl' = 'context'): string {
    const invalid = this.isControlInvalid(controlName);
    const alignment = mode === 'ltr'
      ? 'text-left'
      : mode === 'rtl'
        ? 'text-right'
        : this.currentLang === 'ar'
          ? 'text-right'
          : 'text-left';

    return [
      'w-full rounded-[12px] border px-3 py-2.5 text-[0.75rem] font-semibold text-slate-900 outline-none transition-all resize-none',
      alignment,
      invalid
        ? 'border-rose-200 bg-rose-50/70 focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100'
        : 'border-slate-200/80 bg-slate-50/80 focus:border-zadna-primary/25 focus:bg-white focus:ring-2 focus:ring-zadna-primary/10'
    ].join(' ');
  }

  timeFieldClass(isOpen: boolean): string {
    return [
      'h-10 rounded-[14px] border px-3 text-[0.74rem] font-bold outline-none transition-all',
      isOpen
        ? 'border-emerald-200 bg-white text-slate-700 focus:border-zadna-primary/30 focus:ring-4 focus:ring-zadna-primary/8'
        : 'border-slate-200 bg-white/90 text-slate-500'
    ].join(' ');
  }

  translatedOption(scope: string, value?: string | null, fallback = '-'): string {
    if (!value) {
      return fallback;
    }

    const translationKey = `${scope}.${value}`;
    const translated = this.translate.instant(translationKey);
    return translated === translationKey ? value : translated;
  }

  optionsWithCurrent(options: SelectOption[], currentValue?: string | null): SelectOption[] {
    if (!currentValue || options.some((option) => option.value === currentValue)) {
      return options;
    }

    return [
      ...options,
      {
        value: currentValue,
        labelKey: ''
      }
    ];
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const value = this.profileForm.getRawValue() as VendorProfile;
    value.companyDomain = normalizeCompanyDomain(value.companyDomain);
    this.profileService.saveProfile(value);
    setTimeout(() => {
      this.isSaving = false;
    }, 400);
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      storeNameAr: ['', Validators.required],
      storeNameEn: ['', Validators.required],
      businessType: ['', Validators.required],
      supportPhone: ['', Validators.required],
      supportEmail: ['', [Validators.required, Validators.email]],
      companyDomain: ['', Validators.required],
      descriptionAr: [''],
      descriptionEn: [''],
      region: ['', Validators.required],
      city: ['', Validators.required],
      nationalAddress: ['', Validators.required],
      ownerName: ['', Validators.required],
      ownerEmail: ['', [Validators.required, Validators.email]],
      ownerPhone: ['', Validators.required],
      idNumber: ['', Validators.required],
      nationality: ['', Validators.required],
      taxId: ['', Validators.required],
      commercialRegistrationNumber: ['', Validators.required],
      expiryDate: ['', Validators.required],
      licenseNumber: [''],
      bankName: ['', Validators.required],
      iban: ['', Validators.required],
      swiftCode: [''],
      payoutCycle: ['', Validators.required],
      hasLogo: [false],
      hasCRDoc: [false],
      reviewStatus: ['active', Validators.required],
      joinedAt: ['', Validators.required],
      operatingHours: this.fb.array([])
    });
  }

  private patchProfile(profile: VendorProfile): void {
    this.profileForm.patchValue({
      ...profile,
      operatingHours: []
    }, { emitEvent: false });

    this.operatingHours.clear();
    profile.operatingHours.forEach((item) => {
      this.operatingHours.push(this.createHourGroup(item));
    });
  }

  private createHourGroup(item: VendorOperatingHour): FormGroup {
    return this.fb.group({
      dayKey: [item.dayKey],
      from: [item.from],
      to: [item.to],
      isOpen: [item.isOpen]
    });
  }

  private isControlInvalid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private isFieldCompleted(controlName: string): boolean {
    const value = this.profileForm.get(controlName)?.value;
    return typeof value === 'boolean' ? value : !!String(value || '').trim();
  }
}
