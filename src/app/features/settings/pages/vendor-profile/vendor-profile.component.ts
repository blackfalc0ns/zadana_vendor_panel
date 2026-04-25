import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { finalize } from 'rxjs';
import { Subscription } from 'rxjs';
import { BANKS, BUSINESS_TYPES, CITIES, NATIONALITIES, PAYMENT_CYCLES, REGIONS, SelectOption } from '../../../auth/constants/vendor-onboarding.constants';
import { VendorOperatingHour, VendorProfile, VendorReviewAuditEntry, VendorReviewItem } from '../../models/vendor-profile.models';
import { VendorLegalDocumentType, VendorProfileService } from '../../services/vendor-profile.service';
import { ProfileSectionNavItem, ProfileWorkspaceWindow, ProfileWorkspaceWindowId } from './vendor-profile.view-models';
import { AppFlashBannerComponent } from '../../../../shared/components/ui/feedback/flash-banner/flash-banner.component';
import { ProfileCommandCenterComponent } from './components/profile-command-center.component';
import { ProfileWindowSwitcherComponent } from './components/profile-window-switcher.component';
import { ProfileCoreWindowComponent } from './components/profile-core-window.component';
import { ProfileReviewWindowComponent } from './components/profile-review-window.component';
import { ProfileOperationsWindowComponent } from './components/profile-operations-window.component';
import { ProfileTimelineWindowComponent } from './components/profile-timeline-window.component';
import { ProfileSideRailComponent } from './components/profile-side-rail.component';

interface LegalDocumentCard {
  type: VendorLegalDocumentType;
  code: string;
  inputId: string;
  titleAr: string;
  titleEn: string;
  hintAr: string;
  hintEn: string;
  url?: string | null;
  uploaded: boolean;
  reviewItem?: VendorReviewItem;
}

type LegalDocumentCardLike = Omit<LegalDocumentCard, 'inputId'> & { inputId?: string };

