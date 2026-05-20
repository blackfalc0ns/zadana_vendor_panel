import { CommonModule, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppPageSectionShellComponent } from '../../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';
import { VendorReviewAuditEntry, VendorReviewItem } from '../../../models/vendor-profile.models';

@Component({
  selector: 'app-profile-timeline-window',
  standalone: true,
  imports: [CommonModule, NgClass, TranslateModule, AppPageSectionShellComponent],
  template: `
    <div id="timeline-window">
      <app-page-section-shell
      [title]="currentLang === 'ar' ? 'السجل والمتابعة' : 'Timeline and follow-up'"
      [subtitle]="currentLang === 'ar' ? 'هنا ترى ما الذي تغيّر في ملفك وكيف يتتبعه فريق المراجعة.' : 'This window shows what changed in your file and how review is progressing.'"
      [translateTitle]="false"
      [translateSubtitle]="false"
      bodyClass="grid gap-6 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      
      <!-- Current Review State -->
      <div class="rounded-[12px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-[8px] bg-slate-100 text-slate-500">
              <span class="material-symbols-outlined text-[20px]">analytics</span>
            </div>
            <div>
              <p class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                {{ currentLang === 'ar' ? 'الحالة الحالية' : 'Current review state' }}
              </p>
              <h4 class="text-base font-black text-slate-900">{{ reviewStateLabel }}</h4>
            </div>
          </div>
          <span class="rounded-[6px] border px-2.5 py-1 text-sm font-black" [ngClass]="reviewStateBadgeClasses">
            {{ reviewProgressPercent }}%
          </span>
        </div>

        <div class="mt-6 space-y-3">
          <div
            *ngFor="let item of reviewItems"
            class="rounded-[8px] border p-4 transition-colors hover:shadow-sm"
            [ngClass]="reviewItemCardClasses(item)">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-900">{{ reviewItemLabel(item.code) }}</p>
                <p *ngIf="item.decisionNote" class="mt-1 text-xs text-slate-600">{{ item.decisionNote }}</p>
              </div>
              <span class="shrink-0 rounded-[6px] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider border" [ngClass]="reviewItemStatusBadgeClasses(item)">
                {{ reviewItemStatusLabel(item.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="rounded-[12px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
          <span class="material-symbols-outlined text-[20px] text-slate-500">history</span>
          <p class="text-xs font-bold uppercase tracking-wider text-slate-600">
            {{ currentLang === 'ar' ? 'السجل الزمني الكامل' : 'Complete review timeline' }}
          </p>
        </div>
        
        <div class="custom-scrollbar max-h-[420px] overflow-y-auto pe-2">
        <div class="relative ms-4 space-y-4 before:absolute before:-left-[17px] before:bottom-0 before:top-2 before:w-[2px] before:bg-slate-200" [dir]="'ltr'">
          <article *ngFor="let entry of fullTimelineEntries" class="relative">
            <!-- Timeline dot -->
            <div class="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-[3px] border-white" [ngClass]="timelineToneDotClasses(entry).replace('bg-', '!bg-')"></div>
            
            <div class="rounded-[8px] border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:shadow">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-bold text-slate-900">{{ entry.authorName }}</span>
                <span class="rounded-[4px] bg-slate-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-slate-600">{{ localizeRoleLabel(entry.roleLabel) }}</span>
                <span class="ms-auto text-xs font-bold text-slate-400">{{ formatReviewDate(entry.createdAtUtc) }}</span>
              </div>
              <p class="mt-1.5 text-xs text-slate-600">{{ localizeMessage(entry.message) }}</p>
            </div>
          </article>

          <p *ngIf="fullTimelineEntries.length === 0" class="rounded-[8px] border border-dashed border-slate-300 bg-white py-6 text-center text-sm font-medium text-slate-500">
            {{ currentLang === 'ar' ? 'لا يوجد نشاط مراجعة بعد.' : 'No review activity yet.' }}
          </p>
        </div>
        </div>
      </div>
      </app-page-section-shell>
    </div>
  `
})
export class ProfileTimelineWindowComponent {
  @Input() currentLang: 'ar' | 'en' | string = 'ar';
  @Input() reviewStateLabel = '';
  @Input() reviewProgressPercent = 0;
  @Input() reviewStateBadgeClasses = '';
  @Input() reviewItems: VendorReviewItem[] = [];
  @Input() fullTimelineEntries: VendorReviewAuditEntry[] = [];
  @Input() reviewItemLabel!: (code: string) => string;
  @Input() reviewItemStatusLabel!: (status: string) => string;
  @Input() reviewItemCardClasses!: (item: VendorReviewItem) => string;
  @Input() reviewItemStatusBadgeClasses!: (item: VendorReviewItem) => string;
  @Input() timelineToneDotClasses!: (entry: VendorReviewAuditEntry) => string;
  @Input() formatReviewDate!: (value?: string | null) => string;

