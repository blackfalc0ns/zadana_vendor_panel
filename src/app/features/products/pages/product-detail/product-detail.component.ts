import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { combineLatest, Subscription } from 'rxjs';
import { ProductStatusBadgeComponent } from '../../components/product-status-badge/product-status-badge.component';
import { ProductMediaCardComponent } from '../../components/product-media-card/product-media-card.component';
import { ProductPriceStockFormComponent } from '../../components/product-price-stock-form/product-price-stock-form.component';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { Category, VendorProduct } from '../../models/catalog.models';
import { CatalogService } from '../../services/catalog.service';

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
            class="hidden sm:flex items-center gap-3 rounded-[16px] bg-white px-4 py-2 border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300">
            <span 
              class="text-[0.75rem] font-black tracking-widest uppercase transition-colors duration-300"
              [ngClass]="product?.isActive ? 'text-emerald-600' : 'text-slate-400'">
              {{ (product?.isActive ? 'PRODUCTS.STATUS_ACTIVE' : 'PRODUCTS.STATUS_INACTIVE') | translate }}
            </span>
            <div 
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner"
              [ngClass]="product?.isActive ? 'bg-emerald-500' : 'bg-slate-300'">
              <span 
                class="pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm ring-0 transition-transform duration-300 ease-in-out"
                [ngClass]="product?.isActive ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'">
                @if (product?.isActive) {
                  <svg class="h-3 w-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                } @else {
                  <svg class="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                }
              </span>
            </div>
          </button>

          <!-- Save Button -->
          <button 
            (click)="saveChanges()"
            [disabled]="productForm.invalid || isSaving"
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
        </div>
      </app-page-header>

      @if (isLoading) {
        <div class="flex h-[60vh] flex-col items-center justify-center gap-5 animate-in fade-in duration-700">
          <div class="relative flex h-20 w-20 items-center justify-center">
            <div class="absolute inset-0 animate-ping rounded-full bg-zadna-primary/10"></div>
            <div class="relative h-12 w-12 animate-spin rounded-full border-4 border-zadna-primary/20 border-t-zadna-primary"></div>
          </div>
          <span class="text-[0.85rem] font-black tracking-widest text-slate-400 uppercase">{{ 'COMMON.LOADING' | translate }}...</span>
        </div>
      } @else if (product) {
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-in slide-in-from-bottom-8 duration-700 fill-mode-both">
          
          <!-- Left Column: Media & Primary Info -->
          <div class="space-y-8 lg:col-span-4">
            <div class="group relative overflow-hidden rounded-[32px] border border-slate-100/80 bg-white shadow-sm shadow-slate-200/50 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1">
              <div class="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <app-product-media-card 
                [imageUrl]="product.imageUrl || null" 
                [canChange]="true"
                (onChange)="onHandleImageChange()"
                class="relative z-10 block p-2">
              </app-product-media-card>
            </div>

            <!-- Basic Info Summary -->
            <div class="group overflow-hidden rounded-[32px] border border-slate-100/80 bg-white shadow-sm shadow-slate-200/50 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1">
              <div class="border-b border-slate-50/80 bg-slate-50/30 px-6 py-5">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 class="text-[0.85rem] font-black uppercase tracking-widest text-slate-700">{{ 'PRODUCTS.BASIC_INFO' | translate }}</h3>
                </div>
              </div>
              
              <div class="p-6 space-y-5">
                <div class="flex flex-col gap-1.5 rounded-2xl bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <span class="text-[0.72rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.BRAND' | translate }}</span>
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-2 rounded-full bg-amber-400"></div>
                    <span class="text-[0.9rem] font-black text-slate-800">
                      {{ currentLang === 'ar' ? (product.brandNameAr || ('COMMON.BRAND_GENERAL' | translate)) : (product.brandNameEn || ('COMMON.BRAND_GENERAL' | translate)) }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5 rounded-2xl bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <span class="text-[0.72rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.CATEGORY' | translate }}</span>
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-2 rounded-full bg-zadna-primary"></div>
                    <span class="inline-flex rounded-xl bg-zadna-primary/10 px-3 py-1.5 text-[0.8rem] font-black text-zadna-primary border border-zadna-primary/10">
                      {{ currentLang === 'ar' ? (product.categoryNameAr || ('COMMON.NO_DATA' | translate)) : (product.categoryNameEn || ('COMMON.NO_DATA' | translate)) }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5 rounded-2xl bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <span class="text-[0.72rem] font-black uppercase tracking-widest text-slate-400">{{ 'PRODUCTS.UNIT' | translate }}</span>
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-2 rounded-full bg-emerald-400"></div>
                    <span class="text-[0.9rem] font-black text-slate-800">
                      {{ currentLang === 'ar' ? (product.unitNameAr || ('PRODUCTS.UNIT_PIECE' | translate)) : (product.unitNameEn || ('PRODUCTS.UNIT_PIECE' | translate)) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Forms & Technical Details -->
          <div class="space-y-8 lg:col-span-8">
            <form [formGroup]="productForm" class="space-y-8">
              
              <!-- Pricing & Stock Card -->
              <div class="group overflow-hidden rounded-[32px] border border-slate-100/80 bg-white shadow-sm shadow-slate-200/50 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1" style="animation-delay: 100ms;">
                <div class="border-b border-slate-50/80 bg-gradient-to-r from-emerald-50/50 to-transparent px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner shadow-emerald-200/50 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <h2 class="text-[1.05rem] font-black text-slate-900">{{ 'PRODUCTS.PRICING_STOCK' | translate }}</h2>
                      <p class="text-[0.75rem] font-bold text-slate-500 mt-0.5">Manage pricing, discounts, and available stock levels</p>
                    </div>
                  </div>
                </div>

                <div class="p-8 relative">
                  <div class="absolute right-0 top-0 w-64 h-64 bg-emerald-50/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                  <app-product-price-stock-form 
                    [form]="productForm" 
                    [unitName]="(currentLang === 'ar' ? product.unitNameAr : product.unitNameEn) || ''">
                  </app-product-price-stock-form>
                </div>
              </div>

              <!-- Catalog Details -->
              <div class="group overflow-hidden rounded-[32px] border border-slate-100/80 bg-white shadow-sm shadow-slate-200/50 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1" style="animation-delay: 200ms;">
                <div class="border-b border-slate-50/80 bg-gradient-to-r from-sky-50/50 to-transparent px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shadow-inner shadow-sky-200/50 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                      </svg>
                    </div>
                    <div>
                      <h2 class="text-[1.05rem] font-black text-slate-900">{{ 'PRODUCTS.CATALOG_INFO' | translate }}</h2>
                      <p class="text-[0.75rem] font-bold text-slate-500 mt-0.5">Master catalog details synced from Zadana's central database</p>
                    </div>
                  </div>
                </div>

                <div class="p-8 relative">
                  <div class="absolute left-0 top-0 w-64 h-64 bg-sky-50/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                  
                  <div class="grid gap-6 md:grid-cols-2">
                    <div class="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div class="flex items-center gap-2">
                        <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <label class="text-[0.75rem] font-black uppercase tracking-widest text-slate-500">{{ 'PRODUCTS.HEADER_PRODUCT' | translate }}</label>
                      </div>
                      <p class="text-[1rem] font-black text-slate-900 leading-relaxed ps-6">
                        {{ currentLang === 'ar' ? product.nameAr : product.nameEn }}
                      </p>
                    </div>

                    <div class="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div class="flex items-center gap-2">
                        <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
                        </svg>
                        <label class="text-[0.75rem] font-black uppercase tracking-widest text-slate-500">{{ 'PRODUCTS.DESCRIPTION' | translate }}</label>
                      </div>
                      <p class="text-[0.85rem] font-bold leading-relaxed text-slate-500 ps-6">
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe(event => this.currentLang = event.lang);

    this.productForm = this.fb.group({
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
          sellingPrice: this.product.sellingPrice,
          discountPercentage: this.catalogService.calculateDiscountPercentage(this.product.sellingPrice, this.product.compareAtPrice),
          stockQty: this.product.stockQty
        });
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

  onHandleImageChange(): void {
    console.log('Change image clicked');
    // Implement image upload logic here
  }

  saveChanges(): void {
    if (this.productForm.invalid || !this.product) return;

    this.isSaving = true;
    const updateData = {
      sellingPrice: this.productForm.value.sellingPrice,
      stockQty: this.productForm.value.stockQty,
      compareAtPrice: this.catalogService.calculateCompareAtPrice(
        this.productForm.value.sellingPrice,
        this.productForm.value.discountPercentage
      )
    };

    this.catalogService.updateVendorProduct(this.product.id, updateData).subscribe({
      next: () => {
        this.isSaving = false;
        this.translate.get('PRODUCTS.UPDATE_SUCCESS').subscribe(msg => alert(msg));
        this.router.navigate(['/products']);
      },
      error: () => {
        this.isSaving = false;
        this.translate.get('PRODUCTS.UPDATE_ERROR').subscribe(msg => alert(msg));
      }
    });
  }
}
