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
  User?: {
    PushSubscription?: {
      id?: string | null;
      token?: string | null;
      optedIn?: boolean;
      optIn?: () => Promise<void>;
      addEventListener?: (event: 'change', listener: () => void) => void;
    };
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
  private static readonly browserDeviceIdKey = 'vendor_onesignal_browser_device_id';
  private readonly authSubscription = new Subscription();
  private readonly promptPrefix = 'vendor_onesignal_prompted_';
  private readonly devicesUrl = `${environment.apiUrl}/notifications/devices`;
  private sdkPromise?: Promise<OneSignalSdk | null>;
  private lastExternalId: string | null = null;
  private lastRegisteredSubscriptionState: string | null = null;
  private initialized = false;
  private sdkUnavailableLogged = false;

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
      this.lastRegisteredSubscriptionState = null;
    }

    if (environment.oneSignal.autoPrompt) {
      await this.promptForPermissionOnce(user.id);
    }

    if (this.resolveBrowserNotificationPermission() === 'granted') {
      await this.runDeferred(async (sdk) => {
        await sdk.User?.PushSubscription?.optIn?.();
      });
    }

    const registered = await this.registerCurrentSubscription(oneSignal, user.id);
    if (registered) {
      await this.triggerLoginTestNotificationIfPending(user);
    }
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
            oneSignal.User?.PushSubscription?.addEventListener?.('change', () => {
              const currentUser = this.authService.currentUserSnapshot;
              if (!currentUser?.id || !this.authService.hasApiSession) {
                return;
              }

              void this.registerCurrentSubscription(oneSignal, currentUser.id).then((registered) => {
                if (registered) {
                  return this.triggerLoginTestNotificationIfPending(currentUser);
                }

                return undefined;
              });
            });
            resolve(oneSignal);
          } catch (error) {
            this.reportSdkUnavailable('OneSignal initialization failed. Web push will stay disabled for this session.', error);
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
        this.reportSdkUnavailable('OneSignal Web SDK was blocked or unavailable. Web push will stay disabled for this session.');
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
          if (!environment.production) {
            console.warn('OneSignal operation failed.', error);
          }
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

  private async registerCurrentSubscription(oneSignal: OneSignalSdk, userId: string): Promise<boolean> {
    const subscription = oneSignal.User?.PushSubscription;
    const subscriptionId = subscription?.id?.trim() || null;
    const browserPermission = this.resolveBrowserNotificationPermission();
    const optedIn = subscription?.optedIn === true && browserPermission === 'granted';

    if (!subscriptionId) {
      return false;
    }

    const registrationState = `${subscriptionId}:${optedIn}`;
    if (this.lastRegisteredSubscriptionState === registrationState) {
      return optedIn;
    }

    try {
      await firstValueFrom(this.http.post(`${this.devicesUrl}/register`, {
        deviceToken: subscriptionId,
        oneSignalSubscriptionId: subscriptionId,
        platform: 'web',
        deviceId: this.getBrowserDeviceId(),
        deviceName: this.document.defaultView?.navigator.userAgent?.slice(0, 120) ?? 'Vendor browser',
        appVersion: 'vendor-panel',
        locale: this.document.documentElement.lang || localStorage.getItem('lang') || 'ar',
        notificationsEnabled: optedIn,
        dispatchPushEnabled: true,
        assignmentPushEnabled: true,
        supportPushEnabled: true,
        walletPushEnabled: true,
        accountPushEnabled: true
      }));

      this.lastRegisteredSubscriptionState = registrationState;
      return optedIn;
    } catch (error) {
      this.lastRegisteredSubscriptionState = null;
      if (!environment.production) {
        console.warn('OneSignal vendor device registration failed.', error);
      }
      return false;
    }
  }

  private getBrowserDeviceId(): string {
    const existing = localStorage.getItem(VendorWebPushService.browserDeviceIdKey);
    if (existing) {
      return existing;
    }

    const generated = this.document.defaultView?.crypto?.randomUUID?.()
      ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const deviceId = `vendor-web-${generated}`;
    localStorage.setItem(VendorWebPushService.browserDeviceIdKey, deviceId);
    return deviceId;
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
      if (!environment.production) {
        console.warn('Vendor login notification test failed.', error);
      }
    }
  }

  private reportSdkUnavailable(message: string, error?: unknown): void {
    if (this.sdkUnavailableLogged) {
      return;
    }

    this.sdkUnavailableLogged = true;

    if (!environment.production) {
      console.warn(message, error ?? '');
    }
  }
}
