import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { OrderDetail, OrderStatus } from '../../models/orders.models';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, OrderStatusBadgeComponent],
  template: `
    <div class="space-y-6" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <button 
            routerLink="/orders"
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 transition-all hover:bg-slate-50 active:scale-95 shadow-sm">
            <svg class="h-5 w-5" [class.rotate-180]="currentLang === 'ar'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-black text-slate-900 tracking-tight">#{{ order?.displayId }}</h1>
              <app-order-status-badge *ngIf="order" [status]="order.status"></app-order-status-badge>
            </div>
            <p class="text-[0.82rem] font-bold text-slate-400">{{ order?.date }} - {{ order?.time }}</p>
          </div>
        </div>

        <!-- Desktop Actions -->
        <div class="hidden sm:flex items-center gap-3">
          <button 
            *ngIf="canConfirm()"
            (click)="updateStatus('CONFIRMED')"
            class="rounded-xl bg-zadna-primary px-6 py-2.5 text-[0.82rem] font-black text-white shadow-lg shadow-zadna-primary/20 transition-all hover:scale-105 active:scale-95">
            {{ 'ORDERS.ACTION_CONFIRM' | translate }}
          </button>
          <button 
            *ngIf="canPrepare()"
            (click)="updateStatus('IN_PROGRESS')"
            class="rounded-xl bg-amber-500 px-6 py-2.5 text-[0.82rem] font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95">
            {{ 'ORDERS.ACTION_START_PREPARING' | translate }}
          </button>
          <button 
            *ngIf="canMarkReady()"
            (click)="updateStatus('READY_FOR_PICKUP')"
            class="rounded-xl bg-indigo-600 px-6 py-2.5 text-[0.82rem] font-black text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95">
            {{ 'ORDERS.ACTION_MARK_READY' | translate }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Journey & Details -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Timeline Card -->
          <div class="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <h3 class="mb-8 text-sm font-black text-slate-800 uppercase tracking-wider">{{ 'ORDERS.DETAIL_TIMELINE' | translate }}</h3>
            
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
             <div class="p-6 border-b border-slate-50">
               <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider">{{ 'ORDERS.DETAIL_ITEMS' | translate }}</h3>
             </div>
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
                         <img [src]="item.imageUrl || 'assets/images/placeholders/product.png'" class="h-full w-full object-cover">
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
            <h3 class="mb-6 text-sm font-black text-slate-800 uppercase tracking-wider">{{ 'ORDERS.DETAIL_CUSTOMER' | translate }}</h3>
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
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider">{{ 'ORDERS.DETAIL_DRIVER' | translate }}</h3>
              <div *ngIf="order?.driverRating" class="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-600 border border-amber-100/50">
                <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span class="text-[0.7rem] font-black">{{ order?.driverRating }}</span>
              </div>
            </div>
            
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
          </div>

          <!-- Billing Card -->
          <div class="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
             <h3 class="mb-6 text-sm font-black text-slate-800 uppercase tracking-wider">{{ 'ORDERS.DETAIL_SUMMARY' | translate }}</h3>
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
             <button *ngIf="canConfirm()" (click)="updateStatus('CONFIRMED')" class="w-full rounded-2xl bg-zadna-primary p-4 text-[0.9rem] font-black text-white">
                {{ 'ORDERS.ACTION_CONFIRM' | translate }}
             </button>
             <!-- others... -->
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  order: OrderDetail | null = null;
  currentLang = 'ar';
  private sub: Subscription | null = null;
  private langSub: Subscription | null = null;

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
      this.sub = this.ordersService.getOrderById(id).subscribe(o => this.order = o);
    }
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.langSub) this.langSub.unsubscribe();
  }

  canConfirm(): boolean { return this.order?.status === 'NEW'; }
  canPrepare(): boolean { return this.order?.status === 'CONFIRMED'; }
  canMarkReady(): boolean { return this.order?.status === 'IN_PROGRESS'; }

  updateStatus(status: OrderStatus): void {
    if (!this.order) return;
    this.ordersService.updateOrderStatus(this.order.id, status).subscribe(updated => {
      this.order = updated;
    });
  }
}
