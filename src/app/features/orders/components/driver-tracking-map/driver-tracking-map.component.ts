import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-driver-tracking-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative overflow-hidden rounded-[28px] border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-sm">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-indigo-100 bg-white/80 px-5 py-3 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div>
            <p class="text-[0.8rem] font-black uppercase tracking-wider text-indigo-900">
              {{ isArabic ? 'تتبع المندوب مباشر' : 'Live Driver Tracking' }}
            </p>
            <p class="text-[0.65rem] font-bold text-indigo-500">
              {{ isArabic ? 'تحديث كل 5 ثوانٍ' : 'Updates every 5 seconds' }}
            </p>
          </div>
        </div>

        <!-- Status Indicator -->
        <div class="flex items-center gap-2 rounded-full px-3 py-1.5"
          [class]="isStale ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'">
          <span class="relative flex h-2 w-2">
            <span *ngIf="!isStale"
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full"
              [class]="isStale ? 'bg-amber-500' : 'bg-emerald-500'"></span>
          </span>
          <span class="text-[0.65rem] font-black">
            {{ isStale
              ? (isArabic ? 'جاري التحديث...' : 'Updating...')
              : (isArabic ? 'مباشر' : 'LIVE') }}
          </span>
        </div>
      </div>

      <!-- Map Container -->
      <div #mapContainer class="h-[320px] w-full" style="z-index: 0;"></div>

      <!-- Driver Info Bar -->
      <div *ngIf="driverLocation" class="flex items-center justify-between border-t border-indigo-100 bg-white/90 px-5 py-3 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-black">
            🚗
          </div>
          <div>
            <p class="text-[0.72rem] font-black text-slate-800">
              {{ isArabic ? 'موقع المندوب' : 'Driver Location' }}
            </p>
            <p class="text-[0.62rem] font-bold text-slate-400">
              {{ lastUpdateText }}
            </p>
          </div>
        </div>
        <div *ngIf="driverLocation?.accuracyMeters" class="text-[0.62rem] font-bold text-slate-400">
          ± {{ driverLocation.accuracyMeters | number:'1.0-0' }}m
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    :host ::ng-deep .leaflet-control-attribution {
      font-size: 9px !important;
      opacity: 0.6;
    }

    :host ::ng-deep .driver-marker-icon {
      background: none;
      border: none;
    }

    :host ::ng-deep .vendor-marker-icon {
      background: none;
      border: none;
    }

    :host ::ng-deep .customer-marker-icon {
      background: none;
      border: none;
    }

    :host ::ng-deep .driver-marker-pulse {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.25);
      border: 3px solid rgba(16, 185, 129, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      animation: markerPulse 2s ease-in-out infinite;
    }

    :host ::ng-deep .vendor-marker-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(249, 115, 22, 0.15);
      border: 3px solid rgba(249, 115, 22, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    :host ::ng-deep .customer-marker-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.15);
      border: 3px solid rgba(99, 102, 241, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    @keyframes markerPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      50% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    }
  `]
})
export class DriverTrackingMapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() driverLocation?: { lat: number; lng: number; accuracyMeters?: number; recordedAtUtc: string };
  @Input() vendorLocation?: { lat: number; lng: number };
  @Input() customerLocation?: { lat: number; lng: number };
  @Input() isArabic = false;

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  isStale = false;
  lastUpdateText = '';

  private map?: L.Map;
  private driverMarker?: L.Marker;
  private vendorMarker?: L.Marker;
  private customerMarker?: L.Marker;
  private accuracyCircle?: L.Circle;
  private boundsSet = false;
  private staleTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.staleTimer = setInterval(() => this.updateStaleState(), 5000);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['driverLocation']) {
      this.updateDriverMarker();
      this.updateStaleState();
    }
    if (changes['vendorLocation'] && !this.vendorMarker) {
      this.addVendorMarker();
    }
    if (changes['customerLocation'] && !this.customerMarker) {
      this.addCustomerMarker();
    }
    if (!this.boundsSet) {
      this.fitBounds();
    }
  }

  ngOnDestroy(): void {
    if (this.staleTimer) clearInterval(this.staleTimer);
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      attributionControl: true
    }).setView([24.7136, 46.6753], 12); // Default: Riyadh

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18
    }).addTo(this.map);

    // Add markers if data already available
    this.addVendorMarker();
    this.addCustomerMarker();
    this.updateDriverMarker();
    this.fitBounds();
  }

  private addVendorMarker(): void {
    if (!this.map || !this.vendorLocation) return;

    const icon = L.divIcon({
      className: 'vendor-marker-icon',
      html: '<div class="vendor-marker-dot">🏪</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.vendorMarker = L.marker(
      [this.vendorLocation.lat, this.vendorLocation.lng],
      { icon, zIndexOffset: 100 }
    ).addTo(this.map);

    this.vendorMarker.bindTooltip(
      this.isArabic ? 'موقع المتجر' : 'Store Location',
      { direction: 'top', offset: [0, -18] }
    );
  }

  private addCustomerMarker(): void {
    if (!this.map || !this.customerLocation) return;

    const icon = L.divIcon({
      className: 'customer-marker-icon',
      html: '<div class="customer-marker-dot">📍</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.customerMarker = L.marker(
      [this.customerLocation.lat, this.customerLocation.lng],
      { icon, zIndexOffset: 100 }
    ).addTo(this.map);

    this.customerMarker.bindTooltip(
      this.isArabic ? 'موقع التوصيل' : 'Delivery Location',
      { direction: 'top', offset: [0, -18] }
    );
  }

  private updateDriverMarker(): void {
    if (!this.map || !this.driverLocation) return;

    const latlng: L.LatLngExpression = [this.driverLocation.lat, this.driverLocation.lng];

    if (this.driverMarker) {
      // Smooth animation to new position
      this.driverMarker.setLatLng(latlng);
    } else {
      const icon = L.divIcon({
        className: 'driver-marker-icon',
        html: '<div class="driver-marker-pulse">🚗</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      this.driverMarker = L.marker(latlng, {
        icon,
        zIndexOffset: 200
      }).addTo(this.map);

      this.driverMarker.bindTooltip(
        this.isArabic ? 'المندوب' : 'Driver',
        { direction: 'top', offset: [0, -20], permanent: false }
      );
    }

    // Update accuracy circle
    if (this.driverLocation.accuracyMeters && this.driverLocation.accuracyMeters > 0) {
      if (this.accuracyCircle) {
        this.accuracyCircle.setLatLng(latlng);
        this.accuracyCircle.setRadius(this.driverLocation.accuracyMeters);
      } else {
        this.accuracyCircle = L.circle(latlng, {
          radius: this.driverLocation.accuracyMeters,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.08,
          weight: 1
        }).addTo(this.map);
      }
    }
  }

  private fitBounds(): void {
    if (!this.map) return;

    const points: L.LatLngExpression[] = [];
    if (this.vendorLocation) points.push([this.vendorLocation.lat, this.vendorLocation.lng]);
    if (this.customerLocation) points.push([this.customerLocation.lat, this.customerLocation.lng]);
    if (this.driverLocation) points.push([this.driverLocation.lat, this.driverLocation.lng]);

    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      this.boundsSet = true;
    } else if (points.length === 1) {
      this.map.setView(points[0], 15);
      this.boundsSet = true;
    }
  }

  private updateStaleState(): void {
    if (!this.driverLocation?.recordedAtUtc) {
      this.isStale = true;
      this.lastUpdateText = '';
      return;
    }

    const recorded = new Date(this.driverLocation.recordedAtUtc);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - recorded.getTime()) / 1000);

    this.isStale = diffSec > 60;

    if (diffSec < 10) {
      this.lastUpdateText = this.isArabic ? 'الآن' : 'Just now';
    } else if (diffSec < 60) {
      this.lastUpdateText = this.isArabic
        ? `منذ ${diffSec} ثانية`
        : `${diffSec}s ago`;
    } else {
      const diffMin = Math.floor(diffSec / 60);
      this.lastUpdateText = this.isArabic
        ? `منذ ${diffMin} دقيقة`
        : `${diffMin}m ago`;
    }
  }
}
