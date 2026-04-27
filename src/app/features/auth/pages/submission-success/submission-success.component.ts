import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppCardComponent } from '../../../../shared/components/ui/card/card.component';
import { AppButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { AppBadgeComponent } from '../../../../shared/components/ui/feedback/badge/badge.component';
import { VendorAuthService } from '../../../../core/auth/services/vendor-auth.service';
import { VendorProfileService } from '../../../settings/services/vendor-profile.service';
import { VendorRequiredAction } from '../../../settings/models/vendor-profile.models';
import { repairUtf8Mojibake } from '../../../../shared/utils/text-normalization.util';

@Component({
  selector: 'app-submission-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    AppCardComponent,
    AppButtonComponent,
    AppBadgeComponent
  ],
  templateUrl: './submission-success.component.html',
  styleUrl: './submission-success.component.scss'
})
export class SubmissionSuccessComponent implements OnInit {
  today = new Date();
  applicationId = 'ZDN-' + Math.floor(Math.random() * 9000000 + 1000000);
  businessName = '';
  reviewState = 'Submitted';
  status = '';
  requiredActions: VendorRequiredAction[] = [];
  rejectionReason = '';

  constructor(
    private router: Router,
    private translate: TranslateService,
    private authService: VendorAuthService,
    private profileService: VendorProfileService
  ) {}

  ngOnInit(): void {
    this.businessName = repairUtf8Mojibake(
      localStorage.getItem('onboarding_biz_name') || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME')
    );

    if (!this.authService.hasApiSession) {
      return;
    }

    this.profileService.loadProfileForGuard(true).subscribe({
      next: (profile) => {
        this.businessName = profile.storeNameAr || profile.storeNameEn || this.businessName;
        this.reviewState = profile.reviewState || (profile.status === 'Active' ? 'Verified' : 'Submitted');
        this.status = profile.status;
        this.requiredActions = profile.requiredActions || [];
        this.rejectionReason = profile.rejectionReason || '';
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        void this.router.navigate(['/login']);
      }
    });
  }

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goOnboardingEdit(): void {
    void this.router.navigate(['/onboarding'], { queryParams: { mode: 'edit' } });
  }

  get isActive(): boolean {
    return this.status === 'Active' || this.reviewState === 'Verified';
  }

  get showEditButton(): boolean {
    return this.reviewState === 'ChangesRequested'
      || this.reviewState === 'Rejected'
      || this.status === 'Rejected'
      || this.requiredActions.length > 0;
  }

  get statusLabelKey(): string {
    switch (this.reviewState) {
      case 'Verified':
        return 'ONBOARDING.SUCCESS_PAGE.STATUS_ACTIVE';
      case 'UnderReview':
        return 'ONBOARDING.SUCCESS_PAGE.STATUS_UNDER_REVIEW';
      case 'ChangesRequested':
        return 'ONBOARDING.SUCCESS_PAGE.STATUS_CHANGES_REQUESTED';
      case 'Rejected':
        return 'ONBOARDING.SUCCESS_PAGE.STATUS_REJECTED';
      case 'Submitted':
        return 'ONBOARDING.SUCCESS_PAGE.STATUS_SUBMITTED';
      default:
        return this.status === 'Active'
          ? 'ONBOARDING.SUCCESS_PAGE.STATUS_ACTIVE'
          : 'ONBOARDING.SUCCESS_PAGE.STATUS_PENDING';
    }
  }

  get isRTL(): boolean {
    return this.translate.currentLang === 'ar';
  }
}

