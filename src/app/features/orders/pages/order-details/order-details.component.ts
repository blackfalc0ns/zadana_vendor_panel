import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, interval, switchMap } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { OrderDetail, OrderStatus } from '../../models/orders.models';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { DriverTrackingMapComponent } from '../../components/driver-tracking-map/driver-tracking-map.component';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, OrderStatusBadgeComponent, AppPanelHeaderComponent, AppPageHeaderComponent, DriverTrackingMapComponent],
  template: `
    <div class="space-y-6" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <div *ngIf="isLoading" class="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[28px] border border-slate-100 bg-white p-10 text-center shadow-sm">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-zadna-primary/15 border-t-zadna-primary"></div>
        <p class="text-sm font-black text-slate-700">{{ 'COMMON.LOADING' | translate }}</p>
      </div>

      <div *ngIf="!isLoading && loadErrorMessage" class="rounded-[28px] border border-rose-200 bg-white p-8 shadow-sm">
        <div class="mx-auto flex max-w-xl flex-col items-center text-center">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 0 0 3.66 18h16.68a1 1 0 0 0 .87-1.5l-7.5-13a1 1 0 0 0-1.74 0z"></path>
            </svg>
          </div>
          <h2 class="mb-2 text-lg font-black text-slate-900">
            {{ currentLang === 'ar' ? 'تعذر تحميل الطلب' : 'Unable to load order' }}
          </h2>
          <p class="mb-5 text-sm font-bold text-slate-500">{{ loadErrorMessage }}</p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <a routerLink="/orders" class="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-[0.8rem] font-black text-slate-700 transition hover:bg-slate-100">
              {{ currentLang === 'ar' ? 'العودة إلى الطلبات' : 'Back to orders' }}
            </a>
            <button
              *ngIf="orderId"
              type="button"
              (click)="retryLoad()"
              class="rounded-2xl bg-zadna-primary px-5 py-3 text-[0.8rem] font-black text-white transition hover:opacity-95">
              {{ currentLang === 'ar' ? 'إعادة المحاولة' : 'Retry' }}
            </button>
          </div>
        </div>
      </div>

      <ng-container *ngIf="!isLoading && !loadErrorMessage">
      <app-page-header
        [showBack]="true"
        backLink="/orders"
        [eyebrow]="'ORDERS.DETAIL_TITLE' | translate"
        [description]="orderMetaLine"
        customClass="sticky top-4 z-20"
      >
        <span title class="inline-flex items-center gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zadna-primary/10 text-zadna-primary">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.172a2 2 0 0 1 1.414.586l3.828 3.828A2 2 0 0 1 18 8.828V19a2 2 0 0 1-2 2Z"></path>
            </svg>
          </span>
          <span class="flex flex-col">
            <span class="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-slate-400">
              {{ 'ORDERS.HEADER_ORDER_ID' | translate }}
            </span>
            <span class="text-[1.65rem] font-black tracking-tight text-slate-900">#{{ order?.displayId }}</span>
          </span>
        </span>

        <div actions class="flex flex-wrap items-center gap-3">

          <div *ngIf="order" class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[0.72rem] font-black text-emerald-700">
            <span class="text-emerald-500">{{ 'ORDERS.GRAND_TOTAL' | translate }}</span>
            <span>{{ order.total | number:'1.2-2' }} {{ 'ORDERS.CURRENCY' | translate }}</span>
          </div>

          <app-order-status-badge *ngIf="order" [status]="order.status"></app-order-status-badge>

          <button 
            *ngIf="canConfirm()"
            (click)="updateStatus('CONFIRMED')"
            [disabled]="isUpdatingStatus"
            class="rounded-2xl bg-zadna-primary px-6 py-3 text-[0.8rem] font-black text-white shadow-lg shadow-zadna-primary/20 transition-all hover:translate-y-[-1px] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
            {{ 'ORDERS.ACTION_CONFIRM' | translate }}
          </button>
          <button 
            *ngIf="canPrepare()"
            (click)="updateStatus('IN_PROGRESS')"
            [disabled]="isUpdatingStatus"
            class="rounded-2xl bg-amber-500 px-6 py-3 text-[0.8rem] font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:translate-y-[-1px] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
            {{ 'ORDERS.ACTION_START_PREPARING' | translate }}
          </button>
          <button 
            *ngIf="canMarkReady()"
            (click)="updateStatus('READY_FOR_PICKUP')"
            [disabled]="isUpdatingStatus"
            class="rounded-2xl bg-indigo-600 px-6 py-3 text-[0.8rem] font-black text-white shadow-lg shadow-indigo-600/20 transition-all hover:translate-y-[-1px] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
            {{ 'ORDERS.ACTION_MARK_READY' | translate }}
          </button>
        </div>
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Journey & Details -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Timeline Card -->
          <div class="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <app-panel-header
              [title]="'ORDERS.DETAIL_TIMELINE'"
              containerClass="mb-8 border-b border-slate-50 pb-4"
              contentClass="flex items-center justify-between gap-3"
              titleClass="text-sm font-black uppercase tracking-wider text-slate-800"
            ></app-panel-header>
            
            <div class="relative ps-8 space-y-8 before:absolute before:inset-y-0 before:start-2 before:w-0.5 before:bg-slate-100">
              <div *ngFor="let step of order?.timeline; let last = last" class="relative">
                <span class="absolute -start-[2.15rem] flex h-4 w-4 items-center justify-center rounded-full bg-white ring-4 ring-white">
                  <span class="h-2 w-2 rounded-full" [ngClass]="step.isCompleted ? 'bg-zadna-primary' : 'bg-slate-200'"></span>
                </span>
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p class="text-[0.85rem] font-black text-slate-800">{{ currentLang === 'ar' ? step.labelAr : step.labelEn }}</p>
                    <p *ngIf="step.notes" class="text-[0.75rem] font-bold text-slate-400">{{ step.notes }}</p>
                  </div>
                  <time class="text-[0.7rem] font-black text-slate-400 opacity-80">{{ step.timestamp | date:'short' }}</time>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Card -->
          <div class="rounded-[28px] border border-slate-100 bg-white overflow-hidden shadow-sm">
             <app-panel-header
               [title]="'ORDERS.DETAIL_ITEMS'"
               containerClass="border-b border-slate-50 px-6 py-6"
               contentClass="flex items-center justify-between gap-3"
               titleClass="text-sm font-black uppercase tracking-wider text-slate-800"
             ></app-panel-header>
             <table class="w-full text-start">
               <thead class="bg-slate-50/50 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">
                 <tr>
                   <th class="px-6 py-3 text-start">{{ 'PRODUCTS.HEADER_PRODUCT' | translate }}</th>
                   <th class="px-6 py-3 text-center">{{ 'PRODUCTS.HEADER_STOCK' | translate }}</th>
                   <th class="px-6 py-3 text-end">{{ 'PRODUCTS.HEADER_PRICE' | translate }}</th>
                 </tr>
               </thead>
               <tbody class="divide-y divide-slate-50">
                 <tr *ngFor="let item of order?.items" class="group hover:bg-slate-50/30 transition-colors">
                   <td class="px-6 py-3">
                     <div class="flex items-center gap-3">
                       <div class="h-10 w-10 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                         <img [src]="item.imageUrl || 'assets/images/placeholders/product.svg'" class="h-full w-full object-cover">
                       </div>
                       <div>
                         <p class="text-[0.8rem] font-black text-slate-800">{{ currentLang === 'ar' ? item.nameAr : item.nameEn }}</p>
                         <p class="text-[0.65rem] font-bold text-slate-400 font-mono tracking-tight">{{ 'PRODUCTS.PRODUCT_SKU' | translate }}: {{ item.sku }}</p>
                       </div>
                     </div>
                   </td>
                   <td class="px-6 py-3 text-center">
                     <span class="text-[0.8rem] font-black text-slate-700">x{{ item.quantity }}</span>
                   </td>
                   <td class="px-6 py-3 text-end">
                     <span class="text-[0.82rem] font-black text-slate-900">{{ item.price | number:'1.2-2' }}</span>
                   </td>
                 </tr>
               </tbody>
             </table>
          </div>
        </div>

        <!-- Right: Customer & Bill -->
        <div class="space-y-6">
          <!-- Customer Card -->
          <div class="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <app-panel-header
              [title]="'ORDERS.DETAIL_CUSTOMER'"
              containerClass="mb-6 border-b border-slate-50 pb-4"
              contentClass="flex items-center justify-between gap-3"
              titleClass="text-sm font-black uppercase tracking-wider text-slate-800"
            ></app-panel-header>
            <div class="space-y-4">
              <div class="flex items-start gap-4">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div>
                  <p class="text-[0.9rem] font-black text-slate-900">{{ order?.customerName }}</p>
                  <p class="text-[0.75rem] font-bold text-slate-500">{{ order?.customerPhone }}</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div>
                  <p class="text-[0.8rem] font-bold text-slate-600 leading-relaxed">{{ order?.customerAddress }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Driver Card -->
          <div class="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm overflow-hidden relative">
            <app-panel-header
              [title]="'ORDERS.DETAIL_DRIVER'"
              containerClass="mb-6 border-b border-slate-50 pb-4"
              contentClass="flex items-center justify-between gap-3"
              titleClass="text-sm font-black uppercase tracking-wider text-slate-800"
            >
              <div *ngIf="order?.driverRating" actions class="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-600 border border-amber-100/50">
                <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span class="text-[0.7rem] font-black">{{ order?.driverRating }}</span>
              </div>
            </app-panel-header>
            
            <div *ngIf="order?.driverName; else noDriver" class="space-y-6">
              <!-- Identity -->
              <div class="flex items-start gap-4">
                <div class="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-indigo-50 border border-indigo-100/30 ring-4 ring-slate-50">
                   <img [src]="order?.driverImage || 'assets/images/placeholders/driver.png'" class="h-full w-full object-cover">
                </div>
                <div>
                  <p class="text-[0.95rem] font-black text-slate-900 tracking-tight">{{ order?.driverName }}</p>
                  <p class="text-[0.75rem] font-bold text-slate-500 mb-1">{{ order?.driverPhone }}</p>
                  <span class="inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-[0.6rem] font-black text-slate-500 uppercase tracking-wider">
                    {{ (currentLang === 'ar' ? order?.driverCompanyAr : order?.driverCompanyEn) }}
                  </span>
                </div>
              </div>
              
              <!-- Vehicle Info -->
              <div class="grid grid-cols-2 gap-3 border-y border-slate-50 py-4">
                <div class="space-y-1">
                  <span class="text-[0.62rem] font-black text-slate-400 uppercase tracking-widest">{{ 'ORDERS.DRIVER_VEHICLE' | translate }}</span>
                  <p class="text-[0.75rem] font-black text-slate-700 leading-tight">{{ order?.driverVehicleType }}</p>
                </div>
                <div class="space-y-1">
                  <span class="text-[0.62rem] font-black text-slate-400 uppercase tracking-widest">{{ 'ORDERS.DRIVER_PLATE' | translate }}</span>
                  <p class="text-[0.8rem] font-black text-indigo-600 bg-indigo-50/50 rounded-lg px-2 py-1 inline-block border border-indigo-100/30">{{ order?.driverVehiclePlate }}</p>
                </div>
              </div>

              <div class="flex items-center justify-between rounded-2xl bg-gradient-to-r from-zadna-primary/5 to-indigo-50/50 px-4 py-3 border border-zadna-primary/10">
                <div class="flex items-center gap-2">
                   <span class="relative flex h-2 w-2">
                     <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-zadna-primary opacity-75"></span>
                     <span class="relative inline-flex rounded-full h-2 w-2 bg-zadna-primary"></span>
                   </span>
                   <span class="text-[0.72rem] font-black text-slate-500 uppercase">{{ 'ORDERS.ESTIMATED_DELIVERY' | translate }}</span>
                </div>
                <span class="text-[0.85rem] font-black text-zadna-primary">{{ order?.estimatedDelivery }}</span>
              </div>
            </div>

            <ng-template #noDriver>
              <div *ngIf="isDispatchInProgress(); else staticNoDriver" class="flex flex-col items-center justify-center py-6 text-center">
                <div class="relative h-14 w-14 mb-4">
                  <span class="animate-ping absolute inset-0 rounded-full bg-indigo-400/20"></span>
                  <div class="relative h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100/50">
                    <svg class="h-6 w-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                    </svg>
                  </div>
                </div>
                <p class="text-[0.8rem] font-black text-indigo-600 mb-1">{{ currentLang === 'ar' ? 'جارٍ البحث عن مندوب...' : 'Searching for a driver...' }}</p>
                <p class="text-[0.68rem] font-bold text-slate-400">{{ currentLang === 'ar' ? 'سيتم تعيين مندوب تلقائيًا قريبًا' : 'A driver will be auto-assigned shortly' }}</p>
              </div>
              <ng-template #staticNoDriver>
                <div class="flex flex-col items-center justify-center py-6 text-center">
                  <div class="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 text-slate-300">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                      <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                  </div>
                  <p class="text-[0.75rem] font-black text-slate-400">{{ 'ORDERS.DRIVER_NOT_ASSIGNED' | translate }}</p>
                </div>
              </ng-template>
            </ng-template>
          </div>

          <!-- Live Tracking Map -->
          <app-driver-tracking-map
            *ngIf="isTrackingActive()"
            [driverLocation]="order?.driverLiveLocation"
            [vendorLocation]="order?.vendorLocation"
            [customerLocation]="order?.customerLocation"
            [isArabic]="currentLang === 'ar'"
          ></app-driver-tracking-map>

          <!-- Pickup Confirmation Card -->
          <div *ngIf="order?.canConfirmPickup" class="rounded-[28px] border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm animate-fade-in">
            <app-panel-header
              [title]="currentLang === 'ar' ? 'تأكيد استلام المندوب' : 'Confirm Driver Pickup'"
              containerClass="mb-5 border-b border-amber-100 pb-4"
              contentClass="flex items-center justify-between gap-3"
              titleClass="text-sm font-black uppercase tracking-wider text-amber-800"
            ></app-panel-header>

            <div class="space-y-5">
              <!-- Info Banner -->
              <div class="flex items-start gap-3 rounded-2xl bg-white/70 p-4 border border-amber-100">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <div>
                  <p class="text-[0.8rem] font-black text-amber-900">{{ currentLang === 'ar' ? 'أدخل رمز الاستلام' : 'Enter Pickup Code' }}</p>
                  <p class="text-[0.7rem] font-bold text-amber-600/80">{{ currentLang === 'ar' ? 'اطلب الرمز المكوّن من 4 أرقام من المندوب وأدخله أدناه' : 'Ask the driver for the 4-digit code and enter it below' }}</p>
                </div>
              </div>

              <!-- OTP Input Boxes -->
              <div class="flex justify-center gap-3" dir="ltr">
                <input *ngFor="let i of [0,1,2,3]"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]"
                  maxlength="1"
                  [attr.data-otp-index]="i"
                  [value]="otpDigits[i] || ''"
                  (input)="onOtpDigitInput($event, i)"
                  (keydown)="onOtpKeyDown($event, i)"
                  (paste)="onOtpPaste($event)"
                  class="h-16 w-14 rounded-2xl border-2 border-amber-200 bg-white text-center text-2xl font-black text-amber-900 transition-all duration-150 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:scale-110 placeholder:text-amber-200"
                  placeholder="·"
                />
              </div>

              <!-- Confirm Button -->
              <button
                (click)="confirmPickup()"
                [disabled]="isConfirmingPickup || otpDigits.join('').length < 4"
                class="w-full rounded-2xl bg-amber-500 px-6 py-3.5 text-[0.85rem] font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-500/30 hover:translate-y-[-1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
              >
                <span *ngIf="!isConfirmingPickup">
                  {{ currentLang === 'ar' ? '✓ تأكيد استلام الطلب' : '✓ Confirm Order Pickup' }}
                </span>
                <span *ngIf="isConfirmingPickup" class="flex items-center justify-center gap-2">
                  <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {{ currentLang === 'ar' ? 'جاري التأكيد...' : 'Confirming...' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Billing Card -->
          <div class="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
             <app-panel-header
               [title]="'ORDERS.DETAIL_SUMMARY'"
               containerClass="mb-6 border-b border-slate-50 pb-4"
               contentClass="flex items-center justify-between gap-3"
               titleClass="text-sm font-black uppercase tracking-wider text-slate-800"
             ></app-panel-header>
             <div class="space-y-3">
               <div class="flex justify-between text-[0.8rem] font-bold text-slate-500">
                 <span>{{ 'ORDERS.SUBTOTAL' | translate }}</span>
                 <span>{{ order?.subtotal | number:'1.2-2' }}</span>
               </div>
               <div class="flex justify-between text-[0.8rem] font-bold text-slate-500">
                 <span>{{ 'ORDERS.DELIVERY_FEE' | translate }}</span>
                 <span>{{ order?.deliveryFee | number:'1.2-2' }}</span>
               </div>
               <div class="flex justify-between text-[0.8rem] font-bold text-slate-500">
                 <span>{{ 'ORDERS.TAX' | translate }}</span>
                 <span>{{ order?.tax | number:'1.2-2' }}</span>
               </div>
               <div class="my-4 h-px bg-slate-100"></div>
               <div class="flex justify-between">
                 <span class="text-[0.9rem] font-black text-slate-900">{{ 'ORDERS.GRAND_TOTAL' | translate }}</span>
                 <div class="text-end">
                   <span class="block text-[1.1rem] font-black text-zadna-primary">{{ order?.total | number:'1.2-2' }}</span>
                   <span class="text-[0.65rem] font-black text-zadna-primary uppercase">{{ 'ORDERS.CURRENCY' | translate }}</span>
                 </div>
               </div>
             </div>
          </div>

          <!-- Mobile Actions (Bottom Fixed) -->
          <div class="block sm:hidden space-y-3 pt-4">
             <button *ngIf="canConfirm()" (click)="updateStatus('CONFIRMED')" [disabled]="isUpdatingStatus" class="w-full rounded-2xl bg-zadna-primary p-4 text-[0.9rem] font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                {{ 'ORDERS.ACTION_CONFIRM' | translate }}
             </button>
             <!-- others... -->
          </div>
        </div>
      </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
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
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId = id;
      this.loadOrder(id);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.langSub) this.langSub.unsubscribe();
    this.stopPolling();
  }

  get orderMetaLine(): string {
    if (!this.order) {
      return '';
    }

    const segments = [this.order.date, this.order.time].filter(Boolean);
    return segments.join(' - ');
  }

  canConfirm(): boolean { return this.order?.backendStatus === 'PendingVendorAcceptance'; }
  canPrepare(): boolean { return this.order?.backendStatus === 'Accepted'; }
  canMarkReady(): boolean { return this.order?.backendStatus === 'Preparing'; }

  isDispatchInProgress(): boolean {
    return this.order?.backendStatus === 'ReadyForPickup' || this.order?.backendStatus === 'DriverAssignmentInProgress';
  }

  isTrackingActive(): boolean {
    const s = this.order?.backendStatus;
    return s === 'DriverAssigned' || s === 'PickedUp' || s === 'OnTheWay';
  }

  updateStatus(status: OrderStatus): void {
    if (!this.order || this.isUpdatingStatus) return;

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
    if (!this.order || this.isConfirmingPickup || code.length < 4) return;

    const orderId = this.order.id;
    this.isConfirmingPickup = true;

    this.ordersService.confirmPickupOtp(orderId, code).subscribe({
      next: (updated) => {
        this.order = updated;
        this.isConfirmingPickup = false;
        this.otpDigits = ['', '', '', ''];
        // Refresh order immediately so status updates in real-time
        this.loadOrder(orderId);
      },
      error: (error: HttpErrorResponse) => {
        this.isConfirmingPickup = false;
        this.otpDigits = ['', '', '', ''];
        // Focus first box after error
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

    // Auto-submit when all 4 digits are entered
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
      if (input) input.value = this.otpDigits[i];
    }
    // Focus the next empty box or last
    const nextEmpty = this.otpDigits.findIndex(d => !d);
    const focusIndex = nextEmpty === -1 ? 3 : nextEmpty;
    const target = document.querySelector<HTMLInputElement>(`[data-otp-index="${focusIndex}"]`);
    target?.focus();

    // Auto-submit if all 4 digits pasted
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

  private loadOrder(orderId: string): void {
    this.sub?.unsubscribe();
    this.isLoading = true;
    this.loadErrorMessage = '';
    this.sub = this.ordersService.getOrderById(orderId).subscribe({
      next: (o) => {
        this.order = o;
        this.isLoading = false;

        if (!o) {
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

    if (!this.order) return;

    // Terminal states — no polling needed
    const terminal = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'DELIVERY_FAILED', 'REFUNDED'];
    if (terminal.includes(this.order.status)) return;

    // Use faster polling during active delivery tracking
    const pollInterval = this.isTrackingActive() ? 5000 : this.POLL_INTERVAL_MS;
    const orderId = this.order.id;

    this.pollSub = interval(pollInterval).pipe(
      switchMap(() => this.ordersService.getOrderById(orderId))
    ).subscribe(updated => {
      if (!updated) {
        this.stopPolling();
        return;
      }
      this.order = updated;

      // Stop if order reached a terminal state
      if (terminal.includes(updated.status)) {
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
}
