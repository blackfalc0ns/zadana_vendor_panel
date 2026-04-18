import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  distinctUntilChanged,
  interval,
  map,
  of,
  shareReplay,
  take,
  tap
} from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorAuthService } from '../../../core/auth/services/vendor-auth.service';
import {
  AlertCenterItemVm,
  AlertSummaryVm,
  AlertWorkspaceSnapshotVm,
  AlertWorkspaceState,
  cloneAlerts
} from '../models/alerts-center.models';
import {
  clearWorkspaceState,
  persistWorkspaceState,
  readWorkspaceState
} from '../../../shared/utils/workspace-storage.util';

interface NotificationsApiResponse {
  items: NotificationItemApiModel[];
  page: number;
  perPage: number;
  total: number;
}

interface NotificationItemApiModel {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  type?: string | null;
  referenceId?: string | null;
  data?: string | null;
  dataObject?: Record<string, unknown> | null;
  isRead: boolean;
  createdAtUtc: string;
}

interface RealtimeNotificationPayload {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  type?: string | null;
  referenceId?: string | null;
  data?: string | null;
  dataObject?: Record<string, unknown> | null;
  isRead: boolean;
  createdAtUtc: string;
}

interface SignalRHubConnection {
  state: number | string;
  start(): Promise<void>;
  stop(): Promise<void>;
  on(methodName: string, newMethod: (payload: RealtimeNotificationPayload) => void): void;
  onclose(callback: (error?: Error) => void): void;
}

interface SignalRHubConnectionBuilder {
  withUrl(url: string, options: { accessTokenFactory: () => string }): SignalRHubConnectionBuilder;
  withAutomaticReconnect(): SignalRHubConnectionBuilder;
  configureLogging(level: number): SignalRHubConnectionBuilder;
  build(): SignalRHubConnection;
}

interface SignalRBrowserSdk {
  HubConnectionBuilder: new () => SignalRHubConnectionBuilder;
  HubConnectionState: {
    Disconnected: number | string;
    Connected: number | string;
    Connecting: number | string;
    Reconnecting: number | string;
  };
  LogLevel: {
    Information: number;
    Warning: number;
  };
}

