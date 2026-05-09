import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, interval, switchMap } from 'rxjs';
import { DriverTrackingMapComponent } from '../../components/driver-tracking-map/driver-tracking-map.component';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';
import { OrderDetail, OrderStatus, OrderTimelineEntry } from '../../models/orders.models';
import { OrdersService } from '../../services/orders.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    OrderStatusBadgeComponent,
    DriverTrackingMapComponent
  ],
  template: `
    <div class="min-h-screen order-details-shell -mx-2 sm:-mx-3 md:-mx-4" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <div class="w-full max-w-none order-details-page space-y-4">
        <header class="floating-top-bar">
          <div class="flex items-center gap-2.5">
            <button routerLink="/orders" class="icon-shell group" type="button" [attr.aria-label]="currentLang === 'ar' ? 'العودة إلى الطلبات' : 'Back to orders'">
              <span class="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5" [class.rotate-180]="currentLang === 'ar'">arrow_back</span>
            </button>
            <div>
              <p class="text-[0.64rem] font-black uppercase tracking-[0.22em] text-[#00626f]/55">
                {{ currentLang === 'ar' ? 'لوحة متابعة الطلب' : 'Order Command View' }}
              </p>
              <h1 class="text-base font-extrabold text-[#004953] md:text-lg">
                {{ currentLang === 'ar' ? 'تفاصيل الطلب' : 'Order Details' }}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button class="icon-shell" type="button" (click)="retryLoad()" [disabled]="isLoading" [attr.aria-label]="currentLang === 'ar' ? 'تحديث الصفحة' : 'Refresh page'">
              <span class="material-symbols-outlined text-[20px]" [class.animate-spin]="isLoading">sync</span>
            </button>
          </div>
        </header>

        <section *ngIf="isLoading" class="surface-card flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <div class="h-12 w-12 animate-spin rounded-full border-[3px] border-[#00626f]/15 border-t-[#00626f]"></div>
          <p class="text-xs font-bold text-[#004953]/70">{{ 'COMMON.LOADING' | translate }}</p>
        </section>

        <section *ngIf="!isLoading && loadErrorMessage" class="surface-card flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <span class="material-symbols-outlined text-[28px]">error</span>
          </div>
          <p class="max-w-xl text-sm font-bold text-[#004953]">{{ loadErrorMessage }}</p>
          <button type="button" class="primary-action" (click)="retryLoad()">
            {{ currentLang === 'ar' ? 'إعادة المحاولة' : 'Retry' }}
          </button>
        </section>

        <ng-container *ngIf="!isLoading && order as currentOrder">
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div class="space-y-4 lg:col-span-8">
              <section class="surface-card overflow-hidden">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p class="eyebrow-label">{{ currentLang === 'ar' ? 'ملخص الطلب' : 'Order overview' }}</p>
                    <div class="mt-1.5 flex flex-wrap items-center gap-2.5">
                      <h2 class="text-xl font-extrabold text-[#004953] md:text-[1.7rem]">
                        {{ currentLang === 'ar' ? 'طلب' : 'Order' }}
                        <span class="font-numeric text-[#00626f]">#{{ currentOrder.displayId }}</span>
                      </h2>
                      <app-order-status-badge
                        [status]="currentOrder.status"
                        customClass="rounded-full border border-[#00626f]/10 bg-[#00626f]/5 px-3 py-1.5 text-[0.68rem] font-black"
                      ></app-order-status-badge>
                    </div>
                    <p class="mt-2.5 max-w-2xl text-[0.82rem] leading-6 text-[#3f484a]">
                      {{ currentOrder.notes || (currentLang === 'ar' ? 'عرض مباشر لحالة الطلب، بيانات العميل، وخط سير التوصيل.' : 'Live order status, customer data, and delivery progress in one place.') }}
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-2.5">
                    <button *ngIf="canConfirm()" type="button" class="primary-action" (click)="updateStatus('CONFIRMED')" [disabled]="isUpdatingStatus">
                      <span class="material-symbols-outlined text-[16px]">task_alt</span>
                      {{ 'ORDERS.ACTION_CONFIRM' | translate }}
                    </button>
                    <button *ngIf="canPrepare()" type="button" class="accent-action" (click)="updateStatus('IN_PROGRESS')" [disabled]="isUpdatingStatus">
                      <span class="material-symbols-outlined text-[16px]">restaurant</span>
                      {{ 'ORDERS.ACTION_START_PREPARING' | translate }}
                    </button>
                    <button *ngIf="canMarkReady()" type="button" class="teal-action" (click)="updateStatus('READY_FOR_PICKUP')" [disabled]="isUpdatingStatus">
                      <span class="material-symbols-outlined text-[16px]">inventory_2</span>
                      {{ 'ORDERS.ACTION_MARK_READY' | translate }}
                    </button>
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <article class="stat-card">
                    <p class="stat-label">{{ currentLang === 'ar' ? 'وقت الطلب' : 'Order time' }}</p>
                    <p class="stat-value font-numeric">{{ currentOrder.time | date:'shortTime' }}</p>
                    <p class="stat-sub">{{ currentOrder.time | date:'mediumDate' }}</p>
                  </article>
                  <article class="stat-card">
                    <p class="stat-label">{{ currentLang === 'ar' ? 'العميل' : 'Customer' }}</p>
                    <p class="stat-value">{{ currentOrder.customerName }}</p>
                    <p class="stat-sub font-numeric">{{ currentOrder.customerPhone }}</p>
                  </article>
                  <article class="stat-card">
                    <p class="stat-label">{{ currentLang === 'ar' ? 'الدفع' : 'Payment' }}</p>
                    <p class="stat-value">{{ paymentMethodLabel(currentOrder) }}</p>
                    <p class="stat-sub">{{ paymentStatusLabel(currentOrder) }}</p>
                  </article>
                  <article class="stat-card stat-card-total">
                    <p class="stat-label">{{ 'ORDERS.GRAND_TOTAL' | translate }}</p>
                    <p class="stat-value font-numeric">{{ currentOrder.total | number:'1.2-2' }}</p>
                    <p class="stat-sub">{{ 'ORDERS.CURRENCY' | translate }}</p>
                  </article>
                </div>
              </section>

              <section class="surface-card">
                <div class="flex items-center justify-between gap-4">
                  <h3 class="section-title">
                    <span class="material-symbols-outlined text-[20px] text-[#00626f]">inventory_2</span>
                    {{ 'ORDERS.DETAIL_ITEMS' | translate }}
                  </h3>
                  <span class="eyebrow-label font-numeric">{{ currentOrder.items.length }} {{ currentLang === 'ar' ? 'عنصر' : 'items' }}</span>
                </div>

                <div class="mt-4 space-y-2.5">
                  <article *ngFor="let item of currentOrder.items" class="item-row">
                    <div class="flex min-w-0 items-center gap-3">
                      <div class="item-thumb">
                        <img [src]="item.imageUrl || 'assets/images/placeholders/product.svg'" [alt]="currentLang === 'ar' ? item.nameAr : item.nameEn">
                      </div>
                      <div class="min-w-0">
                        <p class="truncate text-[0.82rem] font-extrabold text-[#004953] md:text-[0.92rem]">{{ currentLang === 'ar' ? item.nameAr : item.nameEn }}</p>
                        <div class="mt-1 flex flex-wrap items-center gap-1.5 text-[0.68rem] font-bold text-[#6f797b]">
                          <span class="rounded-full bg-[#00626f]/6 px-2.5 py-1 font-numeric text-[#00626f]">{{ item.sku }}</span>
                          <span *ngIf="item.unitAr || item.unitEn">{{ currentLang === 'ar' ? item.unitAr : item.unitEn }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="item-figures">
                      <div>
                        <p class="item-label">{{ currentLang === 'ar' ? 'الكمية' : 'Qty' }}</p>
                        <p class="item-number font-numeric">{{ item.quantity }}</p>
                      </div>
                      <div>
                        <p class="item-label">{{ currentLang === 'ar' ? 'السعر' : 'Price' }}</p>
                        <p class="item-number font-numeric">{{ item.price | number:'1.2-2' }}</p>
                      </div>
                      <div>
                        <p class="item-label">{{ currentLang === 'ar' ? 'الإجمالي' : 'Total' }}</p>
                        <p class="item-number font-numeric text-[#004953]">{{ item.total | number:'1.2-2' }}</p>
                      </div>
                    </div>
                  </article>
                </div>
              </section>

              <section class="tracking-card">
                <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 class="section-title">
                      <span class="material-symbols-outlined text-[20px] text-[#00626f]">explore</span>
                      {{ currentLang === 'ar' ? 'تتبع حي للطلب' : 'Live order tracking' }}
                    </h3>
                    <p class="section-copy">
                      {{ hasTrackableMapData()
                        ? (isTrackingActive()
                          ? (currentLang === 'ar' ? 'المندوب يتحرك الآن على المسار المباشر.' : 'The courier is moving on the live route now.')
                          : (currentLang === 'ar' ? 'الخريطة تعرض مواقع المتجر والعميل حاليًا، وسيظهر موقع المندوب فور توفره.' : 'The map is showing store and customer locations now, and the courier will appear as soon as live coordinates arrive.'))
                        : (currentLang === 'ar' ? 'لا توجد بيانات موقع حقيقية متاحة لهذا الطلب حتى الآن.' : 'No real location data is available for this order yet.') }}
                    </p>
                  </div>

                  <div class="live-pill" *ngIf="isTrackingActive(); else waitingPill">
                    <span class="relative flex h-2.5 w-2.5">
                      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                    <span>{{ currentLang === 'ar' ? 'مباشر' : 'Live' }}</span>
                  </div>
                  <ng-template #waitingPill>
                    <div class="live-pill bg-slate-100 text-slate-500">
                      <span class="material-symbols-outlined text-[18px]">{{ hasTrackableMapData() ? 'map' : 'location_off' }}</span>
                      <span>{{ hasTrackableMapData() ? (currentLang === 'ar' ? 'خريطة الطلب متاحة' : 'Order map available') : (currentLang === 'ar' ? 'لا توجد بيانات تتبع' : 'No tracking data') }}</span>
                    </div>
                  </ng-template>
                </div>

                <div class="mt-4 overflow-hidden rounded-[1.1rem] border border-white/60 bg-[#12212c] shadow-inner">
                  <div *ngIf="shouldShowLiveMap(); else trackingPlaceholder" class="h-[270px]">
                    <app-driver-tracking-map
                      [driverLocation]="currentOrder.driverLiveLocation"
                      [vendorLocation]="currentOrder.vendorLocation"
                      [customerLocation]="currentOrder.customerLocation"
                      [isArabic]="currentLang === 'ar'"
                    ></app-driver-tracking-map>
                  </div>

                  <ng-template #trackingPlaceholder>
                    <div class="tracking-empty-state">
                      <div class="tracking-empty-badge">
                        <span class="material-symbols-outlined text-[26px]">location_off</span>
                      </div>
                      <p class="tracking-empty-title">
                        {{ currentLang === 'ar' ? 'لا توجد بيانات تتبع حية لهذا الطلب' : 'No live tracking data for this order' }}
                      </p>
                      <p class="tracking-empty-copy">
                        {{ currentLang === 'ar'
                          ? 'سيتم عرض الخريطة الحقيقية فقط عند وصول إحداثيات المتجر أو العميل أو السائق من النظام.'
                          : 'The real map will appear only when store, customer, or driver coordinates are received from the system.' }}
                      </p>
                      <div class="tracking-empty-note">
                        {{ currentLang === 'ar' ? 'لا يتم عرض أي مسار أو خريطة تجريبية.' : 'No mock route or fake map is shown.' }}
                      </div>
                    </div>
                  </ng-template>
                </div>

                <div class="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-3">
                  <article class="telemetry-card">
                    <p class="telemetry-label">{{ currentLang === 'ar' ? 'الحالة الحالية' : 'Current phase' }}</p>
                    <p class="telemetry-value">{{ currentStatusLabel(currentOrder) }}</p>
                  </article>
                  <article class="telemetry-card">
                    <p class="telemetry-label">{{ currentLang === 'ar' ? 'موعد الوصول' : 'ETA' }}</p>
                    <p class="telemetry-value font-numeric">{{ currentOrder.estimatedDelivery || '--' }}</p>
                  </article>
                  <article class="telemetry-card">
                    <p class="telemetry-label">{{ currentLang === 'ar' ? 'آخر تحديث' : 'Last update' }}</p>
                    <p class="telemetry-value font-numeric">
                      {{ currentOrder.driverLiveLocation?.recordedAtUtc
                        ? (currentOrder.driverLiveLocation?.recordedAtUtc | date:'shortTime')
                        : (hasTrackableMapData() ? (currentLang === 'ar' ? 'الخريطة متاحة' : 'Map ready') : '--:--') }}
                    </p>
                  </article>
                </div>
              </section>

              <section class="surface-card">
                <div class="flex items-center justify-between gap-4">
                  <h3 class="section-title">
                    <span class="material-symbols-outlined text-[20px] text-[#00626f]">receipt_long</span>
                    {{ currentLang === 'ar' ? 'التفاصيل المالية' : 'Financial details' }}
                  </h3>
                  <span class="eyebrow-label">{{ currentLang === 'ar' ? 'بيانات الفاتورة' : 'Invoice summary' }}</span>
                </div>

                <div class="mt-4 space-y-2.5">
                  <div class="money-row">
                    <span>{{ 'ORDERS.SUBTOTAL' | translate }}</span>
                    <span class="font-numeric">{{ currentOrder.subtotal | number:'1.2-2' }} {{ 'ORDERS.CURRENCY' | translate }}</span>
                  </div>
                  <div class="money-row">
                    <span>{{ 'ORDERS.DELIVERY_FEE' | translate }}</span>
                    <span class="font-numeric">{{ currentOrder.deliveryFee | number:'1.2-2' }} {{ 'ORDERS.CURRENCY' | translate }}</span>
                  </div>
                  <div class="money-row">
                    <span>{{ 'ORDERS.TAX' | translate }}</span>
                    <span class="font-numeric">{{ currentOrder.tax | number:'1.2-2' }} {{ 'ORDERS.CURRENCY' | translate }}</span>
                  </div>
                  <div class="divider-line"></div>
                  <div class="money-total">
                    <span>{{ 'COMMON.TOTAL' | translate }}</span>
                    <span class="font-numeric">{{ currentOrder.total | number:'1.2-2' }} {{ 'ORDERS.CURRENCY' | translate }}</span>
                  </div>
                </div>
              </section>

            </div>

            <div class="space-y-4 lg:col-span-4">
              <section class="surface-card">
                <h3 class="section-title">
                  <span class="material-symbols-outlined text-[20px] text-[#00626f]">timeline</span>
                  {{ 'ORDERS.DETAIL_TIMELINE' | translate }}
                </h3>

                <div class="relative mt-4">
                  <div class="timeline-rail"></div>
                  <article *ngFor="let step of currentOrder.timeline; let i = index" class="timeline-row" [class.timeline-row-pending]="!step.isCompleted" [class.timeline-row-active]="isActiveTimelineStep(i)">
                    <div class="timeline-node" [ngClass]="timelineNodeClass(step, i)">
                      <span class="material-symbols-outlined text-[16px]">{{ timelineIcon(step) }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="truncate text-[0.82rem] font-extrabold" [ngClass]="timelineTextClass(step, i)">
                            {{ currentLang === 'ar' ? step.labelAr : step.labelEn }}
                          </p>
                          <p *ngIf="step.notes" class="mt-0.5 text-[0.7rem] leading-5 text-[#6f797b]">
                            {{ translateTimelineNote(step.notes) }}
                          </p>
                        </div>
                        <time class="font-numeric text-[0.68rem] font-bold text-[#6f797b]">
                          {{ step.timestamp | date:'shortTime' }}
                        </time>
                      </div>
                    </div>
                  </article>
                </div>
              </section>

              <section class="surface-card">
                <h3 class="section-title">
                  <span class="material-symbols-outlined text-[20px] text-[#00626f]">delivery_truck_speed</span>
                  {{ currentLang === 'ar' ? 'معلومات المندوب' : 'Driver details' }}
                </h3>

                <ng-container *ngIf="currentOrder.driverName; else noDriverState">
                  <div class="mt-4 flex items-center gap-3">
                    <div class="driver-avatar">
                      <img [src]="currentOrder.driverImage || 'assets/images/placeholders/driver.png'" [alt]="currentOrder.driverName">
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-extrabold text-[#004953]">{{ currentOrder.driverName }}</p>
                      <p class="mt-1 text-xs font-bold text-[#6f797b]">{{ driverCompanyLabel(currentOrder) }}</p>
                      <div *ngIf="currentOrder.driverRating" class="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[0.75rem] font-bold text-amber-700">
                        <span class="material-symbols-outlined text-[15px]" style="font-variation-settings: 'FILL' 1">star</span>
                        <span class="font-numeric">{{ currentOrder.driverRating }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="mt-4 rounded-[1rem] bg-[#f5f7f8] p-3.5">
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-xs font-bold text-[#6f797b]">{{ currentLang === 'ar' ? 'المركبة' : 'Vehicle' }}</span>
                      <span class="text-sm font-extrabold text-[#004953]">{{ currentOrder.driverVehicleType || '--' }}</span>
                    </div>
                    <div class="mt-3 flex items-center justify-between gap-3">
                      <span class="text-xs font-bold text-[#6f797b]">{{ currentLang === 'ar' ? 'اللوحة' : 'Plate' }}</span>
                      <span class="font-numeric text-sm font-extrabold tracking-[0.18em] text-[#004953]">{{ currentOrder.driverVehiclePlate || '--' }}</span>
                    </div>
                  </div>

                  <div class="mt-3 grid grid-cols-2 gap-2.5">
                    <a *ngIf="currentOrder.driverPhone" class="contact-action" [href]="'tel:' + currentOrder.driverPhone">
                      <span class="material-symbols-outlined text-[18px]">call</span>
                      {{ currentLang === 'ar' ? 'اتصال' : 'Call' }}
                    </a>
                    <a *ngIf="currentOrder.driverPhone" class="contact-action" [href]="'https://wa.me/' + sanitizePhone(currentOrder.driverPhone)" target="_blank" rel="noreferrer">
                      <span class="material-symbols-outlined text-[18px]">chat</span>
                      {{ currentLang === 'ar' ? 'رسالة' : 'Message' }}
                    </a>
                  </div>
                </ng-container>

                <ng-template #noDriverState>
                  <div class="mt-5 rounded-[1.1rem] border border-dashed border-[#00626f]/20 bg-[#f8fafb] px-4 py-8 text-center">
                    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#00626f]/8 text-[#00626f]">
                      <span class="material-symbols-outlined text-[22px]">{{ isDispatchInProgress() ? 'search' : 'delivery_truck_speed' }}</span>
                    </div>
                    <p class="mt-3 text-[0.82rem] font-extrabold text-[#004953]">
                      {{ isDispatchInProgress() ? (currentLang === 'ar' ? 'جارٍ البحث عن مندوب' : 'Searching for a courier') : (currentLang === 'ar' ? 'لم يتم تعيين مندوب بعد' : 'No courier assigned yet') }}
                    </p>
                    <p class="mt-1.5 text-[0.7rem] leading-5 text-[#6f797b]">
                      {{ currentLang === 'ar' ? 'سيظهر ملف المندوب هنا فور قبول مهمة التوصيل.' : 'The courier profile will appear here once a delivery task is accepted.' }}
                    </p>
                  </div>
                </ng-template>
              </section>

              <section class="otp-card" *ngIf="currentOrder.canConfirmPickup">
                <div class="relative z-10">
                  <h3 class="text-lg font-extrabold text-white">
                    {{ currentLang === 'ar' ? 'تسليم الطلب' : 'Pickup handoff' }}
                  </h3>
                  <p class="mt-2 text-[0.82rem] leading-6 text-[#d8f6fb]">
                    {{ currentLang === 'ar' ? 'أدخل رمز التحقق المكوّن من 4 أرقام لتأكيد تسليم الطلب للمندوب.' : 'Enter the 4-digit OTP to confirm the handoff to the courier.' }}
                  </p>

                  <div class="mt-5 flex justify-center gap-2" dir="ltr">
                    <input
                      *ngFor="let i of [0, 1, 2, 3]"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]"
                      maxlength="1"
                      [attr.data-otp-index]="i"
                      [value]="otpDigits[i] || ''"
                      (input)="onOtpDigitInput($event, i)"
                      (keydown)="onOtpKeyDown($event, i)"
                      (paste)="onOtpPaste($event)"
                      class="otp-input"
                      placeholder="•"
                    />
                  </div>

                  <button type="button" class="otp-submit" (click)="confirmPickup()" [disabled]="isConfirmingPickup || otpDigits.join('').length < 4">
                    <span *ngIf="!isConfirmingPickup" class="flex items-center justify-center gap-2">
                      <span class="material-symbols-outlined text-[20px]">check_circle</span>
                      {{ currentLang === 'ar' ? 'تأكيد التسليم' : 'Confirm handoff' }}
                    </span>
                    <span *ngIf="isConfirmingPickup" class="flex items-center justify-center gap-2">
                      <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      {{ 'COMMON.PROCESSING' | translate }}
                    </span>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  order: OrderDetail | null = null;
  orderId: string | null = null;
  currentLang = 'ar';
  isUpdatingStatus = false;
  isConfirmingPickup = false;
  isLoading = true;
  loadErrorMessage = '';
  otpDigits: string[] = ['', '', '', ''];
  private sub: Subscription | null = null;
  private langSub: Subscription | null = null;
  private pollSub: Subscription | null = null;
  private readonly POLL_INTERVAL_MS = 8000;

  constructor(
    private route: ActivatedRoute,
    private ordersService: OrdersService,
    private translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((e) => {
      this.currentLang = e.lang;
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId = id;
      this.loadOrder(id);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.langSub?.unsubscribe();
    this.stopPolling();
  }

  canConfirm(): boolean {
    return this.order?.backendStatus === 'PendingVendorAcceptance';
  }

  canPrepare(): boolean {
    return this.order?.backendStatus === 'Accepted';
  }

  canMarkReady(): boolean {
    return this.order?.backendStatus === 'Preparing';
  }

  isDispatchInProgress(): boolean {
    return this.order?.backendStatus === 'ReadyForPickup' || this.order?.backendStatus === 'DriverAssignmentInProgress';
  }

  isTrackingActive(): boolean {
    const status = this.order?.backendStatus;
    return status === 'DriverAssigned' || status === 'PickedUp' || status === 'OnTheWay';
  }

  hasTrackableMapData(): boolean {
    return !!(
      this.order?.vendorLocation ||
      this.order?.customerLocation ||
      this.order?.driverLiveLocation
    );
  }

  shouldShowLiveMap(): boolean {
    return this.hasTrackableMapData();
  }

  updateStatus(status: OrderStatus): void {
    if (!this.order || this.isUpdatingStatus) {
      return;
    }

    const orderId = this.order.id;
    this.isUpdatingStatus = true;

    this.ordersService.updateOrderStatus(orderId, status).subscribe({
      next: (updated) => {
        this.order = updated;
        this.isUpdatingStatus = false;
        this.startPollingIfNeeded();
      },
      error: (error: HttpErrorResponse) => {
        this.isUpdatingStatus = false;
        this.loadOrder(orderId);
        alert(this.resolveUpdateErrorMessage(error));
      }
    });
  }

  confirmPickup(): void {
    const code = this.otpDigits.join('');
    if (!this.order || this.isConfirmingPickup || code.length < 4) {
      return;
    }

    const orderId = this.order.id;
    this.isConfirmingPickup = true;

    this.ordersService.confirmPickupOtp(orderId, code).subscribe({
      next: (updated) => {
        this.order = updated;
        this.isConfirmingPickup = false;
        this.otpDigits = ['', '', '', ''];
        this.loadOrder(orderId);
      },
      error: (error: HttpErrorResponse) => {
        this.isConfirmingPickup = false;
        this.otpDigits = ['', '', '', ''];
        setTimeout(() => {
          const first = document.querySelector<HTMLInputElement>('[data-otp-index="0"]');
          first?.focus();
        });
        const detail = error.error?.detail;
        alert(typeof detail === 'string' && detail.trim() ? detail : (this.currentLang === 'ar' ? 'رمز غير صحيح' : 'Invalid code'));
      }
    });
  }

  onOtpDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    input.value = value;
    this.otpDigits[index] = value;

    if (value && index < 3) {
      const next = document.querySelector<HTMLInputElement>(`[data-otp-index="${index + 1}"]`);
      next?.focus();
    }

    if (this.otpDigits.join('').length === 4) {
      this.confirmPickup();
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prev = document.querySelector<HTMLInputElement>(`[data-otp-index="${index - 1}"]`);
      if (prev) {
        this.otpDigits[index - 1] = '';
        prev.value = '';
        prev.focus();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text')?.replace(/[^0-9]/g, '') || '';
    const digits = paste.slice(0, 4).split('');

    for (let i = 0; i < 4; i++) {
      this.otpDigits[i] = digits[i] || '';
      const input = document.querySelector<HTMLInputElement>(`[data-otp-index="${i}"]`);
      if (input) {
        input.value = this.otpDigits[i];
      }
    }

    const nextEmpty = this.otpDigits.findIndex((digit) => !digit);
    const focusIndex = nextEmpty === -1 ? 3 : nextEmpty;
    const target = document.querySelector<HTMLInputElement>(`[data-otp-index="${focusIndex}"]`);
    target?.focus();

    if (this.otpDigits.join('').length === 4) {
      this.confirmPickup();
    }
  }

  retryLoad(): void {
    if (!this.orderId) {
      return;
    }

    this.loadOrder(this.orderId);
  }

  paymentMethodLabel(order: OrderDetail): string {
    if (this.currentLang === 'ar') {
      return order.paymentMethodType === 'CARD' ? 'بطاقة ائتمان' : 'نقدًا عند الاستلام';
    }

    return order.paymentMethodType === 'CARD' ? 'Credit card' : 'Cash on delivery';
  }

  paymentStatusLabel(order: OrderDetail): string {
    const labels = this.currentLang === 'ar'
      ? {
          PENDING: 'قيد الانتظار',
          PAID: 'مدفوع',
          FAILED: 'فشل الدفع',
          REFUNDED: 'مسترد',
          PARTIALLY_REFUNDED: 'استرداد جزئي',
          COD_PENDING: 'يدفع عند التسليم'
        }
      : {
          PENDING: 'Pending',
          PAID: 'Paid',
          FAILED: 'Failed',
          REFUNDED: 'Refunded',
          PARTIALLY_REFUNDED: 'Partially refunded',
          COD_PENDING: 'Pay on delivery'
        };

    return labels[order.paymentStatus] || order.paymentStatus;
  }

  currentStatusLabel(order: OrderDetail): string {
    return this.currentLang === 'ar' ? this.getStatusLabel(order.status).ar : this.getStatusLabel(order.status).en;
  }

  driverCompanyLabel(order: OrderDetail): string {
    return this.currentLang === 'ar'
      ? order.driverCompanyAr || 'شركة التوصيل'
      : order.driverCompanyEn || 'Delivery company';
  }

  sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
  }

  timelineIcon(step: OrderTimelineEntry): string {
    const icons: Record<OrderStatus, string> = {
      NEW: 'receipt_long',
      CONFIRMED: 'task_alt',
      IN_PROGRESS: 'restaurant',
      READY_FOR_PICKUP: 'inventory_2',
      DRIVER_ASSIGNMENT_IN_PROGRESS: 'search',
      DRIVER_ASSIGNED: 'delivery_truck_speed',
      PICKED_UP: 'move_to_inbox',
      OUT_FOR_DELIVERY: 'local_shipping',
      DELIVERED: 'home',
      COMPLETED: 'check_circle',
      CANCELLED: 'close',
      RETURNED: 'undo',
      DELIVERY_FAILED: 'warning',
      REFUNDED: 'currency_exchange'
    };

    return icons[step.status] || 'radio_button_checked';
  }

  timelineNodeClass(step: OrderTimelineEntry, index: number): string[] {
    const classes = ['timeline-node', this.timelineStatusClass(step.status)];

    if (step.isCompleted) {
      classes.push('timeline-node-completed');
    }

    if (this.isActiveTimelineStep(index)) {
      classes.push('timeline-node-active');
    }

    if (!step.isCompleted) {
      classes.push('timeline-node-pending');
    }

    return classes;
  }

  timelineTextClass(step: OrderTimelineEntry, index: number): string[] {
    if (this.isActiveTimelineStep(index)) {
      return ['timeline-text-active', this.timelineAccentTextClass(step.status)];
    }

    return step.isCompleted ? ['text-[#004953]'] : ['text-[#5f6b6e]'];
  }

  isActiveTimelineStep(index: number): boolean {
    const timeline = this.order?.timeline ?? [];
    const current = timeline[index];
    const next = timeline[index + 1];

    return !!current?.isCompleted && !next?.isCompleted;
  }

  translateTimelineNote(note: string): string {
    if (!note || this.currentLang !== 'ar') {
      return note;
    }

    const cleanNote = note.trim().replace(/^\.+/, '').trim();

    const translations: Record<string, string> = {
      'Cash on delivery selected': 'تم اختيار الدفع عند الاستلام',
      'Awaiting vendor response': 'في انتظار رد المتجر',
      'Vendor accepted the order': 'تم قبول الطلب من قبل المتجر',
      'Vendor started preparing': 'بدأ المتجر في تجهيز الطلب',
      'Order is ready for pickup': 'الطلب جاهز للاستلام',
      'Auto-dispatch started': 'بدأ البحث التلقائي عن مندوب',
      'Driver accepted delivery offer': 'تم قبول عرض التوصيل من قبل المندوب',
      'Vendor confirmed pickup handoff via OTP': 'تم تأكيد تسليم الطلب للمندوب عبر الرمز',
      'Driver is on the way': 'المندوب في الطريق إليك',
      'Driver verified delivery OTP': 'تم التحقق من رمز التوصيل بنجاح',
      'Order placed': 'تم إنشاء الطلب بنجاح',
      'Order confirmed': 'تم تأكيد الطلب',
      'Order picked up': 'تم استلام الطلب من قبل المندوب',
      'Order delivered': 'تم توصيل الطلب بنجاح'
    };

    return translations[cleanNote] || note;
  }

  private timelineStatusClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      NEW: 'timeline-status-new',
      CONFIRMED: 'timeline-status-confirmed',
      IN_PROGRESS: 'timeline-status-preparing',
      READY_FOR_PICKUP: 'timeline-status-ready',
      DRIVER_ASSIGNMENT_IN_PROGRESS: 'timeline-status-dispatch',
      DRIVER_ASSIGNED: 'timeline-status-driver',
      PICKED_UP: 'timeline-status-picked',
      OUT_FOR_DELIVERY: 'timeline-status-shipping',
      DELIVERED: 'timeline-status-delivered',
      COMPLETED: 'timeline-status-completed',
      CANCELLED: 'timeline-status-cancelled',
      RETURNED: 'timeline-status-returned',
      DELIVERY_FAILED: 'timeline-status-failed',
      REFUNDED: 'timeline-status-refunded'
    };

    return classes[status];
  }

  private timelineAccentTextClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      NEW: 'text-[#0d5c63]',
      CONFIRMED: 'text-[#0f766e]',
      IN_PROGRESS: 'text-[#c77700]',
      READY_FOR_PICKUP: 'text-[#0f8a7a]',
      DRIVER_ASSIGNMENT_IN_PROGRESS: 'text-[#0b7285]',
      DRIVER_ASSIGNED: 'text-[#2563eb]',
      PICKED_UP: 'text-[#7c3aed]',
      OUT_FOR_DELIVERY: 'text-[#0891b2]',
      DELIVERED: 'text-[#15803d]',
      COMPLETED: 'text-[#166534]',
      CANCELLED: 'text-[#b42318]',
      RETURNED: 'text-[#9333ea]',
      DELIVERY_FAILED: 'text-[#c2410c]',
      REFUNDED: 'text-[#7c2d12]'
    };

    return classes[status];
  }

  private loadOrder(orderId: string): void {
    this.sub?.unsubscribe();
    this.isLoading = true;
    this.loadErrorMessage = '';

    this.sub = this.ordersService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;

        if (!order) {
          this.stopPolling();
          this.loadErrorMessage = this.currentLang === 'ar'
            ? 'تعذر العثور على الطلب المطلوب أو أنك لا تملك صلاحية الوصول إليه.'
            : 'The requested order was not found or you do not have access to it.';
          return;
        }

        this.startPollingIfNeeded();
      },
      error: () => {
        this.order = null;
        this.isLoading = false;
        this.stopPolling();
        this.loadErrorMessage = this.currentLang === 'ar'
          ? 'حدث خطأ أثناء تحميل تفاصيل الطلب. حاول مرة أخرى.'
          : 'Failed to load order details. Please try again.';
      }
    });
  }

  private startPollingIfNeeded(): void {
    this.stopPolling();

    if (!this.order) {
      return;
    }

    const terminalStates: OrderStatus[] = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'DELIVERY_FAILED', 'REFUNDED'];
    if (terminalStates.includes(this.order.status)) {
      return;
    }

    const pollInterval = this.isTrackingActive() ? 5000 : this.POLL_INTERVAL_MS;
    const orderId = this.order.id;

    this.pollSub = interval(pollInterval).pipe(
      switchMap(() => this.ordersService.getOrderById(orderId))
    ).subscribe((updated) => {
      if (!updated) {
        this.stopPolling();
        return;
      }

      this.order = updated;

      if (terminalStates.includes(updated.status)) {
        this.stopPolling();
      }
    });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  private resolveUpdateErrorMessage(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    return this.translate.instant('COMMON.ERROR_OCCURRED');
  }

  private getStatusLabel(status: OrderStatus): { ar: string; en: string } {
    const labels: Record<OrderStatus, { ar: string; en: string }> = {
      NEW: { ar: 'طلب جديد', en: 'New order' },
      CONFIRMED: { ar: 'تم التأكيد', en: 'Confirmed' },
      IN_PROGRESS: { ar: 'قيد التجهيز', en: 'Preparing' },
      READY_FOR_PICKUP: { ar: 'جاهز للاستلام', en: 'Ready for pickup' },
      DRIVER_ASSIGNMENT_IN_PROGRESS: { ar: 'جارٍ البحث عن مندوب', en: 'Finding a driver' },
      DRIVER_ASSIGNED: { ar: 'تم تعيين مندوب', en: 'Driver assigned' },
      PICKED_UP: { ar: 'تم الاستلام من المتجر', en: 'Picked up' },
      OUT_FOR_DELIVERY: { ar: 'في الطريق', en: 'On the way' },
      DELIVERED: { ar: 'تم التوصيل', en: 'Delivered' },
      COMPLETED: { ar: 'مكتمل', en: 'Completed' },
      CANCELLED: { ar: 'ملغي', en: 'Cancelled' },
      RETURNED: { ar: 'مرتجع', en: 'Returned' },
      DELIVERY_FAILED: { ar: 'فشل التوصيل', en: 'Delivery failed' },
      REFUNDED: { ar: 'تم الاسترداد', en: 'Refunded' }
    };

    return labels[status];
  }
}