@Component({
  selector: 'app-vendor-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppFlashBannerComponent,
    ProfileCommandCenterComponent,
    ProfileWindowSwitcherComponent,
    ProfileCoreWindowComponent,
    ProfileReviewWindowComponent,
    ProfileOperationsWindowComponent,
    ProfileTimelineWindowComponent,
    ProfileSideRailComponent
  ],
    template: `
    <div class="space-y-8 pb-16 min-h-screen bg-slate-50" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <div class="w-full px-4 sm:px-6 lg:px-8 pt-8">
        
        <app-flash-banner *ngIf="pageError" [message]="pageError" tone="error" class="mb-4 block" />
        <app-flash-banner *ngIf="!pageError && pageNotice" [message]="pageNotice" tone="success" class="mb-4 block" />

        <section
          *ngIf="showLimitedEditNotice"
          class="rounded-[20px] border border-amber-200 bg-amber-50/90 px-4 py-3 shadow-sm mb-4">
          <div class="flex items-start gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-white text-amber-700">
              <span class="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
            <div>
              <p class="text-[0.78rem] font-black text-amber-900">{{ limitedEditNoticeTitle }}</p>
              <p class="mt-1 text-[0.74rem] font-bold leading-6 text-amber-800">{{ limitedEditNoticeBody }}</p>
            </div>
          </div>
        </section>

        <section
          *ngIf="!currentProfile.commercialAccessEnabled && currentProfile.requiredActions.length > 0"
          class="relative overflow-hidden rounded-[16px] border px-6 py-5 shadow-sm transition-all hover:shadow mb-4"
          [ngClass]="activationBannerClasses">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-3">
              <span class="inline-flex items-center gap-2 rounded-full border border-current/15 bg-white/90 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider shadow-sm">
                <span class="h-2 w-2 rounded-full bg-current"></span>
                {{ reviewStateLabel }}
              </span>
              <div>
                <h2 class="text-[1.15rem] font-black tracking-tight">
                  {{ currentLang === 'ar'
                    ? 'ملف التاجر جاهز للعمل الداخلي لكن التشغيل التجاري ما زال محجوبًا'
                    : 'The vendor workspace is ready for setup, but commercial activation is still blocked' }}
                </h2>
                <p class="mt-2.5 max-w-3xl text-[0.84rem] font-semibold leading-relaxed text-current/80">
                  {{ currentProfile.lastReviewDecision || (currentLang === 'ar'
                    ? 'يمكنك تجهيز الملف وساعات العمل والبيانات القانونية من هنا، ثم إرسال الملف للمراجعة أو إعادة إرساله بعد استكمال المطلوب.'
                    : 'You can complete the profile, operating setup, and legal data here, then submit or resubmit the file for compliance review.') }}
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="submitForReview()"
              [disabled]="submitReviewDisabled"
              class="relative z-10 inline-flex items-center justify-center gap-2 rounded-[12px] bg-slate-900 px-5 py-2.5 text-[0.8rem] font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
              <span *ngIf="isSubmittingReview" class="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white"></span>
              {{ submitReviewLabel }}
            </button>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <span
              *ngFor="let action of currentProfile.requiredActions"
              class="relative z-10 inline-flex items-center rounded-[8px] border border-current/15 bg-white/80 px-3 py-1 text-[0.72rem] font-bold shadow-sm transition-colors hover:bg-white">
              {{ action.message }}
            </span>
          </div>
        </section>

        <!-- Merged Command Center and Window Switcher -->
        <div class="mb-8 rounded-[16px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <app-profile-command-center
            [currentLang]="currentLang"
            [displayStoreName]="displayStoreName"
            [heroMessage]="heroMessage"
            [reviewStateLabel]="reviewStateLabel"
            [reviewStateBadgeClasses]="reviewStateBadgeClasses"
            [reviewStateDotClass]="reviewStateDotClass"
            [reviewProgressPercent]="reviewProgressPercent"
            [missingDocumentsCount]="currentProfile.missingDocumentsCount"
            [approvedItems]="currentProfile.reviewSummary.approvedItems"
            [submittedItems]="currentProfile.reviewSummary.submittedItems"
            [accountWorkspaceLabel]="accountWorkspaceLabel"
            [lastDecisionText]="lastDecisionText"
            [isSaving]="isSaving"
            [isSubmittingReview]="isSubmittingReview"
            [saveDisabled]="profileForm.invalid || isSaving"
            [submitDisabled]="submitReviewDisabled"
            [submitReviewLabel]="submitReviewLabel"
            (save)="saveProfile()"
            (submit)="submitForReview()" />

          <div class="border-t border-slate-100 mx-4"></div>

          <app-profile-window-switcher
            [currentLang]="currentLang"
            [windows]="workspaceWindows"
            [activeWindowId]="activeWindowId"
            [counts]="workspaceWindowCounts"
            (windowChange)="setActiveWindow($event)" />
        </div>

      <form [formGroup]="profileForm" class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div class="min-w-0 space-y-4">
          <app-profile-core-window
            *ngIf="isWindowActive('basics')"
            [form]="profileForm"
            [businessTypeOptions]="businessTypeOptions"
            [regionOptions]="regionOptions"
            [cityOptions]="cityOptions"
            [fieldClass]="fieldClassFn"
            [textareaClass]="textareaClassFn" />

          <app-profile-review-window
            *ngIf="isWindowActive('review')"
            [form]="profileForm"
            [currentLang]="currentLang"
            [accountWorkspaceLabel]="accountWorkspaceLabel"
            [lastDecisionText]="lastDecisionText"
            [reviewProgressPercent]="reviewProgressPercent"
            [missingDocumentsCount]="currentProfile.missingDocumentsCount"
            [nationalityOptions]="nationalityOptions"
            [legalDocumentCards]="legalDocumentCards"
            [uploadingDocumentType]="uploadingDocumentType"
            [fieldClass]="fieldClassFn"
            [documentActionLabel]="documentActionLabelFn"
            [documentCardClasses]="documentCardClassesFn"
            [reviewItemStatusLabel]="reviewItemStatusLabelFn"
            [reviewItemStatusBadgeClasses]="reviewItemStatusBadgeClassesOptionalFn"
            (uploadClick)="triggerLegalDocumentInput($event)"
            (documentSelected)="onLegalDocumentSelected($event.event, $event.type)" />

          <app-profile-operations-window
            *ngIf="isWindowActive('operations')"
            [form]="profileForm"
            [bankOptions]="bankOptions"
            [paymentCycleOptions]="paymentCycleOptions"
            [openDaysCount]="openDaysCount"
            [fieldClass]="fieldClassFn"
            [timeFieldClass]="timeFieldClassFn" />

          <app-profile-timeline-window
            *ngIf="isWindowActive('timeline')"
            [currentLang]="currentLang"
            [reviewStateLabel]="reviewStateLabel"
            [reviewProgressPercent]="reviewProgressPercent"
            [reviewStateBadgeClasses]="reviewStateBadgeClasses"
            [reviewItems]="currentProfile.reviewItems"
            [fullTimelineEntries]="fullTimelineEntries"
            [reviewItemLabel]="reviewItemLabelFn"
            [reviewItemStatusLabel]="reviewItemStatusLabelFn"
            [reviewItemCardClasses]="reviewItemCardClassesFn"
            [reviewItemStatusBadgeClasses]="reviewItemStatusBadgeClassesFn"
            [timelineToneDotClasses]="timelineToneDotClassesFn"
            [formatReviewDate]="formatReviewDateFn" />
        </div>

        <div class="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <app-profile-side-rail
            [currentLang]="currentLang"
            [activeWindow]="activeWindow"
            [activeTab]="activeTab"
            [sectionLabels]="sectionLabels"
            [sections]="activeWindowSections"
            [requiredActions]="currentProfile.requiredActions"
            [showRequiredActions]="activeWindowId === 'review'"
            [showSave]="activeWindowId !== 'timeline'"
            [showSubmit]="activeWindowId === 'review'"
            [showTimelinePreview]="activeWindowId !== 'timeline'"
            [saveDisabled]="profileForm.invalid || isSaving"
            [submitDisabled]="submitReviewDisabled"
            [isSaving]="isSaving"
            [isSubmittingReview]="isSubmittingReview"
            [submitReviewLabel]="submitReviewLabel"
            [reviewStateLabel]="reviewStateLabel"
            [reviewProgressPercent]="reviewProgressPercent"
            [reviewItems]="currentProfile.reviewItems"
            [timelineEntries]="timelineEntries"
            [completedFields]="completedFieldsFn"
            [totalFields]="totalFieldsFn"
            [sectionPercent]="sectionPercentFn"
            [reviewItemLabel]="reviewItemLabelFn"
            [reviewItemStatusLabel]="reviewItemStatusLabelFn"
            [reviewItemCardClasses]="reviewItemCardClassesFn"
            [reviewItemStatusBadgeClasses]="reviewItemStatusBadgeClassesFn"
            [timelineToneDotClasses]="timelineToneDotClassesFn"
            [formatReviewDate]="formatReviewDateFn"
            (sectionSelect)="setActiveTab($event)"
            (save)="saveProfile()"
            (submit)="submitForReview()" />
        </div>
      </form>
      </div>
    </div>
  `
})
export class VendorProfileComponent implements OnInit, OnDestroy {
  currentLang = 'ar';
  isSaving = false;
  isSubmittingReview = false;
  uploadingDocumentType: VendorLegalDocumentType | null = null;
  pageNotice = '';
  pageError = '';
  activeTab = 'store-section';
  profileForm: FormGroup;
  currentProfile: VendorProfile;
  private langSub: Subscription;
  private profileSub?: Subscription;
  readonly fieldClassFn = (controlName: string, mode?: 'context' | 'ltr' | 'rtl') => this.fieldClass(controlName, mode);
  readonly textareaClassFn = (controlName: string, mode?: 'context' | 'ltr' | 'rtl') => this.textareaClass(controlName, mode);
  readonly timeFieldClassFn = (isOpen: boolean) => this.timeFieldClass(isOpen);
  readonly documentActionLabelFn = (document: LegalDocumentCardLike) => this.documentActionLabel(document as LegalDocumentCard);
  readonly documentCardClassesFn = (document: LegalDocumentCardLike) => this.documentCardClasses(document as LegalDocumentCard);
  readonly completedFieldsFn = (item: ProfileSectionNavItem) => this.completedFields(item);
  readonly totalFieldsFn = (item: ProfileSectionNavItem) => this.totalFields(item);
  readonly sectionPercentFn = (item: ProfileSectionNavItem) => this.sectionPercent(item);
  readonly reviewItemLabelFn = (code: string) => this.reviewItemLabel(code);
  readonly reviewItemStatusLabelFn = (status: string) => this.reviewItemStatusLabel(status);
  readonly reviewItemCardClassesFn = (item: VendorReviewItem) => this.reviewItemCardClasses(item);
  readonly reviewItemStatusBadgeClassesFn = (item: VendorReviewItem) => this.reviewItemStatusBadgeClasses(item);
  readonly reviewItemStatusBadgeClassesOptionalFn = (item?: VendorReviewItem) =>
    this.reviewItemStatusBadgeClasses(item ?? this.emptyReviewItem('pending'));
  readonly timelineToneDotClassesFn = (entry: VendorReviewAuditEntry) => this.timelineToneDotClasses(entry);
  readonly formatReviewDateFn = (value?: string | null) => this.formatReviewDate(value);

