import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VendorAuthService } from './core/auth/services/vendor-auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Zadna Vendor Panel';
  currentLang = 'ar';

  constructor(
    private readonly translate: TranslateService,
    private readonly authService: VendorAuthService,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly renderer: Renderer2
  ) {
    const savedLang = localStorage.getItem('lang') || 'ar';

    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('ar');
    this.currentLang = savedLang;
    this.setDocumentDirection(savedLang);

    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.setDocumentDirection(event.lang);
      localStorage.setItem('lang', event.lang);
    });
  }

  ngOnInit(): void {
    this.scheduleNonBlockingSessionBootstrap();
  }

  switchLanguage(lang: 'ar' | 'en'): void {
    if (lang !== this.currentLang) {
      this.translate.use(lang);
    }
  }

  private setDocumentDirection(lang: string): void {
    const htmlTag = this.document.documentElement;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';

    this.renderer.setAttribute(htmlTag, 'dir', dir);
    this.renderer.setAttribute(htmlTag, 'lang', lang);
  }

  private scheduleNonBlockingSessionBootstrap(): void {
    if (!this.authService.hasApiSession) {
      return;
    }

    const bootstrap = () => {
      void this.authService.initializeSession();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }).requestIdleCallback(
        () => bootstrap()
      );
      return;
    }

    setTimeout(bootstrap, 0);
  }
}
