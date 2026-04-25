import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  combineLatest,
  distinctUntilChanged,
  finalize,
  interval,
  map,
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
  onreconnecting?(callback: (error?: Error) => void): void;
  onreconnected?(callback: (connectionId?: string) => void): void;
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

type InitialLoadStatus = 'idle' | 'loading' | 'ready' | 'error';
type RealtimeConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed' | 'error';

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
  private readonly initialLoadStatusSubject = new BehaviorSubject<InitialLoadStatus>('idle');
  private readonly realtimeConnectionStateSubject = new BehaviorSubject<RealtimeConnectionState>('idle');
  private readonly lastLoadErrorSubject = new BehaviorSubject<string | null>(null);
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
  private hasLoadedInboxOnce = false;
  private refreshInFlight = false;
  private refreshQueued = false;

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
          this.hasLoadedInboxOnce = false;
          this.initialLoadStatusSubject.next('idle');
          this.realtimeConnectionStateSubject.next('idle');
          this.lastLoadErrorSubject.next(null);
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

  getInitialLoadStatus(): Observable<InitialLoadStatus> {
    return this.initialLoadStatusSubject.asObservable().pipe(shareReplay(1));
  }

  getRealtimeConnectionState(): Observable<RealtimeConnectionState> {
    return this.realtimeConnectionStateSubject.asObservable().pipe(shareReplay(1));
  }

  getLastLoadError(): Observable<string | null> {
    return this.lastLoadErrorSubject.asObservable().pipe(shareReplay(1));
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
      source: this.resolveSource(item.type, route),
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

  private resolveSource(type?: string | null, route?: string | null): AlertCenterItemVm['source'] {
    if (type?.startsWith('vendor_')) {
      if (route?.startsWith('/finance')) {
        return 'finance';
      }

      return 'profile';
    }

    if (route?.startsWith('/finance')) {
      return 'finance';
    }

    if (route?.startsWith('/profile')) {
      return 'profile';
    }

    return 'orders';
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
    if (this.refreshInFlight) {
      this.refreshQueued = true;
      return;
    }

    if (!this.hasLoadedInboxOnce) {
      this.initialLoadStatusSubject.next('loading');
    }

    this.refreshInFlight = true;
    this.http.get<NotificationsApiResponse>(this.apiUrl, {
      params: new HttpParams()
        .set('page', '1')
        .set('per_page', '100')
    }).pipe(
      finalize(() => {
        this.refreshInFlight = false;
        if (this.refreshQueued) {
          this.refreshQueued = false;
          queueMicrotask(() => this.refreshFromServer());
        }
      }),
      map((response) => response.items.map((item) => this.mapNotification(item)))
    ).subscribe({
      next: (alerts) => {
        this.hasLoadedInboxOnce = true;
        this.initialLoadStatusSubject.next('ready');
        this.lastLoadErrorSubject.next(null);
        this.replaceServerAlerts(alerts);
      },
      error: (error) => {
        if (this.shouldIgnoreTransientRefreshError(error)) {
          this.debugLog('warn', 'Transient vendor notifications inbox refresh failed. Keeping the current alerts state.', error);
          return;
        }

        this.initialLoadStatusSubject.next('error');
        this.lastLoadErrorSubject.next(this.describeError(error));
        this.debugLog('error', 'Failed to load vendor notifications inbox.', error);
      }
    });
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
      this.debugLog('warn', 'Skipping vendor notifications realtime connection because no access token is available.');
      return;
    }

    const signalR = await this.loadSignalRSdk();
    if (!signalR) {
      this.realtimeConnectionStateSubject.next('error');
      this.lastLoadErrorSubject.next('Failed to load SignalR browser SDK.');
      return;
    }

    if (this.hubConnection?.state === signalR.HubConnectionState.Connected ||
        this.hubConnection?.state === signalR.HubConnectionState.Connecting ||
        this.hubConnection?.state === signalR.HubConnectionState.Reconnecting) {
      this.debugLog('info', 'Vendor notifications realtime connection is already active.', {
        state: this.hubConnection.state
      });
      return;
    }

    this.realtimeConnectionStateSubject.next('connecting');
    this.debugLog('info', 'Connecting vendor notifications realtime hub.', { hubUrl: this.hubUrl });

    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: () => this.authService.getToken() ?? ''
        })
        .withAutomaticReconnect()
        .configureLogging(environment.production ? signalR.LogLevel.Warning : signalR.LogLevel.Information)
        .build();

      this.hubConnection.on('ReceiveNotification', (payload: RealtimeNotificationPayload) => {
        if (!payload?.id || !payload.createdAtUtc) {
          this.debugLog('warn', 'Ignoring invalid vendor notification realtime payload.', payload);
          return;
        }

        this.debugLog('info', 'Received vendor notification realtime payload.', payload);
        this.upsertRealtimeAlert(this.mapRealtimeNotification(payload));
      });

      this.hubConnection.onreconnecting?.((error) => {
        this.realtimeConnectionStateSubject.next('reconnecting');
        this.debugLog('warn', 'Vendor notifications realtime hub is reconnecting.', error);
      });

      this.hubConnection.onreconnected?.(() => {
        this.realtimeConnectionStateSubject.next('connected');
        this.lastLoadErrorSubject.next(null);
        this.debugLog('info', 'Vendor notifications realtime hub reconnected successfully.');
        this.refreshFromServer();
      });

      this.hubConnection.onclose((error) => {
        this.realtimeConnectionStateSubject.next('closed');
        this.debugLog('warn', 'Vendor notifications realtime hub closed.', error);
        if (this.authService.hasApiSession) {
          void this.reconnectRealtimeWithBackoff();
        }
      });
    }

    try {
      await this.hubConnection.start();
      this.realtimeConnectionStateSubject.next('connected');
      this.lastLoadErrorSubject.next(null);
      this.debugLog('info', 'Vendor notifications realtime hub connected successfully.');
      this.refreshFromServer();
    } catch (error) {
      this.realtimeConnectionStateSubject.next('error');
      this.lastLoadErrorSubject.next(this.describeError(error));
      console.error('Vendor notifications SignalR connection failed.', error);
      void this.reconnectRealtimeWithBackoff();
    }
  }

  private async reconnectRealtimeWithBackoff(): Promise<void> {
    if (this.reconnectingRealtime || !this.authService.hasApiSession) {
      return;
    }

    this.reconnectingRealtime = true;
    this.realtimeConnectionStateSubject.next('reconnecting');
    this.debugLog('info', 'Scheduling vendor notifications realtime reconnect attempt.');

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
      this.realtimeConnectionStateSubject.next('closed');
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
        this.debugLog('warn', 'Unable to load SignalR browser SDK because window is unavailable.');
        resolve(null);
        return;
      }

      if (view.signalR) {
        this.debugLog('info', 'SignalR browser SDK already loaded.');
        resolve(view.signalR);
        return;
      }

      const existingScript = this.document.getElementById(AlertsCenterService.signalRScriptId) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(view.signalR ?? null), { once: true });
        existingScript.addEventListener('error', () => {
          this.signalRSdkPromise = undefined;
          this.debugLog('error', 'SignalR browser SDK script failed to load from existing script tag.');
          resolve(null);
        }, { once: true });
        return;
      }

      const script = this.document.createElement('script');
      script.id = AlertsCenterService.signalRScriptId;
      script.src = AlertsCenterService.signalRScriptUrl;
      script.defer = true;
      script.onload = () => resolve(view.signalR ?? null);
      script.onerror = () => {
        this.signalRSdkPromise = undefined;
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

    try {
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
    } catch (error) {
      this.debugLog('warn', 'Browser desktop notification failed to display.', error);
    }
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
      this.debugLog('warn', 'Browser audio context is not available for vendor notification tone.');
      return;
    }

    this.audioContext ??= new AudioContextCtor();

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume().catch((error) => {
        this.debugLog('warn', 'Vendor notification audio context resume failed.', error);
      });
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

  private describeError(error: unknown): string {
    if (this.isTransientTransportError(error)) {
      return 'The notifications inbox request was interrupted before the browser received the response.';
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unexpected vendor notifications error.';
  }

  private shouldIgnoreTransientRefreshError(error: unknown): boolean {
    if (!this.isTransientTransportError(error)) {
      return false;
    }

    return this.hasLoadedInboxOnce || this.serverAlertsSubject.value.length > 0;
  }

  private isTransientTransportError(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 0) {
      return false;
    }

    const transportError = error;
    const detail = [
      transportError.message,
      typeof transportError.error === 'string' ? transportError.error : '',
      transportError.statusText
    ].join(' ');

    return /ERR_HTTP2_PING_FAILED|Unknown Error|ProgressEvent/i.test(detail);
  }

  private debugLog(level: 'info' | 'warn' | 'error', message: string, details?: unknown): void {
    if (environment.production) {
      return;
    }

    const prefix = '[VendorAlerts]';
    switch (level) {
      case 'warn':
        console.warn(prefix, message, details ?? '');
        return;
      case 'error':
        console.error(prefix, message, details ?? '');
        return;
      default:
        console.info(prefix, message, details ?? '');
        return;
    }
  }
}