  buildFormOptions(options: any[]): SearchableSelectOption[] {
    return options.map(opt => ({
      value: opt.value,
      labelKey: opt.labelKey,
      label: opt.label
    }));
  }

  get businessTypeOptions(): SearchableSelectOption[] { return this.buildFormOptions(this.businessTypes); }
  get regionOptions(): SearchableSelectOption[] { return this.buildFormOptions(this.regions); }
  get cityOptions(): SearchableSelectOption[] { return this.buildFormOptions(this.cities); }
  get nationalityOptions(): SearchableSelectOption[] { return this.buildFormOptions(this.nationalities); }
  get bankOptions(): SearchableSelectOption[] { return this.buildFormOptions(this.banks); }
  get paymentCycleOptions(): SearchableSelectOption[] { return this.buildFormOptions(this.paymentCycles); }
  
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
      fields: ['storeNameAr', 'storeNameEn', 'businessType', 'supportPhone', 'supportEmail', 'descriptionAr', 'descriptionEn']
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
      fields: ['idNumber', 'nationality', 'commercialRegistrationNumber', 'expiryDate', 'taxId', 'licenseNumber', 'hasCRDoc', 'hasTaxDoc', 'hasLicenseDoc']
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

  readonly workspaceWindows: ProfileWorkspaceWindow[] = [
    {
      id: 'basics',
      icon: 'storefront',
      labelAr: 'البيانات الأساسية',
      labelEn: 'Core profile',
      summaryAr: 'بيانات المتجر والمالك والعنوان',
      summaryEn: 'Store, owner, and address details'
    },
    {
      id: 'review',
      icon: 'verified_user',
      labelAr: 'المستندات والمراجعة',
      labelEn: 'Documents & review',
      summaryAr: 'Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ø±Ø³Ù…ÙŠØ© ÙˆØ§Ù„Ù…Ø·Ù„ÙˆØ¨ Ù‚Ø¨Ù„ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„',
      summaryEn: 'Official files and review checklist'
    },
    {
      id: 'operations',
      icon: 'account_balance_wallet',
      labelAr: 'البنك والتشغيل',
      labelEn: 'Banking & operations',
      summaryAr: 'الحساب البنكي وساعات العمل',
      summaryEn: 'Banking profile and operating hours'
    },
    {
      id: 'timeline',
      icon: 'history',
      labelAr: 'السجل والمتابعة',
      labelEn: 'Timeline & follow-up',
      summaryAr: 'سجل المراجعة والقرارات الأخيرة',
      summaryEn: 'Review history and recent decisions'
    }
  ];

