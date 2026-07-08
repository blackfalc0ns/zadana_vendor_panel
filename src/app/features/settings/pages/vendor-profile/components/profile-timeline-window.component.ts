import { CommonModule, NgClass } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppPageSectionShellComponent } from '../../../../../shared/components/ui/layout/page-section-shell/page-section-shell.component';
import { VendorReviewAuditEntry, VendorReviewItem } from '../../../models/vendor-profile.models';
import { resolveLocalizedMessage } from '../../../../../shared/utils/text-normalization.util';

@Component({
 changeDetection: ChangeDetectionStrategy.OnPush,
 selector: 'app-profile-timeline-window',
 standalone: true,
 imports: [CommonModule, NgClass, TranslateModule, AppPageSectionShellComponent],
 styles: [`.profile-timeline-items-scroll {
 max-height: min(22rem, 42vh);
 overflow-x: hidden;
 overflow-y: auto;
 scrollbar-width: thin;
 scrollbar-color: rgba(148, 163, 184, 0.8) transparent;
 }.profile-timeline-items-scroll::-webkit-scrollbar {
 width: 4px;
 }.profile-timeline-items-scroll::-webkit-scrollbar-thumb {
 background: rgba(148, 163, 184, 0.75);
 border-radius: 999px;
 }.profile-timeline-list-scroll {
 max-height: min(26rem, 48vh);
 overflow-x: hidden;
 overflow-y: auto;
 scrollbar-width: thin;
 scrollbar-color: rgba(148, 163, 184, 0.8) transparent;
 }.profile-timeline-list-scroll::-webkit-scrollbar {
 width: 4px;
 }.profile-timeline-list-scroll::-webkit-scrollbar-thumb {
 background: rgba(148, 163, 184, 0.75);
 border-radius: 999px;
 }
 `],
 template: `
 <div id="timeline-window">
 <app-page-section-shell
 [title]="currentLang === 'ar' ? 'السجل والمتابعة' : 'Timeline and follow-up'"
 [subtitle]="currentLang === 'ar' ? 'هنا ترى ما الذي تغيّر في ملفك وكيف يتتبعه فريق المراجعة.' : 'This window shows what changed in your file and how review is progressing.'"
 [translateTitle]="false"
 [translateSubtitle]="false"
 bodyClass="grid gap-6 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
 
 <!-- Current Review State -->
 <div class="rounded-[1.25rem] border border-white/60 bg-white/40 backdrop-blur-xl p-4 shadow-sm transition-shadow hover:shadow-md relative overflow-hidden flex flex-col min-h-0">
 <div class="absolute -right-20 -top-20 w-48 h-48 bg-gradient-to-br from-zadna-primary/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
 <div class="flex items-center justify-between gap-2 shrink-0">
 <div class="flex items-center gap-3 relative z-10 min-w-0">
 <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-white shadow-sm border border-slate-100 text-slate-500">
 <span class="material-symbols-outlined text-[20px]">analytics</span>
 </div>
 <div class="min-w-0">
 <p class="text-[0.58rem] font-bold uppercase tracking-wider text-slate-500">
 {{ currentLang === 'ar' ? 'الحالة الحالية' : 'Current review state' }}
 </p>
 <h4 class="truncate text-sm font-black text-slate-900">{{ reviewStateLabel }}</h4>
 </div>
 </div>
 <span class="shrink-0 rounded-[6px] border px-2 py-0.5 text-[0.68rem] font-black" [ngClass]="reviewStateBadgeClasses">
 {{ reviewProgressPercent }}%
 </span>
 </div>

 <div class="profile-timeline-items-scroll mt-3 space-y-2 pe-1">
 <div
 *ngFor="let item of reviewItems"
 class="rounded-xl border border-white/80 bg-white/50 p-3 shadow-sm transition-all hover:bg-white/80"
 [ngClass]="reviewItemCardClasses(item)">
 <div class="flex items-start justify-between gap-2">
 <div class="min-w-0">
 <p class="text-xs font-bold leading-5 text-slate-900">{{ reviewItemLabel(item.code) }}</p>
 <p *ngIf="item.decisionNote" class="mt-0.5 line-clamp-2 text-[0.68rem] leading-5 text-slate-600">{{ localizeMessage(item.decisionNote) }}</p>
 </div>
 <span class="shrink-0 rounded-[5px] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide border" [ngClass]="reviewItemStatusBadgeClasses(item)">
 {{ reviewItemStatusLabel(item.status) }}
 </span>
 </div>
 </div>

 <p *ngIf="reviewItems.length === 0" class="rounded-xl border border-dashed border-slate-300/60 bg-white/40 py-6 text-center text-xs font-medium text-slate-500">
          {{ currentLang === 'ar' ? 'ما فيه عناصر مراجعة حتى الحين.' : 'No review items yet.' }}
 </p>
 </div>
 </div>

 <!-- Timeline -->
 <div class="rounded-[1.25rem] border border-white/60 bg-white/40 backdrop-blur-xl p-4 shadow-sm transition-shadow hover:shadow-md flex flex-col min-h-0">
 <div class="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2 shrink-0">
 <span class="material-symbols-outlined text-[18px] text-slate-500">history</span>
 <p class="text-[0.65rem] font-bold uppercase tracking-wider text-slate-600">
 {{ currentLang === 'ar' ? 'السجل الزمني الكامل' : 'Complete review timeline' }}
 </p>
 </div>
 
 <div class="profile-timeline-list-scroll pe-1">
 <div class="relative ms-3 space-y-3 before:absolute before:-left-[13px] before:bottom-0 before:top-2 before:w-[2px] before:bg-slate-200/60" [dir]="'ltr'">
 <article *ngFor="let entry of fullTimelineEntries" class="relative group">
 <!-- Timeline dot -->
 <div class="absolute -left-[20px] top-1 h-3 w-3 rounded-full border-[3px] border-white shadow-sm" [ngClass]="timelineToneDotClasses(entry).replace('bg-', '!bg-')"></div>
 
 <div class="rounded-[0.85rem] border border-white/80 bg-white/60 p-3 shadow-sm transition-all hover:bg-white">
 <div class="flex flex-wrap items-center gap-1.5">
 <span class="text-xs font-bold text-slate-900">{{ entry.authorName }}</span>
 <span class="rounded-[4px] bg-slate-100 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-slate-600">{{ localizeRoleLabel(entry.roleLabel) }}</span>
 <span class="ms-auto text-[0.65rem] font-bold text-slate-400">{{ formatReviewDate(entry.createdAtUtc) }}</span>
 </div>
 <p class="mt-1 text-[0.68rem] leading-5 text-slate-600">{{ localizeMessage(entry.message) }}</p>
 </div>
 </article>

 <p *ngIf="fullTimelineEntries.length === 0" class="rounded-[0.85rem] border border-dashed border-slate-300/60 bg-white/40 py-6 text-center text-xs font-medium text-slate-500">
          {{ currentLang === 'ar' ? 'ما فيه نشاط مراجعة حتى الحين.' : 'No review activity yet.' }}
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

 private readonly roleLabelArToEn: Record<string, string> = {
 'مراجعة الامتثال': 'Compliance Review',
 'مراجعة المستندات': 'Document Review',
 'المخاطر والامتثال': 'Risk & Compliance',
 'مراجعة أمنية': 'Security Review',
 'التحكم الأمني': 'Security Control',
 'إجراء إداري': 'Admin Action',
 'المسؤول': 'Admin',
 'بوابة التاجر': 'Vendor Portal',
 'مراجعة التاجر': 'Vendor Review',
 'لوحة التشغيل': 'Operations Console',
 'مكتب امتثال التاجر': 'Vendor Compliance Desk',
 'مكتب المخاطر والامتثال': 'Risk & Compliance Desk',
 'مكتب الأمان': 'Security Desk',
 'مراجع العمليات': 'Operations Reviewer'
 };

 private readonly enToAr: Record<string, string> = {
 'Vendor review started.': 'بدأت مراجعة التاجر.',
 'Vendor account reactivated and returned to active status.': 'أعدنا تفعيل حساب التاجر ورجعناه للحالة النشطة.',
 'Vendor login was unlocked and account access was restored.': 'فتحنا دخول التاجر ورجعنا وصول الحساب.',
 'Vendor password was reset by an administrator and all active sessions were revoked.': 'أعادت الإدارة تعيين كلمة مرور التاجر وأنهت كل الجلسات النشطة.',
 'Please re-upload the required legal documents and confirm the latest vendor information.': 'أعد رفع المستندات القانونية المطلوبة وتأكد من أحدث بيانات التاجر.',
 'Vendor updated banking and payout setup from Vendor Portal.': 'حدّث التاجر بيانات الحساب البنكي والتسويات من بوابة التاجر.',
 'Vendor updated store profile details from Vendor Portal.': 'حدّث التاجر بيانات المتجر من بوابة التاجر.',
 'Vendor updated address and contact location details from Vendor Portal.': 'حدّث التاجر بيانات العنوان والموقع من بوابة التاجر.',
 'Vendor updated operating hours from Vendor Portal.': 'حدّث التاجر ساعات العمل من بوابة التاجر.',
 'Vendor updated owner information from Vendor Portal.': 'حدّث التاجر بيانات المالك من بوابة التاجر.',
 'Vendor updated notification preferences from Vendor Portal.': 'حدّث التاجر تفضيلات الإشعارات من بوابة التاجر.',
 'Vendor updated operational settings from Vendor Portal.': 'حدّث التاجر إعدادات التشغيل من بوابة التاجر.',
 'Vendor updated legal and compliance information from Vendor Portal.': 'حدّث التاجر البيانات القانونية وبيانات الامتثال من بوابة التاجر.',
 'Vendor submitted the profile and required documents for compliance review.': 'أرسل التاجر الملف الشخصي والمستندات المطلوبة لمراجعة الامتثال.',
 'No review activity yet.': 'ما فيه نشاط مراجعة بعد.'
 };

 private readonly arToEn: Record<string, string> = {
 'بدأت مراجعة التاجر.': 'Vendor review started.',
 'أعدنا تفعيل حساب التاجر ورجعناه للحالة النشطة.': 'Vendor account reactivated and returned to active status.',
 'فتحنا دخول التاجر ورجعنا وصول الحساب.': 'Vendor login was unlocked and account access was restored.',
 'أعادت الإدارة تعيين كلمة مرور التاجر وأنهت كل الجلسات النشطة.': 'Vendor password was reset by an administrator and all active sessions were revoked.',
 'أعد رفع المستندات القانونية المطلوبة وتأكد من أحدث بيانات التاجر.': 'Please re-upload the required legal documents and confirm the latest vendor information.',
 'حدّث التاجر بيانات الحساب البنكي والتسويات من بوابة التاجر.': 'Vendor updated banking and payout setup from Vendor Portal.',
 'حدّث التاجر بيانات المتجر من بوابة التاجر.': 'Vendor updated store profile details from Vendor Portal.',
 'حدّث التاجر بيانات العنوان والموقع من بوابة التاجر.': 'Vendor updated address and contact location details from Vendor Portal.',
 'حدّث التاجر ساعات العمل من بوابة التاجر.': 'Vendor updated operating hours from Vendor Portal.',
 'حدّث التاجر بيانات المالك من بوابة التاجر.': 'Vendor updated owner information from Vendor Portal.',
 'حدّث التاجر تفضيلات الإشعارات من بوابة التاجر.': 'Vendor updated notification preferences from Vendor Portal.',
 'حدّث التاجر إعدادات التشغيل من بوابة التاجر.': 'Vendor updated operational settings from Vendor Portal.',
 'حدّث التاجر البيانات القانونية وبيانات الامتثال من بوابة التاجر.': 'Vendor updated legal and compliance information from Vendor Portal.',
 'أرسل التاجر الملف الشخصي والمستندات المطلوبة لمراجعة الامتثال.': 'Vendor submitted the profile and required documents for compliance review.',
 'ما فيه نشاط مراجعة بعد.': 'No review activity yet.'
 };

 localizeRoleLabel(roleLabel: string): string {
 const cleanRole = resolveLocalizedMessage(roleLabel, this.currentLang);
 if (this.currentLang === 'ar') {
 return this.roleLabelMap[cleanRole] || cleanRole;
 }
 return this.roleLabelArToEn[cleanRole] || cleanRole;
 }

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
  replace: (m: RegExpMatchArray) => `اعتمدنا التاجر بنسبة عمولة ${m[1]}%.`
 },
 {
 regex: /^(Commercial|Tax|License|Identity|Bank) document approved\.$/,
  replace: (m: RegExpMatchArray) => `قبلنا مستند ${this.docTypeAr(m[1])}.`
 },
 {
 regex: /^(Commercial|Tax|License|Identity|Bank) document rejected\. (.+)$/,
  replace: (m: RegExpMatchArray) => `رفضنا مستند ${this.docTypeAr(m[1])}. ${m[2]}`
 },
 {
 regex: /^Vendor re-uploaded document\(s\): (.+)\. They are back in the review queue\.$/,
  replace: (m: RegExpMatchArray) => `أعاد التاجر رفع مستند(ات): ${m[1]}. ورجّعناها لقائمة المراجعة.`
 },
 {
 regex: /^Operations settings updated\. Accept orders: (enabled|disabled), minimum order: (.+), preparation time: (.+) minutes\.$/,
  replace: (m: RegExpMatchArray) => `حدّثنا إعدادات التشغيل. قبول الطلبات: ${m[1] === 'enabled' ? 'مفعّل' : 'معطّل'}، الحد الأدنى للطلب: ${m[2] === 'not set' ? 'غير محدد' : m[2]}، وقت التحضير: ${m[3] === 'not set' ? 'غير محدد' : m[3]} دقيقة.`
 },
 {
 regex: /^Notification settings updated\. Email: (enabled|disabled), SMS: (enabled|disabled), new orders: (enabled|disabled), sound: (.+)\.$/,
  replace: (m: RegExpMatchArray) => `حدّثنا إعدادات الإشعارات. البريد: ${m[1] === 'enabled' ? 'مفعّل' : 'معطّل'}، الرسائل: ${m[2] === 'enabled' ? 'مفعّل' : 'معطّل'}، طلبات جديدة: ${m[3] === 'enabled' ? 'مفعّل' : 'معطّل'}، الصوت: ${m[4]}.`
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
  regex: /^اعتمدنا التاجر بنسبة عمولة ([\d.]+)%\.$/,
 replace: (m: RegExpMatchArray) => `Vendor approved with commission rate ${m[1]}%.`
 },
 {
  regex: /^قبلنا مستند (السجل التجاري|الضريبة|الرخصة|الهوية|البنك)\.$/,
 replace: (m: RegExpMatchArray) => `${this.docTypeEn(m[1])} document approved.`
 },
 {
  regex: /^رفضنا مستند (السجل التجاري|الضريبة|الرخصة|الهوية|البنك)\. (.+)$/,
 replace: (m: RegExpMatchArray) => `${this.docTypeEn(m[1])} document rejected. ${m[2]}`
 },
 {
  regex: /^أعاد التاجر رفع مستند\(ات\): (.+)\. ورجّعناها لقائمة المراجعة\.$/,
 replace: (m: RegExpMatchArray) => `Vendor re-uploaded document(s): ${m[1]}. They are back in the review queue.`
 },
 {
  regex: /^حدّثنا إعدادات التشغيل\. قبول الطلبات: (مفعّل|معطّل)، الحد الأدنى للطلب: (غير محدد|.+?)، وقت التحضير: (غير محدد|.+?) دقيقة\.$/,
 replace: (m: RegExpMatchArray) => `Operations settings updated. Accept orders: ${m[1] === 'مفعّل' ? 'enabled' : 'disabled'}, minimum order: ${m[2] === 'غير محدد' ? 'not set' : m[2]}, preparation time: ${m[3] === 'غير محدد' ? 'not set' : m[3]} minutes.`
 },
 {
regex: /^حدّثنا إعدادات الإشعارات\. البريد: (مفعّل|معطّل)، الرسائل: (مفعّل|معطّل)، طلبات جديدة: (مفعّل|معطّل)، الصوت: (.+?)\.$/,
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
