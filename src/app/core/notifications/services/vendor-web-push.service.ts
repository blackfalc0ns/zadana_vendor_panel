import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { distinctUntilChanged, firstValueFrom, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorCurrentUser } from '../../auth/models/vendor-auth.models';
import { VendorAuthService } from '../../auth/services/vendor-auth.service';

type OneSignalInitOptions = {
  appId: string;
  allowLocalhostAsSecureOrigin?: boolean;
};

type OneSignalSdk = {
  init(options: OneSignalInitOptions): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
  Notifications: {
    permission: boolean;
    isPushSupported(): boolean;
    requestPermission(): Promise<void>;
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalSdk) => void>;
  }
}

@Injectable({
  providedIn: 'root'
})
export class VendorWebPushService implements OnDestroy {
  private static readonly sdkScriptId = 'onesignal-web-sdk';
  private readonly authSubscription = new Subscription();
  private readonly promptPrefix = 'vendor_onesignal_prompted_';
  private sdkPromise?: Promise<OneSignalSdk | null>;
  private lastExternalId: string | null = null;
  private initialized = false;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: VendorAuthService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  initialize(): void {
    if (this.initialized || !environment.oneSignal.enabled || !environment.oneSignal.appId) {
      return;
    }

    this.initialized = true;

    this.authSubscription.add(
      this.authService.currentUser$
        .pipe(distinctUntilChanged((previous, current) => previous?.id === current?.id))
        .subscribe((user) => {
          void this.syncUser(user);
        })
    );
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  private async syncUser(user: VendorCurrentUser | null): Promise<void> {
    if (!user?.id && !this.lastExternalId) {
      return;
    }

    const oneSignal = await this.loadSdk();
    if (!oneSignal) {
      return;
    }

    if (!user?.id) {
      if (this.lastExternalId) {
        await this.runDeferred(async (sdk) => {
          await sdk.logout();
        });
        this.lastExternalId = null;
      }

      return;
    }

    if (this.lastExternalId !== user.id) {
      await this.runDeferred(async (sdk) => {
        await sdk.login(user.id);
      });
      this.lastExternalId = user.id;
    }

    if (environment.oneSignal.autoPrompt) {
      await this.promptForPermissionOnce(user.id);
    }

    await this.triggerLoginTestNotificationIfPending(user);
  }

  private async promptForPermissionOnce(externalId: string): Promise<void> {
    const storageKey = `${this.promptPrefix}${externalId}`;
    const existingState = localStorage.getItem(storageKey);
    if (existingState === 'granted' || existingState === 'denied') {
      return;
    }

    await this.runDeferred(async (sdk) => {
      if (!sdk.Notifications.isPushSupported() || sdk.Notifications.permission) {
        localStorage.setItem(storageKey, sdk.Notifications.permission ? 'granted' : 'skipped');
        return;
      }

      await sdk.Notifications.requestPermission();

      const browserPermission = this.resolveBrowserNotificationPermission();
      if (browserPermission === 'granted' || browserPermission === 'denied') {
        localStorage.setItem(storageKey, browserPermission);
      }
    });
  }

  private async loadSdk(): Promise<OneSignalSdk | null> {
    if (!environment.oneSignal.enabled || !environment.oneSignal.appId) {
      return null;
    }

    if (this.sdkPromise) {
      return this.sdkPromise;
    }

    this.sdkPromise = new Promise<OneSignalSdk | null>((resolve) => {
      const view = this.document.defaultView;
      if (!view) {
        resolve(null);
        return;
      }

      view.OneSignalDeferred = view.OneSignalDeferred || [];
      const completeInit = () => {
        view.OneSignalDeferred!.push(async (oneSignal) => {
          try {
            await oneSignal.init({
              appId: environment.oneSignal.appId,
              allowLocalhostAsSecureOrigin: this.isLocalhost()
            });
            resolve(oneSignal);
          } catch (error) {
            console.error('OneSignal initialization failed.', error);
            resolve(null);
          }
        });
      };

      const existingScript = this.document.getElementById(VendorWebPushService.sdkScriptId) as HTMLScriptElement | null;
      if (existingScript) {
        completeInit();
        return;
      }

      const script = this.document.createElement('script');
      script.id = VendorWebPushService.sdkScriptId;
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      script.onload = () => completeInit();
      script.onerror = () => {
        console.error('Failed to load OneSignal Web SDK.');
        resolve(null);
      };

      this.document.head.appendChild(script);
    });

    return this.sdkPromise;
  }

  private async runDeferred(operation: (oneSignal: OneSignalSdk) => Promise<void>): Promise<void> {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    const oneSignal = await this.loadSdk();
    if (!oneSignal) {
      return;
    }

    await new Promise<void>((resolve) => {
      view.OneSignalDeferred = view.OneSignalDeferred || [];
      view.OneSignalDeferred.push(async (sdk) => {
        try {
          await operation(sdk);
        } catch (error) {
          console.error('OneSignal operation failed.', error);
        } finally {
          resolve();
        }
      });
    });
  }

  private isLocalhost(): boolean {
    const host = this.document.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  }

  private resolveBrowserNotificationPermission(): NotificationPermission | null {
    const view = this.document.defaultView;
    if (!view || !('Notification' in view)) {
      return null;
    }

    return view.Notification.permission;
  }

  private async triggerLoginTestNotificationIfPending(user: VendorCurrentUser): Promise<void> {
    if (!this.authService.consumePendingLoginNotificationTestUserId(user.id)) {
      return;
    }

    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/vendor/notifications/test`, {
        titleAr: 'إشعار اختبار بعد تسجيل الدخول',
        titleEn: 'Login notification test',
        bodyAr: 'تم إرسال هذا الإشعار تلقائيًا بعد تسجيل دخول التاجر للتأكد من ربط OneSignal.',
        bodyEn: 'This notification was sent automatically after vendor login to verify OneSignal is connected.',
        type: 'vendor_login_test',
        targetUrl: '/alerts',
        data: JSON.stringify({
          source: 'vendor_login_test',
          userId: user.id,
          generatedAtUtc: new Date().toISOString()
        }),
        sendPush: true
      }));
    } catch (error) {
      console.error('Vendor login notification test failed.', error);
    }
  }
}
