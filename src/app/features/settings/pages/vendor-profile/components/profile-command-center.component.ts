import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-command-center',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule],
  template: `
    <section class="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white">
      <!-- Store Info & Status -->
      <div class="flex items-center gap-3 min-w-0">
        <div class="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500">
          <span class="material-symbols-outlined text-[24px]">storefront</span>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="truncate text-lg font-black text-slate-900">{{ displayStoreName }}</h1>
            <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold" [ngClass]="reviewStateBadgeClasses">
              <span class="h-1.5 w-1.5 rounded-full" [ngClass]="reviewStateDotClass"></span>
              {{ reviewStateLabel }}
            </span>
          </div>
          <p class="mt-1 truncate text-xs font-semibold text-slate-500">
            {{ 'SETTINGS_PROFILE.COMMAND_CENTER.ACCOUNT_STATUS' | translate }} <span class="font-bold text-slate-700">{{ accountWorkspaceLabel }}</span>
            <span class="mx-1.5 text-slate-200">|</span>
            {{ 'SETTINGS_PROFILE.COMMAND_CENTER.LAST_DECISION' | translate }} <span class="font-bold text-slate-700">{{ lastDecisionText }}</span>
          </p>
        </div>
      </div>

      <!-- Review Readiness Compact -->
      <div class="flex-1 lg:max-w-md xl:max-w-lg lg:mx-6 rounded-[10px] bg-slate-50/50 border border-slate-100 p-2.5">
        <div class="flex items-center justify-between mb-2">
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
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80">
            <div class="h-full rounded-full bg-zadna-primary transition-all duration-1000 ease-out" [style.width.%]="reviewProgressPercent"></div>
          </div>
          <span class="text-xs font-black text-slate-900 w-8 text-right" [dir]="'ltr'">{{ reviewProgressPercent }}%</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          (click)="save.emit()"
          [disabled]="saveDisabled"
          class="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-4 text-[0.75rem] font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50">
          <span *ngIf="isSaving" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-slate-700"></span>
          <span *ngIf="!isSaving" class="material-symbols-outlined text-[16px]">save</span>
          <span class="hidden sm:inline">{{ 'SETTINGS_PROFILE.COMMAND_CENTER.SAVE' | translate }}</span>
        </button>
        
        <button
          type="button"
          (click)="submit.emit()"
          [disabled]="submitDisabled"
          class="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-slate-900 px-5 text-[0.75rem] font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50">
          <span *ngIf="isSubmittingReview" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white"></span>
          <span *ngIf="!isSubmittingReview" class="material-symbols-outlined text-[16px]">send</span>
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

  @Output() save = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();
}
