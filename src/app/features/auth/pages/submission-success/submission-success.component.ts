import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, catchError, interval, of, startWith, switchMap } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppBadgeComponent } from '../../../../shared/components/ui/feedback/badge/badge.component';
import { StatusChipTone } from '../../../../shared/components/ui/models/ui-contracts.models';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';
import { VendorProfileService } from '../../../settings/services/vendor-profile.service';
import { VendorProfile, VendorRequiredAction } from '../../../settings/models/vendor-profile.models';
import { repairUtf8Mojibake, resolveLocalizedMessage } from '../../../../shared/utils/text-normalization.util';
import { canAccessVendorDashboard } from '../../../../core/auth/utils/vendor-activation.util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-submission-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    AppButtonComponent,
    AppBadgeComponent
  ],
  templateUrl: './submission-success.component.html',
  styleUrl: './submission-success.component.scss'
})
export class SubmissionSuccessComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly profileRefreshMs = 30000;
  private profileRefreshSub?: Subscription;

  today = new Date();
  applicationId = this.resolveApplicationId();
  businessName = '';
  reviewState = 'Submitted';
  status = '';
  commercialAccessEnabled = false;
  requiredActions: VendorRequiredAction[] = [];
  rejectionReason = '';
  isProfileLoading = false;
  profileLoadFailed = false;
  lastCheckedAt: Date | null = null;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private authService: VendorAuthService,
    private profileService: VendorProfileService
  ) {}

  ngOnInit(): void {
    if (this.authService.isVendorStaffSession) {
      void this.router.navigate(['/dashboard']);
      return;
    }

    this.businessName = repairUtf8Mojibake(
      localStorage.getItem('onboarding_biz_name') || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME')
    );

    if (!this.authService.hasApiSession) {
      return;
    }

    this.startProfileRefresh();
  }

  ngOnDestroy(): void {
    this.profileRefreshSub?.unsubscribe();
  }

  localizeMessage(message?: string | null): string {
    return resolveLocalizedMessage(message, this.translate.currentLang || 'ar');
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.cdr.markForCheck();
        void this.router.navigate(['/login']);
      }
    });
  }

  goDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }

  goOnboardingEdit(): void {
    void this.router.navigate(['/onboarding'], { queryParams: { mode: 'edit' } });
  }

  get isActive(): boolean {
    return canAccessVendorDashboard({
      status: this.status,
      reviewState: this.reviewState,
      commercialAccessEnabled: this.commercialAccessEnabled
    });
  }

  get isRejected(): boolean {
    return this.normalizedReviewState === 'rejected' || this.normalizedStatus === 'rejected';
  }

  get showEditButton(): boolean {
    return this.normalizedReviewState === 'changesrequested'
      || this.normalizedReviewState === 'pendingvendor'
      || this.isRejected
      || this.requiredActions.length > 0;
  }

  get statusLabelKey(): string {
    if (this.isActive) {
      return 'ONBOARDING.SUCCESS_PAGE.STATUS_ACTIVE';
    }

    if (this.isRejected) {
      return 'ONBOARDING.SUCCESS_PAGE.STATUS_REJECTED';
    }

    if (this.showEditButton) {
      return 'ONBOARDING.SUCCESS_PAGE.STATUS_CHANGES_REQUESTED';
    }

    switch (this.normalizedReviewState) {
      case 'verified':
      case 'approved':
      case 'active':
        return 'ONBOARDING.SUCCESS_PAGE.STATUS_ACTIVE';
      case 'underreview':
        return 'ONBOARDING.SUCCESS_PAGE.STATUS_UNDER_REVIEW';
      case 'submitted':
        return 'ONBOARDING.SUCCESS_PAGE.STATUS_SUBMITTED';
      default:
        return 'ONBOARDING.SUCCESS_PAGE.STATUS_PENDING';
    }
  }

  get heroTitleKey(): string {
    if (this.isActive) {
      return 'ONBOARDING.SUCCESS_PAGE.ACTIVE_HERO_TITLE';
    }

    if (this.isRejected) {
      return 'ONBOARDING.SUCCESS_PAGE.REJECTED_HERO_TITLE';
    }

    if (this.showEditButton) {
      return 'ONBOARDING.SUCCESS_PAGE.ACTION_HERO_TITLE';
    }

    return 'ONBOARDING.SUCCESS_PAGE.REVIEW_HERO_TITLE';
  }

  get heroDescriptionKey(): string {
    if (this.isActive) {
      return 'ONBOARDING.SUCCESS_PAGE.ACTIVE_HERO_DESCRIPTION';
    }

    if (this.isRejected) {
      return 'ONBOARDING.SUCCESS_PAGE.REJECTED_HERO_DESCRIPTION';
    }

    if (this.showEditButton) {
      return 'ONBOARDING.SUCCESS_PAGE.ACTION_HERO_DESCRIPTION';
    }

    return 'ONBOARDING.SUCCESS_PAGE.REVIEW_HERO_DESCRIPTION';
  }

  get stampLabelKey(): string {
    if (this.isActive) {
      return 'ONBOARDING.SUCCESS_PAGE.ACTIVE_STAMP';
    }

    if (this.isRejected) {
      return 'ONBOARDING.SUCCESS_PAGE.REJECTED_STAMP';
    }

    if (this.showEditButton) {
      return 'ONBOARDING.SUCCESS_PAGE.ACTION_STAMP';
    }

    return 'ONBOARDING.SUCCESS_PAGE.REVIEW_STAMP';
  }

  get hintTitleKey(): string {
    if (this.isActive) {
      return 'ONBOARDING.SUCCESS_PAGE.ACTIVE_HINT_TITLE';
    }

    if (this.showEditButton) {
      return 'ONBOARDING.SUCCESS_PAGE.ACTION_HINT_TITLE';
    }

    return 'ONBOARDING.SUCCESS_PAGE.PENDING_HINT_TITLE';
  }

  get hintKey(): string {
    if (this.isActive) {
      return 'ONBOARDING.SUCCESS_PAGE.ACTIVE_HINT';
    }

    if (this.showEditButton) {
      return 'ONBOARDING.SUCCESS_PAGE.ACTION_HINT';
    }

    return 'ONBOARDING.SUCCESS_PAGE.PENDING_HINT';
  }

  get statusBadgeVariant(): StatusChipTone {
    if (this.isActive) {
      return 'success';
    }

    if (this.isRejected) {
      return 'error';
    }

    if (this.showEditButton) {
      return 'warning';
    }

    return 'info';
  }

  get stateClass(): string {
    if (this.isActive) {
      return 'is-active';
    }

    if (this.isRejected) {
      return 'is-rejected';
    }

    if (this.showEditButton) {
      return 'is-action';
    }

    return 'is-review';
  }

  get statusIcon(): string {
    if (this.isActive) {
      return 'verified';
    }

    if (this.isRejected) {
      return 'report';
    }

    if (this.showEditButton) {
      return 'edit_note';
    }

    return 'pending_actions';
  }

  get summaryStatusClass(): string {
    if (this.isActive) {
      return 'text-emerald-600';
    }

    if (this.isRejected) {
      return 'text-rose-600';
    }

    if (this.showEditButton) {
      return 'text-amber-700';
    }

    return 'text-sky-700';
  }

  get isRTL(): boolean {
    return this.translate.currentLang === 'ar';
  }

  private startProfileRefresh(): void {
    this.profileRefreshSub?.unsubscribe();
    this.profileRefreshSub = interval(this.profileRefreshMs).pipe(
      startWith(0),
      switchMap(() => {
        this.isProfileLoading = true;
        this.profileLoadFailed = false;
        this.cdr.markForCheck();

        return this.profileService.loadProfileForGuard(true).pipe(
          catchError(() => {
            this.profileLoadFailed = true;
            return of<VendorProfile | null>(null);
          })
        );
      })
    ).subscribe((profile) => {
      this.isProfileLoading = false;
      this.lastCheckedAt = new Date();

      if (profile) {
        this.applyProfile(profile);
      }

      this.cdr.markForCheck();
    });
  }

  private applyProfile(profile: VendorProfile): void {
    this.businessName = repairUtf8Mojibake(profile.storeNameAr || profile.storeNameEn || this.businessName);
    this.status = profile.status || '';
    this.commercialAccessEnabled = !!profile.commercialAccessEnabled;
    this.reviewState = profile.reviewState || (this.isActive ? 'Verified' : 'Submitted');
    this.requiredActions = profile.requiredActions || [];
    this.rejectionReason = profile.rejectionReason || '';
  }

  private get normalizedReviewState(): string {
    return this.normalizeState(this.reviewState);
  }

  private get normalizedStatus(): string {
    return this.normalizeState(this.status);
  }

  private normalizeState(value?: string | null): string {
    return `${value || ''}`.trim().replace(/[\s_-]+/g, '').toLowerCase();
  }

  private resolveApplicationId(): string {
    const storageKey = 'onboarding_application_id';
    const existing = localStorage.getItem(storageKey);

    if (existing) {
      return existing;
    }

    const next = 'ZDN-' + Math.floor(Math.random() * 9000000 + 1000000);
    localStorage.setItem(storageKey, next);
    return next;
  }
}