  private readonly roleLabelMap: Record<string, string> = {
    'Compliance Review': 'مراجعة الامتثال',
    'Document Review': 'مراجعة المستندات',
    'Risk & Compliance': 'المخاطر والامتثال',
    'Security Review': 'مراجعة أمنية',
    'Security Control': 'التحكم الأمني',
    'Admin Action': 'إجراء إداري',
    'Admin': 'المسؤول',
    'Vendor Portal': 'بوابة التاجر',
    'Vendor Review': 'مراجعة التاجر',
    'Operations Console': 'لوحة التشغيل',
    'Vendor Compliance Desk': 'مكتب امتثال التاجر',
    'Risk & Compliance Desk': 'مكتب المخاطر والامتثال',
    'Security Desk': 'مكتب الأمان',
    'Operations Reviewer': 'مراجع العمليات'
  };

  private readonly messageMap: Record<string, string> = {
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

  localizeRoleLabel(roleLabel: string): string {
    if (this.currentLang !== 'ar') {
      return roleLabel;
    }
    return this.roleLabelMap[roleLabel] || roleLabel;
  }

  localizeMessage(message: string): string {
    if (this.currentLang !== 'ar') {
      return message;
    }

    // Exact match
    if (this.messageMap[message]) {
      return this.messageMap[message];
    }

    // Pattern-based translations for dynamic messages
    const patterns: { regex: RegExp; replace: string | ((match: RegExpMatchArray) => string) }[] = [
      {
        regex: /^Vendor approved with commission rate ([\d.]+)%\.$/,
        replace: (m) => `تمت الموافقة على التاجر بنسبة عمولة ${m[1]}%.`
      },
      {
        regex: /^(Commercial|Tax|License|Identity|Bank) document approved\.$/,
        replace: (m) => `تم قبول مستند ${this.docTypeAr(m[1])}.`
      },
      {
        regex: /^(Commercial|Tax|License|Identity|Bank) document rejected\. (.+)$/,
        replace: (m) => `تم رفض مستند ${this.docTypeAr(m[1])}. ${m[2]}`
      },
      {
        regex: /^Vendor re-uploaded document\(s\): (.+)\. They are back in the review queue\.$/,
        replace: (m) => `قام التاجر بإعادة رفع مستند(ات): ${m[1]}. تم إرجاعها لقائمة المراجعة.`
      },
      {
        regex: /^Operations settings updated\. Accept orders: (enabled|disabled), minimum order: (.+), preparation time: (.+) minutes\.$/,
        replace: (m) => `تم تحديث إعدادات التشغيل. قبول الطلبات: ${m[1] === 'enabled' ? 'مفعّل' : 'معطّل'}، الحد الأدنى للطلب: ${m[2] === 'not set' ? 'غير محدد' : m[2]}، وقت التحضير: ${m[3] === 'not set' ? 'غير محدد' : m[3]} دقيقة.`
      },
      {
        regex: /^Notification settings updated\. Email: (enabled|disabled), SMS: (enabled|disabled), new orders: (enabled|disabled), sound: (.+)\.$/,
        replace: (m) => `تم تحديث إعدادات الإشعارات. البريد: ${m[1] === 'enabled' ? 'مفعّل' : 'معطّل'}، الرسائل: ${m[2] === 'enabled' ? 'مفعّل' : 'معطّل'}، طلبات جديدة: ${m[3] === 'enabled' ? 'مفعّل' : 'معطّل'}، الصوت: ${m[4]}.`
      }
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern.regex);
      if (match) {
        return typeof pattern.replace === 'function' ? pattern.replace(match) : pattern.replace;
      }
    }

    return message;
  }

  private docTypeAr(type: string): string {
    const map: Record<string, string> = {
      'Commercial': 'السجل التجاري',
      'Tax': 'الضريبة',
      'License': 'الرخصة',
      'Identity': 'الهوية',
      'Bank': 'البنك'
    };
    return map[type] || type;
  }
}