  private readonly sectionWindowMap: Record<string, ProfileWorkspaceWindowId> = {
    'store-section': 'basics',
    'owner-section': 'basics',
    'contact-section': 'basics',
    'legal-section': 'review',
    'banking-section': 'operations',
    'hours-section': 'operations',
    'timeline-window': 'timeline'
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly profileService: VendorProfileService,
    private readonly translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => this.currentLang = event.lang);
    this.profileForm = this.buildForm();
    this.currentProfile = this.profileService.getProfileSnapshot();
  }

  ngOnInit(): void {
    this.profileSub = this.profileService.getProfile().subscribe((profile) => {
      this.currentProfile = profile;
      this.patchProfile(profile);
    });

    this.profileService.loadProfile().subscribe();
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

  get activeWindowId(): ProfileWorkspaceWindowId {
    return this.sectionWindowMap[this.activeTab] ?? 'basics';
  }

  get activeWindow(): ProfileWorkspaceWindow {
    return this.workspaceWindows.find((window) => window.id === this.activeWindowId) ?? this.workspaceWindows[0];
  }

  get activeWindowSections(): ProfileSectionNavItem[] {
    return this.sectionNavItems.filter((item) => this.sectionWindowMap[item.id] === this.activeWindowId);
  }

  get workspaceWindowCounts(): Partial<Record<ProfileWorkspaceWindowId, number>> {
    return this.workspaceWindows.reduce<Partial<Record<ProfileWorkspaceWindowId, number>>>((acc, window) => {
      acc[window.id] = this.workspaceWindowCount(window.id);
      return acc;
    }, {});
  }

  get sectionLabels(): Record<string, string> {
    return this.sectionNavItems.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = this.translate.instant(item.labelKey);
      return acc;
    }, {});
  }

  get accountWorkspaceLabel(): string {
    return this.currentProfile.commercialAccessEnabled
      ? (this.currentLang === 'ar' ? 'الحساب التجاري مفعل' : 'Commercial access enabled')
      : (this.currentLang === 'ar' ? 'الحساب ما زال تحت الاعتماد' : 'Commercial access is still gated');
  }

  get heroMessage(): string {
    return this.currentProfile.commercialAccessEnabled
      ? (this.currentLang === 'ar'
        ? 'حسابك التجاري مفعل. أي تعديل مهم أو إعادة رفع مستند سيظهر فورًا لفريق الأدمن في مسار المراجعة.'
        : 'Your commercial account is active. Important edits or document re-uploads appear instantly in the admin review flow.')
      : (this.currentLang === 'ar'
        ? 'أكمل البيانات والمستندات المطلوبة ثم أرسل الملف للمراجعة. كل تحديث تحفظه هنا يظهر مباشرة لدى الأدمن.'
        : 'Complete the required details and documents, then submit the file for review. Every saved update is visible to admin.');
  }

  get lastDecisionText(): string {
    if (this.currentProfile.lastReviewDecision?.trim()) {
      return this.currentProfile.lastReviewDecision;
    }

    return this.currentLang === 'ar'
      ? 'لا يوجد قرار نهائي بعد'
      : 'No final decision yet';
  }

  get showLimitedEditNotice(): boolean {
    const state = (this.currentProfile.reviewState || '').toLowerCase();
    return state === 'submitted'
      || state === 'underreview'
      || state === 'changesrequested'
      || state === 'changes_requested';
  }

  get limitedEditNoticeTitle(): string {
    return this.currentLang === 'ar'
      ? 'التعديلات ستعيد هذا الجزء للمراجعة'
      : 'Changes here will reopen this part for review';
  }

  get limitedEditNoticeBody(): string {
    if ((this.currentProfile.reviewState || '').toLowerCase() === 'changesrequested'
      || (this.currentProfile.reviewState || '').toLowerCase() === 'changes_requested') {
      return this.currentLang === 'ar'
        ? 'Ù†ÙØ° Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ Ø«Ù… Ø§Ø­ÙØ¸ ÙˆØ£Ø¹Ø¯ Ø±ÙØ¹ Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ù…Ø±ÙÙˆØ¶Ø© Ù‚Ø¨Ù„ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©.'
        : 'Apply the requested fixes, save, and re-upload rejected files before resubmitting.';
    }

    return this.currentLang === 'ar'
      ? 'ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ØŒ Ù„ÙƒÙ† Ø£ÙŠ ØªØ­Ø¯ÙŠØ« Ù…Ù‡Ù… Ø£Ùˆ Ø¥Ø¹Ø§Ø¯Ø© Ø±ÙØ¹ Ù…Ù„Ù Ø³ÙŠØ¸Ù‡Ø± Ù„Ù„Ø£Ø¯Ù…Ù† ÙƒØ¨Ù†Ø¯ ÙŠØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¬Ø¯ÙŠØ¯Ø©.'
      : 'You can still edit, but important updates or file re-uploads will be visible to admin as items needing review.';
  }

  get fullTimelineEntries(): VendorReviewAuditEntry[] {
    return this.currentProfile.reviewAuditEntries;
  }

  get statusBadgeClass(): string {
    return this.currentProfile.commercialAccessEnabled
      ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
      : 'border-amber-100 bg-amber-50 text-amber-600';
  }

  get statusDotClass(): string {
    return this.currentProfile.commercialAccessEnabled ? 'bg-emerald-500' : 'bg-amber-500';
  }

  get profileStatusLabelKey(): string {
    return this.currentProfile.commercialAccessEnabled
      ? 'SETTINGS_PROFILE.STATUS_ACTIVE'
      : 'SETTINGS_PROFILE.STATUS_PENDING';
  }

  get reviewStateLabel(): string {
    switch ((this.currentProfile.reviewState || '').toLowerCase()) {
      case 'awaitingsubmission':
        return this.currentLang === 'ar' ? 'بانتظار الإرسال' : 'Awaiting submission';
      case 'submitted':
        return this.currentLang === 'ar' ? 'مُرسل' : 'Submitted';
      case 'underreview':
        return this.currentLang === 'ar' ? 'قيد المراجعة' : 'Under review';
      case 'changesrequested':
      case 'changes_requested':
        return this.currentLang === 'ar' ? 'مطلوب تعديلات' : 'Changes requested';
      case 'verified':
        return this.currentLang === 'ar' ? 'معتمد' : 'Verified';
      case 'rejected':
        return this.currentLang === 'ar' ? 'مرفوض' : 'Rejected';
      case 'suspended':
        return this.currentLang === 'ar' ? 'معلق' : 'Suspended';
      default:
        return this.currentLang === 'ar' ? 'قيد الإعداد' : 'In setup';
    }
  }

  get activationBannerClasses(): string {
    switch ((this.currentProfile.reviewState || '').toLowerCase()) {
      case 'changesrequested':
      case 'changes_requested':
        return 'border-amber-200 bg-amber-50/90 text-amber-950';
      case 'rejected':
      case 'suspended':
        return 'border-rose-200 bg-rose-50/90 text-rose-950';
      default:
        return 'border-sky-200 bg-sky-50/90 text-sky-950';
    }
  }

  get reviewStateBadgeClasses(): string {
    if (this.currentProfile.commercialAccessEnabled) {
      return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if ((this.currentProfile.reviewState || '').toLowerCase() === 'changesrequested'
      || (this.currentProfile.reviewState || '').toLowerCase() === 'changes_requested') {
      return 'border border-amber-200 bg-amber-50 text-amber-700';
    }

    if ((this.currentProfile.reviewState || '').toLowerCase() === 'rejected'
      || (this.currentProfile.reviewState || '').toLowerCase() === 'suspended') {
      return 'border border-rose-200 bg-rose-50 text-rose-700';
    }

    return 'border border-sky-200 bg-sky-50 text-sky-700';
  }

  get reviewStateDotClass(): string {
    if (this.currentProfile.commercialAccessEnabled) {
      return 'bg-emerald-500';
    }

    if ((this.currentProfile.reviewState || '').toLowerCase() === 'changesrequested'
      || (this.currentProfile.reviewState || '').toLowerCase() === 'changes_requested') {
      return 'bg-amber-500';
    }

    if ((this.currentProfile.reviewState || '').toLowerCase() === 'rejected'
      || (this.currentProfile.reviewState || '').toLowerCase() === 'suspended') {
      return 'bg-rose-500';
    }

    return 'bg-sky-500';
  }

  get submitReviewDisabled(): boolean {
    return this.isSubmittingReview || this.isSaving || this.profileForm.invalid || !this.currentProfile.canSubmitForReview;
  }

  get submitReviewLabel(): string {
    return ((this.currentProfile.reviewState || '').toLowerCase() === 'changesrequested'
      || (this.currentProfile.reviewState || '').toLowerCase() === 'changes_requested')
      ? (this.currentLang === 'ar' ? 'إعادة الإرسال للمراجعة' : 'Resubmit for review')
      : (this.currentLang === 'ar' ? 'إرسال للمراجعة' : 'Submit for review');
  }

  get reviewProgressPercent(): number {
    // If vendor is already verified/active, show 100%
    if (this.currentProfile.commercialAccessEnabled
      || (this.currentProfile.reviewState || '').toLowerCase() === 'verified') {
      return 100;
    }

    const total = this.currentProfile.reviewSummary.totalItems || Math.max(this.currentProfile.reviewItems.length, 1);
    const approved = this.currentProfile.reviewSummary.approvedItems || 0;
    return Math.round((approved / total) * 100);
  }

  get timelineEntries(): VendorReviewAuditEntry[] {
    return this.currentProfile.reviewAuditEntries.slice(0, 5);
  }

  get legalDocumentCards(): LegalDocumentCard[] {
    const documents: LegalDocumentCard[] = [
      {
        type: 'commercial',
        code: 'commercial',
        inputId: 'profileCommercialDocInput',
        titleAr: 'السجل التجاري',
        titleEn: 'Commercial registration',
        hintAr: 'Ù…Ù„Ù PDF Ø±Ø³Ù…ÙŠ Ù„Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ. ÙŠØ¸Ù‡Ø± Ù„Ù„Ø£Ø¯Ù…Ù† Ù…Ø¨Ø§Ø´Ø±Ø© Ø¨Ø¹Ø¯ Ø§Ù„Ø±ÙØ¹.',
        hintEn: 'Official commercial registration PDF. Admin sees it immediately after upload.',
        url: this.currentProfile.commercialRegisterDocumentUrl,
        uploaded: !!this.currentProfile.commercialRegisterDocumentUrl,
        reviewItem: this.findReviewItem('commercial')
      },
      {
        type: 'tax',
        code: 'tax',
        inputId: 'profileTaxDocInput',
        titleAr: 'الشهادة الضريبية',
        titleEn: 'Tax certificate',
        hintAr: 'Ù…Ù„Ù PDF Ù„Ù„Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø¶Ø±ÙŠØ¨ÙŠØ© Ù…Ø·Ù„ÙˆØ¨ Ù„Ø§Ø³ØªÙƒÙ…Ø§Ù„ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©.',
        hintEn: 'Tax certificate PDF is required to complete compliance review.',
        url: this.currentProfile.taxDocumentUrl,
        uploaded: !!this.currentProfile.taxDocumentUrl,
        reviewItem: this.findReviewItem('tax')
      },
      {
        type: 'license',
        code: 'license',
        inputId: 'profileLicenseDocInput',
        titleAr: 'الرخصة التشغيلية',
        titleEn: 'Operating license',
        hintAr: 'Ù…Ù„Ù PDF Ù„Ù„Ø±Ø®ØµØ© Ø£Ùˆ Ø§Ù„ØªØµØ±ÙŠØ­ Ø§Ù„Ø¨Ù„Ø¯ÙŠ/Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠ.',
        hintEn: 'PDF for the municipal or operating license.',
        url: this.currentProfile.licenseDocumentUrl,
        uploaded: !!this.currentProfile.licenseDocumentUrl,
        reviewItem: this.findReviewItem('license')
      }
    ];

    return documents.sort((left, right) => this.legalDocumentRank(left) - this.legalDocumentRank(right));
  }

  scrollToSection(sectionId: string): void {
    this.activeTab = sectionId;
    if (sectionId === 'timeline-window') {
      return;
    }

    queueMicrotask(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  setActiveTab(tabId: string): void {
    this.scrollToSection(tabId);
  }

  setActiveWindow(windowId: ProfileWorkspaceWindowId): void {
    if (windowId === 'timeline') {
      this.activeTab = 'timeline-window';
      return;
    }

    const firstSection = this.sectionNavItems.find((item) => this.sectionWindowMap[item.id] === windowId);
    this.activeTab = firstSection?.id ?? 'store-section';
  }

  isWindowActive(windowId: ProfileWorkspaceWindowId): boolean {
    return this.activeWindowId === windowId;
  }

  triggerLegalDocumentInput(documentType: VendorLegalDocumentType): void {
    const inputId = this.legalDocumentCards.find((document) => document.type === documentType)?.inputId;
    if (inputId) {
      document.getElementById(inputId)?.click();
    }
  }

  onLegalDocumentSelected(event: Event, documentType: VendorLegalDocumentType): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!this.isPdfFile(file)) {
      this.pageNotice = '';
      this.pageError = this.currentLang === 'ar'
        ? 'المستندات الرسمية يجب رفعها بصيغة PDF.'
        : 'Official documents must be uploaded as PDF files.';
      input.value = '';
      return;
    }

    this.uploadingDocumentType = documentType;
    this.pageNotice = '';
    this.pageError = '';

    this.profileService.uploadLegalDocument(documentType, file)
      .pipe(finalize(() => {
        this.uploadingDocumentType = null;
        input.value = '';
      }))
      .subscribe({
        next: () => {
          this.pageNotice = this.currentLang === 'ar'
            ? 'تم رفع المستند وتحديث ملف التاجر، وسيظهر فوراً لدى الأدمن.'
            : 'Document uploaded and synced to admin for review.';
        },
        error: (error) => {
          this.pageError = this.resolveErrorMessage(
            error,
            this.currentLang === 'ar'
              ? 'ØªØ¹Ø°Ø± Ø±ÙØ¹ Ø§Ù„Ù…Ø³ØªÙ†Ø¯ Ø§Ù„Ø¢Ù†.'
              : 'Unable to upload the document right now.'
          );
        }
      });
  }

  documentActionLabel(document: LegalDocumentCard): string {
    if (this.uploadingDocumentType === document.type) {
      return this.currentLang === 'ar' ? 'جاري الرفع' : 'Uploading';
    }

    const status = (document.reviewItem?.status || '').toLowerCase();
    if (status === 'changesrequested' || status === 'changes_requested') {
      return this.currentLang === 'ar' ? 'إعادة رفع' : 'Re-upload';
    }

    return document.uploaded
      ? (this.currentLang === 'ar' ? 'استبدال' : 'Replace')
      : (this.currentLang === 'ar' ? 'رفع PDF' : 'Upload PDF');
  }

  documentCardClasses(document: LegalDocumentCard): string {
    const status = (document.reviewItem?.status || '').toLowerCase();

    if (status === 'approved') {
      return 'border-emerald-200 bg-emerald-50/70';
    }

    if (status === 'changesrequested' || status === 'changes_requested') {
      return 'border-amber-200 bg-amber-50/80';
    }

    if (document.uploaded) {
      return 'border-sky-200 bg-sky-50/70';
    }

    return 'border-slate-200 bg-white';
  }

  workspaceWindowCount(windowId: ProfileWorkspaceWindowId): number {
    switch (windowId) {
      case 'basics':
        return this.sectionPercent(this.getSectionItem('store-section'));
      case 'review':
        return this.currentProfile.missingDocumentsCount;
      case 'operations':
        return this.openDaysCount;
      case 'timeline':
        return this.fullTimelineEntries.length;
      default:
        return 0;
    }
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
      this.pageNotice = '';
      this.pageError = this.currentLang === 'ar'
        ? 'Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© Ù‚Ø¨Ù„ Ø­ÙØ¸ Ù…Ù„Ù Ø§Ù„ØªØ§Ø¬Ø±.'
        : 'Please review the required fields before saving the vendor profile.';
      return;
    }

    this.isSaving = true;
    this.pageNotice = '';
    this.pageError = '';
    const value = {
      ...this.profileService.getProfileSnapshot(),
      ...this.profileForm.getRawValue()
    } as VendorProfile;
    this.profileService.saveProfile(value)
      .pipe(finalize(() => {
        this.isSaving = false;
      }))
      .subscribe({
        next: () => {
          this.pageNotice = this.currentLang === 'ar'
            ? 'ØªÙ… Ø­ÙØ¸ ØªØ¹Ø¯ÙŠÙ„Ø§Øª Ø§Ù„Ù…Ù„Ù ÙˆØ¥Ø±Ø³Ø§Ù„Ù‡Ø§ Ù„Ù„Ø£Ø¯Ù…Ù† Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©.'
            : 'Profile changes were saved and synced to the admin workspace.';
        },
        error: (error) => {
          console.error('Failed to save vendor profile.', error);
          this.pageError = this.resolveErrorMessage(
            error,
            this.currentLang === 'ar'
              ? 'ØªØ¹Ø°Ø± Ø­ÙØ¸ ØªØ¹Ø¯ÙŠÙ„Ø§Øª Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø¢Ù†.'
              : 'Unable to save profile changes right now.'
          );
        }
      });
  }

  submitForReview(): void {
    if (this.submitReviewDisabled) {
      this.profileForm.markAllAsTouched();
      this.pageNotice = '';
      this.pageError = this.currentLang === 'ar'
        ? 'استكمل البيانات والمستندات المطلوبة قبل الإرسال للمراجعة.'
        : 'Complete the required data and documents before submitting for review.';
      return;
    }

    this.isSubmittingReview = true;
    this.pageNotice = '';
    this.pageError = '';
    this.profileService.submitForReview()
      .pipe(finalize(() => {
        this.isSubmittingReview = false;
      }))
      .subscribe({
        next: () => {
          this.pageNotice = this.currentLang === 'ar'
            ? 'ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ù…Ù„Ù Ø§Ù„ØªØ§Ø¬Ø± Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© ÙˆØ³ÙŠØ¸Ù‡Ø± ÙÙˆØ±Ù‹Ø§ Ù„Ø¯Ù‰ Ø§Ù„Ø£Ø¯Ù…Ù†.'
            : 'The vendor profile was submitted for review and is visible to admin.';
        },
        error: (error) => {
          console.error('Failed to submit vendor profile for review.', error);
          this.pageError = this.resolveErrorMessage(
            error,
            this.currentLang === 'ar'
              ? 'ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…Ù„Ù Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¢Ù†.'
              : 'Unable to submit the profile for review right now.'
          );
        }
      });
  }

  reviewItemLabel(code: string): string {
    const labels: Record<string, { ar: string; en: string }> = {
      commercial: { ar: 'السجل التجاري', en: 'Commercial registration' },
      tax: { ar: 'الشهادة الضريبية', en: 'Tax certificate' },
      license: { ar: 'الرخصة التشغيلية', en: 'Operating license' },
      identity: { ar: 'بيانات الهوية', en: 'Identity details' },
      bank: { ar: 'البيانات البنكية', en: 'Banking details' }
    };
    const direct = labels[(code || '').trim().toLowerCase()];

    if (direct) {
      return this.currentLang === 'ar' ? direct.ar : direct.en;
    }

    const normalized = code.replace(/([a-z])([A-Z])/g, '$1 $2');
    return normalized
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  reviewItemStatusLabel(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return this.currentLang === 'ar' ? 'معتمد' : 'Approved';
      case 'submitted':
        return this.currentLang === 'ar' ? 'مُرسل' : 'Submitted';
      case 'changesrequested':
      case 'changes_requested':
        return this.currentLang === 'ar' ? 'تعديلات' : 'Changes';
      case 'waived':
        return this.currentLang === 'ar' ? 'مستثنى' : 'Waived';
      default:
        return this.currentLang === 'ar' ? 'بانتظارك' : 'Pending vendor';
    }
  }

  reviewItemCardClasses(item: VendorReviewItem): string {
    switch ((item.status || '').toLowerCase()) {
      case 'approved':
        return 'border-emerald-100 bg-emerald-50/70';
      case 'changesrequested':
      case 'changes_requested':
        return 'border-amber-100 bg-amber-50/70';
      case 'submitted':
        return 'border-sky-100 bg-sky-50/70';
      default:
        return 'border-slate-200 bg-slate-50/80';
    }
  }

  reviewItemStatusBadgeClasses(item: VendorReviewItem): string {
    switch ((item.status || '').toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'changesrequested':
      case 'changes_requested':
        return 'bg-amber-100 text-amber-700';
      case 'submitted':
        return 'bg-sky-100 text-sky-700';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  }

  timelineToneDotClasses(entry: VendorReviewAuditEntry): string {
    switch (entry.tone) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-rose-500';
      default:
        return 'bg-sky-500';
    }
  }

  formatReviewDate(value?: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      storeNameAr: ['', Validators.required],
      storeNameEn: ['', Validators.required],
      businessType: ['', Validators.required],
      supportPhone: ['', Validators.required],
      supportEmail: ['', [Validators.required, Validators.email]],
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
      hasTaxDoc: [false],
      hasLicenseDoc: [false],
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

  private findReviewItem(code: string): VendorReviewItem | undefined {
    const normalizedCode = code.toLowerCase();
    return this.currentProfile.reviewItems.find((item) => item.code.toLowerCase() === normalizedCode);
  }

  private legalDocumentRank(document: LegalDocumentCard): number {
    const status = (document.reviewItem?.status || '').toLowerCase();

    if (status === 'changesrequested' || status === 'changes_requested') {
      return 0;
    }

    if (!document.uploaded) {
      return 1;
    }

    if (status === 'submitted') {
      return 2;
    }

    if (status === 'approved') {
      return 4;
    }

    return 3;
  }

  emptyReviewItem(code: string): VendorReviewItem {
    return {
      code,
      status: 'PendingVendor'
    };
  }

  private isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    const apiError = error as { error?: { message?: string; Message?: string; title?: string; Title?: string } };
    return apiError?.error?.message
      || apiError?.error?.Message
      || apiError?.error?.title
      || apiError?.error?.Title
      || fallback;
  }
}

