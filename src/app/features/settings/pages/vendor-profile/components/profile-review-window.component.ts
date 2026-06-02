import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { AppPageSectionShellComponent } from '../../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';
import { VendorReviewItem } from '../../../models/vendor-profile.models';
import { VendorLegalDocumentType } from '../../../services/vendor-profile.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-review-window',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, SearchableSelectComponent, AppPageSectionShellComponent],
  template: `
    <div [formGroup]="form" class="space-y-6">
      <div id="legal-data-section">
        <app-page-section-shell
          [title]="'SETTINGS_PROFILE.SECTIONS.LEGAL'"
          [subtitle]="'SETTINGS_PROFILE.SECTIONS.LEGAL_HINT'"
          bodyClass="grid gap-6 px-5 py-5">
        <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md">
          <div class="border-b border-white/40 bg-white/50 px-6 py-4 rounded-t-[1.5rem]">
            <span class="text-[0.75rem] font-black uppercase tracking-wider text-slate-700">{{ 'SETTINGS_PROFILE.UI.REPRESENTATIVE_INFO' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {{ 'SETTINGS_PROFILE.FIELDS.ID_NUMBER' | translate }} <span class="text-rose-500 font-extrabold">*</span>
              </span>
              <input formControlName="idNumber" type="text" dir="ltr" [class]="fieldClass('idNumber', 'ltr')">
              <p *ngIf="form.get('idNumber')?.invalid && (form.get('idNumber')?.touched || form.get('idNumber')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
            </label>

            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {{ 'SETTINGS_PROFILE.FIELDS.NATIONALITY' | translate }} <span class="text-rose-500 font-extrabold">*</span>
              </span>
              <app-searchable-select 
                formControlName="nationality" 
                [options]="nationalityOptions" 
                [placeholder]="'SETTINGS_PROFILE.FIELDS.NATIONALITY'"
                [error]="form.get('nationality')?.invalid && (form.get('nationality')?.touched || form.get('nationality')?.dirty) ? 'REGISTER.ERR_GENERAL' : ''"
                [isTouched]="form.get('nationality')?.touched || form.get('nationality')?.dirty || false"
                [isRequired]="true"
              ></app-searchable-select>
            </label>

            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {{ 'SETTINGS_PROFILE.FIELDS.COMMERCIAL_REGISTRATION' | translate }} <span class="text-rose-500 font-extrabold">*</span>
              </span>
              <input formControlName="commercialRegistrationNumber" type="text" dir="ltr" [class]="fieldClass('commercialRegistrationNumber', 'ltr')">
              <p *ngIf="form.get('commercialRegistrationNumber')?.invalid && (form.get('commercialRegistrationNumber')?.touched || form.get('commercialRegistrationNumber')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
            </label>

            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {{ 'SETTINGS_PROFILE.FIELDS.TAX_ID' | translate }} <span class="text-rose-500 font-extrabold">*</span>
              </span>
              <input formControlName="taxId" type="text" dir="ltr" [class]="fieldClass('taxId', 'ltr')">
              <p *ngIf="form.get('taxId')?.invalid && (form.get('taxId')?.touched || form.get('taxId')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
            </label>

            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {{ 'SETTINGS_PROFILE.FIELDS.EXPIRY_DATE' | translate }} <span class="text-rose-500 font-extrabold">*</span>
              </span>
              <input formControlName="expiryDate" type="date" dir="ltr" [class]="fieldClass('expiryDate', 'ltr')">
              <p *ngIf="form.get('expiryDate')?.invalid && (form.get('expiryDate')?.touched || form.get('expiryDate')?.dirty)" 
                class="text-[11px] font-semibold text-rose-500 mt-1.5 block px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {{ 'REGISTER.ERR_GENERAL' | translate }}
              </p>
            </label>

            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {{ 'SETTINGS_PROFILE.FIELDS.LICENSE_NUMBER' | translate }}
              </span>
              <input formControlName="licenseNumber" type="text" dir="ltr" [class]="fieldClass('licenseNumber', 'ltr')">
            </label>
          </div>
        </div>
        </app-page-section-shell>
      </div>

      <div id="documents-section">
        <app-page-section-shell
          [title]="'SETTINGS_PROFILE.SECTIONS.DOCUMENTS'"
          [subtitle]="'SETTINGS_PROFILE.SECTIONS.DOCUMENTS_HINT'"
          bodyClass="px-5 py-5">
        <div class="rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md">
          <div class="border-b border-white/40 bg-white/50 px-6 py-4 rounded-t-[1.5rem] flex justify-between items-center">
            <span class="text-[0.75rem] font-black uppercase tracking-wider text-slate-700">{{ 'SETTINGS_PROFILE.UI.REQUIRED_DOCUMENTS' | translate }}</span>
            <span class="text-[0.75rem] font-black px-3 py-1 rounded-full shadow-sm" [ngClass]="missingDocumentsCount > 0 ? 'bg-amber-100/80 text-amber-800' : 'bg-emerald-100/80 text-emerald-800'">
              {{ missingDocumentsCount }} {{ 'SETTINGS_PROFILE.REVIEW_PANEL.MISSING_ITEMS' | translate }}
            </span>
          </div>

          <div class="grid gap-4 p-6">
            <article
              *ngFor="let document of legalDocumentCards"
              class="flex flex-col gap-4 rounded-[1.25rem] border border-white/80 bg-white/60 p-5 shadow-sm transition-all hover:shadow-md hover:bg-white hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between group">
              <div class="flex items-start gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-500 transition-colors group-hover:border-zadna-primary/20">
                  <span class="material-symbols-outlined text-[24px]" [ngClass]="document.uploaded ? 'text-zadna-primary' : 'text-slate-400'">description</span>
                </div>
                <div class="min-w-0 pt-0.5">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-bold text-slate-900">{{ currentLang === 'ar' ? normalizeArabic(document.titleAr) : document.titleEn }}</p>
                    <span class="rounded-[4px] border px-2 py-0.5 text-[0.65rem] font-bold tracking-wider" [ngClass]="document.uploaded ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'">
                      {{ document.uploaded ? ('SETTINGS_PROFILE.REVIEW_PANEL.UPLOADED' | translate) : ('SETTINGS_PROFILE.REVIEW_PANEL.MISSING' | translate) }}
                    </span>
                    <span class="rounded-[4px] px-2 py-0.5 text-[0.65rem] font-bold tracking-wider" [ngClass]="reviewItemStatusBadgeClasses(document.reviewItem)">
                      {{ reviewItemStatusLabel(document.reviewItem?.status || 'PendingVendor') }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">{{ currentLang === 'ar' ? normalizeArabic(document.hintAr) : document.hintEn }}</p>

                  <div *ngIf="document.reviewItem?.decisionNote" class="mt-2 flex items-start gap-2 rounded-[6px] border border-amber-200 bg-amber-50 px-3 py-2">
                    <span class="material-symbols-outlined shrink-0 text-[16px] text-amber-600">info</span>
                    <p class="text-xs font-medium text-amber-800">{{ document.reviewItem?.decisionNote }}</p>
                  </div>
                </div>
              </div>

              <div class="flex shrink-0 gap-3 md:flex-col md:items-end">
                <a
                  *ngIf="document.url"
                  [href]="document.url"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center justify-center gap-1.5 rounded-[12px] border border-white bg-white/80 px-4 py-2 text-[0.8rem] font-bold text-slate-700 shadow-sm transition-all hover:bg-white hover:shadow-md">
                  <span class="material-symbols-outlined text-[18px]">visibility</span>
                  {{ 'SETTINGS_PROFILE.REVIEW_PANEL.VIEW_FILE' | translate }}
                </a>
                <button
                  type="button"
                  (click)="uploadClick.emit(document.type)"
                  [disabled]="uploadingDocumentType === document.type"
                  class="inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-slate-900 px-4 py-2 text-[0.8rem] font-bold text-white shadow-md transition-all hover:bg-slate-800 disabled:opacity-60">
                  <span *ngIf="uploadingDocumentType === document.type" class="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-white"></span>
                  <span *ngIf="!uploadingDocumentType" class="material-symbols-outlined text-[18px]">{{ document.uploaded ? 'upload_file' : 'add_circle' }}</span>
                  {{ documentActionLabel(document) }}
                </button>
              </div>
            </article>
          </div>
        </div>
        </app-page-section-shell>
      </div>
    </div>
  `
})
export class ProfileReviewWindowComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() currentLang: 'ar' | 'en' | string = 'ar';
  @Input() currentProfileRequiredActionsCount = 0;
  @Input() accountWorkspaceLabel = '';
  @Input() lastDecisionText = '';
  @Input() reviewProgressPercent = 0;
  @Input() missingDocumentsCount = 0;
  @Input() nationalityOptions: SearchableSelectOption[] = [];
  @Input() legalDocumentCards: any[] = [];
  @Input() uploadingDocumentType: VendorLegalDocumentType | null = null;
  @Input() fieldClass!: (controlName: string, mode?: 'context' | 'ltr' | 'rtl') => string;
  @Input() documentActionLabel!: (document: any) => string;
  @Input() documentCardClasses!: (document: any) => string;
  @Input() reviewItemStatusLabel!: (status: string) => string;
  @Input() reviewItemStatusBadgeClasses!: (item?: VendorReviewItem) => string;

  @Output() uploadClick = new EventEmitter<VendorLegalDocumentType>();
  @Output() documentSelected = new EventEmitter<{ event: Event; type: VendorLegalDocumentType }>();

  normalizeArabic(value?: string | null): string {
    if (!value) {
      return '';
    }

    if (!/[ØÙÃ]/.test(value)) {
      return value;
    }

    try {
      return decodeURIComponent(escape(value));
    } catch {
      return value;
    }
  }
}
