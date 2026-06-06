import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, filter } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { VendorProfileService } from '../../features/settings/services/vendor-profile.service';
import { VendorAuthService } from '../auth/services/vendor-auth.service';
import { VendorAccessService } from '../auth/services/vendor-access.service';
import { VendorProfile } from '../../features/settings/models/vendor-profile.models';
import { repairUtf8Mojibake, resolveLocalizedMessage } from '../../shared/utils/text-normalization.util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  isMobileMenuOpen = false;
  isSidebarOpen = true;
  currentLang = 'ar';
  userName = '';
  userRole = 'Vendor Account';
  initials = 'Z';
  storeLogoUrl: string | null = null;
  activationProfile: VendorProfile;
  private langSub?: Subscription;
  private profileSub?: Subscription;
  private routerEventsSub?: Subscription;

  constructor(
    private readonly translate: TranslateService,
    private readonly router: Router,
    private readonly profileService: VendorProfileService,
    private readonly authService: VendorAuthService,
    private readonly accessService: VendorAccessService
  ) {
    this.activationProfile = this.profileService.getProfileSnapshot();
    this.applyProfilePresentation(this.activationProfile);
  }

  ngOnInit(): void {
    const savedSidebarState = localStorage.getItem('vendor_sidebar_open');
    if (savedSidebarState !== null) {
      this.isSidebarOpen = savedSidebarState === '1';
    }

    this.currentLang = this.translate.currentLang || 'ar';
    this.updateHtmlAttributes(this.currentLang);
    this.userRole = this.translate.instant('SETTINGS_PROFILE.ROLE_LABEL');

    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.cdr.markForCheck();
      this.currentLang = event.lang;
      this.updateHtmlAttributes(this.currentLang);
      this.userRole = this.translate.instant('SETTINGS_PROFILE.ROLE_LABEL');
      this.applyProfilePresentation(this.activationProfile);
    });

    this.profileSub = this.profileService.getProfile().subscribe((profile) => {
      this.cdr.markForCheck();
      this.activationProfile = profile;
      this.applyProfilePresentation(profile);
    });

    this.routerEventsSub = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isMobileMenuOpen = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.profileSub?.unsubscribe();
    this.routerEventsSub?.unsubscribe();
  }

  onChildRouteActivated(): void {
    this.cdr.markForCheck();
  }

  toggleSidebar(): void {
    if (this.isDesktopViewport()) {
      this.isSidebarOpen = !this.isSidebarOpen;
      localStorage.setItem('vendor_sidebar_open', this.isSidebarOpen ? '1' : '0');
    } else {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }

    this.cdr.markForCheck();
  }

  closeSidebar(): void {
    if (this.isDesktopViewport()) {
      this.isSidebarOpen = false;
      localStorage.setItem('vendor_sidebar_open', '0');
    } else {
      this.isMobileMenuOpen = false;
    }

    this.cdr.markForCheck();
  }

  private isDesktopViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  }

  switchLanguage(): void {
    const newLang = this.currentLang === 'ar' ? 'en' : 'ar';
    this.translate.use(newLang);
    this.currentLang = newLang;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.cdr.markForCheck();
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
      return resolveLocalizedMessage(this.activationProfile.requiredActions[0].message, this.currentLang);
    }

    if (this.activationProfile.lastReviewDecision) {
      return resolveLocalizedMessage(this.activationProfile.lastReviewDecision, this.currentLang);
    }

    return this.currentLang === 'ar'
      ? 'يمكنك الدخول لكل أجزاء اللوحة، لكن النشر والطلبات والتسويات ستظل محجوبة حتى الاعتماد النهائي.'
      : 'You can access the full workspace, but publishing, orders, and payouts stay blocked until final approval.';
  }

  localizeMessage(message?: string | null): string {
    return resolveLocalizedMessage(message, this.currentLang);
  }

  get canAccessSupport(): boolean {
    return this.accessService.hasPermission('vendor_support.view');
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
    const preferredName = this.currentLang === 'ar'
      ? (profile.storeNameAr || profile.storeNameEn)
      : (profile.storeNameEn || profile.storeNameAr);

    if (preferredName?.trim()) {
      return repairUtf8Mojibake(preferredName.trim());
    }

    const cachedName = localStorage.getItem('onboarding_biz_name')?.trim();
    if (cachedName) {
      return repairUtf8Mojibake(cachedName);
    }

    const authName = this.authService.currentUserSnapshot?.fullName?.trim();
    if (authName) {
      return repairUtf8Mojibake(authName);
    }

    return this.translate.instant('COMMON.DEFAULT_VENDOR_NAME');
  }

  private applyProfilePresentation(profile: VendorProfile): void {
    this.userName = this.resolveDisplayName(profile);
    this.initials = this.buildInitials(this.userName);
    this.storeLogoUrl = profile.logoUrl?.trim() || null;
  }
}
