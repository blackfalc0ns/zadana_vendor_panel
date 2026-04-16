import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, combineLatest } from 'rxjs';
import { MasterProductSelectorModalComponent } from '../../components/master-product-selector-modal/master-product-selector-modal.component';
import { AddProductModalComponent } from '../../components/add-product-modal/add-product-modal.component';
import { BulkAddReviewModalComponent } from '../../components/bulk-add-review-modal/bulk-add-review-modal.component';
import { ProductStatusBadgeComponent } from '../../components/product-status-badge/product-status-badge.component';
import { ProductRequestModalComponent } from '../../components/product-request-modal/product-request-modal.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPaginationComponent } from '../../../../shared/components/ui/navigation/pagination/pagination.component';
import { Category, MasterProduct, VendorProduct } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
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

      <div class="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50">
        <app-panel-header
          containerClass="border-b border-slate-100 px-6 py-5"
          contentClass="flex flex-col gap-4"
        >
          <div actions class="grid w-full gap-4 xl:grid-cols-[minmax(260px,1.5fr)_repeat(4,minmax(150px,1fr))_auto]">
            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'PRODUCTS.FILTERS.SEARCH' | translate }}</span>
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
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'PRODUCTS.FILTERS.CATEGORY' | translate }}</span>
              <select
                [(ngModel)]="filters.category"
                (ngModelChange)="onFiltersChange()"
                class="h-11 w-full rounded-[16px] border border-slate-100 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="">{{ 'PRODUCTS.FILTERS.ALL_CATEGORIES' | translate }}</option>
                @for (category of availableCategories; track category.value) {
                  <option [value]="category.value">{{ category.label }}</option>
                }
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'PRODUCTS.FILTERS.STATUS' | translate }}</span>
              <select
                [(ngModel)]="filters.status"
                (ngModelChange)="onFiltersChange()"
                class="h-11 w-full rounded-[16px] border border-slate-100 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'PRODUCTS.FILTERS.ALL_STATUSES' | translate }}</option>
                <option value="active">{{ 'PRODUCTS.STATUS_ACTIVE' | translate }}</option>
                <option value="inactive">{{ 'PRODUCTS.STATUS_INACTIVE' | translate }}</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'PRODUCTS.FILTERS.STOCK' | translate }}</span>
              <select
                [(ngModel)]="filters.stock"
                (ngModelChange)="onFiltersChange()"
                class="h-11 w-full rounded-[16px] border border-slate-100 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'PRODUCTS.FILTERS.ALL_STOCK' | translate }}</option>
                <option value="healthy">{{ 'PRODUCTS.FILTERS.HEALTHY_STOCK' | translate }}</option>
                <option value="low">{{ 'PRODUCTS.FILTERS.LOW_STOCK' | translate }}</option>
                <option value="out">{{ 'PRODUCTS.FILTERS.OUT_OF_STOCK' | translate }}</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'PRODUCTS.FILTERS.OFFERS' | translate }}</span>
              <select
                [(ngModel)]="filters.offers"
                (ngModelChange)="onFiltersChange()"
                class="h-11 w-full rounded-[16px] border border-slate-100 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'PRODUCTS.FILTERS.ALL_OFFERS' | translate }}</option>
                <option value="with">{{ 'PRODUCTS.FILTERS.WITH_OFFERS' | translate }}</option>
                <option value="without">{{ 'PRODUCTS.FILTERS.WITHOUT_OFFERS' | translate }}</option>
              </select>
            </label>

            <div class="flex items-end">
              <button
                type="button"
                (click)="resetFilters()"
                class="inline-flex h-11 items-center justify-center rounded-[16px] border border-rose-200 bg-rose-50 px-5 text-[0.78rem] font-black text-rose-600 transition hover:bg-rose-100">
                {{ 'PRODUCTS.FILTERS.RESET' | translate }}
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
          } @else if (products.length === 0) {
            <div class="flex h-80 flex-col items-center justify-center p-8 text-center">
              <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50">
                <svg class="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <h3 class="text-lg font-black text-slate-900">{{ 'PRODUCTS.EMPTY_TITLE' | translate }}</h3>
              <p class="max-w-xs text-sm font-bold text-slate-500">{{ 'PRODUCTS.EMPTY_DESC' | translate }}</p>
              <button
                (click)="onAddProductClick()"
                class="mt-6 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-3 text-[0.8rem] font-black text-slate-500 transition-all hover:border-zadna-primary hover:text-zadna-primary">
                {{ 'PRODUCTS.ADD_FIRST' | translate }}
              </button>
            </div>
          } @else {
            <table class="w-full border-collapse text-start">
              <thead>
                <tr class="bg-slate-50/50 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.HEADER_PRODUCT' | translate }}</th>
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.HEADER_CATEGORY' | translate }}</th>
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.HEADER_PRICE' | translate }}</th>
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.HEADER_STOCK' | translate }}</th>
                  <th class="px-3 py-3 text-start">{{ 'PRODUCTS.HEADER_STATUS' | translate }}</th>
                  <th class="px-3 py-3 text-center">{{ 'COMMON.ACTIONS' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (product of products; track product.id) {
                  <tr class="group transition-colors hover:bg-slate-50/50">
                    <td class="px-3 py-2.5">
                      <div class="flex items-center gap-3.5">
                        <div class="h-10 w-10 shrink-0 overflow-hidden rounded-[14px] border border-slate-100 bg-slate-50 transition-all group-hover:border-zadna-primary/20">
                          <img [src]="product.imageUrl || 'assets/images/placeholders/product.svg'" class="h-full w-full object-cover">
                        </div>
                        <div class="min-w-0">
                          <span class="block truncate text-[0.8rem] font-black text-slate-900 transition-colors group-hover:text-zadna-primary">
                            {{ currentLang === 'ar' ? product.nameAr : product.nameEn }}
                          </span>
                          <span class="text-[0.62rem] font-bold text-slate-400">
                            {{ currentLang === 'ar' ? (product.brandNameAr || ('COMMON.BRAND_GENERAL' | translate)) : (product.brandNameEn || ('COMMON.BRAND_GENERAL' | translate)) }}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <span class="inline-flex rounded-lg bg-slate-100 px-2.5 py-0.5 text-[0.6rem] font-black text-slate-600">
                        {{ currentLang === 'ar' ? (product.categoryNameAr || ('COMMON.NO_DATA' | translate)) : (product.categoryNameEn || ('COMMON.NO_DATA' | translate)) }}
                      </span>
                    </td>
                    <td class="px-3 py-2.5">
                      <div class="flex flex-col gap-0.5">
                        <strong class="text-[0.8rem] font-black leading-none text-slate-900">{{ product.sellingPrice }} <small class="text-[0.55rem] font-bold text-slate-400">{{ 'COMMON.EGP' | translate }}</small></strong>
                        @if (hasActiveOffer(product)) {
                          <div class="flex items-center gap-2">
                            <span class="text-[0.62rem] font-bold text-slate-400 line-through">
                              {{ product.compareAtPrice | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}
                            </span>
                            <span class="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[0.58rem] font-black text-orange-700">
                              {{ 'PRODUCTS.OFFER_BADGE' | translate:{ value: product.discountPercentage || 0 } }}
                            </span>
                          </div>
                        }
                        <span class="text-[0.58rem] font-bold text-slate-400">{{ 'PRODUCTS.INCL_VAT' | translate }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <div class="flex items-center gap-1.5">
                        <div class="h-1.2 w-1.2 rounded-full" [ngClass]="product.stockQty > 20 ? 'bg-emerald-500' : product.stockQty > 0 ? 'bg-orange-500' : 'bg-rose-500'"></div>
                        <span class="text-[0.75rem] font-black leading-none text-slate-700">{{ product.stockQty }}</span>
                        <small class="text-[0.58rem] font-bold uppercase text-slate-400">
                          {{ currentLang === 'ar' ? (product.unitNameAr || ('PRODUCTS.UNIT_PIECE' | translate)) : (product.unitNameEn || ('PRODUCTS.UNIT_PIECE' | translate)) }}
                        </small>
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <app-product-status-badge [isActive]="product.isActive"></app-product-status-badge>
                    </td>
                    <td class="px-3 py-2.5">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          [routerLink]="['/products', product.id]"
                          class="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 transition hover:border-zadna-primary/20 hover:bg-zadna-primary/10 hover:text-zadna-primary">
                          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button class="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-500">
                          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
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

        @if (products.length > 0) {
          <div class="border-t border-slate-50 px-6">
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
      </div>
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
  allProducts: VendorProduct[] = [];
  categories: Category[] = [];
  isLoading = true;
  searchTerm = '';
  currentLang = 'ar';
  filters = {
    category: '',
    status: 'all',
    stock: 'all',
    offers: 'all'
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
    private translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => this.currentLang = event.lang);
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }
  }

  get availableCategories(): Array<{ value: string; label: string }> {
    const categoryMap = new Map<string, string>();

    this.flattenCategories(this.categories).forEach((category) => {
      categoryMap.set(category.id, this.currentLang === 'ar' ? category.nameAr : category.nameEn);
    });

    this.allProducts.forEach((product) => {
      const value = product.categoryId;
      if (!categoryMap.has(value)) {
        categoryMap.set(
          value,
          this.currentLang === 'ar'
            ? (product.categoryNameAr || this.translate.instant('COMMON.NO_DATA'))
            : (product.categoryNameEn || this.translate.instant('COMMON.NO_DATA'))
        );
      }
    });

    return Array.from(categoryMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  loadProducts(): void {
    this.isLoading = true;

    combineLatest([
      this.catalogService.getVendorProducts({
        searchTerm: this.searchTerm,
        pageNumber: 1,
        pageSize: 250
      }),
      this.catalogService.getCategories()
    ]).subscribe({
      next: ([data, categories]) => {
        const flattenedCategories = this.flattenCategories(categories);

        this.categories = flattenedCategories;
        this.allProducts = this.enrichProductsWithCategories(data.items, flattenedCategories);
        this.applyFiltersAndPagination();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  applyFiltersAndPagination(): void {
    const filtered = this.allProducts.filter((product) => this.matchesFilters(product));
    this.totalCount = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.products = filtered.slice(startIndex, startIndex + this.pageSize);
  }

  private matchesFilters(product: VendorProduct): boolean {
    if (this.filters.category && product.categoryId !== this.filters.category) {
      return false;
    }

    if (this.filters.status === 'active' && !product.isActive) {
      return false;
    }

    if (this.filters.status === 'inactive' && product.isActive) {
      return false;
    }

    if (this.filters.stock === 'healthy' && product.stockQty <= 20) {
      return false;
    }

    if (this.filters.stock === 'low' && (product.stockQty === 0 || product.stockQty > 20)) {
      return false;
    }

    if (this.filters.stock === 'out' && product.stockQty > 0) {
      return false;
    }

    const hasOffer = this.hasActiveOffer(product);
    if (this.filters.offers === 'with' && !hasOffer) {
      return false;
    }

    if (this.filters.offers === 'without' && hasOffer) {
      return false;
    }

    return true;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyFiltersAndPagination();
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
      offers: 'all'
    };
    this.currentPage = 1;
    this.loadProducts();
  }

  private enrichProductsWithCategories(products: VendorProduct[], categories: Category[]): VendorProduct[] {
    const categoryLookup = new Map(categories.map((category) => [category.id, category]));

    return products.map((product) => {
      const category = categoryLookup.get(product.categoryId);

      if (!category) {
        return product;
      }

      return {
        ...product,
        categoryNameAr: product.categoryNameAr || category.nameAr,
        categoryNameEn: product.categoryNameEn || category.nameEn
      };
    });
  }

  private flattenCategories(categories: Category[] | null | undefined): Category[] {
    if (!categories?.length) {
      return [];
    }

    return categories.flatMap((category) => [
      category,
      ...this.flattenCategories(category.subCategories || [])
    ]);
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

  onRequestProduct(searchTerm: string): void {
    this.requestInitialName = searchTerm;
    this.isSelectorModalOpen = false;
    this.isRequestModalOpen = true;
  }

  onRequestSubmitted(): void {
    this.isRequestModalOpen = false;
    this.translate.get('PRODUCTS.REQUEST_SUCCESS').subscribe((msg) => alert(msg));
  }

  onPricingConfirm(event: { sellingPrice: number, stockQuantity: number, discountPercentage: number }): void {
    if (!this.selectedMasterProduct) {
      return;
    }

    const request = {
      masterProductId: this.selectedMasterProduct.id,
      sellingPrice: event.sellingPrice,
      stockQty: event.stockQuantity,
      compareAtPrice: this.catalogService.calculateCompareAtPrice(event.sellingPrice, event.discountPercentage)
    };

    this.catalogService.addToStore(request).subscribe({
      next: () => {
        this.closeAllModals();
        this.loadProducts();
      },
      error: () => {
        this.translate.get('PRODUCTS.ERROR_ADDING_MSG').subscribe((msg) => alert(msg));
      }
    });
  }

  closeAllModals(): void {
    this.isSelectorModalOpen = false;
    this.isPricingModalOpen = false;
    this.isBulkReviewModalOpen = false;
    this.isRequestModalOpen = false;
    this.selectedMasterProduct = null;
    this.selectedBulkProducts = [];
  }

  onBulkCompleted(): void {
    this.isBulkReviewModalOpen = false;
    this.selectedBulkProducts = [];
    this.loadProducts();
  }

  hasActiveOffer(product: VendorProduct): boolean {
    return this.catalogService.hasActiveOffer(product);
  }
}