declare global {
  interface Window {
    signalR?: SignalRBrowserSdk;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AlertsCenterService {
  private static readonly signalRScriptId = 'vendor-alerts-signalr-sdk';
  private static readonly signalRScriptUrl = 'https://cdn.jsdelivr.net/npm/@microsoft/signalr@8.0.7/dist/browser/signalr.min.js';
  private readonly storageKey = 'vendor_alerts_workspace';
  private readonly apiUrl = `${environment.apiUrl}/vendor/notifications`;
  private readonly hubUrl = `${environment.apiUrl.replace(/\/api\/?$/, '')}/hubs/notifications`;
  private readonly pollIntervalMs = 15000;
  private readonly workspaceSubject = new BehaviorSubject<AlertWorkspaceState>(this.loadWorkspace());
  private readonly serverAlertsSubject = new BehaviorSubject<AlertCenterItemVm[]>([]);
  private readonly realtimeAlertSubject = new Subject<AlertCenterItemVm>();
  private pollSubscription?: Subscription;
  private authSubscription?: Subscription;
  private hubConnection?: SignalRHubConnection;
  private monitoringStarted = false;
  private monitoringInitialized = false;
  private unreadIds = new Set<string>();
  private notificationsPermissionRequested = false;
  private audioContext?: AudioContext;
  private reconnectingRealtime = false;
  private signalRSdkPromise?: Promise<SignalRBrowserSdk | null>;

  private readonly serverAlerts$ = this.serverAlertsSubject.asObservable().pipe(shareReplay(1));

  private readonly alerts$ = combineLatest([
    this.serverAlerts$,
    this.workspaceSubject
  ]).pipe(
    map(([alerts, workspace]) => this.applyWorkspace(alerts, workspace)),
    shareReplay(1)
  );

  constructor(
    private readonly http: HttpClient,
    private readonly authService: VendorAuthService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  startMonitoring(): void {
    if (this.monitoringStarted) {
      return;
    }

    this.monitoringStarted = true;
    this.authSubscription = this.authService.currentUser$
      .pipe(distinctUntilChanged((previous, current) => previous?.id === current?.id))
      .subscribe((user) => {
        if (!user?.id) {
          this.stopPolling();
          void this.disconnectRealtime();
          this.serverAlertsSubject.next([]);
          this.monitoringInitialized = false;
          this.unreadIds = new Set<string>();
          return;
        }

        this.requestBrowserNotificationPermission();
        this.startPolling();
        this.refreshFromServer();
        void this.ensureRealtimeConnection();
      });
  }

  getAlerts(): Observable<AlertCenterItemVm[]> {
    return this.alerts$.pipe(map((alerts) => cloneAlerts(alerts)));
  }

  getBellAlerts(): Observable<AlertCenterItemVm[]> {
    return this.alerts$.pipe(
      map((alerts) => alerts.filter((alert) => alert.state !== 'archived').slice(0, 5)),
      map((alerts) => cloneAlerts(alerts))
    );
  }

  getRealtimeAlerts(): Observable<AlertCenterItemVm> {
    return this.realtimeAlertSubject.asObservable().pipe(
      map((alert) => cloneAlerts([alert])[0])
    );
  }

  getSummary(): Observable<AlertSummaryVm> {
    return this.alerts$.pipe(
      map((alerts) => ({
        unreadCount: alerts.filter((alert) => alert.state === 'unread').length,
        criticalCount: alerts.filter((alert) => alert.state !== 'archived' && alert.severity === 'critical').length,
        needsActionCount: alerts.filter((alert) => alert.state !== 'archived' && alert.severity !== 'info').length,
        archivedCount: alerts.filter((alert) => alert.state === 'archived').length,
        totalCount: alerts.length
      }))
    );
  }

  getUnreadCount(): Observable<number> {
    return this.alerts$.pipe(
      map((alerts) => alerts.filter((alert) => alert.state === 'unread').length)
    );
  }

  markAsRead(alertId: string): void {
    this.http.post(`${this.apiUrl}/${alertId}/read`, {}).pipe(
      tap(() => {
        this.serverAlertsSubject.next(
          this.serverAlertsSubject.value.map((alert) =>
            alert.id === alertId ? { ...alert, state: 'read' } : alert
          )
        );
        this.refreshFromServer();
      })
    ).subscribe();
  }

  markAsUnread(_alertId: string): void {
  }

  archive(alertId: string): void {
    this.alerts$.pipe(
      take(1),
      map((alerts) => alerts.find((alert) => alert.id === alertId)),
      tap((alert) => {
        this.setWorkspace((workspace) => ({
          ...workspace,
          archivedMap: {
            ...workspace.archivedMap,
            [alertId]: true
          },
          archivedSnapshots: alert
            ? {
                ...workspace.archivedSnapshots,
                [alertId]: this.toSnapshot(alert)
              }
            : workspace.archivedSnapshots
        }));
      })
    ).subscribe();
  }

  unarchive(alertId: string): void {
    this.setWorkspace((workspace) => {
      const nextArchivedMap = { ...workspace.archivedMap };
      const nextArchivedSnapshots = { ...workspace.archivedSnapshots };
      delete nextArchivedMap[alertId];
      delete nextArchivedSnapshots[alertId];

      return {
        ...workspace,
        archivedMap: nextArchivedMap,
        archivedSnapshots: nextArchivedSnapshots
      };
    });
  }

  markAllAsRead(): void {
    this.http.post(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.serverAlertsSubject.next(
          this.serverAlertsSubject.value.map((alert) => ({ ...alert, state: 'read' }))
        );
        this.refreshFromServer();
      })
    ).subscribe();
  }

  resetWorkspaceState(): void {
    clearWorkspaceState(this.storageKey);
    this.workspaceSubject.next(this.createEmptyWorkspace());
    this.refreshFromServer();
  }

  private mapNotification(item: NotificationItemApiModel): AlertCenterItemVm {
    const route = this.resolveRoute(item.referenceId, item.dataObject, item.data);

    return {
      id: item.id,
      source: 'orders',
      severity: this.resolveSeverity(item.type),
      title: {
        ar: item.titleAr,
        en: item.titleEn
      },
      summary: {
        ar: item.bodyAr,
        en: item.bodyEn
      },
      createdAt: item.createdAtUtc,
      route,
      routeQuery: undefined,
      count: undefined,
      entityId: item.referenceId ?? undefined,
      state: item.isRead ? 'read' : 'unread'
    };
  }

  private mapRealtimeNotification(item: RealtimeNotificationPayload): AlertCenterItemVm {
    return this.mapNotification({
      id: item.id,
      titleAr: item.titleAr,
      titleEn: item.titleEn,
      bodyAr: item.bodyAr,
      bodyEn: item.bodyEn,
      type: item.type,
      referenceId: item.referenceId,
      data: item.data,
      dataObject: item.dataObject,
      isRead: item.isRead,
      createdAtUtc: item.createdAtUtc
    });
  }

  private resolveSeverity(type?: string | null): 'info' | 'warning' | 'critical' {
    switch (type) {
      case 'vendor_new_order':
        return 'warning';
      case 'order_cancelled':
        return 'critical';
      default:
        return 'info';
    }
  }

  private applyWorkspace(liveAlerts: AlertCenterItemVm[], workspace: AlertWorkspaceState): AlertCenterItemVm[] {
    const hydratedLiveAlerts = liveAlerts.map((alert) => ({
      ...alert,
      state: workspace.archivedMap[alert.id] ? 'archived' : alert.state
    }));

    const archivedFallbacks = Object.entries(workspace.archivedSnapshots)
      .filter(([id]) => workspace.archivedMap[id] && !hydratedLiveAlerts.some((alert) => alert.id === id))
      .map(([, snapshot]) => ({
        ...snapshot,
        title: { ...snapshot.title },
        summary: { ...snapshot.summary },
        routeQuery: snapshot.routeQuery ? { ...snapshot.routeQuery } : undefined,
        state: 'archived' as const
      }));

    return [...hydratedLiveAlerts, ...archivedFallbacks]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
  }

  private toSnapshot(alert: AlertCenterItemVm): AlertWorkspaceSnapshotVm {
    return {
      id: alert.id,
      source: alert.source,
      severity: alert.severity,
      title: { ...alert.title },
      summary: { ...alert.summary },
      createdAt: alert.createdAt,
      route: alert.route,
      routeQuery: alert.routeQuery ? { ...alert.routeQuery } : undefined,
      count: alert.count,
      entityId: alert.entityId
    };
  }

  private setWorkspace(projector: (workspace: AlertWorkspaceState) => AlertWorkspaceState): void {
    const nextWorkspace = projector(this.workspaceSubject.value);
    persistWorkspaceState(this.storageKey, nextWorkspace);
    this.workspaceSubject.next(nextWorkspace);
  }

  private loadWorkspace(): AlertWorkspaceState {
    const stored = readWorkspaceState<AlertWorkspaceState | null>(this.storageKey, null);
    if (stored) {
      return {
        readMap: stored.readMap || {},
        archivedMap: stored.archivedMap || {},
        archivedSnapshots: stored.archivedSnapshots || {}
      };
    }

    return this.createEmptyWorkspace();
  }

  private createEmptyWorkspace(): AlertWorkspaceState {
    return {
      readMap: {},
      archivedMap: {},
      archivedSnapshots: {}
    };
  }

  private handleIncomingAlerts(alerts: AlertCenterItemVm[]): void {
    const nextUnreadIds = new Set(
      alerts
        .filter((alert) => alert.state === 'unread')
        .map((alert) => alert.id)
    );

    if (!this.monitoringInitialized) {
      this.unreadIds = nextUnreadIds;
      this.monitoringInitialized = true;
      return;
    }

    const newlyArrived = alerts.filter((alert) => alert.state === 'unread' && !this.unreadIds.has(alert.id));
    this.unreadIds = nextUnreadIds;

    if (!newlyArrived.length) {
      return;
    }

    for (const alert of newlyArrived) {
      this.showDesktopNotification(alert);
      this.playNotificationTone();
    }
  }

  private startPolling(): void {
    if (this.pollSubscription) {
      return;
    }

    this.pollSubscription = interval(this.pollIntervalMs).subscribe(() => {
      this.refreshFromServer();
    });
  }

  private stopPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
  }

  private refreshFromServer(): void {
    this.http.get<NotificationsApiResponse>(this.apiUrl, {
      params: new HttpParams()
        .set('page', '1')
        .set('per_page', '100')
    }).pipe(
      catchError(() => of<NotificationsApiResponse>({
        items: [],
        page: 1,
        perPage: 100,
        total: 0
      })),
      map((response) => response.items.map((item) => this.mapNotification(item))),
      tap((alerts) => this.replaceServerAlerts(alerts))
    ).subscribe();
  }

  private replaceServerAlerts(alerts: AlertCenterItemVm[]): void {
    const sortedAlerts = [...alerts]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());

    this.serverAlertsSubject.next(sortedAlerts);
    this.handleIncomingAlerts(sortedAlerts);
  }

  private upsertRealtimeAlert(alert: AlertCenterItemVm): void {
    const existing = this.serverAlertsSubject.value.filter((item) => item.id !== alert.id);
    const nextAlerts = [alert, ...existing]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());

    this.serverAlertsSubject.next(nextAlerts);
    this.realtimeAlertSubject.next(alert);
    this.handleIncomingAlerts(nextAlerts);
  }

  private async ensureRealtimeConnection(): Promise<void> {
    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    const signalR = await this.loadSignalRSdk();
    if (!signalR) {
      return;
    }

    if (this.hubConnection?.state === signalR.HubConnectionState.Connected ||
        this.hubConnection?.state === signalR.HubConnectionState.Connecting ||
        this.hubConnection?.state === signalR.HubConnectionState.Reconnecting) {
      return;
    }

    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: () => this.authService.getToken() ?? ''
        })
        .withAutomaticReconnect()
        .configureLogging(environment.production ? signalR.LogLevel.Warning : signalR.LogLevel.Information)
        .build();

      this.hubConnection.on('ReceiveNotification', (payload: RealtimeNotificationPayload) => {
        this.upsertRealtimeAlert(this.mapRealtimeNotification(payload));
      });

      this.hubConnection.onclose(() => {
        if (this.authService.hasApiSession) {
          void this.reconnectRealtimeWithBackoff();
        }
      });
    }

    try {
      await this.hubConnection.start();
    } catch (error) {
      console.error('Vendor notifications SignalR connection failed.', error);
      void this.reconnectRealtimeWithBackoff();
    }
  }

  private async reconnectRealtimeWithBackoff(): Promise<void> {
    if (this.reconnectingRealtime || !this.authService.hasApiSession) {
      return;
    }

    this.reconnectingRealtime = true;

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await this.ensureRealtimeConnection();
    } finally {
      this.reconnectingRealtime = false;
    }
  }

  private async disconnectRealtime(): Promise<void> {
    if (!this.hubConnection) {
      return;
    }

    try {
      await this.hubConnection.stop();
    } catch (error) {
      console.error('Vendor notifications SignalR disconnection failed.', error);
    }
  }

  private async loadSignalRSdk(): Promise<SignalRBrowserSdk | null> {
    if (this.signalRSdkPromise) {
      return this.signalRSdkPromise;
    }

    this.signalRSdkPromise = new Promise<SignalRBrowserSdk | null>((resolve) => {
      const view = this.document.defaultView;
      if (!view) {
        resolve(null);
        return;
      }

      if (view.signalR) {
        resolve(view.signalR);
        return;
      }

      const existingScript = this.document.getElementById(AlertsCenterService.signalRScriptId) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(view.signalR ?? null), { once: true });
        existingScript.addEventListener('error', () => resolve(null), { once: true });
        return;
      }

      const script = this.document.createElement('script');
      script.id = AlertsCenterService.signalRScriptId;
      script.src = AlertsCenterService.signalRScriptUrl;
      script.defer = true;
      script.onload = () => resolve(view.signalR ?? null);
      script.onerror = () => {
        console.error('Failed to load SignalR browser SDK.');
        resolve(null);
      };

      this.document.head.appendChild(script);
    });

    return this.signalRSdkPromise;
  }

  private resolveRoute(
    referenceId?: string | null,
    dataObject?: Record<string, unknown> | null,
    data?: string | null
  ): string {
    const routeFromDataObject = this.extractTargetUrl(dataObject);
    if (routeFromDataObject) {
      return routeFromDataObject;
    }

    const routeFromData = this.extractTargetUrl(this.tryParseData(data));
    if (routeFromData) {
      return routeFromData;
    }

    return referenceId ? `/orders/${referenceId}` : '/alerts';
  }

  private extractTargetUrl(data?: Record<string, unknown> | null): string | null {
    const targetUrl = data?.['targetUrl'];
    return typeof targetUrl === 'string' && targetUrl.trim() ? targetUrl.trim() : null;
  }

  private tryParseData(data?: string | null): Record<string, unknown> | null {
    if (!data?.trim()) {
      return null;
    }

    try {
      const parsed = JSON.parse(data);
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }

  private requestBrowserNotificationPermission(): void {
    if (this.notificationsPermissionRequested || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    this.notificationsPermissionRequested = true;

    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }

  private showDesktopNotification(alert: AlertCenterItemVm): void {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(alert.title.ar || alert.title.en, {
      body: alert.summary.ar || alert.summary.en,
      tag: alert.id,
      silent: true
    });

    notification.onclick = () => {
      if (typeof window !== 'undefined') {
        window.focus();
        window.location.assign(this.buildAbsoluteRoute(alert));
      }
      notification.close();
    };
  }

  private buildAbsoluteRoute(alert: AlertCenterItemVm): string {
    const route = alert.route.startsWith('/') ? alert.route : `/${alert.route}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    if (!alert.routeQuery || !Object.keys(alert.routeQuery).length) {
      return `${origin}${route}`;
    }

    const params = new URLSearchParams(alert.routeQuery);
    return `${origin}${route}?${params.toString()}`;
  }

  private playNotificationTone(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    this.audioContext ??= new AudioContextCtor();

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.0001, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.35);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.35);
  }
}
