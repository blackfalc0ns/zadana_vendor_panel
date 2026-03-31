import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { OrderListItem, OrderStatus } from '../../models/orders.models';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TranslateModule, 
    OrderStatusBadgeComponent,
    AppPaginationComponent,
    RouterModule
  ],
  template: `
    <div class="space-y-6" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <!-- Header Section -->
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">{{ 'ORDERS.LIST_TITLE' | translate }}</h1>
        <p class="text-[0.85rem] font-bold text-slate-500">{{ 'ORDERS.LIST_SUBTITLE' | translate }}</p>
      </div>

      <!-- Filters & Stats Bar -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <!-- Status Tabs -->
        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-[20px] bg-slate-100/80 p-1.5 border border-slate-200/50 backdrop-blur-sm">
          <button 
            *ngFor="let tab of statusTabs"
            (click)="onStatusChange(tab.value)"
            [ngClass]="{
              'bg-white text-zadna-primary shadow-sm': currentStatus === tab.value,
              'text-slate-500 hover:text-zadna-primary/70': currentStatus !== tab.value
            }"
            class="whitespace-nowrap rounded-[14px] px-4 py-2 text-[0.78rem] font-black transition-all">
            {{ tab.labelKey | translate }}
          </button>
        </div>

        <!-- Search -->
        <div class="relative w-full max-w-xs group">
          <span class="absolute inset-y-0 start-4 flex items-center text-slate-400 group-focus-within:text-zadna-primary transition-colors">
            <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"></path>
            </svg>
          </span>
          <input 
            type="text" 
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()"
            [placeholder]="'ORDERS.SEARCH_PLACEHOLDER' | translate"
            class="h-11 w-full rounded-[16px] border border-slate-100 bg-white pe-4 ps-11 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:ring-4 focus:ring-zadna-primary/5 outline-none shadow-sm">
        </div>
      </div>

      <!-- Main Content / Table -->
      <div class="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50 transition-all duration-500">
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
                <tr class="bg-slate-50/50 text-[0.62rem] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
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
                        <span class="text-[0.78rem] font-black text-slate-900 group-hover:text-zadna-primary transition-colors">#{{ order.displayId }}</span>
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
                        <span class="text-[0.6rem] font-black text-zadna-primary uppercase tracking-tighter">{{ 'ORDERS.CURRENCY' | translate }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <app-order-status-badge [status]="order.status"></app-order-status-badge>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                         <button 
                           [routerLink]="['/orders', order.id]"
                           class="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-500 transition-all hover:bg-zadna-primary/10 hover:border-zadna-primary/30 hover:text-zadna-primary shadow-sm">
                           <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                             <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                           </svg>
                         </button>
                         <button class="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-500 transition-all hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 shadow-sm">
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

        <!-- Pagination -->
        @if (orders.length > 0) {
          <div class="border-t border-slate-50 px-6 bg-slate-50/20">
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
  private langSub: Subscription;

  // Pagination State
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  // Status Filter State
  currentStatus: OrderStatus | 'ALL' = 'ALL';
  statusTabs = [
    { labelKey: 'ORDERS.TAB_ALL', value: 'ALL' as const },
    { labelKey: 'ORDERS.TAB_NEW', value: 'NEW' as const },
    { labelKey: 'ORDERS.TAB_PREPARING', value: 'IN_PROGRESS' as const },
    { labelKey: 'ORDERS.TAB_READY', value: 'READY_FOR_PICKUP' as const },
    { labelKey: 'ORDERS.TAB_COMPLETED', value: 'COMPLETED' as const },
  ];

  constructor(
    private ordersService: OrdersService,
    private translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe(event => this.currentLang = event.lang);
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.ordersService.getOrders({
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      status: this.currentStatus === 'ALL' ? undefined : this.currentStatus,
      searchTerm: this.searchTerm
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

  onStatusChange(status: OrderStatus | 'ALL'): void {
    this.currentStatus = status;
    this.currentPage = 1;
    this.loadOrders();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }
}
