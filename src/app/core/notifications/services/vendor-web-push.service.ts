import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { distinctUntilChanged, firstValueFrom, Observable, Subject, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorCurrentUser } from '../../auth/models/vendor-auth.models';
import { VendorAuthService } from '../../auth/services/vendor-auth.service';

export interface VendorOneSignalPushPayload {
  notificationId: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  type?: string | null;
  referenceId?: string | null;
  dataObject?: Record<string, unknown> | null;
  targetUrl?: string | null;
  createdAtUtc: string;
}

type OneSignalInitOptions = {
  appId: string;
  allowLocalhostAsSecureOrigin?: boolean;
  serviceWorkerPath?: string;
  serviceWorkerUpdaterPath?: string;
  serviceWorkerParam?: {
    scope: string;
  };
};

type OneSignalNotificationLike = {
  notificationId?: string;
  title?: string;
  body?: string;
  additionalData?: Record<string, unknown> | null;
  launchURL?: string | null;
};

type OneSignalForegroundDisplayEvent = {
  notification: OneSignalNotificationLike;
  preventDefault?: () => void;
};

type OneSignalClickEvent = {
  notification: OneSignalNotificationLike;
};

type OneSignalSdk = {
  init(options: OneSignalInitOptions): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
  Notifications: {
    permission: boolean;
    isPushSupported(): boolean;
    requestPermission(): Promise<void>;
    addEventListener?(
      event: 'foregroundWillDisplay' | 'click',
      listener: (event: OneSignalForegroundDisplayEvent | OneSignalClickEvent) => void
    ): void;
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
  private static readonly subscriptionReadyAttempts = 12;
  private static readonly subscriptionReadyDelayMs = 500;
  private readonly authSubscription = new Subscription();
  private readonly promptPrefix = 'vendor_onesignal_prompted_';
  private readonly devicesUrl = `${environment.apiUrl}/notifications/devices`;
  private readonly foregroundPushSubject = new Subject<VendorOneSignalPushPayload>();
  private sdkPromise?: Promise<OneSignalSdk | null>;
  private lastExternalId: string | null = null;
  private lastRegisteredSubscriptionState: string | null = null;
  private initialized = false;
  private sdkUnavailableLogged = false;
  private visibilityHandler?: () => void;
  private focusHandler?: () => void;
  private listenersBound = false;

  readonly foregroundPushes$: Observable<VendorOneSignalPushPayload> =
    this.foregroundPushSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: VendorAuthService,
    private readonly router: Router,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  initialize(): void {
    if (this.initialized || !environment.oneSignal.enabled || !environment.oneSignal.appId) {
      return;
    }

    this.initialized = true;
    this.bindLifecycleHandlers();

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
    this.unbindLifecycleHandlers();
    this.foregroundPushSubject.complete();
  }

  private bindLifecycleHandlers(): void {
    const view = this.document.defaultView;
    if (!view || this.visibilityHandler) {
      return;
    }

    this.visibilityHandler = () => {
      if (this.document.visibilityState === 'visible') {
        void this.refreshSubscriptionForCurrentUser();
      }
    };
    this.focusHandler = () => {
      void this.refreshSubscriptionForCurrentUser();
    };

    view.addEventListener('visibilitychange', this.visibilityHandler);
    view.addEventListener('focus', this.focusHandler);
  }

  private unbindLifecycleHandlers(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    if (this.visibilityHandler) {
      view.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = undefined;
    }

    if (this.focusHandler) {
      view.removeEventListener('focus', this.focusHandler);
      this.focusHandler = undefined;
    }
  }

  private async refreshSubscriptionForCurrentUser(): Promise<void> {
    const user = this.authService.currentUserSnapshot;
    if (!user?.id || !this.authService.hasApiSession) {
      return;
    }

    const oneSignal = await this.loadSdk();
    if (!oneSignal) {
      return;
    }

    if (this.resolveBrowserNotificationPermission() === 'granted') {
      await this.runDeferred(async (sdk) => {
        await sdk.User?.PushSubscription?.optIn?.();
      });
    }

    await this.waitForActiveSubscription(oneSignal, user.id);
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

    const registered = await this.waitForActiveSubscription(oneSignal, user.id);
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
              allowLocalhostAsSecureOrigin: this.isLocalhost(),
              serviceWorkerPath: 'OneSignalSDKWorker.js',
              serviceWorkerUpdaterPath: 'OneSignalSDKUpdaterWorker.js',
              serviceWorkerParam: {
                scope: '/'
              }
            });
            this.bindNotificationListeners(oneSignal);
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
            this.reportSdkUnavailable(
              'OneSignal initialization failed. Web push will stay disabled for this session.',
              error
            );
            resolve(null);
          }
        });
      };

      const existingScript = this.document.getElementById(
        VendorWebPushService.sdkScriptId
      ) as HTMLScriptElement | null;
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
        this.reportSdkUnavailable(
          'OneSignal Web SDK was blocked or unavailable. Web push will stay disabled for this session.'
        );
        resolve(null);
      };

      this.document.head.appendChild(script);
    });

    return this.sdkPromise;
  }

  private bindNotificationListeners(oneSignal: OneSignalSdk): void {
    if (this.listenersBound || !oneSignal.Notifications.addEventListener) {
      return;
    }

    this.listenersBound = true;

    oneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      const displayEvent = event as OneSignalForegroundDisplayEvent;
      const payload = this.mapNotificationPayload(displayEvent.notification);
      if (!payload) {
        return;
      }

      // Suppress OneSignal's own UI; AlertsCenter shows a single Windows notification.
      displayEvent.preventDefault?.();
      this.foregroundPushSubject.next(payload);
    });

    oneSignal.Notifications.addEventListener('click', (event) => {
      const clickEvent = event as OneSignalClickEvent;
      const payload = this.mapNotificationPayload(clickEvent.notification);
      const route = this.resolveRouteFromPush(payload, clickEvent.notification.launchURL);
      if (!route) {
        return;
      }

      void this.router.navigateByUrl(route);
    });
  }

  private mapNotificationPayload(
    notification: OneSignalNotificationLike | undefined
  ): VendorOneSignalPushPayload | null {
    if (!notification) {
      return null;
    }

    const data = notification.additionalData ?? {};
    const notificationId = String(
      data['notificationId'] ?? notification.notificationId ?? `onesignal-${Date.now()}`
    );
    const title = String(notification.title ?? '').trim();
    const body = String(notification.body ?? '').trim();
    const titleAr = String(data['titleAr'] ?? title);
    const titleEn = String(data['titleEn'] ?? title);
    const bodyAr = String(data['bodyAr'] ?? body);
    const bodyEn = String(data['bodyEn'] ?? body);

    if (!titleAr && !titleEn && !bodyAr && !bodyEn) {
      return null;
    }

    const referenceRaw = data['referenceId'] ?? data['orderId'];
    const referenceId =
      referenceRaw === null || referenceRaw === undefined || referenceRaw === ''
        ? null
        : String(referenceRaw);

    return {
      notificationId,
      titleAr: titleAr || titleEn,
      titleEn: titleEn || titleAr,
      bodyAr: bodyAr || bodyEn,
      bodyEn: bodyEn || bodyAr,
      type: data['type'] ? String(data['type']) : null,
      referenceId,
      dataObject: data,
      targetUrl: notification.launchURL ?? (data['targetUrl'] ? String(data['targetUrl']) : null),
      createdAtUtc: new Date().toISOString()
    };
  }

  private resolveRouteFromPush(
    payload: VendorOneSignalPushPayload | null,
    launchUrl?: string | null
  ): string | null {
    if (payload?.referenceId) {
      return `/orders/${payload.referenceId}`;
    }

    const raw = (payload?.targetUrl || launchUrl || '').trim();
    if (!raw) {
      return '/alerts';
    }

    try {
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        const url = new URL(raw);
        return `${url.pathname}${url.search}` || '/alerts';
      }
    } catch {
      return '/alerts';
    }

    return raw.startsWith('/') ? raw : `/${raw}`;
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
      await firstValueFrom(
        this.http.post(`${this.devicesUrl}/register`, {
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
        })
      );

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

  private async waitForActiveSubscription(oneSignal: OneSignalSdk, userId: string): Promise<boolean> {
    for (let attempt = 0; attempt < VendorWebPushService.subscriptionReadyAttempts; attempt += 1) {
      if (await this.registerCurrentSubscription(oneSignal, userId)) {
        return true;
      }

      if (this.resolveBrowserNotificationPermission() !== 'granted') {
        return false;
      }

      await this.delay(VendorWebPushService.subscriptionReadyDelayMs);
    }

    if (!environment.production) {
      console.warn('OneSignal vendor subscription did not become active after opt-in.');
    }

    return false;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  private getBrowserDeviceId(): string {
    const existing = localStorage.getItem(VendorWebPushService.browserDeviceIdKey);
    if (existing) {
      return existing;
    }

    const generated =
      this.document.defaultView?.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const deviceId = `vendor-web-${generated}`;
    localStorage.setItem(VendorWebPushService.browserDeviceIdKey, deviceId);
    return deviceId;
  }

  private async triggerLoginTestNotificationIfPending(user: VendorCurrentUser): Promise<void> {
    if (!this.authService.consumePendingLoginNotificationTestUserId(user.id)) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/vendor/notifications/test`, {
          titleAr: 'إشعار اختبار بعد تسجيل الدخول',
          titleEn: 'Login notification test',
          bodyAr: 'أرسلنا هذا الإشعار تلقائيًا بعد تسجيل دخول التاجر للتأكد من ربط OneSignal.',
          bodyEn:
            'This notification was sent automatically after vendor login to verify OneSignal is connected.',
          type: 'vendor_login_test',
          targetUrl: '/alerts',
          data: JSON.stringify({
            source: 'vendor_login_test',
            userId: user.id,
            generatedAtUtc: new Date().toISOString()
          }),
          sendPush: true
        })
      );
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
