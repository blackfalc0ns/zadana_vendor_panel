import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  isMobileMenuOpen = false;
  currentLang = 'ar';
  userName = 'مؤسسة التقنية الحديثة التجارية';
  userRole = 'VENDOR_ACCOUNT';
  initials = 'مت';

  constructor(
    private translate: TranslateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentLang = this.translate.currentLang || 'ar';
    // Sync current lang on language change event
    this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
    });

    const storedName = localStorage.getItem('onboarding_biz_name');
    if (storedName) {
      this.userName = storedName;
      this.initials = storedName.substring(0, 2).toUpperCase();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  switchLanguage(): void {
    const newLang = this.currentLang === 'ar' ? 'en' : 'ar';
    this.translate.use(newLang);
    this.currentLang = newLang;

    const htmlTag = document.getElementsByTagName('html')[0];
    htmlTag.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    htmlTag.lang = newLang;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
