import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProfileSectionNavItem, ProfileWorkspaceWindow } from '../vendor-profile.view-models';
import { VendorReviewAuditEntry, VendorReviewItem } from '../../../models/vendor-profile.models';

@Component({
  selector: 'app-profile-side-rail',
  standalone: true,
  imports: [CommonModule, NgClass],
  template: `
    <aside class="rounded-[12px] border border-slate-200 bg-white shadow-sm overflow-hidden">
      <!-- Header -->
      <div class="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-zadna-primary/10 text-zadna-primary">
            <span class="material-symbols-outlined text-[20px]">{{ activeWindow.icon }}</span>
          </div>
          <div class="min-w-0">
            <h3 class="truncate text-base font-black text-slate-900">{{ currentLang === 'ar' ? activeWindow.labelAr : activeWindow.labelEn }}</h3>
            <p class="truncate text-xs font-bold text-slate-500">{{ currentLang === 'ar' ? 'نافذة التشغيل الحالية' : 'Current workspace' }}</p>
          </div>
        </div>
      </div>

      <div class="p-4 space-y-4">
        <!-- Required actions alert -->
        <div *ngIf="showRequiredActions && requiredActions.length > 0" class="rounded-[8px] border border-amber-200 bg-amber-50 p-4">
          <div class="flex items-center justify-between gap-3 mb-2">
            <p class="text-xs font-bold uppercase tracking-wider text-amber-800">{{ currentLang === 'ar' ? 'المطلوب قبل المراجعة' : 'Required before review' }}</p>
            <span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-black text-amber-900">{{ requiredActions.length }}</span>
          </div>
          <ul class="space-y-2">
            <li *ngFor="let action of requiredActions" class="text-xs font-medium text-amber-900 flex items-start gap-1.5">
              <span class="material-symbols-outlined text-[14px] text-amber-600 shrink-0">error</span>
              <span>{{ action.message }}</span>
            </li>
          </ul>
        </div>

        <!-- Section Navigation Tabs -->
        <nav *ngIf="sections.length > 0" class="flex flex-col gap-1">
          <button
            *ngFor="let section of sections"
            type="button"
            (click)="sectionSelect.emit(section.id)"
            class="group flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2.5 text-start transition-colors"
            [ngClass]="activeTab === section.id ? 'bg-slate-100' : 'hover:bg-slate-50'">
            
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold" [ngClass]="activeTab === section.id ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'">
                {{ sectionLabels[section.id] }}
              </p>
              <p class="mt-0.5 text-[0.65rem] font-bold" [ngClass]="activeTab === section.id ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-500'">
                {{ completedFields(section) }}/{{ totalFields(section) }} {{ currentLang === 'ar' ? 'مكتمل' : 'completed' }}
              </p>
            </div>
            
            <span class="shrink-0 rounded-[4px] px-2 py-0.5 text-[10px] font-black"
              [ngClass]="sectionPercent(section) === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'">
              {{ sectionPercent(section) }}%
            </span>
          </button>
        </nav>

        <!-- Buttons -->
        <div class="flex flex-col gap-2 pt-2 border-t border-slate-100">
          <button
            *ngIf="showSave"
            type="button"
            (click)="save.emit()"
            [disabled]="saveDisabled"
            class="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50">
            <span *ngIf="isSaving" class="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-slate-700"></span>
            <span *ngIf="!isSaving" class="material-symbols-outlined text-[16px]">save</span>
            {{ currentLang === 'ar' ? 'حفظ التعديلات' : 'Save Changes' }}
          </button>

          <button
            *ngIf="showSubmit"
            type="button"
            (click)="submit.emit()"
            [disabled]="submitDisabled"
            class="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50">
            <span *ngIf="isSubmittingReview" class="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white"></span>
            <span *ngIf="!isSubmittingReview" class="material-symbols-outlined text-[16px]">send</span>
            {{ submitReviewLabel }}
          </button>
        </div>

        <!-- Progress Widget -->
        <div class="rounded-[8px] border border-slate-100 bg-slate-50 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                {{ currentLang === 'ar' ? 'حالة الاعتماد' : 'Review progress' }}
              </p>
              <h4 class="text-sm font-black text-slate-900">{{ reviewStateLabel }}</h4>
            </div>
            <span class="text-base font-black text-slate-900">{{ reviewProgressPercent }}%</span>
          </div>
          <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div class="h-full rounded-full bg-zadna-primary transition-all duration-500 ease-out" [style.width.%]="reviewProgressPercent"></div>
          </div>
          
          <div class="mt-3 max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <div *ngFor="let item of reviewItems" class="rounded-[6px] border border-slate-200 bg-white p-2.5 transition-colors hover:bg-slate-50" [ngClass]="reviewItemCardClasses(item)">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-xs font-bold text-slate-900">{{ reviewItemLabel(item.code) }}</p>
                </div>
                <span class="shrink-0 rounded-[4px] border px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider" [ngClass]="reviewItemStatusBadgeClasses(item)">
                  {{ reviewItemStatusLabel(item.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Timeline -->
        <div *ngIf="showTimelinePreview" class="rounded-[8px] border border-slate-100 bg-slate-50 p-4">
          <p class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 mb-3">
            {{ currentLang === 'ar' ? 'آخر السجل' : 'Recent timeline' }}
          </p>
          <div class="relative max-h-48 space-y-3 overflow-y-auto pr-1 custom-scrollbar before:absolute before:-left-[7px] before:bottom-0 before:top-1 before:w-0.5 before:bg-slate-200" [dir]="'ltr'">
            <article *ngFor="let entry of timelineEntries" class="relative ms-3">
              <div class="absolute -left-[17px] top-1 h-2.5 w-2.5 rounded-full border-2 border-slate-50" [ngClass]="timelineToneDotClasses(entry).replace('bg-', '!bg-')"></div>
              <div class="rounded-[6px] border border-slate-200 bg-white p-2.5 shadow-sm">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <span class="text-xs font-bold text-slate-900">{{ entry.authorName }}</span>
                  <span class="text-[0.6rem] font-bold text-slate-400 ms-auto">{{ formatReviewDate(entry.createdAtUtc) }}</span>
                </div>
                <p class="text-xs text-slate-600">{{ entry.message }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class ProfileSideRailComponent {
  @Input() currentLang: 'ar' | 'en' | string = 'ar';
  @Input({ required: true }) activeWindow!: ProfileWorkspaceWindow;
  @Input() activeTab = '';
  @Input() sectionLabels: Record<string, string> = {};
  @Input() sections: ProfileSectionNavItem[] = [];
  @Input() requiredActions: Array<{ code: string; message: string }> = [];
  @Input() showRequiredActions = false;
  @Input() showSave = true;
  @Input() showSubmit = false;
  @Input() showTimelinePreview = true;
  @Input() saveDisabled = false;
  @Input() submitDisabled = false;
  @Input() isSaving = false;
  @Input() isSubmittingReview = false;
  @Input() submitReviewLabel = '';
  @Input() reviewStateLabel = '';
  @Input() reviewProgressPercent = 0;
  @Input() reviewItems: VendorReviewItem[] = [];
  @Input() timelineEntries: VendorReviewAuditEntry[] = [];
  @Input() completedFields!: (item: ProfileSectionNavItem) => number;
  @Input() totalFields!: (item: ProfileSectionNavItem) => number;
  @Input() sectionPercent!: (item: ProfileSectionNavItem) => number;
  @Input() reviewItemLabel!: (code: string) => string;
  @Input() reviewItemStatusLabel!: (status: string) => string;
  @Input() reviewItemCardClasses!: (item: VendorReviewItem) => string;
  @Input() reviewItemStatusBadgeClasses!: (item: VendorReviewItem) => string;
  @Input() timelineToneDotClasses!: (entry: VendorReviewAuditEntry) => string;
  @Input() formatReviewDate!: (value?: string | null) => string;

  @Output() sectionSelect = new EventEmitter<string>();
  @Output() save = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();
}
