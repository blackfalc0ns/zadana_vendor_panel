import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchableSelectComponent, SearchableSelectOption } from '../../../../shared/components/ui/form-controls/select/searchable-select.component';
import { Subscription } from 'rxjs';
import { MasterProductSelectorModalComponent } from '../../components/master-product-selector-modal/master-product-selector-modal.component';
import { AddProductModalComponent } from '../../components/add-product-modal/add-product-modal.component';
import { BulkAddReviewModalComponent } from '../../components/bulk-add-review-modal/bulk-add-review-modal.component';
import { ProductStatusBadgeComponent } from '../../components/product-status-badge/product-status-badge.component';
import { ProductRequestModalComponent } from '../../components/product-request-modal/product-request-modal.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';
import { MasterProduct, UnitOption, VendorProduct } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';
import { AlertModalService } from '../../../../core/notifications/services/alert-modal.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    SearchableSelectComponent,
    CommonModule,
    FormsModule,
    TranslateModule,
    MasterProductSelectorModalComponent,
    AddProductModalComponent,
    BulkAddReviewModalComponent,
    ProductStatusBadgeComponent,
    ProductRequestModalComponent,
    RouterModule,
    AppPaginationComponent,
    AppPageHeaderComponent,
    AppPanelHeaderComponent
  ],
  template: `
    <div class="space-y-6" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <app-page-header
        [title]="'PRODUCTS.LIST_TITLE' | translate"
        [description]="'PRODUCTS.LIST_SUBTITLE' | translate"
        customClass="mb-0"
      >
        <div actions class="flex items-center gap-3">
          <a
            routerLink="/products/requests"
            class="inline-flex items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-5 py-3 text-[0.82rem] font-black text-slate-700 shadow-sm transition-all hover:border-zadna-primary/30 hover:text-zadna-primary">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"></path>
            </svg>
            {{ 'PRODUCTS.REQUESTS_BUTTON' | translate }}
          </a>
          <button
            (click)="onAddProductClick()"
            class="flex items-center justify-center gap-2 rounded-[18px] bg-zadna-primary px-6 py-3 text-[0.82rem] font-black text-white shadow-xl shadow-zadna-primary/25 transition-all hover:scale-105 active:scale-95">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
            </svg>
            {{ 'PRODUCTS.ADD_BUTTON' | translate }}
          </button>
        </div>
      </app-page-header>

      <section class="relative z-20 overflow-visible rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-black text-slate-800">{{ 'COMMON.FILTERS' | translate }}</h2>
        </div>
        <div class="grid w-full items-center gap-3 md:grid-cols-3 lg:grid-cols-[minmax(200px,1.5fr)_repeat(7,minmax(120px,1fr))_auto]">
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
                [placeholder]="'PRODUCTS.SEARCH_PLACEHOLDER' | translate"
                class="h-11 w-full rounded-[16px] border border-slate-100 bg-slate-50 pe-4 ps-11 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
            </div>

            <div>
              <app-searchable-select [(ngModel)]="filters.category" (ngModelChange)="onFiltersChange()" [searchable]="false" [options]="categoryOptions" [allowClear]="false" [placeholder]="'PRODUCTS.FILTERS.CATEGORY'"></app-searchable-select>
            </div>

            <div>
              <app-searchable-select [(ngModel)]="filters.status" (ngModelChange)="onFiltersChange()" [searchable]="false" [options]="statusOptions" [allowClear]="false" [placeholder]="'PRODUCTS.FILTERS.STATUS'"></app-searchable-select>
            </div>

            <div>
              <app-searchable-select [(ngModel)]="filters.stock" (ngModelChange)="onFiltersChange()" [searchable]="false" [options]="stockOptions" [allowClear]="false" [placeholder]="'PRODUCTS.FILTERS.STOCK'"></app-searchable-select>
            </div>

            <div>
              <app-searchable-select [(ngModel)]="filters.offers" (ngModelChange)="onFiltersChange()" [searchable]="false" [options]="offerOptions" [allowClear]="false" [placeholder]="'PRODUCTS.FILTERS.OFFERS'"></app-searchable-select>
            </div>

            <div>
              <app-searchable-select [(ngModel)]="filters.packageTypeId" (ngModelChange)="onFiltersChange()" [searchable]="false" [options]="packageTypeOptions" [allowClear]="false" [placeholder]="'PRODUCTS.FILTERS.PACKAGE_TYPE'"></app-searchable-select>
            </div>

            <div>
              <app-searchable-select [(ngModel)]="filters.measurementUnitId" (ngModelChange)="onFiltersChange()" [searchable]="false" [options]="measurementUnitOptions" [allowClear]="false" [placeholder]="'PRODUCTS.FILTERS.MEASUREMENT_UNIT'"></app-searchable-select>
            </div>

            <div>
              <app-searchable-select [(ngModel)]="filters.measurementValue" (ngModelChange)="onFiltersChange()" [searchable]="false" [options]="measurementValueOptions" [allowClear]="false" [placeholder]="'PRODUCTS.FILTERS.SIZE_VALUE'"></app-searchable-select>
            </div>

            <div>
              <button
                (click)="resetFilters()"
                class="inline-flex h-11 w-full items-center justify-center rounded-[16px] border border-rose-200 bg-rose-50 px-5 text-[0.78rem] font-black text-rose-600 transition hover:bg-rose-100">
                {{ 'PRODUCTS.FILTERS.RESET' | translate }}
              </button>
            </div>
          </div>
      </section>

      <section class="relative z-10 overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50">
        <app-panel-header
          [title]="'PRODUCTS.LIST_TITLE'"
          [subtitle]="'PRODUCTS.LIST_SUBTITLE'">
        </app-panel-header>

        <div class="overflow-x-auto no-scrollbar">
          @if (isLoading) {
            <div class="p-4 space-y-4">
              <!-- Skeleton Product Cards -->
              <div class="flex items-center justify-between gap-4 px-2">
                <span class="vendor-skeleton vendor-skeleton-line lg w-36"></span>
                <span class="vendor-skeleton vendor-skeleton-line sm w-20"></span>
              </div>
              @for (row of [1,2,3,4,5,6]; track row) {
                <div class="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <span class="vendor-skeleton vendor-skeleton-avatar"></span>
                  <div class="flex-1 space-y-2">
                    <span class="vendor-skeleton vendor-skeleton-line w-2/3"></span>
                    <span class="vendor-skeleton vendor-skeleton-line sm w-1/3"></span>
                  </div>
                  <span class="vendor-skeleton vendor-skeleton-chip"></span>
                  <span class="vendor-skeleton vendor-skeleton-line w-16"></span>
                </div>
              }
            </div>
          } @else if (products.length === 0) {
            <div class="p-4 animate-in zoom-in duration-500">
              <div class="min-h-[320px] rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50/35 px-6 py-16 text-center flex flex-col items-center justify-center">
                <span class="material-symbols-outlined mb-5 text-[28px] leading-none text-[#8bbfca]">inventory_2</span>
                <h3 class="text-[1.35rem] font-black text-slate-900 tracking-normal leading-tight">{{ 'PRODUCTS.EMPTY_TITLE' | translate }}</h3>
                <p class="mt-3 max-w-md text-[0.86rem] font-extrabold text-slate-500 leading-6">{{ 'PRODUCTS.EMPTY_DESC' | translate }}</p>
                <button
                  type="button"
                  (click)="onAddProductClick()"
                  class="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[0.8rem] bg-zadna-primary px-6 text-[0.82rem] font-black text-white shadow-lg shadow-zadna-primary/20 transition hover:bg-teal-700 active:scale-95">
                  <span class="material-symbols-outlined text-[20px]">add</span>
                  {{ 'PRODUCTS.ADD_BUTTON' | translate }}
                </button>
              </div>
            </div>
          } @else {
            <table class="hidden md:table w-full text-start border-collapse animate-in slide-in-from-bottom-2 duration-500">
              <thead>
                <tr class="border-b border-slate-50 bg-slate-50/50 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">
                  <th class="px-6 py-4 text-start">{{ 'PRODUCTS.HEADER_PRODUCT' | translate }}</th>
                  <th class="px-6 py-4 text-start">{{ 'PRODUCTS.HEADER_CATEGORY' | translate }}</th>
                  <th class="px-6 py-4 text-start">{{ 'PRODUCTS.HEADER_PRICE' | translate }}</th>
                  <th class="px-6 py-4 text-start">{{ 'PRODUCTS.HEADER_STOCK' | translate }}</th>
                  <th class="px-6 py-4 text-start">{{ 'PRODUCTS.HEADER_STATUS' | translate }}</th>
                  <th class="px-6 py-4 text-center">{{ 'COMMON.ACTIONS' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50/70">
                @for (group of groupedVendorProducts; track group.groupId) {
                  @if (group.sizesCount > 1) {
                    <tr class="bg-slate-50/40">
                      <td class="px-6 py-2.5" colspan="6">
                        <div class="flex items-center gap-3">
                          <div class="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-slate-200/60 p-0.5">
                            <img [src]="group.imageUrl || 'assets/images/placeholder.png'" class="h-full w-full object-contain">
                          </div>
                          <span class="text-[0.75rem] font-black text-slate-700">{{ group.name }}</span>
                          <span class="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 text-[0.58rem] font-black text-violet-600 ring-1 ring-violet-200/50">
                            {{ group.sizesCount }} {{ currentLang === 'ar' ? 'أحجام' : 'sizes' }}
                          </span>
                        </div>
                      </td>
                    </tr>
                  }
                  @for (product of group.variants; track product.id) {
                  <tr class="group transition-all hover:bg-slate-50/30">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-4">
                        <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-50">
                          <img [src]="product.imageUrl || 'assets/images/placeholder.png'" [alt]="currentLang === 'ar' ? product.nameAr : product.nameEn" class="h-full w-full object-contain p-1">
                        </div>
                        <div class="min-w-0">
                          @if (group.sizesCount === 1) {
                            <span class="block truncate text-[0.8rem] font-black text-slate-800 transition-colors group-hover:text-zadna-primary">
                              {{ currentLang === 'ar' ? product.nameAr : product.nameEn }}
                            </span>
                          }
                          <span class="inline-flex items-center rounded-lg bg-cyan-50 px-2 py-0.5 text-[0.65rem] font-black text-cyan-800 ring-1 ring-cyan-200/40">
                            {{ getProductSizeSummary(product) || (currentLang === 'ar' ? 'قياسي' : 'Standard') }}
                          </span>
                          @if (product.tradePrice === null || product.tradePrice === undefined) {
                            <span class="ms-1 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[0.58rem] font-black text-rose-700">
                              {{ currentLang === 'ar' ? 'تسعير غير مكتمل' : 'Pricing incomplete' }}
                            </span>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[0.68rem] font-black text-slate-600">
                        {{ (currentLang === 'ar' ? product.categoryNameAr : product.categoryNameEn) || ('COMMON.NO_DATA' | translate) }}
                      </span>
                      @if (getProductSizeSummary(product)) {
                        <div class="mt-2">
                          <span class="inline-flex items-center rounded-lg border border-zadna-primary/10 bg-zadna-primary/5 px-2 py-0.5 text-[0.58rem] font-black text-zadna-primary">
                            {{ getProductSizeSummary(product) }}
                          </span>
                        </div>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-col items-start leading-tight">
                        <span class="text-[0.85rem] font-black text-slate-900">{{ product.sellingPrice | number:'1.2-2' }}</span>
                        @if (product.tradePrice !== null && product.tradePrice !== undefined) {
                          <span class="mt-1 text-[0.62rem] font-black text-slate-400">
                            {{ currentLang === 'ar' ? 'تجاري' : 'Trade' }}: {{ product.tradePrice | number:'1.2-2' }}
                          </span>
                        }
                        <span class="text-[0.6rem] font-black uppercase tracking-tighter text-zadna-primary">{{ 'COMMON.CURRENCY' | translate }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-col gap-1">
                        <span [class]="'text-[0.8rem] font-black ' + (product.stockQty <= 20 ? 'text-rose-600' : 'text-slate-700')">
                          {{ product.stockQty }} {{ 'COMMON.UNIT_PIECE' | translate }}
                        </span>
                        @if (product.stockQty <= 20) {
                          <span class="text-[0.6rem] font-bold text-rose-400">{{ 'PRODUCTS.FILTERS.LOW_STOCK' | translate }}</span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <app-product-status-badge [isActive]="product.isActive"></app-product-status-badge>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-center gap-1.5 opacity-40 transition-opacity group-hover:opacity-100">
                        <button
                          [routerLink]="['/products', product.id]"
                          class="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm transition-all hover:border-zadna-primary/30 hover:bg-zadna-primary/10 hover:text-zadna-primary">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          (click)="deleteProduct(product)"
                          class="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-500 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  }
                }
              </tbody>
            </table>

            <!-- Mobile Cards View -->
            <div class="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 animate-in slide-in-from-bottom-2 duration-500">
              @for (product of filteredProducts; track product.id) {
                <div class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-zadna-primary/30">
                  <div class="flex items-start gap-4">
                    <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-[14px] bg-slate-50 p-1">
                      <img [src]="product.imageUrl || 'assets/images/placeholder.png'" class="h-full w-full object-contain">
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-start">
                        <span class="block truncate text-[0.85rem] font-black text-slate-800">
                          {{ currentLang === 'ar' ? product.nameAr : product.nameEn }}
                        </span>
                        <button
                          [routerLink]="['/products', product.id]"
                          class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition hover:bg-zadna-primary/10 hover:text-zadna-primary">
                          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          (click)="deleteProduct(product)"
                          class="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-500 transition hover:bg-rose-100 hover:text-rose-700">
                          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                      <span class="inline-flex mt-1 items-center rounded-lg bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-black text-indigo-600 border border-indigo-100/50">
                        {{ (currentLang === 'ar' ? product.categoryNameAr : product.categoryNameEn) || ('COMMON.NO_DATA' | translate) }}
                      </span>
                      <div class="mt-2 flex flex-wrap items-center gap-1.5">
                        @if (getPackageTypeLabel(product)) {
                          <span class="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-[0.58rem] font-black text-emerald-700">
                            {{ getPackageTypeLabel(product) }}
                          </span>
                        }
                        @if (product.measurementValue !== null && product.measurementValue !== undefined) {
                          <span class="inline-flex items-center rounded-lg bg-cyan-50 px-2 py-0.5 text-[0.58rem] font-black text-cyan-700">
                            {{ product.measurementValue }}
                          </span>
                        }
                        @if (getMeasurementUnitLabel(product)) {
                          <span class="inline-flex items-center rounded-lg bg-sky-50 px-2 py-0.5 text-[0.58rem] font-black text-sky-700">
                            {{ getMeasurementUnitLabel(product) }}
                          </span>
                        }
                      </div>
                      <div class="mt-2 text-[0.65rem] font-bold text-slate-400">ID: {{ product.id.substring(0, 8) }}</div>
                      @if (product.tradePrice === null || product.tradePrice === undefined) {
                        <span class="mt-2 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[0.58rem] font-black text-rose-700">
                          {{ currentLang === 'ar' ? 'تسعير غير مكتمل' : 'Pricing incomplete' }}
                        </span>
                      }
                    </div>
                  </div>

                  <div class="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50/50 p-3">
                    <div class="flex flex-col">
                      <span class="text-[0.65rem] font-bold text-slate-400">{{ 'PRODUCTS.HEADER_PRICE' | translate }}</span>
                      <div class="flex items-baseline gap-1 mt-0.5">
                        <span class="text-[0.9rem] font-black text-slate-900">{{ product.sellingPrice | number:'1.2-2' }}</span>
                        <span class="text-[0.6rem] font-black text-zadna-primary">{{ 'COMMON.CURRENCY' | translate }}</span>
                      </div>
                      @if (product.tradePrice !== null && product.tradePrice !== undefined) {
                        <span class="mt-1 text-[0.62rem] font-black text-slate-400">
                          {{ currentLang === 'ar' ? 'تجاري' : 'Trade' }}: {{ product.tradePrice | number:'1.2-2' }}
                        </span>
                      }
                    </div>
                    <div class="flex flex-col items-end text-end">
                      <span class="text-[0.65rem] font-bold text-slate-400">{{ 'PRODUCTS.HEADER_STOCK' | translate }}</span>
                      <div class="flex flex-col items-end mt-0.5 gap-0.5">
                        <span [class]="'text-[0.9rem] font-black ' + (product.stockQty <= 20 ? 'text-rose-600' : 'text-slate-700')">
                          {{ product.stockQty }}
                        </span>
                        @if (product.stockQty <= 20) {
                          <span class="text-[0.55rem] font-black text-rose-400">{{ 'PRODUCTS.FILTERS.LOW_STOCK' | translate }}</span>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="mt-3 rounded-xl border border-slate-100 bg-white p-3">
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-[0.65rem] font-bold text-slate-400">{{ 'PRODUCTS.FILTERS.SIZE_VALUE' | translate }}</span>
                      <span class="text-[0.72rem] font-black text-slate-700 text-end">
                        {{ getProductSizeSummary(product) || ('COMMON.NO_DATA' | translate) }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <app-product-status-badge [isActive]="product.isActive"></app-product-status-badge>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        @if (products.length > 0) {
          <div class="border-t border-slate-50 bg-slate-50/20 px-6">
            <app-pagination
              [currentPage]="currentPage"
              [totalCount]="totalCount"
              [totalItemsLabel]="'PAGINATION.TOTAL_PRODUCTS' | translate:{count: totalCount}"
              [pageSize]="pageSize"
              [totalPages]="totalPages"
              [isRTL]="currentLang === 'ar'"
              (pageChange)="onPageChange($event)">
            </app-pagination>
          </div>
        }
      </section>
    </div>

    @if (isSelectorModalOpen) {
      <app-master-product-selector-modal
        (close)="isSelectorModalOpen = false"
        (selected)="onProductSelected($event)"
        (selectedBulk)="onBulkProductsSelected($event)"
        (requestProduct)="onRequestProduct($event)">
      </app-master-product-selector-modal>
    }

    @if (isPricingModalOpen && selectedMasterProduct) {
      <app-add-product-modal
        [product]="selectedMasterProduct"
        (close)="isPricingModalOpen = false"
        (confirm)="onPricingConfirm($event)">
      </app-add-product-modal>
    }

    @if (isBulkReviewModalOpen && selectedBulkProducts.length > 0) {
      <app-bulk-add-review-modal
        [products]="selectedBulkProducts"
        [currentLang]="currentLang"
        (close)="isBulkReviewModalOpen = false"
        (completed)="onBulkCompleted()">
      </app-bulk-add-review-modal>
    }

    @if (isRequestModalOpen) {
      <app-product-request-modal
        [initialName]="requestInitialName"
        (close)="isRequestModalOpen = false"
        (submitted)="onRequestSubmitted()">
      </app-product-request-modal>
    }
  `,
  styles: [`
    :host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: VendorProduct[] = [];
  categories: any[] = [];
  units: UnitOption[] = [];
  isLoading = true;
  searchTerm = '';
  currentLang = 'ar';
  filters = {
    category: '',
    status: 'all',
    stock: 'all',
    offers: 'all',
    packageTypeId: '',
    measurementUnitId: '',
    measurementValue: ''
  };

  private langSub: Subscription;

  isSelectorModalOpen = false;
  isPricingModalOpen = false;
  isBulkReviewModalOpen = false;
  isRequestModalOpen = false;
  requestInitialName = '';
  selectedMasterProduct: MasterProduct | null = null;
  selectedBulkProducts: MasterProduct[] = [];

  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  constructor(
    private catalogService: CatalogService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private alertModalService: AlertModalService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => this.currentLang = event.lang);
  }

  ngOnInit(): void {
    this.applyQueryParams();
    this.catalogService.getCategories().subscribe(cats => {
      this.categories = this.flattenCategories(cats || []);
      this.loadProducts();
    });
    this.catalogService.getUnits().subscribe(units => {
      this.units = units || [];
    });
  }

  ngOnDestroy(): void {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }
  }

  getPackageTypeLabel(product: VendorProduct): string {
    if (!product.packageTypeId) {
      return '';
    }

    const packageType = this.units.find((unit) => unit.id === product.packageTypeId);
    return this.currentLang === 'ar'
      ? (packageType?.nameAr || packageType?.nameEn || '')
      : (packageType?.nameEn || packageType?.nameAr || '');
  }

  getMeasurementUnitLabel(product: VendorProduct): string {
    if (product.measurementUnitId) {
      const measurementUnit = this.units.find((unit) => unit.id === product.measurementUnitId);
      const measurementLabel = this.currentLang === 'ar'
        ? (measurementUnit?.nameAr || measurementUnit?.nameEn || '')
        : (measurementUnit?.nameEn || measurementUnit?.nameAr || '');

      if (measurementLabel) {
        return measurementLabel;
      }
    }

    return this.currentLang === 'ar'
      ? (product.unitNameAr || product.unitNameEn || '')
      : (product.unitNameEn || product.unitNameAr || '');
  }

  getProductSizeSummary(product: VendorProduct): string {
    const displaySize = this.currentLang === 'ar'
      ? (product.displaySizeAr || product.displaySizeEn || '')
      : (product.displaySizeEn || product.displaySizeAr || '');

    if (displaySize.trim()) {
      return displaySize;
    }

    const packageType = this.getPackageTypeLabel(product);
    const measurementValue = product.measurementValue !== null && product.measurementValue !== undefined
      ? `${product.measurementValue}`
      : '';
    const measurementUnit = this.getMeasurementUnitLabel(product);

    return [packageType, measurementValue, measurementUnit].filter(Boolean).join(' ').trim();
  }

  get filteredProducts(): VendorProduct[] {
    return this.products.filter(p => {
      // Basic search (already handled by API but good for client-side too)
      if (this.searchTerm && !p.nameAr.includes(this.searchTerm) && !p.nameEn.toLowerCase().includes(this.searchTerm.toLowerCase())) return false;

      // Category filter
      if (this.filters.category && p.categoryId !== this.filters.category) return false;

      if (this.filters.packageTypeId && p.packageTypeId !== this.filters.packageTypeId) return false;

      if (this.filters.measurementUnitId && p.measurementUnitId !== this.filters.measurementUnitId) return false;

      if (this.filters.measurementValue) {
        const selectedValue = Number(this.filters.measurementValue);
        if (!Number.isFinite(selectedValue) || p.measurementValue !== selectedValue) return false;
      }

      // Status filter
      if (this.filters.status !== 'all') {
        const isActive = this.filters.status === 'active';
        if (p.isActive !== isActive) return false;
      }

      // Stock filter
      if (this.filters.stock !== 'all') {
        if (this.filters.stock === 'out' && p.stockQty > 0) return false;
        if (this.filters.stock === 'low' && (p.stockQty === 0 || p.stockQty > 20)) return false;
        if (this.filters.stock === 'healthy' && p.stockQty <= 20) return false;
      }

      // Offers filter
      if (this.filters.offers !== 'all') {
        const hasOffer = this.catalogService.hasActiveOffer(p);
        if (this.filters.offers === 'with' && !hasOffer) return false;
        if (this.filters.offers === 'without' && hasOffer) return false;
      }

      return true;
    });
  }

  /** Groups filtered products by variantGroupId for display */
  get groupedVendorProducts(): Array<{ groupId: string; name: string; imageUrl: string; sizesCount: number; variants: VendorProduct[] }> {
    const groupMap = new Map<string, VendorProduct[]>();

    for (const product of this.filteredProducts) {
      const key = product.variantGroupId || product.masterProductId || product.id;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(product);
    }

    const groups: Array<{ groupId: string; name: string; imageUrl: string; sizesCount: number; variants: VendorProduct[] }> = [];

    for (const [groupId, variants] of groupMap) {
      const representative = variants[0];
      groups.push({
        groupId,
        name: this.currentLang === 'ar'
          ? (representative.nameAr || representative.nameEn || '')
          : (representative.nameEn || representative.nameAr || ''),
        imageUrl: representative.imageUrl || '',
        sizesCount: variants.length,
        variants
      });
    }

    return groups;
  }

  get activeProductsCount(): number {
    return this.products.filter(p => p.isActive).length;
  }

  get lowStockCount(): number {
    return this.products.filter(p => p.stockQty > 0 && p.stockQty <= 20).length;
  }

  get outOfStockCount(): number {
    return this.products.filter(p => p.stockQty === 0).length;
  }

  get categoryOptions(): SearchableSelectOption[] {
    return [
      { value: '', labelKey: 'PRODUCTS.FILTERS.ALL_CATEGORIES' },
      ...this.availableCategories.map(c => ({ value: c.value, label: c.label }))
    ];
  }

  get availableCategories(): { value: string, label: string }[] {
    const cats = new Map<string, string>();
    this.products.forEach(p => {
      const id = p.categoryId;
      const name = this.currentLang === 'ar' ? p.categoryNameAr : p.categoryNameEn;
      if (id && name) cats.set(id, name);
    });
    return Array.from(cats.entries()).map(([value, label]) => ({ value, label }));
  }

  get statusOptions(): SearchableSelectOption[] {
    return [
      { value: 'all', labelKey: 'PRODUCTS.FILTERS.ALL_STATUSES' },
      { value: 'active', labelKey: 'PRODUCTS.STATUS_ACTIVE' },
      { value: 'inactive', labelKey: 'PRODUCTS.STATUS_INACTIVE' }
    ];
  }

  get stockOptions(): SearchableSelectOption[] {
    return [
      { value: 'all', labelKey: 'PRODUCTS.FILTERS.ALL_STOCK' },
      { value: 'healthy', labelKey: 'PRODUCTS.FILTERS.HEALTHY_STOCK' },
      { value: 'low', labelKey: 'PRODUCTS.FILTERS.LOW_STOCK' },
      { value: 'out', labelKey: 'PRODUCTS.FILTERS.OUT_OF_STOCK' }
    ];
  }

  get offerOptions(): SearchableSelectOption[] {
    return [
      { value: 'all', labelKey: 'PRODUCTS.FILTERS.ALL_OFFERS' },
      { value: 'with', labelKey: 'PRODUCTS.FILTERS.WITH_OFFERS' },
      { value: 'without', labelKey: 'PRODUCTS.FILTERS.WITHOUT_OFFERS' }
    ];
  }

  get packageTypeOptions(): SearchableSelectOption[] {
    return [
      { value: '', labelKey: 'PRODUCTS.FILTERS.ALL_PACKAGE_TYPES' },
      ...this.units
        .filter((unit) => unit.kind === 'Packaging')
        .map((unit) => ({
          value: unit.id,
          label: this.currentLang === 'ar' ? (unit.nameAr || unit.nameEn) : (unit.nameEn || unit.nameAr)
        }))
    ];
  }

  get measurementUnitOptions(): SearchableSelectOption[] {
    return [
      { value: '', labelKey: 'PRODUCTS.FILTERS.ALL_MEASUREMENT_UNITS' },
      ...this.units
        .filter((unit) => unit.kind === 'Measurement')
        .map((unit) => ({
          value: unit.id,
          label: this.currentLang === 'ar' ? (unit.nameAr || unit.nameEn) : (unit.nameEn || unit.nameAr)
        }))
    ];
  }

  get measurementValueOptions(): SearchableSelectOption[] {
    const values = Array.from(new Set(
      this.products
        .map((product) => product.measurementValue)
        .filter((value): value is number => typeof value === 'number')
    )).sort((left, right) => left - right);

    return [
      { value: '', labelKey: 'PRODUCTS.FILTERS.ALL_SIZES' },
      ...values.map((value) => ({
        value: String(value),
        label: String(value)
      }))
    ];
  }

  loadProducts(): void {
    this.isLoading = true;
    this.catalogService.getVendorProducts({
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm
    }).subscribe({
      next: (response) => {
        this.products = response.items.map(p => {
          const cat = this.categories.find(c => c.id === p.categoryId);
          if (cat) {
            p.categoryNameAr = cat.nameAr;
            p.categoryNameEn = cat.nameEn;
          }
          return p;
        });
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private flattenCategories(categories: any[] | null | undefined): any[] {
    if (!categories?.length) {
      return [];
    }

    return categories.flatMap((category) => [
      category,
      ...this.flattenCategories(category.subCategories || [])
    ]);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  onFiltersChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filters = {
      category: '',
      status: 'all',
      stock: 'all',
      offers: 'all',
      packageTypeId: '',
      measurementUnitId: '',
      measurementValue: ''
    };
    this.currentPage = 1;
    this.loadProducts();
  }

  onAddProductClick(): void {
    this.isSelectorModalOpen = true;
  }

  onProductSelected(product: MasterProduct): void {
    this.selectedMasterProduct = product;
    this.isSelectorModalOpen = false;
    this.isPricingModalOpen = true;
  }

  onBulkProductsSelected(products: MasterProduct[]): void {
    this.selectedBulkProducts = products;
    this.isSelectorModalOpen = false;
    this.isBulkReviewModalOpen = true;
  }

  onRequestProduct(name: string): void {
    this.requestInitialName = name;
    this.isSelectorModalOpen = false;
    this.isRequestModalOpen = true;
  }

  onPricingConfirm(pricingData: any): void {
    this.isPricingModalOpen = false;
    if (!this.selectedMasterProduct) {
      this.loadProducts();
      return;
    }

    this.catalogService.addToStore({
      masterProductId: this.selectedMasterProduct.id,
      costPrice: pricingData.costPrice,
      tradePrice: pricingData.tradePrice,
      sellingPrice: pricingData.sellingPrice,
      compareAtPrice: this.catalogService.calculateCompareAtPrice(
        pricingData.sellingPrice,
        pricingData.discountPercentage
      ),
      stockQty: pricingData.stockQuantity
    }).subscribe({
      next: () => {
        this.selectedMasterProduct = null;
        this.loadProducts();
      },
      error: () => {
        this.loadProducts();
      }
    });
  }

  onBulkCompleted(): void {
    this.isBulkReviewModalOpen = false;
    this.loadProducts();
  }

  onRequestSubmitted(): void {
    this.isRequestModalOpen = false;
  }

  deleteProduct(product: VendorProduct): void {
    const productName = this.currentLang === 'ar'
      ? (product.nameAr || product.nameEn || '')
      : (product.nameEn || product.nameAr || '');
    const confirmed = window.confirm(
      this.currentLang === 'ar'
        ? `هل تريد حذف المنتج "${productName}"؟`
        : `Do you want to delete "${productName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.catalogService.deleteVendorProduct(product.id).subscribe({
      next: () => {
        this.alertModalService.success(
          this.currentLang === 'ar' ? 'تم حذف المنتج بنجاح.' : 'Product deleted successfully.'
        );
        this.loadProducts();
      },
      error: (error) => {
        this.alertModalService.error(
          error?.error?.message
            || (this.currentLang === 'ar'
              ? 'تعذر حذف المنتج الآن. تأكد أنه غير مرتبط بطلبات أو حملات.'
              : 'Unable to delete this product right now. Make sure it is not linked to orders or campaigns.')
        );
      }
    });
  }

  private applyQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const stockState = params.get('stockState');
    const offerState = params.get('offerState');
    const packageTypeId = params.get('packageTypeId');
    const measurementUnitId = params.get('measurementUnitId');
    const measurementValue = params.get('measurementValue');

    if (stockState === 'low' || stockState === 'out' || stockState === 'healthy') {
      this.filters.stock = stockState;
    }

    if (offerState === 'with' || offerState === 'without') {
      this.filters.offers = offerState;
    }

    if (packageTypeId) {
      this.filters.packageTypeId = packageTypeId;
    }

    if (measurementUnitId) {
      this.filters.measurementUnitId = measurementUnitId;
    }

    if (measurementValue) {
      this.filters.measurementValue = measurementValue;
    }
  }
}
