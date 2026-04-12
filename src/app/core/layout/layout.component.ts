import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { VendorProfileService } from '../../features/settings/services/vendor-profile.service';
import { VendorAuthService } from '../auth/services/vendor-auth.service';

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
  private langSub?: Subscription;
  private profileSub?: Subscription;

  constructor(
    private readonly translate: TranslateService,
    private readonly router: Router,
    private readonly profileService: VendorProfileService,
    private readonly authService: VendorAuthService
  ) {}

  ngOnInit(): void {
    this.currentLang = this.translate.currentLang || 'ar';
    this.updateHtmlAttributes(this.currentLang);
    this.userRole = this.translate.instant('SETTINGS_PROFILE.ROLE_LABEL');
    this.profileService.loadProfile().subscribe();

    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.updateHtmlAttributes(this.currentLang);
      this.userRole = this.translate.instant('SETTINGS_PROFILE.ROLE_LABEL');

      const profile = this.profileService.getProfileSnapshot();
      this.userName = this.currentLang === 'ar'
        ? (profile.storeNameAr || profile.storeNameEn || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME'))
        : (profile.storeNameEn || profile.storeNameAr || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME'));
      this.initials = this.buildInitials(this.userName);
    });

    this.profileSub = this.profileService.getProfile().subscribe((profile) => {
      this.userName = this.currentLang === 'ar'
        ? (profile.storeNameAr || profile.storeNameEn || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME'))
        : (profile.storeNameEn || profile.storeNameAr || this.translate.instant('COMMON.DEFAULT_VENDOR_NAME'));
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
}
