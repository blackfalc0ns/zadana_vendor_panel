import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VendorAuthService } from './core/auth/services/vendor-auth.service';
import { AlertsCenterService } from './features/alerts/services/alerts-center.service';
import { VendorWebPushService } from './core/notifications/services/vendor-web-push.service';

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
    private readonly alertsCenterService: AlertsCenterService,
    private readonly vendorWebPushService: VendorWebPushService,
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
    this.scheduleVendorAlertsMonitoring();
    this.scheduleVendorWebPushBootstrap();
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

  private scheduleVendorAlertsMonitoring(): void {
    const startMonitoring = () => {
      this.alertsCenterService.startMonitoring();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }).requestIdleCallback(
        () => startMonitoring()
      );
      return;
    }

    setTimeout(startMonitoring, 0);
  }

  private scheduleVendorWebPushBootstrap(): void {
    const startWebPush = () => {
      this.vendorWebPushService.initialize();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }).requestIdleCallback(
        () => startWebPush()
      );
      return;
    }

    setTimeout(startWebPush, 0);
  }
}
