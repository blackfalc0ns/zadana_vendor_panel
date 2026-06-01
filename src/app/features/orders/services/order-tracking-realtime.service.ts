import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorAuthService } from '../../../core/auth/services/vendor-auth.service';

export interface OrderTrackingDriverLocation {
  orderId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  recordedAtUtc: string;
}

export interface OrderTrackingStatusChangedPayload {
  orderId: string;
  orderNumber: string;
  vendorId: string;
  oldStatus: string;
  newStatus: string;
  actorRole?: string | null;
  action: string;
  targetUrl: string;
  changedAtUtc: string;
}

export interface OrderTrackingArrivalStatePayload {
  orderId: string;
  orderNumber: string;
  arrivalState: string;
  driverName: string;
  actorRole?: string | null;
  targetUrl: string;
  changedAtUtc: string;
}

interface SignalRHubConnection {
  state: number | string;
  start(): Promise<void>;
  stop(): Promise<void>;
  invoke(method: string, ...args: unknown[]): Promise<void>;
  on(method: string, callback: (...args: any[]) => void): void;
  off(method: string): void;
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
    Connected: number | string;
    Connecting: number | string;
    Reconnecting: number | string;
  };
  LogLevel: {
    Information: number;
    Warning: number;
  };
}

export type OrderTrackingConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * Vendor-side SignalR client for the /hubs/order-tracking endpoint. Mirrors the
 * superadmin implementation but binds to the vendor auth service. Vendors can
 * subscribe to orders that belong to their vendor account and receive live
 * driver location, status, and arrival updates.
 */
@Injectable({ providedIn: 'root' })
export class OrderTrackingRealtimeService {
  private static readonly signalRScriptId = 'vendor-order-tracking-signalr-sdk';
  private static readonly signalRScriptUrl =
    'https://cdn.jsdelivr.net/npm/@microsoft/signalr@8.0.7/dist/browser/signalr.min.js';

  private readonly hubUrl = `${environment.apiUrl.replace(/\/api\/?$/, '')}/hubs/order-tracking`;

  private readonly driverLocation$ = new Subject<OrderTrackingDriverLocation>();
  private readonly statusChanged$ = new Subject<OrderTrackingStatusChangedPayload>();
  private readonly arrivalState$ = new Subject<OrderTrackingArrivalStatePayload>();
  private readonly connectionState$ = new Subject<OrderTrackingConnectionState>();

  private hubConnection?: SignalRHubConnection;
  private signalRSdkPromise?: Promise<SignalRBrowserSdk | null>;
  private connectionPromise?: Promise<void>;
  private readonly subscribedOrders = new Set<string>();

