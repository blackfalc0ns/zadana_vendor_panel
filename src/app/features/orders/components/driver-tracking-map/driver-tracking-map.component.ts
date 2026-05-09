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
    <div class="relative overflow-hidden rounded-[2.5rem] border border-white/40 oasis-glass shadow-2xl group/map">
      <!-- Executive Telemetry Header -->
      <div class="flex items-center justify-between border-b border-[#004953]/5 bg-white/40 px-6 py-4 backdrop-blur-xl relative z-10">
        <div class="flex items-center gap-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#004953] text-white shadow-lg shadow-[#004953]/20 transition-transform group-hover/map:scale-110">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div>
            <p class="text-[0.85rem] font-black uppercase tracking-[0.2em] text-[#004953]">
              {{ isArabic ? 'تتبع المندوب مباشر' : 'Satellite Telemetry' }}
            </p>
            <p class="text-[0.65rem] font-black text-[#00626F]/60 uppercase tracking-widest">
              {{ isArabic ? 'تحديث كل 5 ثوانٍ' : 'Active Feedback Loop' }}
            </p>
          </div>
        </div>

        <!-- Pulse Indicator -->
        <div class="flex items-center gap-3 rounded-xl px-4 py-2 bg-white/50 border border-white shadow-inner"
          [class]="isStale ? 'text-amber-600' : 'text-[#00626F]'">
          <div class="relative flex h-2.5 w-2.5">
            <div *ngIf="!isStale"
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00626F] opacity-75"></div>
            <div class="relative inline-flex h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
              [class]="isStale ? 'bg-amber-500' : 'bg-[#00626F]'"></div>
          </div>
          <span class="text-[0.7rem] font-black uppercase tracking-[0.2em]">
            {{ isStale
              ? (isArabic ? 'جاري التحديث...' : 'SYNCHRONIZING')
              : (isArabic ? 'مباشر' : 'LIVE FEED') }}
          </span>
        </div>
      </div>

      <!-- Map Interface -->
      <div #mapContainer class="h-[320px] w-full" style="z-index: 0; filter: contrast(1.1) saturate(1.1);"></div>

      <!-- Live Data Overlay -->
      <div *ngIf="driverLocation" class="absolute bottom-6 inset-x-6 flex items-center justify-between px-6 py-4 rounded-2xl bg-[#004953]/90 text-white backdrop-blur-xl border border-white/20 shadow-2xl transition-all group-hover/map:bottom-8">
        <div class="flex items-center gap-5">
          <div class="h-12 w-12 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-2xl shadow-inner">
            🛰️
          </div>
          <div>
            <p class="text-[0.8rem] font-black uppercase tracking-widest leading-none mb-1">
              {{ isArabic ? 'موقع المندوب' : 'Carrier Coordinates' }}
            </p>
            <p class="text-[0.65rem] font-bold text-white/50 uppercase tracking-[0.2em]">
              {{ lastUpdateText }}
            </p>
          </div>
        </div>
        
        <div *ngIf="driverLocation?.accuracyMeters" class="flex flex-col items-end">
           <span class="text-[0.6rem] font-black text-white/40 uppercase tracking-widest mb-1">Precision</span>
           <span class="text-[0.9rem] font-black font-inter text-[#FF9800]">±{{ driverLocation.accuracyMeters | number:'1.0-0' }}m</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .oasis-glass {
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(24px) saturate(200%);
      -webkit-backdrop-filter: blur(24px) saturate(200%);
    }

    .font-inter { font-family: 'Inter', sans-serif; }

    :host ::ng-deep .leaflet-control-attribution {
      font-size: 8px !important;
      opacity: 0.4;
      background: none !important;
      color: #004953;
    }

    :host ::ng-deep .driver-marker-icon, 
    :host ::ng-deep .vendor-marker-icon, 
    :host ::ng-deep .customer-marker-icon {
      background: none;
      border: none;
    }

    :host ::ng-deep .driver-marker-pulse {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: #00626F;
      border: 3px solid white;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 12px 24px rgba(0, 98, 111, 0.4);
      animation: markerPulse 2s ease-in-out infinite;
    }

    :host ::ng-deep .vendor-marker-dot {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #FF9800;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 8px 16px rgba(255, 152, 0, 0.3);
    }

    :host ::ng-deep .customer-marker-dot {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #127C8C;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 8px 16px rgba(18, 124, 140, 0.3);
    }

    @keyframes markerPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 98, 111, 0.4); }
      50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(0, 98, 111, 0); }
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
