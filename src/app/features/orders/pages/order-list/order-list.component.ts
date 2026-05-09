import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertsCenterService } from '../../../alerts/services/alerts-center.service';
import { OrdersService } from '../../services/orders.service';
import { OrderListItem, OrderStatus } from '../../models/orders.models';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    SearchableSelectComponent,
    CommonModule,
    FormsModule,
    TranslateModule,
    OrderStatusBadgeComponent,
    AppPanelHeaderComponent,
    AppPageHeaderComponent,
    AppPaginationComponent,
    RouterModule
  ],
  template: `
    <div class="space-y-6" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <app-page-header
        [title]="'ORDERS.LIST_TITLE' | translate"
        [description]="'ORDERS.LIST_SUBTITLE' | translate"
        customClass="mb-0"
      ></app-page-header>

      <section class="relative z-20 overflow-visible rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50 p-5">
        <div class="flex flex-col gap-2 mb-4">
          <h2 class="text-sm font-black text-slate-800">{{ 'ORDERS.FILTERS.TITLE' | translate }}</h2>
          <p class="text-[0.72rem] font-bold text-slate-500">{{ 'ORDERS.FILTERS.SUBTITLE' | translate }}</p>
        </div>
        <div class="grid w-full items-center gap-3 md:grid-cols-2 lg:grid-cols-[minmax(200px,1.5fr)_repeat(3,minmax(120px,1fr))_auto]">
          <div class="relative group">
            <span class="absolute inset-y-0 start-4 flex items-center text-slate-400 group-focus-within:text-zadna-primary transition-colors">
              <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"></path>
              </svg>
            </span>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onFiltersChange()"
              [placeholder]="'ORDERS.SEARCH_PLACEHOLDER' | translate"
              class="h-11 w-full rounded-[16px] border border-slate-100 bg-slate-50 pe-4 ps-11 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
          </div>

          <div>
            <app-searchable-select [(ngModel)]="filters.status" (ngModelChange)="onFiltersChange()" [searchable]="false" [options]="[{value:'ALL', labelKey:'ORDERS.FILTERS.ALL_STATUSES'},{value:'NEW', labelKey:'ORDERS.STATUS_NEW'},{value:'CONFIRMED', labelKey:'ORDERS.STATUS_CONFIRMED'},{value:'IN_PROGRESS', labelKey:'ORDERS.STATUS_IN_PROGRESS'},{value:'READY_FOR_PICKUP', labelKey:'ORDERS.STATUS_READY'},{value:'COMPLETED', labelKey:'ORDERS.STATUS_COMPLETED'},{value:'CANCELLED', labelKey:'ORDERS.STATUS_CANCELLED'}]" [placeholder]="'ORDERS.FILTERS.STATUS'"></app-searchable-select>
          </div>

          <div>
            <app-searchable-select [(ngModel)]="filters.paymentMethod" (ngModelChange)="onFiltersChange()" [searchable]="false" [options]="[{value:'ALL', labelKey:'ORDERS.FILTERS.ALL_PAYMENT_METHODS'},{value:'CARD', labelKey:'ORDERS.FILTERS.PAYMENT_CARD'},{value:'COD', labelKey:'ORDERS.FILTERS.PAYMENT_COD'}]" [placeholder]="'ORDERS.FILTERS.PAYMENT_METHOD'"></app-searchable-select>
          </div>

          <div>
            <app-searchable-select [(ngModel)]="filters.lateState" (ngModelChange)="onFiltersChange()" [searchable]="false" [options]="[{value:'ALL', labelKey:'ORDERS.FILTERS.ALL_TIMING'},{value:'LATE', labelKey:'ORDERS.FILTERS.TIMING_LATE'},{value:'ONTIME', labelKey:'ORDERS.FILTERS.TIMING_ONTIME'}]" [placeholder]="'ORDERS.FILTERS.TIMING'"></app-searchable-select>
          </div>

          <div>
            <button
              type="button"
              (click)="resetFilters()"
              class="inline-flex h-11 w-full items-center justify-center rounded-[16px] border border-rose-200 bg-rose-50 px-5 text-[0.78rem] font-black text-rose-600 transition hover:bg-rose-100">
              {{ 'ORDERS.FILTERS.RESET' | translate }}
            </button>
          </div>
        </div>
      </section>

      <section class="relative z-10 overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50">
        <app-panel-header
          [title]="'ORDERS.TABLE.TITLE'"
          [subtitle]="'ORDERS.TABLE.SUBTITLE'">
        </app-panel-header>

        <div class="overflow-x-auto no-scrollbar">
          @if (isLoading) {
            <div class="flex h-64 flex-col items-center justify-center gap-3">
              <div class="h-10 w-10 animate-spin rounded-full border-4 border-zadna-primary/20 border-t-zadna-primary"></div>
              <span class="text-sm font-bold text-slate-400">{{ 'COMMON.LOADING' | translate }}</span>
            </div>
          } @else if (orders.length === 0) {
            <div class="flex h-80 flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
              <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 rotate-3">
                <svg class="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <h3 class="text-lg font-black text-slate-900">{{ 'ORDERS.EMPTY_TITLE' | translate }}</h3>
              <p class="max-w-xs text-sm font-bold text-slate-500">{{ 'ORDERS.EMPTY_DESC' | translate }}</p>
            </div>
          } @else {
            <table class="hidden md:table w-full text-start border-collapse animate-in slide-in-from-bottom-2 duration-500">
              <thead>
                <tr class="border-b border-slate-50 bg-slate-50/50 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">
                  <th class="px-6 py-4 text-start">{{ 'ORDERS.HEADER_ORDER_ID' | translate }}</th>
                  <th class="px-6 py-4 text-start">{{ 'ORDERS.HEADER_CUSTOMER' | translate }}</th>
                  <th class="px-6 py-4 text-start">{{ 'ORDERS.HEADER_DATE' | translate }}</th>
                  <th class="px-6 py-4 text-start">{{ 'ORDERS.HEADER_ITEMS' | translate }}</th>
                  <th class="px-6 py-4 text-start">{{ 'ORDERS.HEADER_TOTAL' | translate }}</th>
                  <th class="px-6 py-4 text-start">{{ 'ORDERS.HEADER_STATUS' | translate }}</th>
                  <th class="px-6 py-4 text-center">{{ 'COMMON.ACTIONS' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50/70">
                @for (order of orders; track order.id) {
                  <tr class="group transition-all hover:bg-slate-50/30">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <span class="text-[0.78rem] font-black text-slate-900 transition-colors group-hover:text-zadna-primary">#{{ order.displayId }}</span>
                        @if (order.isLate) {
                          <span class="inline-flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" [title]="'ORDERS.LATE_ALERT' | translate"></span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="min-w-0">
                        <span class="block truncate text-[0.8rem] font-black text-slate-800">{{ order.customerName }}</span>
                        <span class="text-[0.65rem] font-bold text-slate-400">{{ order.customerPhone }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="space-y-0.5">
                        <span class="block text-[0.75rem] font-bold text-slate-600">{{ order.date }}</span>
                        <span class="block text-[0.65rem] font-bold text-slate-400">{{ order.time }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[0.68rem] font-black text-slate-600">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                        </svg>
                        {{ (order.itemCount === 1 ? 'ORDERS.ITEM_COUNT' : 'ORDERS.ITEMS_COUNT') | translate:{count: order.itemCount} }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-col items-start leading-tight">
                        <span class="text-[0.85rem] font-black text-slate-900">{{ order.total | number:'1.2-2' }}</span>
                        <span class="text-[0.6rem] font-black uppercase tracking-tighter text-zadna-primary">{{ 'ORDERS.CURRENCY' | translate }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <app-order-status-badge [status]="order.status"></app-order-status-badge>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-center gap-1.5 opacity-40 transition-opacity group-hover:opacity-100">
                        <button
                          [routerLink]="['/orders', order.id]"
                          class="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm transition-all hover:border-zadna-primary/30 hover:bg-zadna-primary/10 hover:text-zadna-primary">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                          </svg>
                        </button>
                        <button class="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- Mobile Cards View -->
            <div class="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 animate-in slide-in-from-bottom-2 duration-500">
              @for (order of orders; track order.id) {
                <div class="group flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-zadna-primary/30">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-[0.85rem] font-black text-slate-900">#{{ order.displayId }}</span>
                      @if (order.isLate) {
                        <span class="inline-flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" [title]="'ORDERS.LATE_ALERT' | translate"></span>
                      }
                    </div>
                    <app-order-status-badge [status]="order.status"></app-order-status-badge>
                  </div>

                  <div class="mt-3">
                    <span class="block truncate text-[0.85rem] font-black text-slate-800">{{ order.customerName }}</span>
                    <span class="text-[0.7rem] font-bold text-slate-400">{{ order.customerPhone }}</span>
                  </div>

                  <div class="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50/50 p-3">
                    <div class="flex flex-col">
                      <span class="text-[0.65rem] font-bold text-slate-400">{{ 'ORDERS.HEADER_DATE' | translate }}</span>
                      <span class="text-[0.75rem] font-bold text-slate-700 mt-0.5">{{ order.date }}</span>
                      <span class="text-[0.65rem] font-bold text-slate-400">{{ order.time }}</span>
                    </div>
                    <div class="flex flex-col text-end">
                      <span class="text-[0.65rem] font-bold text-slate-400">{{ 'ORDERS.HEADER_TOTAL' | translate }}</span>
                      <div class="flex items-baseline justify-end gap-1 mt-0.5">
                        <span class="text-[0.9rem] font-black text-slate-900">{{ order.total | number:'1.2-2' }}</span>
                        <span class="text-[0.6rem] font-black uppercase text-zadna-primary">{{ 'ORDERS.CURRENCY' | translate }}</span>
                      </div>
                      <span class="inline-flex mt-1 items-center justify-end gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[0.6rem] font-black text-slate-600">
                        {{ (order.itemCount === 1 ? 'ORDERS.ITEM_COUNT' : 'ORDERS.ITEMS_COUNT') | translate:{count: order.itemCount} }}
                      </span>
                    </div>
                  </div>

                  <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div class="flex items-center gap-2">
                      <button
                        [routerLink]="['/orders', order.id]"
                        class="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm transition hover:border-zadna-primary/30 hover:bg-zadna-primary/10 hover:text-zadna-primary">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                        </svg>
                      </button>
                      <button class="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        @if (orders.length > 0) {
          <div class="border-t border-slate-50 bg-slate-50/20 px-6">
            <app-pagination
              [currentPage]="currentPage"
              [totalCount]="totalCount"
              [totalItemsLabel]="'PAGINATION.TOTAL_ORDERS' | translate:{count: totalCount}"
              [pageSize]="pageSize"
              [totalPages]="totalPages"
              [isRTL]="currentLang === 'ar'"
              (pageChange)="onPageChange($event)">
            </app-pagination>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class OrderListComponent implements OnInit, OnDestroy {
  orders: OrderListItem[] = [];
  isLoading = true;
  searchTerm = '';
  currentLang = 'ar';
  filters = {
    status: 'ALL' as OrderStatus | 'ALL',
    paymentMethod: 'ALL' as 'ALL' | 'CARD' | 'COD',
    lateState: 'ALL' as 'ALL' | 'LATE' | 'ONTIME'
  };

  summary = {
    total: 0,
    new: 0,
    inProgress: 0,
    late: 0
  };

  private langSub: Subscription;
  private realtimeOrdersSub?: Subscription;

  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  constructor(
    private ordersService: OrdersService,
    private alertsCenterService: AlertsCenterService,
    private translate: TranslateService,
    private route: ActivatedRoute
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => this.currentLang = event.lang);
  }

  ngOnInit(): void {
    this.applyQueryParams();
    this.realtimeOrdersSub = this.alertsCenterService.getRealtimeAlerts().subscribe((alert) => {
      if (alert.source === 'orders') {
        this.loadOrders();
      }
    });

    this.loadOrders();
  }

  ngOnDestroy(): void {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }

    this.realtimeOrdersSub?.unsubscribe();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.ordersService.getOrders({
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      status: this.filters.status === 'ALL' ? undefined : this.filters.status,
      searchTerm: this.searchTerm,
      paymentMethod: this.filters.paymentMethod,
      lateState: this.filters.lateState
    }).subscribe({
      next: (data) => {
        this.orders = data.items;
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
        this.isLoading = false;
        this.updateSummary();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private updateSummary(): void {
    this.ordersService.getOrders({
      pageNumber: 1,
      pageSize: 250,
      status: 'ALL',
      paymentMethod: 'ALL',
      lateState: 'ALL'
    }).subscribe((data) => {
      this.summary = {
        total: data.totalCount,
        new: data.items.filter(o => o.status === 'NEW').length,
        inProgress: data.items.filter(o => ['CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP'].includes(o.status)).length,
        late: data.items.filter(o => o.isLate).length
      };
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadOrders();
  }

  onFiltersChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filters = {
      status: 'ALL',
      paymentMethod: 'ALL',
      lateState: 'ALL'
    };
    this.currentPage = 1;
    this.loadOrders();
  }

  private applyQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const status = params.get('status');
    const lateState = params.get('lateState');
    const search = params.get('search');

    if (status) {
      this.filters.status = status as OrderStatus | 'ALL';
    }

    if (lateState === 'LATE' || lateState === 'ONTIME' || lateState === 'ALL') {
      this.filters.lateState = lateState;
    }

    if (search) {
      this.searchTerm = search;
    }
  }
}
