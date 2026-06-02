import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-command-center',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule],
  template: `
    <section class="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-3xl relative overflow-hidden">
      <!-- Decorative BG -->
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-zadna-primary/10 to-teal-400/5 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-zadna-primary/10 to-indigo-400/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <!-- Store Info & Status -->
      <div class="flex items-center gap-4 min-w-0 relative z-10">
        <div class="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-white to-slate-50/50 border border-white shadow-[0_8px_20px_rgb(0,0,0,0.06)] text-slate-500">
          <span class="material-symbols-outlined text-[28px]">storefront</span>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="truncate text-[1.35rem] font-black text-slate-900 tracking-tight">{{ displayStoreName }}</h1>
            <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold shadow-sm" [ngClass]="reviewStateBadgeClasses">
              <span class="h-1.5 w-1.5 rounded-full shadow-sm" [ngClass]="reviewStateDotClass"></span>
              {{ reviewStateLabel }}
            </span>
            <button
              type="button"
              (click)="storeAvailabilityToggle.emit()"
              [disabled]="isStoreAvailabilitySaving"
              class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-bold transition-all shadow-sm disabled:opacity-50 hover:shadow-md"
              [ngClass]="isStoreOffline ? 'border-rose-200/60 bg-gradient-to-r from-rose-50 to-white text-rose-700' : 'border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-white text-emerald-700'">
              <span *ngIf="isStoreAvailabilitySaving" class="h-3 w-3 animate-spin rounded-full border-2 border-current/25 border-t-current"></span>
              <span *ngIf="!isStoreAvailabilitySaving" class="h-1.5 w-1.5 rounded-full" [ngClass]="isStoreOffline ? 'bg-rose-500' : 'bg-emerald-500'"></span>
              {{ isStoreOffline
                ? (currentLang === 'ar' ? 'المتجر أوفلاين' : 'Store offline')
                : (currentLang === 'ar' ? 'المتجر أونلاين' : 'Store online') }}
            </button>
          </div>
          <p class="mt-1 truncate text-xs font-semibold text-slate-500">
            {{ 'SETTINGS_PROFILE.COMMAND_CENTER.ACCOUNT_STATUS' | translate }} <span class="font-bold text-slate-700">{{ accountWorkspaceLabel }}</span>
            <span class="mx-1.5 text-slate-200">|</span>
            {{ 'SETTINGS_PROFILE.COMMAND_CENTER.LAST_DECISION' | translate }} <span class="font-bold text-slate-700">{{ lastDecisionText }}</span>
          </p>
        </div>
      </div>

      <!-- Review Readiness Compact -->
      <div class="flex-1 lg:max-w-md xl:max-w-lg lg:mx-6 rounded-[1.25rem] bg-white/60 backdrop-blur-xl border border-white shadow-sm p-3.5 relative z-10">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px] text-zadna-primary">task_alt</span>
            <span class="text-[0.7rem] font-bold text-slate-700">{{ 'SETTINGS_PROFILE.COMMAND_CENTER.READINESS' | translate }}</span>
          </div>
          <div class="flex items-center gap-2.5 text-[0.65rem] font-bold">
            <span [ngClass]="missingDocumentsCount > 0 ? 'text-rose-600' : 'text-slate-400'">{{ missingDocumentsCount }} {{ 'SETTINGS_PROFILE.COMMAND_CENTER.MISSING' | translate }}</span>
            <span class="text-sky-600">{{ submittedItems }} {{ 'SETTINGS_PROFILE.COMMAND_CENTER.IN_REVIEW' | translate }}</span>
            <span class="text-emerald-600">{{ approvedItems }} {{ 'SETTINGS_PROFILE.COMMAND_CENTER.APPROVED' | translate }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 shadow-inner">
            <div class="h-full rounded-full bg-gradient-to-r from-zadna-primary to-teal-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(20,184,166,0.4)]" [style.width.%]="reviewProgressPercent"></div>
          </div>
          <span class="text-[0.8rem] font-black text-slate-900 w-8 text-right" [dir]="'ltr'">{{ reviewProgressPercent }}%</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 shrink-0 relative z-10">
        <button
          type="button"
          (click)="save.emit()"
          [disabled]="saveDisabled"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-white bg-white/80 backdrop-blur-md px-5 text-[0.8rem] font-bold text-slate-700 shadow-sm transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50">
          <span *ngIf="isSaving" class="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-slate-700"></span>
          <span *ngIf="!isSaving" class="material-symbols-outlined text-[18px]">save</span>
          <span class="hidden sm:inline">{{ 'SETTINGS_PROFILE.COMMAND_CENTER.SAVE' | translate }}</span>
        </button>
        
        <button
          type="button"
          (click)="submit.emit()"
          [disabled]="submitDisabled"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-slate-900 to-slate-800 px-6 text-[0.8rem] font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:from-slate-800 hover:to-slate-700 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
          <span *ngIf="isSubmittingReview" class="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white"></span>
          <span *ngIf="!isSubmittingReview" class="material-symbols-outlined text-[18px]">send</span>
          {{ submitReviewLabel }}
        </button>
      </div>
    </section>
  `
})
export class ProfileCommandCenterComponent {
  @Input() currentLang: 'ar' | 'en' | string = 'ar';
  @Input({ required: true }) displayStoreName!: string;
  @Input({ required: true }) heroMessage!: string;
  @Input({ required: true }) reviewStateLabel!: string;
  @Input({ required: true }) reviewStateBadgeClasses!: string;
  @Input({ required: true }) reviewStateDotClass!: string;
  @Input({ required: true }) reviewProgressPercent!: number;
  @Input({ required: true }) missingDocumentsCount!: number;
  @Input({ required: true }) approvedItems!: number;
  @Input({ required: true }) submittedItems!: number;
  @Input({ required: true }) accountWorkspaceLabel!: string;
  @Input({ required: true }) lastDecisionText!: string;
  @Input({ required: true }) saveDisabled!: boolean;
  @Input({ required: true }) submitDisabled!: boolean;
  @Input({ required: true }) submitReviewLabel!: string;
  @Input({ required: true }) isSaving = false;
  @Input({ required: true }) isSubmittingReview = false;
  @Input() isStoreOffline = false;
  @Input() isStoreAvailabilitySaving = false;

  @Output() save = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();
  @Output() storeAvailabilityToggle = new EventEmitter<void>();
}
