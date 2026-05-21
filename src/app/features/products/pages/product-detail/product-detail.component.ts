import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { combineLatest, Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ProductStatusBadgeComponent } from '../../components/product-status-badge/product-status-badge.component';
import { ProductMediaCardComponent } from '../../components/product-media-card/product-media-card.component';
import { ProductPriceStockFormComponent } from '../../components/product-price-stock-form/product-price-stock-form.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { Category, VendorProduct } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';
import { AlertModalService } from '../../../../core/notifications/services/alert-modal.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterModule,
    ProductStatusBadgeComponent,
    ProductMediaCardComponent,
    ProductPriceStockFormComponent,
    AppPanelHeaderComponent,
    AppPageHeaderComponent
  ],
  template: `
    <div class="px-2 pb-12 sm:px-0" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <app-page-header
        [showBack]="true"
        backLink="/products"
        [title]="'PRODUCTS.DETAILS_TITLE' | translate"
        [description]="'PRODUCTS.DETAILS_SUBTITLE' | translate"
        customClass="sticky top-0 z-30 -mx-4 mb-8 border-b border-white/40 bg-white/60 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-[28px] sm:border sm:px-6 shadow-sm shadow-slate-200/20 transition-all duration-300"
      >
        <div actions class="flex flex-wrap items-center gap-4">
          <!-- Status Toggle Switch -->
          <button 
            type="button"
            (click)="toggleStatus()"
            class="hidden sm:flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 border border-slate-200/50 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow hover:bg-white">
            <div 
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 shadow-inner"
              [ngClass]="product?.isActive ? 'bg-emerald-500' : 'bg-slate-300'">
              <span 
                class="pointer-events-none flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow-sm ring-0 transition-transform duration-300 ease-in-out"
                [ngClass]="product?.isActive ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0'">
                @if (product?.isActive) {
                  <svg class="h-2.5 w-2.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                } @else {
                  <svg class="h-2.5 w-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                }
              </span>
            </div>
            <span 
              class="text-[0.72rem] font-black tracking-widest uppercase transition-colors duration-300"
              [ngClass]="product?.isActive ? 'text-emerald-700' : 'text-slate-500'">
              {{ (product?.isActive ? 'PRODUCTS.STATUS_ACTIVE' : 'PRODUCTS.STATUS_INACTIVE') | translate }}
            </span>
          </button>

          <!-- Save Button -->
          <button 
            (click)="saveChanges()"
            [disabled]="isSaving"
            class="group relative flex items-center justify-center gap-2 overflow-hidden rounded-[14px] bg-zadna-primary px-6 py-2.5 text-[0.78rem] font-black text-white shadow-[0_6px_15px_-4px_rgba(var(--color-zadna-primary),0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-5px_rgba(var(--color-zadna-primary),0.6)] active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 disabled:hover:scale-100">
            <div class="absolute inset-0 bg-white/20 translate-y-full transition-transform duration-300 group-hover:translate-y-0"></div>
            <span class="relative z-10 flex items-center gap-2">
              @if (isSaving) {
                <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              } @else {
                <svg class="h-4 w-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
              }
              {{ 'PRODUCTS.SAVE_CHANGES' | translate }}
            </span>
          </button>

          <button
            type="button"
            (click)="deleteProduct()"
            [disabled]="isSaving || isLoading"
            class="group relative flex items-center justify-center gap-2 overflow-hidden rounded-[14px] border border-rose-200 bg-white px-5 py-2.5 text-[0.78rem] font-black text-rose-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md disabled:opacity-50">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            {{ currentLang === 'ar' ? 'حذف المنتج' : 'Delete product' }}
          </button>
        </div>
      </app-page-header>

      @if (isLoading) {
        <div class="space-y-6 animate-in fade-in duration-500">
          <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <!-- Left Column Skeleton -->
            <div class="space-y-6 lg:col-span-4">
              <div class="vendor-skeleton-card min-h-[20rem] p-5">
                <span class="vendor-skeleton vendor-skeleton-media" style="height: 14rem"></span>
                <div class="mt-4 space-y-3">
                  <span class="vendor-skeleton vendor-skeleton-line lg w-3/4"></span>
                  <span class="vendor-skeleton vendor-skeleton-line sm w-1/2"></span>
                </div>
              </div>
            </div>
            <!-- Right Column Skeleton -->
            <div class="space-y-6 lg:col-span-8">
              <div class="vendor-skeleton-card min-h-[8rem] p-5 space-y-4">
                <span class="vendor-skeleton vendor-skeleton-line lg w-40"></span>
                <div class="grid grid-cols-2 gap-4">
                  @for (item of [1,2,3,4]; track item) {
                    <div class="space-y-2">
                      <span class="vendor-skeleton vendor-skeleton-line sm w-20"></span>
                      <span class="vendor-skeleton vendor-skeleton-line w-full"></span>
                    </div>
                  }
                </div>
              </div>
              <div class="vendor-skeleton-card min-h-[12rem] p-5 space-y-4">
                <span class="vendor-skeleton vendor-skeleton-line lg w-36"></span>
                @for (item of [1,2,3]; track item) {
                  <div class="flex items-center gap-3">
                    <span class="vendor-skeleton vendor-skeleton-circle"></span>
                    <div class="flex-1 space-y-2">
                      <span class="vendor-skeleton vendor-skeleton-line w-2/3"></span>
                      <span class="vendor-skeleton vendor-skeleton-line sm w-1/3"></span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      } @else if (product) {
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-in slide-in-from-bottom-8 duration-700 fill-mode-both">
          
          <!-- Left Column: Media & Primary Info -->
          <div class="space-y-8 lg:col-span-4">
            <div class="group relative overflow-hidden rounded-[32px] border border-slate-100/80 bg-white shadow-sm shadow-slate-200/50 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1">
              <div class="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <app-product-media-card 
                [imageUrl]="product.imageUrl || null" 
                [canChange]="false"
                class="relative z-10 block p-2">
              </app-product-media-card>
            </div>

            <!-- Basic Info Summary -->
            <div class="group overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/40 transition-all duration-500 hover:shadow-lg hover:-translate-y-1">
              <div class="border-b border-slate-50 p-5 pb-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 transition-transform duration-500 group-hover:scale-110">
                      <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h3 class="text-[0.8rem] font-black uppercase tracking-widest text-slate-800">{{ 'PRODUCTS.BASIC_INFO' | translate }}</h3>
                  </div>
                </div>
              </div>
              
              <div class="p-5">
                <ul class="flex flex-col gap-3">
                  <li class="flex flex-col gap-1 rounded-xl border border-slate-100/50 bg-slate-50/50 p-3 ps-4 relative overflow-hidden group/item">
                    <div class="absolute inset-y-0 start-0 w-1 bg-amber-400 rounded-s-xl"></div>
                    <span class="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.BRAND' | translate }}</span>
                    <span class="text-[0.85rem] font-black text-slate-900 truncate">
                      {{ currentLang === 'ar' ? (product.brandNameAr || ('COMMON.BRAND_GENERAL' | translate)) : (product.brandNameEn || ('COMMON.BRAND_GENERAL' | translate)) }}
                    </span>
                  </li>

                  <li class="flex flex-col gap-1 rounded-xl border border-slate-100/50 bg-slate-50/50 p-3 ps-4 relative overflow-hidden group/item">
                    <div class="absolute inset-y-0 start-0 w-1 bg-zadna-primary rounded-s-xl"></div>
                    <span class="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.CATEGORY' | translate }}</span>
                    <span class="text-[0.85rem] font-black text-zadna-primary truncate">
                      {{ currentLang === 'ar' ? (product.categoryNameAr || ('COMMON.NO_DATA' | translate)) : (product.categoryNameEn || ('COMMON.NO_DATA' | translate)) }}
                    </span>
                  </li>

                  <li class="flex flex-col gap-1 rounded-xl border border-slate-100/50 bg-slate-50/50 p-3 ps-4 relative overflow-hidden group/item">
                    <div class="absolute inset-y-0 start-0 w-1 bg-emerald-400 rounded-s-xl"></div>
                    <span class="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.UNIT' | translate }}</span>
                    <span class="text-[0.85rem] font-black text-slate-900 truncate">
                      {{ currentLang === 'ar' ? (product.unitNameAr || ('PRODUCTS.UNIT_PIECE' | translate)) : (product.unitNameEn || ('PRODUCTS.UNIT_PIECE' | translate)) }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Right Column: Forms & Technical Details -->
          <div class="space-y-8 lg:col-span-8">
            <form [formGroup]="productForm" class="space-y-8">
              
              <!-- Pricing & Stock Card -->
              <div class="group overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/40 transition-all duration-500 hover:shadow-lg hover:-translate-y-1" style="animation-delay: 100ms;">
                <div class="border-b border-slate-50 p-5 pb-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition-transform duration-500 group-hover:scale-110">
                        <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div>
                        <h2 class="text-[0.8rem] font-black uppercase tracking-widest text-slate-800">{{ 'PRODUCTS.PRICING_STOCK' | translate }}</h2>
                        <p class="text-[0.68rem] font-bold text-slate-400 mt-0.5">Manage pricing, discounts, and available stock levels</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="p-8 relative">
                  <div class="absolute right-0 top-0 w-64 h-64 bg-emerald-50/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                  <div class="mb-6 overflow-hidden rounded-[24px] border p-5 shadow-sm transition-all duration-300"
                       [ngClass]="getStockInsightCardClasses()">
                    <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div class="space-y-3">
                        <div class="flex flex-wrap items-center gap-3">
                          <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.24em]"
                                [ngClass]="getStockHealthBadgeClasses()">
                            <span class="h-2 w-2 rounded-full" [ngClass]="getStockHealthDotClasses()"></span>
                            {{ getStockHealthLabel() }}
                          </span>
                          <span class="rounded-full bg-white/80 px-3 py-1 text-[0.7rem] font-black text-slate-600 shadow-sm">
                            {{ 'PRODUCTS.STOCK_STATUS' | translate:{ count: product.stockQty } }}
                          </span>
                        </div>
                        <div>
                          <h3 class="text-[0.82rem] font-black uppercase tracking-widest text-slate-900">
                            {{ 'PRODUCTS.STOCK_AUTOMATION_TITLE' | translate }}
                          </h3>
                          <p class="mt-1 max-w-2xl text-[0.78rem] font-bold leading-6 text-slate-600">
                            {{ 'PRODUCTS.STOCK_AUTOMATION_BODY' | translate }}
                          </p>
                        </div>
                      </div>

                      <div class="min-w-[220px] rounded-[20px] border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-sm">
                        <p class="text-[0.64rem] font-black uppercase tracking-[0.22em] text-slate-400">
                          {{ 'PRODUCTS.STOCK_ACTION_TITLE' | translate }}
                        </p>
                        <p class="mt-2 text-[0.78rem] font-black leading-6 text-slate-700">
                          {{ getStockActionMessage() }}
                        </p>
                      </div>
                    </div>
                  </div>
                  @if (product.tradePrice === null || product.tradePrice === undefined) {
                    <div class="mb-6 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-[0.75rem] font-black text-amber-800">
                      {{ currentLang === 'ar' ? 'هذا المنتج يحتاج سعرًا تجاريًا قبل أن يكون جاهزًا للطلبات الفعلية.' : 'This product needs a trade price before it is ready for live orders.' }}
                    </div>
                  }
                  <app-product-price-stock-form 
                    [form]="productForm" 
                    [currentLang]="currentLang"
                    [commissionRate]="product.commissionRate || 0"
                    [unitName]="(currentLang === 'ar' ? product.unitNameAr : product.unitNameEn) || ''">
                  </app-product-price-stock-form>
                </div>
              </div>

              <!-- Catalog Details -->
              <div class="group overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/40 transition-all duration-500 hover:shadow-lg hover:-translate-y-1" style="animation-delay: 200ms;">
                <div class="border-b border-slate-50 p-5 pb-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-500 transition-transform duration-500 group-hover:scale-110">
                      <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                      </svg>
                    </div>
                    <div>
                      <h2 class="text-[0.8rem] font-black uppercase tracking-widest text-slate-800">{{ 'PRODUCTS.CATALOG_INFO' | translate }}</h2>
                      <p class="text-[0.68rem] font-bold text-slate-400 mt-0.5">Master catalog details synced from Zadana's central database</p>
                    </div>
                  </div>
                </div>

                <div class="p-5 md:p-6 relative">
                  <div class="grid gap-4 md:grid-cols-2">
                    <div class="flex flex-col gap-1.5 rounded-2xl border border-slate-100/50 bg-slate-50/50 p-4">
                      <span class="text-[0.65rem] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {{ 'PRODUCTS.HEADER_PRODUCT' | translate }}
                      </span>
                      <p class="text-[0.95rem] font-black text-slate-800 leading-relaxed ps-5">
                        {{ currentLang === 'ar' ? product.nameAr : product.nameEn }}
                      </p>
                    </div>

                    <div class="flex flex-col gap-1.5 rounded-2xl border border-slate-100/50 bg-slate-50/50 p-4">
                      <span class="text-[0.65rem] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                        {{ 'PRODUCTS.DESCRIPTION' | translate }}
                      </span>
                      <p class="text-[0.8rem] font-bold text-slate-500 leading-relaxed ps-5">
                        {{ 'PRODUCTS.CATALOG_DESC_NOTE' | translate }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  productId: string | null = null;
  product: VendorProduct | null = null;
  isLoading = true;
  isSaving = false;
  currentLang = 'ar';
  private langSub: Subscription;
  productForm: FormGroup;
  originalStatus: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private translate: TranslateService,
    private fb: FormBuilder,
    private alertModalService: AlertModalService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe(event => this.currentLang = event.lang);

    this.productForm = this.fb.group({
      costPrice: [0, [Validators.min(0)]],
      tradePrice: [null, [Validators.required, Validators.min(0.01)]],
      sellingPrice: [0, [Validators.required, Validators.min(0.01)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      stockQty: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.loadProduct(this.productId);
    } else {
      this.router.navigate(['/products']);
    }
  }

  ngOnDestroy(): void {
    if (this.langSub) this.langSub.unsubscribe();
  }

  loadProduct(id: string): void {
    this.isLoading = true;
    combineLatest([
      this.catalogService.getVendorProductById(id),
      this.catalogService.getCategories()
    ]).subscribe({
      next: ([data, categories]) => {
        this.product = this.enrichProductWithCategory(data, this.flattenCategories(categories));
        this.productForm.patchValue({
          costPrice: this.product.costPrice ?? 0,
          tradePrice: this.product.tradePrice ?? null,
          sellingPrice: this.product.sellingPrice,
          discountPercentage: this.catalogService.calculateDiscountPercentage(this.product.sellingPrice, this.product.compareAtPrice),
          stockQty: this.product.stockQty
        });
        this.originalStatus = this.product.isActive;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/products']);
      }
    });
  }

  private enrichProductWithCategory(product: VendorProduct, categories: Category[]): VendorProduct {
    const category = categories.find((item) => item.id === product.categoryId);

    if (!category) {
      return product;
    }

    return {
      ...product,
      categoryNameAr: product.categoryNameAr || category.nameAr,
      categoryNameEn: product.categoryNameEn || category.nameEn
    };
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

  toggleStatus(): void {
    if (!this.product) return;
    this.product.isActive = !this.product.isActive;
  }

  getStockHealth(): 'healthy' | 'low' | 'out' {
    const stockQty = this.product?.stockQty ?? 0;

    if (stockQty <= 0) {
      return 'out';
    }

    if (stockQty <= 20) {
      return 'low';
    }

    return 'healthy';
  }

  getStockHealthLabel(): string {
    switch (this.getStockHealth()) {
      case 'out':
        return this.translate.instant('PRODUCTS.STOCK_HEALTH_OUT');
      case 'low':
        return this.translate.instant('PRODUCTS.STOCK_HEALTH_LOW');
      default:
        return this.translate.instant('PRODUCTS.STOCK_HEALTH_HEALTHY');
    }
  }

  getStockHealthBadgeClasses(): string {
    switch (this.getStockHealth()) {
      case 'out':
        return 'bg-rose-100 text-rose-700';
      case 'low':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-emerald-100 text-emerald-700';
    }
  }

  getStockHealthDotClasses(): string {
    switch (this.getStockHealth()) {
      case 'out':
        return 'bg-rose-500';
      case 'low':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  }

  getStockInsightCardClasses(): string {
    switch (this.getStockHealth()) {
      case 'out':
        return 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50/70';
      case 'low':
        return 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/70';
      default:
        return 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70';
    }
  }

  getStockActionMessage(): string {
    switch (this.getStockHealth()) {
      case 'out':
        return this.translate.instant('PRODUCTS.STOCK_ACTION_OUT');
      case 'low':
        return this.translate.instant('PRODUCTS.STOCK_ACTION_LOW');
      default:
        return this.translate.instant('PRODUCTS.STOCK_ACTION_HEALTHY');
    }
  }

  onHandleImageChange(): void {
    console.log('Change image clicked');
    // Implement image upload logic here
  }

  saveChanges(): void {
    if (!this.product) return;

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.alertModalService.error(
        this.currentLang === 'ar' 
          ? 'الرجاء التأكد من إدخال جميع الحقول المطلوبة بشكل صحيح (مثل سعر البيع وسعر التكلفة).' 
          : 'Please make sure to fill all required fields correctly (like selling price and trade price).',
        this.currentLang === 'ar' ? 'بيانات غير مكتملة' : 'Incomplete Data'
      );
      return;
    }

    this.isSaving = true;
    const updateData = {
      costPrice: this.productForm.value.costPrice,
      tradePrice: this.productForm.value.tradePrice,
      sellingPrice: this.productForm.value.sellingPrice,
      stockQty: this.productForm.value.stockQty,
      compareAtPrice: this.catalogService.calculateCompareAtPrice(
        this.productForm.value.sellingPrice,
        this.productForm.value.discountPercentage
      )
    };

    const updateProduct$ = this.catalogService.updateVendorProduct(this.product.id, updateData);

    updateProduct$.pipe(
      switchMap(() => {
        if (this.product!.isActive !== this.originalStatus) {
          return this.catalogService.changeProductStatus(this.product!.id, this.product!.isActive);
        }
        return of(void 0);
      })
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.translate.get('PRODUCTS.UPDATE_SUCCESS').subscribe(msg => {
          this.alertModalService.success(msg);
          this.router.navigate(['/products']);
        });
      },
      error: () => {
        this.isSaving = false;
        this.translate.get('PRODUCTS.UPDATE_ERROR').subscribe(msg => {
          this.alertModalService.error(msg);
        });
      }
    });
  }

  deleteProduct(): void {
    if (!this.product) return;

    const productName = this.currentLang === 'ar'
      ? (this.product.nameAr || this.product.nameEn || '')
      : (this.product.nameEn || this.product.nameAr || '');
    const confirmed = window.confirm(
      this.currentLang === 'ar'
        ? `هل تريد حذف المنتج "${productName}"؟`
        : `Do you want to delete "${productName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.catalogService.deleteVendorProduct(this.product.id).subscribe({
      next: () => {
        this.isSaving = false;
        this.alertModalService.success(
          this.currentLang === 'ar' ? 'تم حذف المنتج بنجاح.' : 'Product deleted successfully.'
        );
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.isSaving = false;
        this.alertModalService.error(
          error?.error?.message
            || (this.currentLang === 'ar'
              ? 'تعذر حذف المنتج الآن. تأكد أنه غير مرتبط بطلبات أو حملات.'
              : 'Unable to delete this product right now. Make sure it is not linked to orders or campaigns.')
        );
      }
    });
  }
}
