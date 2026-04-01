import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
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

      <div class="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50 transition-all duration-500">
        <app-panel-header
          containerClass="border-b border-slate-100 px-6 py-5"
          contentClass="flex flex-col gap-4"
        >
          <div actions class="grid w-full gap-4 xl:grid-cols-[minmax(260px,1.6fr)_repeat(3,minmax(170px,1fr))_auto]">
            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'ORDERS.FILTERS.SEARCH' | translate }}</span>
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
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'ORDERS.FILTERS.STATUS' | translate }}</span>
              <select
                [(ngModel)]="filters.status"
                (ngModelChange)="onFiltersChange()"
                class="h-11 w-full rounded-[16px] border border-slate-100 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="ALL">{{ 'ORDERS.FILTERS.ALL_STATUSES' | translate }}</option>
                <option value="NEW">{{ 'ORDERS.STATUS_NEW' | translate }}</option>
                <option value="CONFIRMED">{{ 'ORDERS.STATUS_CONFIRMED' | translate }}</option>
                <option value="IN_PROGRESS">{{ 'ORDERS.STATUS_IN_PROGRESS' | translate }}</option>
                <option value="READY_FOR_PICKUP">{{ 'ORDERS.STATUS_READY' | translate }}</option>
                <option value="COMPLETED">{{ 'ORDERS.STATUS_COMPLETED' | translate }}</option>
                <option value="CANCELLED">{{ 'ORDERS.STATUS_CANCELLED' | translate }}</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'ORDERS.FILTERS.PAYMENT_METHOD' | translate }}</span>
              <select
                [(ngModel)]="filters.paymentMethod"
                (ngModelChange)="onFiltersChange()"
                class="h-11 w-full rounded-[16px] border border-slate-100 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="ALL">{{ 'ORDERS.FILTERS.ALL_PAYMENT_METHODS' | translate }}</option>
                <option value="CARD">{{ 'ORDERS.FILTERS.PAYMENT_CARD' | translate }}</option>
                <option value="COD">{{ 'ORDERS.FILTERS.PAYMENT_COD' | translate }}</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'ORDERS.FILTERS.TIMING' | translate }}</span>
              <select
                [(ngModel)]="filters.lateState"
                (ngModelChange)="onFiltersChange()"
                class="h-11 w-full rounded-[16px] border border-slate-100 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="ALL">{{ 'ORDERS.FILTERS.ALL_TIMING' | translate }}</option>
                <option value="LATE">{{ 'ORDERS.FILTERS.TIMING_LATE' | translate }}</option>
                <option value="ONTIME">{{ 'ORDERS.FILTERS.TIMING_ONTIME' | translate }}</option>
              </select>
            </label>

            <div class="flex items-end">
              <button
                type="button"
                (click)="resetFilters()"
                class="inline-flex h-11 items-center justify-center rounded-[16px] border border-rose-200 bg-rose-50 px-5 text-[0.78rem] font-black text-rose-600 transition hover:bg-rose-100">
                {{ 'ORDERS.FILTERS.RESET' | translate }}
              </button>
            </div>
          </div>
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
            <table class="w-full text-start border-collapse animate-in slide-in-from-bottom-2 duration-500">
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
      </div>
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
  private langSub: Subscription;

  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  constructor(
    private ordersService: OrdersService,
    private translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => this.currentLang = event.lang);
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }
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
      },
      error: () => {
        this.isLoading = false;
      }
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
}