  constructor(
    private readonly authService: VendorAuthService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  driverLocations(): Observable<OrderTrackingDriverLocation> {
    return this.driverLocation$.asObservable();
  }

  statusChanges(): Observable<OrderTrackingStatusChangedPayload> {
    return this.statusChanged$.asObservable();
  }

  arrivalStates(): Observable<OrderTrackingArrivalStatePayload> {
    return this.arrivalState$.asObservable();
  }

  state(): Observable<OrderTrackingConnectionState> {
    return this.connectionState$.asObservable();
  }

  async subscribe(orderId: string): Promise<void> {
    if (!orderId) {
      return;
    }

    await this.ensureConnection();
    if (!this.hubConnection) {
      console.warn('[OrderTracking] subscribe called but hubConnection is null');
      return;
    }

    if (this.subscribedOrders.has(orderId)) {
      return;
    }

    try {
      await this.hubConnection.invoke('SubscribeToOrder', orderId);
      this.subscribedOrders.add(orderId);
      console.log('[OrderTracking] subscribed to order', orderId);
    } catch (error) {
      console.error('Failed to subscribe to order tracking group', orderId, error);
      throw error;
    }
  }

  async unsubscribe(orderId: string): Promise<void> {
    if (!orderId || !this.subscribedOrders.has(orderId)) {
      return;
    }

    try {
      await this.hubConnection?.invoke('UnsubscribeFromOrder', orderId);
    } catch (error) {
      console.warn('Failed to unsubscribe from order tracking group', orderId, error);
    } finally {
      this.subscribedOrders.delete(orderId);
    }
  }

  async disconnect(): Promise<void> {
    this.subscribedOrders.clear();
    if (!this.hubConnection) {
      return;
    }
    try {
      await this.hubConnection.stop();
    } catch (error) {
      console.warn('Order tracking SignalR disconnection failed.', error);
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.connectionState$.next('idle');
      return;
    }

    this.connectionPromise = (async () => {
      const signalR = await this.loadSignalRSdk();
      if (!signalR) {
        this.connectionState$.next('error');
        return;
      }

      if (
        this.hubConnection?.state === signalR.HubConnectionState.Connected ||
        this.hubConnection?.state === signalR.HubConnectionState.Connecting ||
        this.hubConnection?.state === signalR.HubConnectionState.Reconnecting
      ) {
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

        this.hubConnection.on('ReceiveDriverLocation', (payload: OrderTrackingDriverLocation) => {
          console.log('[OrderTracking] ReceiveDriverLocation', payload);
          this.driverLocation$.next(payload);
        });

        this.hubConnection.on('ReceiveOrderTrackingStatusChanged', (payload: OrderTrackingStatusChangedPayload) => {
          console.log('[OrderTracking] ReceiveOrderTrackingStatusChanged', payload);
          this.statusChanged$.next(payload);
        });

        this.hubConnection.on('ReceiveOrderTrackingArrivalState', (payload: OrderTrackingArrivalStatePayload) => {
          console.log('[OrderTracking] ReceiveOrderTrackingArrivalState', payload);
          this.arrivalState$.next(payload);
        });

        this.hubConnection.onreconnecting?.(() => this.connectionState$.next('reconnecting'));
        this.hubConnection.onreconnected?.(async () => {
          this.connectionState$.next('connected');
          for (const orderId of [...this.subscribedOrders]) {
            try {
              await this.hubConnection?.invoke('SubscribeToOrder', orderId);
            } catch (error) {
              console.warn('Failed to re-subscribe after reconnect', orderId, error);
            }
          }
        });
        this.hubConnection.onclose(() => {
          this.connectionState$.next('error');
        });
      }

      try {
        this.connectionState$.next('connecting');
        await this.hubConnection.start();
        this.connectionState$.next('connected');
      } catch (error) {
        console.error('Order tracking SignalR connection failed.', error);
        this.connectionState$.next('error');
        throw error;
      }
    })();

    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = undefined;
    }
  }

  private async loadSignalRSdk(): Promise<SignalRBrowserSdk | null> {
    if (this.signalRSdkPromise) {
      return this.signalRSdkPromise;
    }

    this.signalRSdkPromise = new Promise<SignalRBrowserSdk | null>((resolve) => {
      const view = this.document.defaultView as (Window & { signalR?: SignalRBrowserSdk }) | null;
      if (!view) {
        resolve(null);
        return;
      }

      if (view.signalR) {
        resolve(view.signalR);
        return;
      }

      const existingScript = this.document.getElementById(
        OrderTrackingRealtimeService.signalRScriptId
      ) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(view.signalR ?? null), { once: true });
        existingScript.addEventListener('error', () => {
          this.signalRSdkPromise = undefined;
          resolve(null);
        }, { once: true });
        return;
      }

      const script = this.document.createElement('script');
      script.id = OrderTrackingRealtimeService.signalRScriptId;
      script.src = OrderTrackingRealtimeService.signalRScriptUrl;
      script.defer = true;
      script.onload = () => resolve(view.signalR ?? null);
      script.onerror = () => {
        this.signalRSdkPromise = undefined;
        resolve(null);
      };
      this.document.head.appendChild(script);
    });

    return this.signalRSdkPromise;
  }
}
