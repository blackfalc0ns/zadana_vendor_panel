import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  isMobileMenuOpen = false;
  currentLang = 'ar';
  userName = 'Vendor User';
  userRole = 'VENDOR_ACCOUNT';
  initials = 'VU';

  constructor(
    private translate: TranslateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentLang = this.translate.currentLang || 'ar';
    this.updateHtmlAttributes(this.currentLang);

    // Sync current lang on language change event
    this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
      this.updateHtmlAttributes(this.currentLang);
      
      // Update default name if not customized
      if (!localStorage.getItem('onboarding_biz_name')) {
        this.userName = this.translate.instant('COMMON.DEFAULT_VENDOR_NAME');
        this.initials = this.userName.substring(0, 2).toUpperCase();
      }
    });

    // Heal broken Arabic text if present in localStorage
    const storedName = localStorage.getItem('onboarding_biz_name');
    
    // Check for common Mojibake patterns (broken UTF-8 interpreted as ANSI/Latin1)
    const isBroken = storedName && (storedName.includes('Ù') || storedName.includes('Ø') || storedName.includes('Ø§'));

    if (isBroken) {
      // Detected Mojibake - reset to correct default for better UX
      const healedName = this.translate.instant('COMMON.DEFAULT_VENDOR_NAME');
      localStorage.setItem('onboarding_biz_name', healedName);
      this.userName = healedName;
    } else if (storedName) {
      this.userName = storedName;
    } else {
      this.userName = this.translate.instant('COMMON.DEFAULT_VENDOR_NAME');
    }

    this.initials = (this.userName || 'VU').substring(0, 2).toUpperCase();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  switchLanguage(): void {
    const newLang = this.currentLang === 'ar' ? 'en' : 'ar';
    this.translate.use(newLang);
    this.currentLang = newLang;
  }

  private updateHtmlAttributes(lang: string): void {
    const htmlTag = document.getElementsByTagName('html')[0];
    htmlTag.dir = lang === 'ar' ? 'rtl' : 'ltr';
    htmlTag.lang = lang;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
