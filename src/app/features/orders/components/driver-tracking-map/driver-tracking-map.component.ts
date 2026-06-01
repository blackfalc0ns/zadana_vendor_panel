import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      <div #mapContainer class="h-[400px] w-full" style="z-index: 0; filter: contrast(1.1) saturate(1.1);"></div>

      <!-- Unified Premium Navigation Bar -->
      <div *ngIf="driverLocation" class="absolute bottom-4 inset-x-4 md:inset-x-8 md:bottom-6 flex items-center justify-between px-2 py-2 rounded-[2rem] bg-[#001f24]/90 text-white backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_-5px_rgba(0,0,0,0.5)] transition-all group-hover/map:bottom-7" style="z-index: 1000">
        
        <!-- Telemetry Update (Right in RTL, Left in LTR) -->
        <div class="flex items-center gap-3 px-3">
           <div class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 shadow-inner">
             <span class="material-symbols-outlined text-[22px] text-teal-300">satellite_alt</span>
             <div class="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#001f24] animate-pulse"></div>
           </div>
           <div class="hidden sm:block">
             <p class="text-[0.65rem] font-bold text-teal-200/80 uppercase tracking-widest mb-0.5">
               {{ isArabic ? 'تحديث الإحداثيات' : 'Telemetry' }}
             </p>
             <p class="text-[0.85rem] font-black truncate max-w-[120px]">
               {{ lastUpdateText }}
             </p>
           </div>
        </div>

        <!-- Divider -->
        <div class="hidden sm:block h-10 w-px bg-white/10"></div>

        <!-- ETA (Center) -->
        <div *ngIf="routeEtaMinutes" class="flex-1 flex justify-center">
          <div class="flex items-center gap-3 px-5 py-2.5 md:px-8 md:py-3 rounded-[1.5rem] bg-gradient-to-r from-teal-500/30 to-emerald-500/30 border border-teal-400/30 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)]">
             <span class="material-symbols-outlined text-[26px] text-teal-400 animate-bounce" style="animation-duration: 2s;">route</span>
             <div>
               <p class="text-[0.65rem] font-bold text-emerald-100 uppercase tracking-widest mb-0.5">
                 {{ isArabic ? 'الوقت المتبقي' : 'ETA' }}
               </p>
               <div class="flex items-baseline gap-1">
                 <span class="text-2xl font-black font-inter leading-none text-white drop-shadow-md">{{ routeEtaMinutes }}</span>
                 <span class="text-[0.7rem] font-bold text-emerald-50">{{ isArabic ? 'دقيقة' : 'min' }}</span>
               </div>
             </div>
          </div>
        </div>

        <!-- Empty spacer if no ETA to keep layout balanced -->
        <div *ngIf="!routeEtaMinutes" class="flex-1"></div>

        <!-- Divider -->
        <div *ngIf="driverLocation?.accuracyMeters" class="hidden sm:block h-10 w-px bg-white/10"></div>

        <!-- Precision (Left in RTL, Right in LTR) -->
        <div *ngIf="driverLocation?.accuracyMeters" class="flex items-center gap-3 px-3" [dir]="isArabic ? 'ltr' : 'rtl'">
           <div class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/5">
              <span class="material-symbols-outlined text-[20px] text-amber-400">my_location</span>
           </div>
           <div class="hidden sm:block" [dir]="isArabic ? 'rtl' : 'ltr'">
             <p class="text-[0.65rem] font-bold text-white/50 uppercase tracking-widest mb-0.5">
               {{ isArabic ? 'دقة الموقع' : 'Precision' }}
             </p>
             <p class="text-[1rem] font-black font-inter text-amber-400 drop-shadow-md">
               ±{{ driverLocation.accuracyMeters | number:'1.0-0' }}m
             </p>
           </div>
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
  @Input() orderStatus?: string;
  @Input() isArabic = false;

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  isStale = false;
  lastUpdateText = '';
  routeEtaMinutes?: number;

  private map?: L.Map;
  private driverMarker?: L.Marker;
  private vendorMarker?: L.Marker;
  private customerMarker?: L.Marker;
  private accuracyCircle?: L.Circle;
  private routeLine?: L.Polyline;
  private boundsSet = false;
  private staleTimer?: ReturnType<typeof setInterval>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.staleTimer = setInterval(() => this.updateStaleState(), 5000);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['driverLocation']) {
      const hadDriverLocation = !!changes['driverLocation'].previousValue;
      this.updateDriverMarker();
      this.updateStaleState();
      this.keepDriverInView(!hadDriverLocation);
      this.fetchAndDrawRoute();
    }
    if (changes['vendorLocation']) {
      this.upsertVendorMarker();
      this.fetchAndDrawRoute();
    }
    if (changes['customerLocation']) {
      this.upsertCustomerMarker();
      this.fetchAndDrawRoute();
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
    this.upsertVendorMarker();
    this.upsertCustomerMarker();
    this.updateDriverMarker();
    this.fitBounds();
  }

  private upsertVendorMarker(): void {
    if (!this.map || !this.vendorLocation) return;

    const latlng: L.LatLngExpression = [this.vendorLocation.lat, this.vendorLocation.lng];

    if (this.vendorMarker) {
      this.vendorMarker.setLatLng(latlng);
      return;
    }

    const icon = L.divIcon({
      className: 'vendor-marker-icon',
      html: '<div class="vendor-marker-dot">🏪</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.vendorMarker = L.marker(
      latlng,
      { icon, zIndexOffset: 100 }
    ).addTo(this.map);

    this.vendorMarker.bindTooltip(
      this.isArabic ? 'موقع المتجر' : 'Store Location',
      { direction: 'top', offset: [0, -18] }
    );
  }

  private upsertCustomerMarker(): void {
    if (!this.map || !this.customerLocation) return;

    const latlng: L.LatLngExpression = [this.customerLocation.lat, this.customerLocation.lng];

    if (this.customerMarker) {
      this.customerMarker.setLatLng(latlng);
      return;
    }

    const icon = L.divIcon({
      className: 'customer-marker-icon',
      html: '<div class="customer-marker-dot">📍</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.customerMarker = L.marker(
      latlng,
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

  private keepDriverInView(isFirstDriverLocation: boolean): void {
    if (!this.map || !this.driverLocation) return;

    const driverLatLng = L.latLng(this.driverLocation.lat, this.driverLocation.lng);

    if (isFirstDriverLocation) {
      this.fitBounds(true);
      return;
    }

    const innerBounds = this.map.getBounds().pad(-0.15);
    if (!innerBounds.contains(driverLatLng)) {
      this.map.panTo(driverLatLng, {
        animate: true,
        duration: 0.6
      });
    }
  }

  private fitBounds(force = false): void {
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
    } else if (force) {
      this.boundsSet = false;
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

  private fetchAndDrawRoute(): void {
    if (!this.map || !this.driverLocation) return;

    // Determine the destination based on the order status
    // Statuses indicating courier is heading to customer (after pickup)
    const afterPickupStatuses = ['PICKED_UP', 'OUT_FOR_DELIVERY'];
    const headingToCustomer = this.orderStatus && afterPickupStatuses.includes(this.orderStatus);

    const destination = headingToCustomer ? this.customerLocation : this.vendorLocation;
    
    if (!destination) return;

    const url = `https://router.project-osrm.org/route/v1/driving/${this.driverLocation.lng},${this.driverLocation.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          const latLngs = coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);

          if (this.routeLine) {
            this.map!.removeLayer(this.routeLine);
          }

          this.routeLine = L.polyline(latLngs, {
            color: '#00626F',
            weight: 4,
            dashArray: '10, 10',
            opacity: 0.8
          }).addTo(this.map!);
          
          this.routeEtaMinutes = Math.ceil(data.routes[0].duration / 60);
          this.cdr.detectChanges();
        }
      })
      .catch(error => console.error('Error fetching OSRM route:', error));
  }
}
