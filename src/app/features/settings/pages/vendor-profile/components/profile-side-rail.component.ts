import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { ProfileSectionNavItem, ProfileWorkspaceWindow } from '../vendor-profile.view-models';
import { VendorReviewAuditEntry, VendorReviewItem } from '../../../models/vendor-profile.models';
import { resolveLocalizedMessage } from '../../../../../shared/utils/text-normalization.util';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-side-rail',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule],
  template: `
    <aside class="rounded-[2rem] border border-white/60 bg-white/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      <!-- Header -->
      <div class="border-b border-white/40 bg-gradient-to-br from-white/80 to-transparent px-6 py-5 relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-zadna-primary/5 to-teal-400/5 rounded-full blur-2xl pointer-events-none"></div>
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

      <div class="p-5 space-y-5">
        <!-- Required actions alert -->
        <div *ngIf="showRequiredActions && requiredActions.length > 0" class="rounded-[8px] border border-amber-200 bg-amber-50 p-4">
          <div class="flex items-center justify-between gap-3 mb-2">
            <p class="text-xs font-bold uppercase tracking-wider text-amber-800">{{ currentLang === 'ar' ? 'المطلوب قبل المراجعة' : 'Required before review' }}</p>
            <span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-black text-amber-900">{{ requiredActions.length }}</span>
          </div>
          <ul class="space-y-2">
            <li *ngFor="let action of requiredActions" class="text-xs font-medium text-amber-900 flex items-start gap-1.5">
              <span class="material-symbols-outlined text-[14px] text-amber-600 shrink-0">error</span>
              <span>{{ localizeMessage(action.message) }}</span>
            </li>
          </ul>
        </div>

        <!-- Section Navigation Tabs -->
        <nav *ngIf="sections.length > 0" class="flex flex-col gap-1">
          <button
            *ngFor="let section of sections"
            type="button"
            (click)="sectionSelect.emit(section.id)"
            class="group flex w-full items-center justify-between gap-3 rounded-[1.25rem] px-4 py-3 text-start transition-all duration-300"
            [ngClass]="activeTab === section.id ? 'bg-white shadow-sm border border-white/60' : 'hover:bg-white/60 border border-transparent'">
            
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold" [ngClass]="activeTab === section.id ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'">
                {{ sectionLabels[section.id] }}
              </p>
              <p class="mt-0.5 text-[0.65rem] font-bold" [ngClass]="activeTab === section.id ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-500'">
                {{ completedFields(section) }}/{{ totalFields(section) }} {{ currentLang === 'ar' ? 'مكتمل' : 'completed' }}
              </p>
            </div>
            
            
            <span class="shrink-0 rounded-[8px] px-2.5 py-1 text-[0.65rem] font-black shadow-sm"
              [ngClass]="sectionPercent(section) === 100 ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700' : 'bg-slate-100/80 text-slate-600'">
              {{ sectionPercent(section) }}%
            </span>
          </button>
        </nav>

        <!-- Buttons -->
        <div class="flex flex-col gap-3 pt-3 border-t border-white/40">
          <button
            *ngIf="showSave"
            type="button"
            (click)="save.emit()"
            [disabled]="saveDisabled"
            class="inline-flex w-full items-center justify-center gap-2 rounded-[1rem] border border-white bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50">
            <span *ngIf="isSaving" class="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-slate-700"></span>
            <span *ngIf="!isSaving" class="material-symbols-outlined text-[18px]">save</span>
            {{ currentLang === 'ar' ? 'حفظ التعديلات' : 'Save Changes' }}
          </button>

          <button
            *ngIf="showSubmit"
            type="button"
            (click)="submit.emit()"
            [disabled]="submitDisabled"
            class="inline-flex w-full items-center justify-center gap-2 rounded-[1rem] bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:from-slate-800 hover:to-slate-700 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50">
            <span *ngIf="isSubmittingReview" class="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white"></span>
            <span *ngIf="!isSubmittingReview" class="material-symbols-outlined text-[18px]">send</span>
            {{ submitReviewLabel }}
          </button>
        </div>

        <!-- Progress Widget -->
        <div class="rounded-[1.25rem] border border-white bg-white/60 p-5 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-zadna-primary/10 to-transparent blur-xl pointer-events-none"></div>
          <div class="flex items-center justify-between gap-3 relative z-10">
            <div>
              <p class="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                {{ 'SETTINGS_PROFILE.SIDE_RAIL.REVIEW_PROGRESS' | translate }}
              </p>
              <h4 class="text-sm font-black text-slate-900">{{ reviewStateLabel }}</h4>
            </div>
            <span class="text-[1.1rem] font-black text-slate-900">{{ reviewProgressPercent }}%</span>
          </div>
          <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 shadow-inner relative z-10">
            <div class="h-full rounded-full bg-gradient-to-r from-zadna-primary to-teal-400 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(20,184,166,0.5)]" [style.width.%]="reviewProgressPercent"></div>
          </div>
          
          <div class="mt-4 max-h-48 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar relative z-10">
            <div *ngFor="let item of reviewItems" class="rounded-[12px] border border-white/60 bg-white/50 p-3 transition-colors hover:bg-white shadow-sm" [ngClass]="reviewItemCardClasses(item)">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-[0.8rem] font-bold text-slate-900">{{ reviewItemLabel(item.code) }}</p>
                </div>
                <span class="shrink-0 rounded-[6px] border px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wider shadow-sm" [ngClass]="reviewItemStatusBadgeClasses(item)">
                  {{ reviewItemStatusLabel(item.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Timeline -->
        <div *ngIf="showTimelinePreview" class="rounded-[1.25rem] border border-white bg-white/60 p-5 shadow-sm">
          <p class="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500 mb-4">
            {{ currentLang === 'ar' ? 'آخر السجل' : 'Recent timeline' }}
          </p>
          <div class="relative max-h-48 space-y-4 overflow-y-auto pr-1 custom-scrollbar before:absolute before:-left-[9px] before:bottom-0 before:top-1 before:w-[2px] before:bg-slate-200/60" [dir]="'ltr'">
            <article *ngFor="let entry of timelineEntries" class="relative ms-3">
              <div class="absolute -left-[20px] top-1.5 h-3 w-3 rounded-full border-[2.5px] border-white shadow-sm" [ngClass]="timelineToneDotClasses(entry).replace('bg-', '!bg-')"></div>
              <div class="rounded-xl border border-white/80 bg-white/70 p-3 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex flex-wrap items-center gap-2 mb-1.5">
                  <span class="text-[0.8rem] font-bold text-slate-900">{{ entry.authorName }}</span>
                  <span class="text-[0.65rem] font-bold text-slate-400 ms-auto bg-slate-100 px-1.5 py-0.5 rounded-md">{{ formatReviewDate(entry.createdAtUtc) }}</span>
                </div>
                <p class="text-[0.75rem] font-medium leading-relaxed text-slate-600">{{ localizeMessage(entry.message) }}</p>
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

  private readonly enToAr: Record<string, string> = {
    'Vendor review started.': 'بدأت مراجعة التاجر.',
    'Vendor account reactivated and returned to active status.': 'تم إعادة تفعيل حساب التاجر وإرجاعه للحالة النشطة.',
    'Vendor login was unlocked and account access was restored.': 'تم فتح دخول التاجر واستعادة الوصول للحساب.',
    'Vendor password was reset by an administrator and all active sessions were revoked.': 'تمت إعادة تعيين كلمة مرور التاجر بواسطة المسؤول وتم إلغاء جميع الجلسات النشطة.',
    'Please re-upload the required legal documents and confirm the latest vendor information.': 'يرجى إعادة رفع المستندات القانونية المطلوبة وتأكيد أحدث بيانات التاجر.',
    'Vendor updated banking and payout setup from Vendor Portal.': 'قام التاجر بتحديث بيانات الحساب البنكي والتسويات من بوابة التاجر.',
    'Vendor updated store profile details from Vendor Portal.': 'قام التاجر بتحديث بيانات المتجر من بوابة التاجر.',
    'Vendor updated address and contact location details from Vendor Portal.': 'قام التاجر بتحديث بيانات العنوان والموقع من بوابة التاجر.',
    'Vendor updated operating hours from Vendor Portal.': 'قام التاجر بتحديث ساعات العمل من بوابة التاجر.',
    'Vendor updated owner information from Vendor Portal.': 'قام التاجر بتحديث بيانات المالك من بوابة التاجر.',
    'Vendor updated notification preferences from Vendor Portal.': 'قام التاجر بتحديث تفضيلات الإشعارات من بوابة التاجر.',
    'Vendor updated operational settings from Vendor Portal.': 'قام التاجر بتحديث إعدادات التشغيل من بوابة التاجر.',
    'Vendor updated legal and compliance information from Vendor Portal.': 'قام التاجر بتحديث البيانات القانونية والامتثال من بوابة التاجر.',
    'Vendor submitted the profile and required documents for compliance review.': 'قام التاجر بإرسال الملف الشخصي والمستندات المطلوبة لمراجعة الامتثال.',
    'No review activity yet.': 'لا يوجد نشاط مراجعة بعد.'
  };

  private readonly arToEn: Record<string, string> = {
    'بدأت مراجعة التاجر.': 'Vendor review started.',
    'تم إعادة تفعيل حساب التاجر وإرجاعه للحالة النشطة.': 'Vendor account reactivated and returned to active status.',
    'تم فتح دخول التاجر واستعادة الوصول للحساب.': 'Vendor login was unlocked and account access was restored.',
    'تمت إعادة تعيين كلمة مرور التاجر بواسطة المسؤول وتم إلغاء جميع الجلسات النشطة.': 'Vendor password was reset by an administrator and all active sessions were revoked.',
    'يرجى إعادة رفع المستندات القانونية المطلوبة وتأكيد أحدث بيانات التاجر.': 'Please re-upload the required legal documents and confirm the latest vendor information.',
    'قام التاجر بتحديث بيانات الحساب البنكي والتسويات من بوابة التاجر.': 'Vendor updated banking and payout setup from Vendor Portal.',
    'قام التاجر بتحديث بيانات المتجر من بوابة التاجر.': 'Vendor updated store profile details from Vendor Portal.',
    'قام التاجر بتحديث بيانات العنوان والموقع من بوابة التاجر.': 'Vendor updated address and contact location details from Vendor Portal.',
    'قام التاجر بتحديث ساعات العمل من بوابة التاجر.': 'Vendor updated operating hours from Vendor Portal.',
    'قام التاجر بتحديث بيانات المالك من بوابة التاجر.': 'Vendor updated owner information from Vendor Portal.',
    'قام التاجر بتحديث تفضيلات الإشعارات من بوابة التاجر.': 'Vendor updated notification preferences from Vendor Portal.',
    'قام التاجر بتحديث إعدادات التشغيل من بوابة التاجر.': 'Vendor updated operational settings from Vendor Portal.',
    'قام التاجر بتحديث البيانات القانونية والامتثال من بوابة التاجر.': 'Vendor updated legal and compliance information from Vendor Portal.',
    'قام التاجر بإرسال الملف الشخصي والمستندات المطلوبة لمراجعة الامتثال.': 'Vendor submitted the profile and required documents for compliance review.',
    'لا يوجد نشاط مراجعة بعد.': 'No review activity yet.'
  };

  localizeMessage(message: string): string {
    const rawMessage = resolveLocalizedMessage(message, this.currentLang);

    if (this.currentLang === 'ar') {
      if (this.enToAr[rawMessage]) {
        return this.enToAr[rawMessage];
      }

      // Pattern-based translations for dynamic messages (English to Arabic)
      const patterns = [
        {
          regex: /^Vendor approved with commission rate ([\d.]+)%\.$/,
          replace: (m: RegExpMatchArray) => `تمت الموافقة على التاجر بنسبة عمولة ${m[1]}%.`
        },
        {
          regex: /^(Commercial|Tax|License|Identity|Bank) document approved\.$/,
          replace: (m: RegExpMatchArray) => `تم قبول مستند ${this.docTypeAr(m[1])}.`
        },
        {
          regex: /^(Commercial|Tax|License|Identity|Bank) document rejected\. (.+)$/,
          replace: (m: RegExpMatchArray) => `تم رفض مستند ${this.docTypeAr(m[1])}. ${m[2]}`
        },
        {
          regex: /^Vendor re-uploaded document\(s\): (.+)\. They are back in the review queue\.$/,
          replace: (m: RegExpMatchArray) => `قام التاجر بإعادة رفع مستند(ات): ${m[1]}. تم إرجاعها لقائمة المراجعة.`
        },
        {
          regex: /^Operations settings updated\. Accept orders: (enabled|disabled), minimum order: (.+), preparation time: (.+) minutes\.$/,
          replace: (m: RegExpMatchArray) => `تم تحديث إعدادات التشغيل. قبول الطلبات: ${m[1] === 'enabled' ? 'مفعّل' : 'معطّل'}، الحد الأدنى للطلب: ${m[2] === 'not set' ? 'غير محدد' : m[2]}، وقت التحضير: ${m[3] === 'not set' ? 'غير محدد' : m[3]} دقيقة.`
        },
        {
          regex: /^Notification settings updated\. Email: (enabled|disabled), SMS: (enabled|disabled), new orders: (enabled|disabled), sound: (.+)\.$/,
          replace: (m: RegExpMatchArray) => `تم تحديث إعدادات الإشعارات. البريد: ${m[1] === 'enabled' ? 'مفعّل' : 'معطّل'}، الرسائل: ${m[2] === 'enabled' ? 'مفعّل' : 'معطّل'}، طلبات جديدة: ${m[3] === 'enabled' ? 'مفعّل' : 'معطّل'}، الصوت: ${m[4]}.`
        }
      ];

      for (const pattern of patterns) {
        const match = rawMessage.match(pattern.regex);
        if (match) {
          return pattern.replace(match);
        }
      }

      return rawMessage;
    } else {
      if (this.arToEn[rawMessage]) {
        return this.arToEn[rawMessage];
      }

      // Pattern-based translations for dynamic messages (Arabic to English)
      const patterns = [
        {
          regex: /^تمت الموافقة على التاجر بنسبة عمولة ([\d.]+)%\.$/,
          replace: (m: RegExpMatchArray) => `Vendor approved with commission rate ${m[1]}%.`
        },
        {
          regex: /^تم قبول مستند (السجل التجاري|الضريبة|الرخصة|الهوية|البنك)\.$/,
          replace: (m: RegExpMatchArray) => `${this.docTypeEn(m[1])} document approved.`
        },
        {
          regex: /^تم رفض مستند (السجل التجاري|الضريبة|الرخصة|الهوية|البنك)\. (.+)$/,
          replace: (m: RegExpMatchArray) => `${this.docTypeEn(m[1])} document rejected. ${m[2]}`
        },
        {
          regex: /^قام التاجر بإعادة رفع مستند\(ات\): (.+)\. تم إرجاعها لقائمة المراجعة\.$/,
          replace: (m: RegExpMatchArray) => `Vendor re-uploaded document(s): ${m[1]}. They are back in the review queue.`
        },
        {
          regex: /^تم تحديث إعدادات التشغيل\. قبول الطلبات: (مفعّل|معطّل)، الحد الأدنى للطلب: (غير محدد|.+?)، وقت التحضير: (غير محدد|.+?) دقيقة\.$/,
          replace: (m: RegExpMatchArray) => `Operations settings updated. Accept orders: ${m[1] === 'مفعّل' ? 'enabled' : 'disabled'}, minimum order: ${m[2] === 'غير محدد' ? 'not set' : m[2]}, preparation time: ${m[3] === 'غير محدد' ? 'not set' : m[3]} minutes.`
        },
        {
          regex: /^تم تحديث إعدادات الإشعارات\. البريد: (مفعّل|معطّل)، الرسائل: (مفعّل|معطّل)، طلبات جديدة: (مفعّل|معطّل)، الصوت: (.+?)\.$/,
          replace: (m: RegExpMatchArray) => `Notification settings updated. Email: ${m[1] === 'مفعّل' ? 'enabled' : 'disabled'}, SMS: ${m[2] === 'مفعّل' ? 'enabled' : 'disabled'}, new orders: ${m[3] === 'مفعّل' ? 'enabled' : 'disabled'}, sound: ${m[4]}.`
        }
      ];

      for (const pattern of patterns) {
        const match = rawMessage.match(pattern.regex);
        if (match) {
          return pattern.replace(match);
        }
      }

      return rawMessage;
    }
  }

  private docTypeAr(type: string): string {
    const map: Record<string, string> = {
      'Commercial': 'السجل التجاري',
      'Tax': 'الضريبة',
      'License': 'الرخصة',
      'Identity': 'الهوية',
      'Bank': 'البنك',
      'commercial': 'السجل التجاري',
      'tax': 'الضريبة',
      'license': 'الرخصة',
      'identity': 'الهوية',
      'bank': 'البنك'
    };
    return map[type] || type;
  }

  private docTypeEn(typeAr: string): string {
    const map: Record<string, string> = {
      'السجل التجاري': 'Commercial',
      'الضريبة': 'Tax',
      'الرخصة': 'License',
      'الهوية': 'Identity',
      'البنك': 'Bank'
    };
    return map[typeAr] || typeAr;
  }
}
