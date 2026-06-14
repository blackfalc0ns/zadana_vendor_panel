import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { combineLatest, Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ProductStatusBadgeComponent } from '../../components/product-status-badge/product-status-badge.component';
import { ProductMediaCardComponent } from '../../components/product-media-card/product-media-card.component';
import { ProductPriceStockFormComponent } from '../../components/product-price-stock-form/product-price-stock-form.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { Category, VendorProduct } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';
import { AlertModalService } from '../../../../core/notifications/services/alert-modal.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    AppPageHeaderComponent
  ],
  template: `
    <div class="space-y-6 pb-12" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <app-page-header
        [showBack]="true"
        backLink="/products"
        [title]="getPageTitle()"
        [description]="getPageDescription()"
        customClass="sticky top-0 z-30 -mx-4 mb-2 border-b border-white/40 bg-white/70 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-[28px] sm:border sm:px-6 shadow-sm shadow-slate-200/20"
      >
        <div actions class="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            (click)="toggleStatus()"
            class="flex items-center gap-2.5 rounded-[16px] border border-slate-200/80 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div
              class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-300"
              [ngClass]="product?.isActive ? 'bg-emerald-500' : 'bg-slate-300'">
              <span
                class="pointer-events-none flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300"
                [ngClass]="product?.isActive ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0'">
              </span>
            </div>
            <span class="text-[0.72rem] font-black" [ngClass]="product?.isActive ? 'text-emerald-700' : 'text-slate-500'">
              {{ (product?.isActive ? 'PRODUCTS.STATUS_ACTIVE' : 'PRODUCTS.STATUS_INACTIVE') | translate }}
            </span>
          </button>

          <button
            type="button"
            (click)="deleteProduct()"
            [disabled]="isSaving || isLoading"
            class="inline-flex items-center justify-center gap-2 rounded-[16px] border border-rose-200 bg-white px-4 py-2.5 text-[0.75rem] font-black text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            <span class="hidden sm:inline">{{ 'PRODUCTS.DELETE_PRODUCT' | translate }}</span>
          </button>

          <button
            (click)="saveChanges()"
            [disabled]="isSaving"
            class="inline-flex items-center justify-center gap-2 rounded-[16px] bg-zadna-primary px-5 py-2.5 text-[0.75rem] font-black text-white shadow-lg shadow-zadna-primary/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:hover:translate-y-0">
            @if (isSaving) {
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            } @else {
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
            }
            {{ 'PRODUCTS.SAVE_CHANGES' | translate }}
          </button>
        </div>
      </app-page-header>

      @if (isLoading) {
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div class="space-y-4 lg:col-span-4">
            <div class="vendor-skeleton-card min-h-[28rem] p-5">
              <span class="vendor-skeleton vendor-skeleton-media" style="height: 18rem"></span>
              <div class="mt-4 space-y-3">
                <span class="vendor-skeleton vendor-skeleton-line lg w-4/5"></span>
                <span class="vendor-skeleton vendor-skeleton-line sm w-1/2"></span>
              </div>
            </div>
          </div>
          <div class="space-y-4 lg:col-span-8">
            <div class="vendor-skeleton-card min-h-[16rem] p-5"></div>
            <div class="vendor-skeleton-card min-h-[10rem] p-5"></div>
          </div>
        </div>
      } @else if (product) {
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <aside class="space-y-5 lg:col-span-4 lg:sticky lg:top-32">
            <article class="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
              <div class="bg-gradient-to-br from-slate-50 to-white p-4 pb-0">
                <app-product-media-card
                  [imageUrl]="product.imageUrl || null"
                  [canChange]="false"
                  aspectRatio="aspect-[4/5]"
                  containerClass="!border-0 !p-0 !shadow-none !rounded-[24px]">
                </app-product-media-card>
              </div>

              <div class="space-y-4 p-5">
                <div>
                  <h1 class="text-lg font-black leading-snug text-slate-900 sm:text-xl">{{ getProductName() }}</h1>
                  <p class="mt-1 font-mono text-[0.68rem] font-bold text-slate-400">{{ 'PRODUCTS.PRODUCT_CODE' | translate }}: {{ product.masterProductId.substring(0, 8) }}</p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <app-product-status-badge [isActive]="product.isActive"></app-product-status-badge>
                  <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-black"
                        [ngClass]="getStockHealthBadgeClasses()">
                    <span class="h-1.5 w-1.5 rounded-full" [ngClass]="getStockHealthDotClasses()"></span>
                    {{ getStockHealthLabel() }}
                  </span>
                  @if (getDisplaySize()) {
                    <span class="rounded-full bg-cyan-50 px-2.5 py-1 text-[0.65rem] font-black text-cyan-800 ring-1 ring-cyan-100">
                      {{ getDisplaySize() }}
                    </span>
                  }
                </div>
              </div>
            </article>

            <div class="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
              <h3 class="mb-4 text-[0.72rem] font-black uppercase tracking-[0.18em] text-slate-400">{{ 'PRODUCTS.BASIC_INFO' | translate }}</h3>
              <dl class="space-y-3">
                <div class="flex items-start justify-between gap-3 rounded-[14px] bg-slate-50/80 px-3 py-2.5">
                  <dt class="text-[0.68rem] font-black text-slate-400">{{ 'PRODUCTS.BRAND' | translate }}</dt>
                  <dd class="text-end text-[0.78rem] font-black text-slate-900">
                    {{ currentLang === 'ar' ? (product.brandNameAr || ('COMMON.BRAND_GENERAL' | translate)) : (product.brandNameEn || ('COMMON.BRAND_GENERAL' | translate)) }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3 rounded-[14px] bg-slate-50/80 px-3 py-2.5">
                  <dt class="text-[0.68rem] font-black text-slate-400">{{ 'PRODUCTS.CATEGORY' | translate }}</dt>
                  <dd class="text-end text-[0.78rem] font-black text-zadna-primary">
                    {{ currentLang === 'ar' ? (product.categoryNameAr || ('COMMON.NO_DATA' | translate)) : (product.categoryNameEn || ('COMMON.NO_DATA' | translate)) }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3 rounded-[14px] bg-slate-50/80 px-3 py-2.5">
                  <dt class="text-[0.68rem] font-black text-slate-400">{{ 'PRODUCTS.UNIT' | translate }}</dt>
                  <dd class="text-end text-[0.78rem] font-black text-slate-900">
                    {{ currentLang === 'ar' ? (product.unitNameAr || ('PRODUCTS.UNIT_PIECE' | translate)) : (product.unitNameEn || ('PRODUCTS.UNIT_PIECE' | translate)) }}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>

          <div class="space-y-6 lg:col-span-8">
            <div class="overflow-hidden rounded-[28px] border p-4 shadow-sm transition-colors"
                 [ngClass]="getStockInsightCardClasses()">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex items-start gap-3">
                  <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                    <svg class="h-4.5 w-4.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </span>
                  <div>
                    <p class="text-[0.72rem] font-black uppercase tracking-widest text-slate-800">{{ 'PRODUCTS.STOCK_AUTOMATION_TITLE' | translate }}</p>
                    <p class="mt-1 text-[0.78rem] font-bold leading-relaxed text-slate-600">{{ 'PRODUCTS.STOCK_AUTOMATION_BODY' | translate }}</p>
                  </div>
                </div>
                <div class="shrink-0 rounded-[16px] border border-white/80 bg-white/90 px-4 py-3 shadow-sm lg:max-w-xs">
                  <p class="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.STOCK_ACTION_TITLE' | translate }}</p>
                  <p class="mt-1 text-[0.76rem] font-black leading-relaxed text-slate-700">{{ getStockActionMessage() }}</p>
                </div>
              </div>
            </div>

            <form [formGroup]="productForm" class="space-y-6">
              <section class="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
                <div class="border-b border-slate-50 px-5 py-3.5">
                  <h2 class="text-sm font-black text-slate-900">{{ 'PRODUCTS.PRICING_STOCK' | translate }}</h2>
                  <p class="mt-0.5 text-[0.72rem] font-bold text-slate-500">{{ 'PRODUCTS.PRICING_STOCK_HINT' | translate }}</p>
                </div>

                <div class="p-4">
                  @if (product.tradePrice === null || product.tradePrice === undefined) {
                    <div class="mb-4 flex items-start gap-2.5 rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2.5">
                      <svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                      </svg>
                      <p class="text-[0.72rem] font-black leading-relaxed text-amber-800">{{ 'PRODUCTS.TRADE_PRICE_REQUIRED_NOTE' | translate }}</p>
                    </div>
                  }
                  @if (product.canEditPrice === false) {
                    <div class="mb-4 flex items-start gap-2.5 rounded-[14px] border border-cyan-200 bg-cyan-50 px-3 py-2.5">
                      <svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <p class="text-[0.72rem] font-black leading-relaxed text-cyan-900">
                        {{ currentLang === 'ar' ? 'السعر موحد من الفرع الرئيسي. هذا الفرع يقدر يعدل المخزون فقط.' : 'Pricing is controlled by the main branch. This branch can update stock only.' }}
                      </p>
                    </div>
                  }

                  <app-product-price-stock-form
                    [form]="productForm"
                    [currentLang]="currentLang"
                    [commissionRate]="product.commissionRate || 0"
                    [unitName]="(currentLang === 'ar' ? product.unitNameAr : product.unitNameEn) || ''"
                    [canEditPricing]="product.canEditPrice !== false">
                  </app-product-price-stock-form>
                </div>
              </section>

              <section class="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
                <div class="border-b border-slate-50 px-6 py-5">
                  <h2 class="text-base font-black text-slate-900">{{ 'PRODUCTS.CATALOG_INFO' | translate }}</h2>
                  <p class="mt-1 text-[0.78rem] font-bold text-slate-500">{{ 'PRODUCTS.CATALOG_INFO_HINT' | translate }}</p>
                </div>

                <div class="grid gap-4 p-6 md:grid-cols-2">
                  <div class="rounded-[18px] border border-slate-100 bg-slate-50/60 p-4">
                    <p class="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.HEADER_PRODUCT' | translate }}</p>
                    <p class="mt-2 text-[0.92rem] font-black leading-relaxed text-slate-800">{{ getProductName() }}</p>
                  </div>
                  <div class="rounded-[18px] border border-slate-100 bg-slate-50/60 p-4">
                    <p class="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.DISPLAY_SIZE' | translate }}</p>
                    <p class="mt-2 text-[0.92rem] font-black text-slate-800">{{ getDisplaySize() || ('PRODUCTS.BULK.STANDARD_SIZE' | translate) }}</p>
                  </div>
                  <div class="rounded-[18px] border border-slate-100 bg-slate-50/60 p-4 md:col-span-2">
                    <p class="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.DESCRIPTION' | translate }}</p>
                    <p class="mt-2 text-[0.82rem] font-bold leading-relaxed text-slate-500">{{ 'PRODUCTS.CATALOG_DESC_NOTE' | translate }}</p>
                  </div>
                </div>
              </section>
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
  private readonly cdr = inject(ChangeDetectorRef);
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
    this.langSub = this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
      this.cdr.markForCheck();
    });

    this.productForm = this.fb.group({
      tradePrice: [null, [Validators.required, Validators.min(0.01)]],
      sellingPrice: [0, [Validators.required, Validators.min(0.01)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      stockQty: [0, [Validators.required, Validators.min(0)]],
    });
  }

  getPageTitle(): string {
    if (!this.product) {
      return this.translate.instant('PRODUCTS.DETAILS_TITLE');
    }

    return this.getProductName() || this.translate.instant('PRODUCTS.DETAILS_TITLE');
  }

  getPageDescription(): string {
    if (!this.product) {
      return this.translate.instant('PRODUCTS.DETAILS_SUBTITLE');
    }

    const brand = this.currentLang === 'ar'
      ? (this.product.brandNameAr || this.translate.instant('COMMON.BRAND_GENERAL'))
      : (this.product.brandNameEn || this.translate.instant('COMMON.BRAND_GENERAL'));
    const category = this.currentLang === 'ar'
      ? (this.product.categoryNameAr || this.translate.instant('COMMON.NO_DATA'))
      : (this.product.categoryNameEn || this.translate.instant('COMMON.NO_DATA'));

    return `${brand} · ${category}`;
  }

  getProductName(): string {
    if (!this.product) {
      return '';
    }

    return this.currentLang === 'ar'
      ? (this.product.nameAr || this.product.nameEn || '')
      : (this.product.nameEn || this.product.nameAr || '');
  }

  getDisplaySize(): string {
    if (!this.product) {
      return '';
    }

    return this.currentLang === 'ar'
      ? (this.product.displaySizeAr || this.product.displaySizeEn || '')
      : (this.product.displaySizeEn || this.product.displaySizeAr || '');
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
        this.cdr.markForCheck();
        this.product = this.enrichProductWithCategory(data, this.flattenCategories(categories));
        this.productForm.patchValue({
          tradePrice: this.product.tradePrice ?? null,
          sellingPrice: this.product.sellingPrice,
          discountPercentage: this.catalogService.calculateDiscountPercentage(this.product.sellingPrice, this.product.compareAtPrice),
          stockQty: this.product.stockQty
        });
        this.originalStatus = this.product.isActive;
        this.isLoading = false;
      },
      error: () => {
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
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
        this.translate.instant('PRODUCTS.VALIDATION_INCOMPLETE'),
        this.translate.instant('PRODUCTS.VALIDATION_INCOMPLETE_TITLE')
      );
      return;
    }

    this.isSaving = true;
    const updateData = {
      costPrice: null,
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
        this.cdr.markForCheck();
        this.isSaving = false;
        this.translate.get('PRODUCTS.UPDATE_SUCCESS').subscribe(msg => {
      this.cdr.markForCheck();
          this.alertModalService.success(msg);
          this.router.navigate(['/products']);
        });
      },
      error: () => {
        this.cdr.markForCheck();
        this.isSaving = false;
        this.translate.get('PRODUCTS.UPDATE_ERROR').subscribe(msg => {
      this.cdr.markForCheck();
          this.alertModalService.error(msg);
        });
      }
    });
  }

  async deleteProduct(): Promise<void> {
    if (!this.product) return;

    const productName = this.getProductName();
    const confirmed = await this.alertModalService.showConfirm(
      this.translate.instant('PRODUCTS.DELETE_CONFIRM_MESSAGE', { name: productName }),
      'PRODUCTS.DELETE_CONFIRM_TITLE',
      {
        type: 'danger',
        confirmText: 'PRODUCTS.DELETE_CONFIRM_BUTTON',
        cancelText: 'COMMON.CANCEL',
        titleIsTranslationKey: true,
        confirmTextIsTranslationKey: true,
        cancelTextIsTranslationKey: true
      }
    );

    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.catalogService.deleteVendorProduct(this.product.id).subscribe({
      next: () => {
        this.cdr.markForCheck();
        this.isSaving = false;
        this.alertModalService.success(
          this.currentLang === 'ar' ? 'تم حذف المنتج بنجاح.' : 'Product deleted successfully.'
        );
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.cdr.markForCheck();
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
