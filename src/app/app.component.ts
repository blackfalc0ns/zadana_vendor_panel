import { Component, OnDestroy, OnInit, Renderer2, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, Router, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { VendorAuthService } from './core/auth/services/vendor-auth.service';
import { AlertsCenterService } from './features/alerts/services/alerts-center.service';
import { VendorWebPushService } from './core/notifications/services/vendor-web-push.service';
import { VendorProfileService } from './features/settings/services/vendor-profile.service';
import { ToastContainerComponent } from './shared/components/ui/feedback/toast-container/toast-container.component';
import { ConfirmDialogHostComponent } from './shared/components/ui/overlay/confirm-dialog-host/confirm-dialog-host.component';
import { AlertCenterItemVm } from './features/alerts/models/alerts-center.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule, ToastContainerComponent, ConfirmDialogHostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private routerEventsSub?: Subscription;
  private splashFallbackTimer?: ReturnType<typeof setTimeout>;
  title = 'Zadna Vendor Panel';
  currentLang = 'ar';

  constructor(
    private readonly translate: TranslateService,
    private readonly authService: VendorAuthService,
    private readonly alertsCenterService: AlertsCenterService,
    private readonly vendorProfileService: VendorProfileService,
    private readonly vendorWebPushService: VendorWebPushService
  ) {
    const savedLang = localStorage.getItem('lang') || 'ar';

    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('ar');
    this.currentLang = savedLang;
    this.setDocumentDirection(savedLang);

    this.translate.onLangChange.subscribe((event) => {
      this.cdr.markForCheck();
      this.currentLang = event.lang;
      this.setDocumentDirection(event.lang);
      localStorage.setItem('lang', event.lang);
    });
  }

  ngOnInit(): void {
    this.splashFallbackTimer = setTimeout(() => this.dismissSplash(), 2500);
    queueMicrotask(() => this.dismissSplash());

    if (this.authService.hasApiSession) {
      void this.authService.initializeSession();
      this.vendorProfileService.loadProfile(true).subscribe();
    }

    this.watchRouterEvents();

    queueMicrotask(() => {
      if (!this.authService.hasApiSession) {
        return;
      }

      this.alertsCenterService.startMonitoring();
      this.alertsCenterService.getRealtimeAlerts().subscribe((alert: AlertCenterItemVm) => {
        this.cdr.markForCheck();

        if (alert.route === '/profile' || alert.route === '/finance' || alert.source === 'profile') {
          this.vendorProfileService.loadProfile(true).subscribe();
        }
      });
      this.vendorWebPushService.initialize();
    });
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
    if (this.splashFallbackTimer) {
      clearTimeout(this.splashFallbackTimer);
    }
  }

  private watchRouterEvents(): void {
    this.routerEventsSub = this.router.events.subscribe((event) => {
      if (
        event instanceof NavigationEnd
        || event instanceof NavigationCancel
        || event instanceof NavigationError
        || event instanceof NavigationSkipped
      ) {
        this.dismissSplash();
        this.cdr.markForCheck();
      }
    });
  }

  private dismissSplash(): void {
    const splash = this.document.getElementById('app-loader');
    if (!splash || splash.dataset['dismissed'] === 'true') {
      return;
    }

    splash.dataset['dismissed'] = 'true';
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 450);
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
}
