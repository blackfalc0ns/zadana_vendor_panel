import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { VendorProfileService } from '../../features/settings/services/vendor-profile.service';
import { VendorAuthService } from '../auth/services/vendor-auth.service';
import { VendorProfile } from '../../features/settings/models/vendor-profile.models';
import { repairUtf8Mojibake } from '../../shared/utils/text-normalization.util';

@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  currentLang = 'ar';
  userName = 'Vendor User';
  userRole = 'Vendor Account';
  initials = 'VU';
  activationProfile: VendorProfile;
  private langSub?: Subscription;
  private profileSub?: Subscription;

  constructor(
    private readonly translate: TranslateService,
    private readonly router: Router,
    private readonly profileService: VendorProfileService,
    private readonly authService: VendorAuthService
  ) {
    this.activationProfile = this.profileService.getProfileSnapshot();
  }

  ngOnInit(): void {
    this.currentLang = this.translate.currentLang || 'ar';
    this.updateHtmlAttributes(this.currentLang);
    this.userRole = this.translate.instant('SETTINGS_PROFILE.ROLE_LABEL');
    this.scheduleProfilePrefetch();

    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.updateHtmlAttributes(this.currentLang);
      this.userRole = this.translate.instant('SETTINGS_PROFILE.ROLE_LABEL');

      const profile = this.profileService.getProfileSnapshot();
      this.userName = this.resolveDisplayName(profile);
      this.initials = this.buildInitials(this.userName);
    });

    this.profileSub = this.profileService.getProfile().subscribe((profile) => {
      this.activationProfile = profile;
      this.userName = this.resolveDisplayName(profile);
      this.initials = this.buildInitials(this.userName);
      localStorage.setItem('onboarding_biz_name', this.userName);
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.profileSub?.unsubscribe();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  switchLanguage(): void {
    const newLang = this.currentLang === 'ar' ? 'en' : 'ar';
    this.translate.use(newLang);
    this.currentLang = newLang;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        void this.router.navigate(['/login']);
      }
    });
  }

  get showActivationBanner(): boolean {
    return !this.activationProfile.commercialAccessEnabled;
  }

  get activationBannerToneClasses(): string {
    switch ((this.activationProfile.reviewState || '').toLowerCase()) {
      case 'changesrequested':
        return 'border-amber-200 bg-amber-50/90 text-amber-950';
      case 'rejected':
      case 'suspended':
        return 'border-rose-200 bg-rose-50/90 text-rose-950';
      default:
        return 'border-sky-200 bg-sky-50/90 text-sky-950';
    }
  }

  get activationStateLabel(): string {
    switch ((this.activationProfile.reviewState || '').toLowerCase()) {
      case 'awaitingsubmission':
        return this.currentLang === 'ar' ? 'بانتظار الإرسال للمراجعة' : 'Awaiting submission';
      case 'submitted':
        return this.currentLang === 'ar' ? 'تم الإرسال للمراجعة' : 'Submitted for review';
      case 'underreview':
        return this.currentLang === 'ar' ? 'قيد المراجعة' : 'Under review';
      case 'changesrequested':
        return this.currentLang === 'ar' ? 'مطلوب تعديلات' : 'Changes requested';
      case 'rejected':
        return this.currentLang === 'ar' ? 'مرفوض' : 'Rejected';
      case 'suspended':
        return this.currentLang === 'ar' ? 'معلق' : 'Suspended';
      default:
        return this.currentLang === 'ar' ? 'غير مفعل' : 'Not activated';
    }
  }

  get activationSummary(): string {
    if (this.activationProfile.requiredActions.length > 0) {
      return repairUtf8Mojibake(this.activationProfile.requiredActions[0].message);
    }

    if (this.activationProfile.lastReviewDecision) {
      return repairUtf8Mojibake(this.activationProfile.lastReviewDecision);
    }

    return this.currentLang === 'ar'
      ? 'يمكنك الدخول لكل أجزاء اللوحة، لكن النشر والطلبات والتسويات ستظل محجوبة حتى الاعتماد النهائي.'
      : 'You can access the full workspace, but publishing, orders, and payouts stay blocked until final approval.';
  }

  private updateHtmlAttributes(lang: string): void {
    const htmlTag = document.getElementsByTagName('html')[0];
    htmlTag.dir = lang === 'ar' ? 'rtl' : 'ltr';
    htmlTag.lang = lang;
  }

  private buildInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
    }

    return (name || 'VU').substring(0, 2).toUpperCase();
  }

  private resolveDisplayName(profile: VendorProfile): string {
    const rawName = this.currentLang === 'ar'
      ? (profile.storeNameAr || profile.storeNameEn || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME'))
      : (profile.storeNameEn || profile.storeNameAr || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME'));

    return repairUtf8Mojibake(rawName);
  }

  private scheduleProfilePrefetch(): void {
    const loadProfile = () => {
      this.profileService.loadProfile().subscribe();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }).requestIdleCallback(
        () => loadProfile()
      );
      return;
    }

    setTimeout(loadProfile, 250);
  }
}
