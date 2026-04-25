import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { AppPageSectionShellComponent } from '../../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';
import { VendorReviewItem } from '../../../models/vendor-profile.models';
import { VendorLegalDocumentType } from '../../../services/vendor-profile.service';

@Component({
  selector: 'app-profile-review-window',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, SearchableSelectComponent, AppPageSectionShellComponent],
  template: `
    <div [formGroup]="form" class="space-y-6">
      <!-- Legal Representative Data -->
      <div id="legal-data-section">
        <app-page-section-shell
          [title]="'SETTINGS_PROFILE.SECTIONS.LEGAL'"
          [subtitle]="'SETTINGS_PROFILE.SECTIONS.LEGAL_HINT'"
          bodyClass="grid gap-6 px-5 py-5">
        <div class="rounded-[12px] border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <span class="text-xs font-bold text-slate-600">{{ 'SETTINGS_PROFILE.UI.REPRESENTATIVE_INFO' | translate }}</span>
          </div>
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.ID_NUMBER' | translate }}</span>
              <input formControlName="idNumber" type="text" dir="ltr" [class]="fieldClass('idNumber', 'ltr')">
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.NATIONALITY' | translate }}</span>
              <app-searchable-select formControlName="nationality" [options]="nationalityOptions" [placeholder]="'SETTINGS_PROFILE.FIELDS.NATIONALITY'"></app-searchable-select>
            </label>
            
            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.COMMERCIAL_REGISTER' | translate }}</span>
              <input formControlName="commercialRegistrationNumber" type="text" dir="ltr" [class]="fieldClass('commercialRegistrationNumber', 'ltr')">
            </label>

            <label class="space-y-2">
              <span class="text-xs font-bold text-slate-700">{{ 'SETTINGS_PROFILE.FIELDS.TAX_ID' | translate }}</span>
              <input formControlName="taxId" type="text" dir="ltr" [class]="fieldClass('taxId', 'ltr')">
            </label>
          </div>
        </div>
        </app-page-section-shell>
      </div>

      <!-- Legal Documents -->
      <div id="documents-section">
        <app-page-section-shell
          [title]="'SETTINGS_PROFILE.SECTIONS.DOCUMENTS'"
          [subtitle]="'SETTINGS_PROFILE.SECTIONS.DOCUMENTS_HINT'"
          bodyClass="px-5 py-5">
        <div class="rounded-[12px] border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 bg-slate-50 px-5 py-3 flex justify-between items-center">
            <span class="text-xs font-bold text-slate-600">{{ 'SETTINGS_PROFILE.UI.REQUIRED_DOCUMENTS' | translate }}</span>
            <span class="text-xs font-bold" [ngClass]="missingDocumentsCount > 0 ? 'text-amber-600' : 'text-emerald-600'">
              {{ missingDocumentsCount }} {{ currentLang === 'ar' ? 'نواقص' : 'Missing' }}
            </span>
          </div>
          
          <div class="grid gap-3 p-5">
            <article
              *ngFor="let document of legalDocumentCards"
              class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[8px] border border-slate-200 bg-white p-4 transition-all hover:shadow-sm">
              <div class="flex items-start gap-4">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-slate-100 text-slate-500">
                  <span class="material-symbols-outlined text-[20px]" [ngClass]="document.uploaded ? 'text-zadna-primary' : 'text-slate-400'">description</span>
                </div>
                <div class="min-w-0 pt-0.5">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-bold text-slate-900">{{ currentLang === 'ar' ? document.titleAr : document.titleEn }}</p>
                    <span class="rounded-[4px] px-2 py-0.5 text-[0.65rem] font-bold tracking-wider" [ngClass]="document.uploaded ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
                      {{ document.uploaded ? (currentLang === 'ar' ? 'مرفوع' : 'Uploaded') : (currentLang === 'ar' ? 'ناقص' : 'Missing') }}
                    </span>
                    <span class="rounded-[4px] px-2 py-0.5 text-[0.65rem] font-bold tracking-wider" [ngClass]="reviewItemStatusBadgeClasses(document.reviewItem)">
                      {{ reviewItemStatusLabel(document.reviewItem?.status || 'PendingVendor') }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">{{ currentLang === 'ar' ? document.hintAr : document.hintEn }}</p>
                  
                  <div *ngIf="document.reviewItem?.decisionNote" class="mt-2 flex items-start gap-2 rounded-[6px] border border-amber-200 bg-amber-50 px-3 py-2">
                    <span class="material-symbols-outlined shrink-0 text-[16px] text-amber-600">info</span>
                    <p class="text-xs font-medium text-amber-800">{{ document.reviewItem?.decisionNote }}</p>
                  </div>
                </div>
              </div>

              <div class="flex shrink-0 gap-2 md:flex-col md:items-end">
                <a
                  *ngIf="document.url"
                  [href]="document.url"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50">
                  <span class="material-symbols-outlined text-[16px]">visibility</span>
                  {{ currentLang === 'ar' ? 'عرض' : 'View' }}
                </a>
                <button
                  type="button"
                  (click)="uploadClick.emit(document.type)"
                  [disabled]="uploadingDocumentType === document.type"
                  class="inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-60">
                  <span *ngIf="uploadingDocumentType === document.type" class="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-white"></span>
                  <span *ngIf="!uploadingDocumentType" class="material-symbols-outlined text-[16px]">{{ document.uploaded ? 'upload_file' : 'add_circle' }}</span>
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
}
